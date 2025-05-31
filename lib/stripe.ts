import Stripe from 'stripe';
import env from '@/lib/env';
import { updateTeam } from 'models/team';
import { updateUser } from 'models/user';

export const stripe = new Stripe(env.stripe.secretKey ?? '');

export async function getStripeCustomerId(teamMember, session?: any) {
  let customerId = '';
  if (!teamMember.team.billingId) {
    const customerData: {
      metadata: { teamId: string };
      email?: string;
    } = {
      metadata: {
        teamId: teamMember.teamId,
      },
    };
    if (session?.user?.email) {
      customerData.email = session?.user?.email;
    }
    const customer = await stripe.customers.create({
      ...customerData,
      name: session?.user?.name as string,
    });
    await updateTeam(teamMember.team.slug, {
      billingId: customer.id,
      billingProvider: 'stripe',
    });
    customerId = customer.id;
  } else {
    customerId = teamMember.team.billingId;
  }
  return customerId;
}

export async function getStripeCustomerIdForUser(user, session?: any) {
  let customerId = '';
  
  if (env.stripe.userBillingEnabled) {
    if (!user.billingId) {
      const customerData: Stripe.CustomerCreateParams = {
        metadata: { userId: user.id },
        email: session?.user?.email,
        name: session?.user?.name as string,
      };
      const customer = await stripe.customers.create(customerData);
      await updateUser({ where: { id: user.id }, data: {
        billingId: customer.id,
        billingProvider: 'stripe'
      }});
      customerId = customer.id;
    } else {
      customerId = user.billingId;
    }
  }
  
  return customerId;
}

export async function getOrCreateStripeCustomer(user) {
  let customerId = '';
  
  if (!user.billingId) {
      // search for existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else  {
      const customerData: Stripe.CustomerCreateParams = {
        metadata: { userId: user.id },
        email: user.email,
        name: user.name as string,
      };
      const customer = await stripe.customers.create(customerData);
      customerId = customer.id;
    }
    await updateUser({ where: { id: user.id }, data: {
        billingId: customerId,
        billingProvider: 'stripe'
    }});
  } else {
    customerId = user.billingId;
  }
  
  return customerId;
}

export async function getBillingCustomerId(context: {
  teamMember?: any;
  user?: any;
  session?: any;
}) {
  if (env.stripe.userBillingEnabled && context.user) {
    return getStripeCustomerIdForUser(context.user, context.session);
  } else if (context.teamMember) {
    return getStripeCustomerId(context.teamMember, context.session);
  }
  
  throw new Error('No valid billing context found');
}
