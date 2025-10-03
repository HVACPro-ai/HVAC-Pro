import { prisma } from "@/server/db";
import { CategoryType } from "@prisma/client";

function normalizeMerchant(name?: string | null): string | null {
  if (!name) return null;
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export async function categorizeNewTransactions(householdId: string) {
  const uncategorized = await prisma.transaction.findMany({
    where: { householdId, category: null },
    orderBy: { date: "asc" },
  });

  const aliases = await prisma.merchantAlias.findMany({
    where: { OR: [{ householdId }, { householdId: null }] },
  });
  const aliasMap = new Map(aliases.map((a) => [a.merchantKey, a]));

  for (const t of uncategorized) {
    const key = normalizeMerchant(t.merchantName || t.name);
    let category: CategoryType | null = null;

    if (key && aliasMap.has(key)) {
      category = aliasMap.get(key)!.category ?? null;
    } else if (t.amountCents < 0) {
      category = CategoryType.INCOME;
    } else {
      category = CategoryType.DISCRETIONARY;
    }

    await prisma.transaction.update({ where: { id: t.id }, data: { category } });
  }
}

export async function upsertMerchantAlias(householdId: string | null, merchantName: string, alias: string, category: CategoryType | null) {
  const key = normalizeMerchant(merchantName);
  if (!key) return;
  await prisma.merchantAlias.upsert({
    where: { merchantKey: key },
    create: { merchantKey: key, alias, category: category ?? undefined, householdId: householdId ?? undefined },
    update: { alias, category: category ?? undefined, householdId: householdId ?? undefined },
  });
}

export async function detectRecurring(householdId: string) {
  const txs = await prisma.transaction.findMany({ where: { householdId }, orderBy: { date: "asc" } });
  const byName = new Map<string, { dates: Date[]; amounts: number[] }>();
  for (const t of txs) {
    const key = normalizeMerchant(t.merchantName || t.name);
    if (!key) continue;
    if (!byName.has(key)) byName.set(key, { dates: [], amounts: [] });
    byName.get(key)!.dates.push(t.date);
    byName.get(key)!.amounts.push(t.amountCents);
  }
  const recurring: string[] = [];
  for (const [key, { dates }] of byName.entries()) {
    if (dates.length < 3) continue;
    dates.sort((a, b) => a.getTime() - b.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) intervals.push((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (Math.abs(avg - 30) < 5 || Math.abs(avg - 14) < 3 || Math.abs(avg - 7) < 2) {
      recurring.push(key);
    }
  }
  return recurring;
}
