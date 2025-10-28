import { headers } from "next/headers";
import { stripe } from "@/server/stripe";
import { env } from "@/env";
import { prisma } from "@/server/db";
import Stripe from "stripe";
import { SubscriptionStatus } from "@prisma/client";

function toPrismaStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "incomplete":
      return "INCOMPLETE";
    case "incomplete_expired":
      return "INCOMPLETE_EXPIRED";
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "unpaid":
      return "UNPAID";
    default:
      return "ACTIVE";
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) return new Response("Unauthorized", { status: 401 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (subscriptionId) {
        const subResp = await stripe.subscriptions.retrieve(subscriptionId);
        type SubWithPeriod = Stripe.Subscription & { current_period_end?: number };
        const sub = subResp as unknown as SubWithPeriod;
        const householdId = (sub.metadata?.householdId as string | undefined) ?? undefined;
        if (householdId) {
          await prisma.subscription.upsert({
            where: { householdId },
            create: {
              householdId,
              status: toPrismaStatus(sub.status),
              stripeCustomerId: String(session.customer),
              stripeSubscriptionId: subscriptionId,
              priceId: env.STRIPE_PRICE_ID,
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
            },
            update: {
              status: toPrismaStatus(sub.status),
              stripeCustomerId: String(session.customer),
              stripeSubscriptionId: subscriptionId,
              priceId: env.STRIPE_PRICE_ID,
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
            },
          });
        }
      }
      break;
    }
    case "invoice.payment_succeeded": {
      const inv = event.data.object as Stripe.Invoice;
      // Some Stripe types omit subscription on Invoice depending on API version/types.
      type InvoiceMaybeSub = Stripe.Invoice & { subscription?: string };
      const subId = (inv as InvoiceMaybeSub).subscription;
      if (subId) {
        const subResp = await stripe.subscriptions.retrieve(subId);
        type SubWithPeriod = Stripe.Subscription & { current_period_end?: number };
        const sub = subResp as unknown as SubWithPeriod;
        const householdId = sub.metadata?.householdId as string | undefined;
        if (householdId) {
          await prisma.subscription.update({
            where: { householdId },
            data: {
              status: toPrismaStatus(sub.status),
              currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
            },
          });
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const householdId = sub.metadata?.householdId as string | undefined;
      if (householdId) {
        await prisma.subscription.update({ where: { householdId }, data: { status: "CANCELED" } });
      }
      break;
    }
  }

  return new Response("OK");
}
