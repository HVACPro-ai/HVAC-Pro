import { prisma } from "@/server/db";
// import { Prisma } from "@prisma/client";
import crypto from "crypto";

export async function createHousehold(userId: string, name: string) {
  return prisma.household.create({
    data: {
      name,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
  });
}

export async function inviteToHousehold(householdId: string, invitedByUserId: string, email: string) {
  const token = crypto.randomUUID();
  return prisma.householdInvite.create({
    data: {
      householdId,
      email,
      invitedByUserId,
      token,
    },
  });
}

export async function acceptInvite(token: string, userId: string) {
  const invite = await prisma.householdInvite.findUnique({ where: { token } });
  if (!invite || invite.status !== "pending") throw new Error("Invalid invite");
  await prisma.$transaction([
    prisma.householdMember.create({
      data: { householdId: invite.householdId, userId, role: "MEMBER" },
    }),
    prisma.householdInvite.update({
      where: { id: invite.id },
      data: { status: "accepted", acceptedAt: new Date() },
    }),
  ]);
}
