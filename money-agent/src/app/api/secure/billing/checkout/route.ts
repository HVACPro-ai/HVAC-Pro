import { auth } from "@/server/auth";
import { createCheckoutSession } from "@/server/stripe";
import { env } from "@/env";
import { z } from "zod";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const data = await request.json().catch(() => ({}));
  const parsed = z.object({ householdId: z.string().cuid() }).safeParse(data);
  if (!parsed.success) return new Response("Invalid", { status: 400 });
  const url = await createCheckoutSession(
    parsed.data.householdId,
    env.STRIPE_PRICE_ID,
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/app`,
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/app?canceled=1`
  );
  return Response.json({ url });
}
