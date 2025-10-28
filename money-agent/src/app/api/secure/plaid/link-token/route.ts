import { auth } from "@/server/auth";
import { createLinkToken } from "@/server/plaid";
import { rateLimit } from "@/server/rateLimit";
import { z } from "zod";

export async function POST(request: Request) {
  const rl = await rateLimit(request, { key: "plaidLinkToken" });
  if (!rl.success) return new Response("Too Many Requests", { status: 429 });
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const data = await request.json().catch(() => ({}));
  const parsed = z.object({ householdId: z.string().cuid() }).safeParse(data);
  if (!parsed.success) return new Response("Invalid", { status: 400 });
  const token = await createLinkToken(session.user.id, parsed.data.householdId);
  return Response.json({ link_token: token });
}
