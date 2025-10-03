import { prisma } from "@/server/db";

export function calculateExtraMoney(monthlyIncomeCents: number, fixedBillsCents: number, discretionaryCents: number): number {
  return monthlyIncomeCents - fixedBillsCents - discretionaryCents;
}

export async function upsertMonthlyBudget(householdId: string, month: Date, monthlyIncomeCents: number, fixedBillsCents: number, discretionaryCents: number) {
  const extraCents = calculateExtraMoney(monthlyIncomeCents, fixedBillsCents, discretionaryCents);
  return prisma.budget.upsert({
    where: { householdId_month: { householdId, month } },
    create: { householdId, month, monthlyIncomeCents, fixedBillsCents, discretionaryCents, extraCents },
    update: { monthlyIncomeCents, fixedBillsCents, discretionaryCents, extraCents },
  });
}
