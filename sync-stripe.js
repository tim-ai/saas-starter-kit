const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

/**
 * Synchronizes data between the database and the Stripe API.
 * Retrieves active products, prices, and subscriptions from Stripe, deletes existing data in the database,
 * and inserts the new data. Prints the number of synced products, prices, and subscriptions.
 *
 * @returns {Promise<void>}
 */
const sync = async () => {
  const prisma = new PrismaClient();
  try {
    console.log('Starting sync with Stripe');
    const stripe = getStripeInstance();

    // Get all active products, prices, and subscriptions
    const [products, prices, subscriptions] = await Promise.all([
      stripe.products.list({ active: true }),
      stripe.prices.list({ active: true }),
      stripe.subscriptions.list({ status: 'all' }), // adjust status filter if needed
    ]);

    if (prices.data.length > 0 && products.data.length > 0) {
      const operations = [
        ...cleanup(prisma),
        ...seedServices(products.data, prisma),
        ...seedPrices(prices.data, prisma),
        ...seedSubscriptions(subscriptions.data, prisma),
      ];
      await prisma.$transaction(operations);
      await printStats(prisma);

      console.log('Sync completed successfully');
      process.exit(0);
    } else {
      if (prices.data.length === 0) {
        throw new Error('No prices found on Stripe');
      } else {
        throw new Error('No products found on Stripe');
      }
    }
  } catch (error) {
    console.error('Error syncing with Stripe:', error);
    process.exit(1);
  }
};

sync();

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

async function printStats(prisma) {
  const [productCount, priceCount, subscriptionCount] = await Promise.all([
    prisma.service.count(),
    prisma.price.count(),
    prisma.subscription.count(),
  ]);

  console.log('Products synced:', productCount);
  console.log('Prices synced:', priceCount);
  console.log('Subscriptions synced:', subscriptionCount);
}

function cleanup(prisma) {
  return [
    // Delete all prices from the database
    prisma.price.deleteMany({}),
    // Delete all products (services) from the database
    prisma.service.deleteMany({}),
    // Delete all subscriptions from the database
    prisma.subscription.deleteMany({}),
  ];
}

function getStripeInstance() {
  if (process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
    });
    return stripe;
  } else {
    throw new Error('STRIPE_SECRET_KEY environment variable not set');
  }
}

function seedPrices(prices, prisma) {
  return prices.map((data) =>
    prisma.price.create({
      data: {
        id: data.id,
        billingScheme: data.billing_scheme,
        currency: data.currency,
        serviceId: data.product,
        amount: data.unit_amount ? data.unit_amount / 100 : null,
        metadata: data.recurring,
        type: data.type,
        created: new Date(data.created * 1000),
      },
    })
  );
}

function seedServices(products, prisma) {
  return products.map((data) =>
    prisma.service.create({
      data: {
        id: data.id,
        description: data.description || '',
        features: (data.features || []).map((a) => a.name),
        image: data.images.length > 0 ? data.images[0] : '',
        name: data.name,
        created: new Date(data.created * 1000),
      },
    })
  );
}

function seedSubscriptions(subscriptions, prisma) {
  return subscriptions.map((data) => {
    // Get the priceId from the first subscription item (assumes at least one item exists)
    const priceId =
      data.items && data.items.data && data.items.data.length > 0
        ? data.items.data[0].price.id
        : null;

    return prisma.subscription.create({
      data: {
        id: data.id,
        customerId: data.customer,
        priceId: priceId,
        active: data.status === 'active',
        startDate: new Date(data.current_period_start * 1000),
        endDate: new Date(data.current_period_end * 1000),
        cancelAt: data.cancel_at ? new Date(data.cancel_at * 1000) : null,
        // createdAt and updatedAt will default to now() per your Prisma schema
      },
    });
  });
}
