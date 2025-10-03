import { auth } from "@/server/auth";
import { createHousehold } from "@/server/households";
import { rateLimit } from "@/server/rateLimit";
import { z } from "zod";

const bodySchema = z.object({ name: z.string().min(1).max(64) });

export async function POST(request: Request) {
  const rl = await rateLimit(request, { key: "createHousehold" });
  if (!rl.success) {
    return new Response("Too Many Requests", { status: 429, headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } });
  }
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new Response("Invalid", { status: 400 });
  const household = await createHousehold(session.user.id, parsed.data.name);
  return Response.json({ household });
}
