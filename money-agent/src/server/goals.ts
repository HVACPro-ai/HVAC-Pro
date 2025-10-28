import { prisma } from "@/server/db";

export async function enqueueGoal(householdId: string, name: string, targetCents: number) {
  const count = await prisma.goal.count({ where: { householdId } });
  const goal = await prisma.goal.create({ data: { householdId, name, targetCents, priority: count + 1, active: count === 0 } });
  return goal;
}

export async function activateNextGoal(householdId: string) {
  const next = await prisma.goal.findFirst({ where: { householdId, active: false }, orderBy: { priority: "asc" } });
  if (!next) return null;
  await prisma.goal.updateMany({ where: { householdId }, data: { active: false } });
  return prisma.goal.update({ where: { id: next.id }, data: { active: true } });
}

export async function contributeToActiveGoal(householdId: string, amountCents: number, source: string) {
  const active = await prisma.goal.findFirst({ where: { householdId, active: true } });
  if (!active) return null;
  await prisma.$transaction([
    prisma.goalContribution.create({ data: { goalId: active.id, amountCents, source } }),
    prisma.goal.update({ where: { id: active.id }, data: { currentCents: { increment: amountCents } } }),
  ]);
  const updated = await prisma.goal.findUnique({ where: { id: active.id } });
  if (updated && updated.currentCents >= updated.targetCents) {
    await prisma.goal.update({ where: { id: active.id }, data: { active: false, completedAt: new Date() } });
    await activateNextGoal(householdId);
  }
  return updated;
}
