import { env } from "@/env";
import { Configuration, PlaidApi, PlaidEnvironments, Products } from "plaid";
import { prisma } from "@/server/db";
import crypto from "crypto";

const config = new Configuration({
  basePath: PlaidEnvironments[env.PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": env.PLAID_CLIENT_ID,
      "PLAID-SECRET": env.PLAID_SECRET,
    },
  },
});

export const plaid = new PlaidApi(config);

function encrypt(text: string): string {
  const key = crypto.createHash("sha256").update(String(process.env.ENCRYPTION_KEY)).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

function decrypt(payload: string): string {
  const key = crypto.createHash("sha256").update(String(process.env.ENCRYPTION_KEY)).digest();
  const buf = Buffer.from(payload, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

export async function createLinkToken(userId: string, _householdId: string) {
  const res = await plaid.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "Money Agent",
    products: env.PLAID_PRODUCTS.split(",") as Products[],
    country_codes: ["US"],
    language: "en",
    redirect_uri: env.PLAID_REDIRECT_URI,
  });
  return res.data.link_token;
}

export async function exchangePublicToken(householdId: string, publicToken: string) {
  const exchange = await plaid.itemPublicTokenExchange({ public_token: publicToken });
  const accessTokenEnc = encrypt(exchange.data.access_token);
  const item = await plaid.itemGet({ access_token: exchange.data.access_token });
  const plaidItem = await prisma.plaidItem.create({
    data: {
      plaidItemId: item.data.item.item_id,
      accessTokenEnc,
      environment: env.PLAID_ENV,
      householdId,
    },
  });
  return plaidItem;
}

export async function syncTransactionsForItem(itemId: string) {
  const item = await prisma.plaidItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Item not found");
  const accessToken = decrypt(item.accessTokenEnc);

  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const res = await plaid.transactionsSync({ access_token: accessToken, cursor, count: 500 });

    for (const acct of res.data.accounts ?? []) {
      await prisma.bankAccount.upsert({
        where: { plaidAccountId: acct.account_id },
        create: {
          plaidAccountId: acct.account_id,
          name: acct.name || "Account",
          officialName: acct.official_name || null,
          mask: acct.mask || null,
          type: acct.type || null,
          subtype: acct.subtype || null,
          householdId: item.householdId,
          itemId: item.id,
        },
        update: {
          name: acct.name || "Account",
          officialName: acct.official_name || null,
          mask: acct.mask || null,
          type: acct.type || null,
          subtype: acct.subtype || null,
        },
      });
    }

    for (const t of res.data.added ?? []) {
      const amountCents = Math.round(Math.abs(t.amount) * 100);
      const bank = await prisma.bankAccount.findUnique({ where: { plaidAccountId: t.account_id } });
      if (!bank) continue;
      await prisma.transaction.upsert({
        where: { plaidTransactionId: t.transaction_id },
        create: {
          plaidTransactionId: t.transaction_id,
          bankAccountId: bank.id,
          householdId: item.householdId,
          amountCents,
          date: new Date(t.date),
          name: t.name || t.merchant_name || "Transaction",
          merchantName: t.merchant_name || null,
          originalDescription: t.original_description || null,
          pending: t.pending ?? false,
        },
        update: {
          amountCents,
          date: new Date(t.date),
          name: t.name || t.merchant_name || "Transaction",
          merchantName: t.merchant_name || null,
          originalDescription: t.original_description || null,
          pending: t.pending ?? false,
        },
      });
    }

    cursor = res.data.next_cursor;
    hasMore = res.data.has_more ?? false;
  }

  await prisma.plaidItem.update({ where: { id: item.id }, data: { lastSyncedAt: new Date() } });
}
