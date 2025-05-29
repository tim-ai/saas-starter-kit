import { prisma } from '@/lib/prisma';
import { Subscription } from '@prisma/client';

export const createStripeSubscription = async ({
  customerId,
  id,
  active,
  startDate,
  endDate,
  priceId,
  teamId,
  userId,
}: {
  customerId: string;
  id: string;
  active: boolean;
  startDate: Date;
  endDate: Date;
  priceId: string;
  teamId?: string;
  userId?: string;
}) => {
  return await prisma.subscription.create({
    data: {
      customerId,
      id,
      active,
      startDate,
      endDate,
      priceId,
      ...(teamId && { teamId }),
      ...(userId && { userId }),
    },
  });
};

export const deleteStripeSubscription = async (id: string) => {
  return await prisma.subscription.deleteMany({
    where: {
      id,
    },
  });
};

export const updateStripeSubscription = async (id: string, data: any) => {
  return await prisma.subscription.update({
    where: {
      id,
    },
    data,
  });
};

export const getSubscriptionsByCustomerId = async (customerId: string) => {
  return await prisma.subscription.findMany({
    where: {
      customerId,
      active: true, // Only return active subscriptions
    },
  });
};

export const getSubscriptionsByTeamId = async (teamId: string) => {
  return await prisma.subscription.findMany({
    where: {
      teamId,
      active: true,
    },
  });
};

export const getSubscriptionsByUserId = async (userId: string) => {
  return await prisma.subscription.findMany({
    where: {
      userId,
      active: true,
    },
  });
};

export const getByCustomerId = async (customerId: string) => {
  return await prisma.subscription.findMany({
    where: {
      customerId,
      active: true, // Only return active subscriptions
    },
  });
};

export const getBySubscriptionId = async (
  subscriptionId: string
): Promise<Subscription | null> => {
  return await prisma.subscription.findUnique({
    where: {
      id: subscriptionId,
    },
  });
};
