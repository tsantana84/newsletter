import { Resend } from "resend";
import { render } from "@react-email/components";
import { ConfirmationEmail } from "@/templates/confirmation-email";
import { NewsletterEmail } from "@/templates/newsletter-email";
import type { Result } from "./types";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Inference <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const BATCH_SIZE = 50;

export async function sendConfirmationEmail({
  to,
  confirmToken,
}: {
  to: string;
  confirmToken: string;
}): Promise<Result<void>> {
  const confirmUrl = `${SITE_URL}/api/confirm?token=${confirmToken}`;
  try {
    const html = await render(ConfirmationEmail({ confirmUrl }));
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Confirm your subscription to Inference",
      html,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to send confirmation email" };
  }
}

export async function sendNewsletter({
  subject,
  slug,
  htmlContent,
  subscribers,
}: {
  subject: string;
  slug: string;
  htmlContent: string;
  subscribers: { email: string; unsubscribeToken: string }[];
}): Promise<Result<void>> {
  try {
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const emails = await Promise.all(
        batch.map(async (sub) => {
          const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${sub.unsubscribeToken}`;
          const issueUrl = `${SITE_URL}/issues/${slug}`;
          const html = await render(
            NewsletterEmail({
              title: subject,
              htmlContent,
              unsubscribeUrl,
              issueUrl,
            })
          );
          return {
            from: FROM_EMAIL,
            to: sub.email,
            subject,
            html,
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          };
        })
      );
      const response = await resend.batch.send(emails);
      if (response.error) {
        return { success: false, error: `Batch send failed: ${response.error.message}` };
      }
    }
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to send newsletter" };
  }
}
