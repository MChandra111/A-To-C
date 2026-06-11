export interface WeighInReminderData {
  displayName: string;
  investmentScore: number;
  aspirationTitle: string;
  appUrl: string;
}

export function buildWeighInReminderSubject(score: number): string {
  return `Your Investment Score is ${score} — weigh-in due today`;
}

export function buildWeighInReminderHtml(data: WeighInReminderData): string {
  const { displayName, investmentScore, aspirationTitle, appUrl } = data;

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0F0F12;font-family:Inter,system-ui,sans-serif;color:#F1F0FF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <tr>
      <td style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#8B8BA7;">A-To-C</td>
    </tr>
    <tr>
      <td style="padding-top:24px;font-size:28px;font-weight:700;font-family:Syne,system-ui,sans-serif;">
        Investment Score: ${investmentScore}
      </td>
    </tr>
    <tr>
      <td style="padding-top:12px;font-size:15px;line-height:1.6;color:#8B8BA7;">
        ${displayName}, your weigh-in for <strong style="color:#F1F0FF;">${aspirationTitle}</strong> is due today.
        One reading keeps the line honest.
      </td>
    </tr>
    <tr>
      <td style="padding-top:28px;">
        <a href="${appUrl}/dashboard"
           style="display:inline-block;background:#6C63FF;color:#F1F0FF;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px;">
          Step on the scale
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding-top:32px;font-size:12px;color:#8B8BA7;">
        Quiet data, no guilt. Update your reminder preferences in Profile.
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildWeighInReminderText(data: WeighInReminderData): string {
  return `${buildWeighInReminderSubject(data.investmentScore)}

${data.displayName}, your weigh-in for "${data.aspirationTitle}" is due today.

Current Investment Score: ${data.investmentScore}

Step on the scale: ${data.appUrl}/dashboard`;
}

/**
 * TODO: integrate with Resend or SendGrid — wire this helper into the cron
 * route once an email provider API key is configured.
 */
export async function sendWeighInReminder(
  to: string,
  data: WeighInReminderData
): Promise<{ sent: false; reason: string }> {
  void to;
  void buildWeighInReminderHtml(data);
  void buildWeighInReminderText(data);

  return {
    sent: false,
    reason:
      "Email provider not configured. Set RESEND_API_KEY or SENDGRID_API_KEY and implement sendWeighInReminder.",
  };
}
