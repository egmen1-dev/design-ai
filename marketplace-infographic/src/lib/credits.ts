import { hasUnlimitedGenerations } from "./admin";
import { prisma } from "./prisma";
import { FREE_DAILY_LIMIT, startOfToday } from "./pricing";

export type UserBalance = {
  freeRemaining: number;
  freeLimit: number;
  credits: number;
  canGenerate: boolean;
  unlimited: boolean;
};

async function getUserEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email ?? null;
}

export async function getUserBalance(userId: string): Promise<UserBalance> {
  const email = await getUserEmail(userId);
  const unlimited = hasUnlimitedGenerations(email);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  const credits = user?.credits ?? 0;

  if (unlimited) {
    return {
      freeRemaining: FREE_DAILY_LIMIT,
      freeLimit: FREE_DAILY_LIMIT,
      credits,
      canGenerate: true,
      unlimited: true,
    };
  }

  const freeUsedToday = await prisma.generatedImage.count({
    where: {
      userId,
      usedFreeQuota: true,
      createdAt: { gte: startOfToday() },
    },
  });

  const freeRemaining = Math.max(0, FREE_DAILY_LIMIT - freeUsedToday);

  return {
    freeRemaining,
    freeLimit: FREE_DAILY_LIMIT,
    credits,
    canGenerate: freeRemaining > 0 || credits > 0,
    unlimited: false,
  };
}

export async function consumeGenerationSlot(userId: string): Promise<{
  usedFreeQuota: boolean;
  balance: UserBalance;
}> {
  const balance = await getUserBalance(userId);

  if (!balance.canGenerate) {
    throw new Error("NO_GENERATIONS_LEFT");
  }

  if (balance.unlimited) {
    return { usedFreeQuota: false, balance };
  }

  if (balance.freeRemaining > 0) {
    return { usedFreeQuota: true, balance };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: 1 } },
  });

  const updated = await getUserBalance(userId);
  return { usedFreeQuota: false, balance: updated };
}
