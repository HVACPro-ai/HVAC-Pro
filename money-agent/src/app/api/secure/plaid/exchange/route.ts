import { auth } from "@/server/auth";
import { exchangePublicToken } from "@/server/plaid";
import { rateLimit } from "@/server/rateLimit";
import { z } from "zod";

export async function POST(request: Request) {
  const rl = await rateLimit(request, { key: "plaidExchange" });
  if (!rl.success) return new Response("Too Many Requests", { status: 429 });
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const data = await request.json().catch(() => ({}));
  const parsed = z.object({ householdId: z.string().cuid(), publicToken: z.string().min(1) }).safeParse(data);
  if (!parsed.success) return new Response("Invalid", { status: 400 });
  const item = await exchangePublicToken(parsed.data.householdId, parsed.data.publicToken);
  return Response.json({ item });
}
