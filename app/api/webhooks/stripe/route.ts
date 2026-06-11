import Stripe from "stripe";
import {
  activateGuruPlan,
  type ActivateGuruResult,
} from "@/lib/plans/activateGuru";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function recordWebhookEvent(
  eventId: string,
  eventType: string
): Promise<"new" | "duplicate" | "error"> {
  const admin = createAdminClient();
  if (!admin) return "error";

  const { error } = await admin.from("stripe_webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
  });

  if (error?.code === "23505") return "duplicate";
  if (error) {
    console.error("stripe_webhook_events insert failed:", error.message);
    return "error";
  }

  return "new";
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<ActivateGuruResult> {
  if (session.payment_status !== "paid") {
    return { ok: false, error: `Payment status: ${session.payment_status}` };
  }

  const amountCents = session.amount_total;
  const currency = session.currency;

  if (amountCents == null || !currency) {
    return { ok: false, error: "Missing amount or currency on checkout session" };
  }

  const email =
    session.customer_details?.email ??
    session.customer_email ??
    null;

  return activateGuruPlan({
    stripeEventId: eventId,
    stripeCheckoutSessionId: session.id,
    clientReferenceId: session.client_reference_id,
    customerEmail: email,
    amountCents,
    currency,
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !webhookSecret) {
    return Response.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Stripe webhook signature error:", message);
    return Response.json({ error: message }, { status: 400 });
  }

  const dedupe = await recordWebhookEvent(event.id, event.type);
  if (dedupe === "duplicate") {
    return Response.json({ received: true, duplicate: true });
  }
  if (dedupe === "error") {
    return Response.json({ error: "Failed to record event" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await handleCheckoutSessionCompleted(session, event.id);

        if (!result.ok) {
          console.error("Guru activation failed:", result.error, {
            eventId: event.id,
            sessionId: session.id,
          });
          return Response.json({
            received: true,
            activated: false,
            error: result.error,
          });
        }

        return Response.json({
          received: true,
          activated: true,
          userId: result.userId,
          alreadyGuru: result.alreadyGuru ?? false,
        });
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await handleCheckoutSessionCompleted(session, event.id);

        if (!result.ok) {
          console.error("Async Guru activation failed:", result.error);
          return Response.json({
            received: true,
            activated: false,
            error: result.error,
          });
        }

        return Response.json({
          received: true,
          activated: true,
          userId: result.userId,
          alreadyGuru: result.alreadyGuru ?? false,
        });
      }

      default:
        return Response.json({ received: true, ignored: event.type });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler error";
    console.error("Stripe webhook handler error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
