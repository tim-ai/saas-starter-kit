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
  return await prisma.$transaction(async (tx) => {

    // Retrieve price record including its associated service
    const price = await tx.price.findUnique({
      where: { id: priceId },
      include: { service: true },
    });
    if (!price) {
      throw new Error(`Price with ID ${priceId} not found`);
    }
    const tierId = price.service?.name.toLocaleLowerCase() + "-tier";
    console.log(`Creating subscription with tierId: ${tierId}`);
    try {
      const s = await tx.subscription.create({
        data: {
          customerId,
          id,
          active,
          startDate,
          endDate,
          priceId,
          tierId,
          userId,
        },
      });
      console.log("Created subscription: ", s, " for userId: ", userId);
      return s;
    } catch (error) {
      console.error("Error creating subscription: ", error);
      throw new Error(`Failed to create subscription: ${error}`);
    }
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
  return await prisma.$transaction(async (tx) => {
    // Update the subscription
    const updatedSubscription = await tx.subscription.update({
      where: { id },
      data,
    });

    // If the subscription belongs to a user, update the user's tierId based on the new price
    if (updatedSubscription.userId) {
      // Determine the priceId to use: if updated data has a new priceId, use it; otherwise, use the existing one.
      const currentPriceId = data.priceId || updatedSubscription.priceId;
      if (currentPriceId) {
        // Retrieve price record including its associated service
        const price = await tx.price.findUnique({
          where: { id: currentPriceId },
          include: { service: true },
        });
        if (price && price.service) {
          // Find a tier whose name matches the service name
          const tier = await tx.tier.findUnique({
            where: { name: price.service.name },
          });
          if (!tier) {
            throw new Error(`Tier for service ${price.service.name} not found`);
          }
          // If a matching tier exists, update the user's tierId; if not, clear it.
          await tx.subscription.update({
            where: { id: updatedSubscription.id },
            data: {  tier: { connect: { id: tier.id } },
            },
          });
        } 
      } else {
        // No priceId provided; clear the user's tierId.
        console.warn(
          `No priceId provided for subscription ${id}. User's tierId will not be updated.`
        );
      }
    }

    return updatedSubscription;
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
    include: {
      tier: true, // Include tier information
    }
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

export const getTiers = async () => {
  return await prisma.tier.findMany();
}
