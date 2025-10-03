import { Resend } from "resend";
import { env } from "@/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendMagicLinkEmail(to: string, url: string) {
  const html = `
  <div style="font-family:Arial,sans-serif;">
    <h2>Sign in to Money Agent</h2>
    <p>Click the link below to sign in:</p>
    <p><a href="${url}" target="_blank" rel="noreferrer">Sign in</a></p>
    <p style="color:#6b7280">If you did not request this, you can ignore this email.</p>
  </div>`;

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: to,
    subject: "Your Magic Sign-In Link",
    html,
  });
}
