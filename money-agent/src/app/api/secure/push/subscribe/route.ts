import { auth } from "@/server/auth";
import { subscribePush } from "@/server/notifications";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const body = await request.json();
  await subscribePush(session.user.id, body);
  return new Response("OK");
}
