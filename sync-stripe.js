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
        ...seedFixedTiers(prisma),
        ...seedServices(products.data, prisma),
        ...seedPrices(prices.data, prisma),
        //...seedSubscriptions(subscriptions.data, prisma),
      ];
      await prisma.$transaction(operations);

      // now seed subscriptions
      await Promise.all(
        seedSubscriptions(subscriptions.data, prisma)
      );

      console.log('Syncing prices and services...');
     
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
    prisma.price.deleteMany(),
    // Delete all products (services) from the database
    prisma.service.deleteMany(),
    // Delete all subscriptions from the database
    prisma.subscription.deleteMany(),
    // Delete all tiers that are tied to a service (if needed)
    prisma.tier.deleteMany(),
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
        // // Create a tier for this service
        // tiers: {
        //   create: {
        //     name: data.name,
        //     // Set defaults: the model has defaults for other fields
        //   }
        // }
      },
    })
  );
}

// Create fixed tiers (Basic, Pro, Premium)
function seedFixedTiers(prisma) {
  const fixedTiers = [
    {
      id: 'basic-tier',
      name: 'Basic',
      description: 'Basic tier',
      features: ['1 Team', '50 Views Per Week', '10MB Storage', '1 Customized AI Analysis Per Week'],
      maxTeams: 1,
      maxStorage: 1024,
      maxApiCalls: 1000,
      price: 0,
      limits: JSON.stringify({ views: 5, analysis: 1 }),
    },
    {
      id: 'pro-tier',
      name: 'Pro',
      description: 'Pro tier',
      features: ['5 Teams', '1000 Views Per Week', '200MB Storage', '100 Customized AI Analysis Per Week'],
      maxTeams: 5,
      maxStorage: 10240,
      maxApiCalls: 10000,
      price: 2900,
      limits: JSON.stringify({ views: 1000, analysis: 100 }),
    },
    {
      id: 'premium-tier',
      name: 'Premium',
      description: 'Premium tier',
      features: ['50 Teams', '10000 Views Per Week', '1000MB Storage', '1000 Customized AI Analysis Per Week'],
      maxTeams: 50,
      maxStorage: 102400,
      maxApiCalls: 100000,
      price: 4900,
      limits: JSON.stringify({ views: 10000, analysis: 1000 }),
    },
  ];

  return fixedTiers.map(tier =>
    prisma.tier.upsert({
      where: { id: tier.id },
      update: tier,
      create: tier
    })
  );
}

function seedSubscriptions(subscriptions, prisma) {
  return subscriptions.map(async (data) => {
    console.log("data", data);
    // Get the priceId from the first subscription item (assumes at least one item exists)
    const priceId =
      data.items && data.items.data && data.items.data.length > 0
        ? data.items.data[0].price.id
        : null;

    const price = await prisma.price.findUnique({
      where: { id: priceId },
      include: { service: true },
    });
    if (!price) {
      console.warn(`No price found for subscription ${data.id}, skipping.`);
      return Promise.resolve(); // Skip this subscription if no priceId
    }
    //console.log("Found price for subscription:", price);
    const tierId = price.service.name.toLowerCase() + '-tier'; 

    // get user id from the customer field
    const user = await prisma.user.findUnique({
      where: { billingId: data.customer },
    });
    if (!user) {
      console.warn(`No user found for customer ${data.customer}, skipping subscription ${data.id}.`);
      return Promise.resolve(); // Skip this subscription if no user found
    }

    console.log(`Processing subscription ${data.id} for service ${price.service.name} with tierId ${tierId}, userId ${user.id}`);
    return prisma.subscription.create({
      data: {
        id: data.id,
        customerId: data.customer,
        priceId: priceId,
        active: data.status === 'active',
        startDate: new Date(data.current_period_start * 1000),
        endDate: new Date(data.current_period_end * 1000),
        cancelAt: data.cancel_at ? new Date(data.cancel_at * 1000) : null,
        tierId: tierId, // Assuming the tierId is derived from the service name
        userId: user.id, // Link to the user based on the billingId
        // createdAt and updatedAt will default to now() per your Prisma schema
      },
    });
  });
}
