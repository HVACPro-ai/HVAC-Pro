import Stripe from "stripe";
import { env } from "@/env";
import { prisma } from "@/server/db";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2025-09-30.clover" });

export async function ensureCustomer(userId: string, email: string | null | undefined) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe.customers.create({ email: email ?? undefined });
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createCheckoutSession(householdId: string, priceId: string, successUrl: string, cancelUrl: string) {
  const household = await prisma.household.findUnique({ where: { id: householdId }, include: { members: { include: { user: true } } } });
  if (!household) throw new Error("Household not found");
  const owner = household.members.find((m) => m.role === "OWNER");
  if (!owner) throw new Error("Owner not found");
  const customerId = await ensureCustomer(owner.userId, owner.user.email);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { householdId },
    },
  });
  return session.url!;
}
