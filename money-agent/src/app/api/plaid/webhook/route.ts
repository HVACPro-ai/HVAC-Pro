import { NextRequest } from "next/server";
import { env } from "@/env";
import { prisma } from "@/server/db";
import { syncTransactionsForItem } from "@/server/plaid";

export async function POST(request: NextRequest) {
  const sig = request.headers.get("plaid-verification") || "";
  if (env.PLAID_WEBHOOK_SECRET && sig !== env.PLAID_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = await request.json();
  const itemId = body?.item_id as string | undefined;
  if (!itemId) return new Response("OK");
  const item = await prisma.plaidItem.findFirst({ where: { plaidItemId: itemId } });
  if (!item) return new Response("OK");
  await syncTransactionsForItem(item.id);
  return new Response("OK");
}
