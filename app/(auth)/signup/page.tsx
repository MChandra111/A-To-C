import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-2xl font-bold text-text-primary">
            A-To-C
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              Your first reading starts here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-sm text-text-muted">Loading...</p>}>
              <AuthForm mode="signup" />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
