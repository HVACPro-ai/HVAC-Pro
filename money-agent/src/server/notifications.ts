import webpush from "web-push";
import { env } from "@/env";
import { prisma } from "@/server/db";
import { Resend } from "resend";

if (env.WEB_PUSH_PUBLIC_KEY && env.WEB_PUSH_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(`mailto:${env.WEB_PUSH_EMAIL}`, env.WEB_PUSH_PUBLIC_KEY, env.WEB_PUSH_PRIVATE_KEY);
  } catch {}
}
const resend = new Resend(env.RESEND_API_KEY);

export async function subscribePush(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  await prisma.webPushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: { userId, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    update: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
  });
}

export async function sendPushToUser(userId: string, payload: object) {
  const subs = await prisma.webPushSubscription.findMany({ where: { userId } });
  await Promise.all(
    subs.map((s) =>
      webpush
        .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as unknown as webpush.PushSubscription, JSON.stringify(payload))
        .catch(async (err: unknown) => {
          const e = err as { statusCode?: number };
          if (e.statusCode === 410 || e.statusCode === 404) {
            await prisma.webPushSubscription.delete({ where: { endpoint: s.endpoint } });
          }
        })
    )
  );
}

export async function sendEmail(to: string, subject: string, html: string) {
  await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
}
