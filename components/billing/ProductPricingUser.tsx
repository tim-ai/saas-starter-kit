import toast from 'react-hot-toast';
import { Button } from 'react-daisyui';
import { useTranslation } from 'next-i18next';

import { Price } from '@prisma/client';
import PaymentButton from './PaymentButton';
import { Service, Subscription } from '@prisma/client';

interface ProductPricingProps {
  plans: any[];
  subscriptions: (Subscription & { product: Service })[];
  tiers: any[];
}

const ProductPricing = ({ plans, subscriptions, tiers }: ProductPricingProps) => {
  const { t } = useTranslation('common');

  const initiateCheckout = async (price: string, quantity?: number) => {
    const res = await fetch(
      `/api/payments/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price, quantity }),
      }
    );

    const data = await res.json();

    if (data?.data?.url) {
      window.open(data.data.url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error(
        data?.error?.message ||
          data?.error?.raw?.message ||
          t('stripe-checkout-fallback-error')
      );
    }
  };

  const hasActiveSubscription = (plan: any, price: Price) => {
    // check if user has any active subscription
    const hasActiveSubscription = subscriptions && subscriptions.length > 0;
  
    const subscribed = subscriptions.some((s) => s.priceId === price.id);
    if (!subscribed) {
      if (!hasActiveSubscription && plan?.name.toLowerCase() === 'basic') {
        return true; // Basic plan is always active for all users
      }
    } else {
      return true;
    }
  }

   return (
    <section className="bg-slate-50 dark:bg-slate-900 py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            {t('pricing_title', 'Flexible Plans for Everyone')}
          </h2>
          <p className="mt-4 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {t('pricing_subtitle', 'Choose the perfect plan to get started. No hidden fees, cancel anytime.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan) => {
            let tier = tiers.find((t) => t.name.toLowerCase() === plan.name.toLowerCase());
            if (!tier) {
              tier = tiers[0]; // Fallback to the first tier if not found
            }

            return (
              <div
                className={`
                  w-full h-full flex flex-col rounded-xl bg-white dark:bg-slate-800 shadow-lg 
                  hover:shadow-2xl transform transition duration-300 ease-in-out
                  ${plan.isActuallyPopular ? 'border-2 border-indigo-600 dark:border-indigo-500 relative ring-2 ring-indigo-600 dark:ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : 'border border-slate-200 dark:border-slate-700'}
                `}
                key={plan.id}
              >
                {plan.isActuallyPopular && (
                  <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 transform px-4 py-1 bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-semibold rounded-full shadow-md uppercase tracking-wider">
                    {t('popular_badge', 'Most Popular')}
                  </div>
                )}

                <div className="p-6 lg:p-8 flex flex-col flex-grow">
                  <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                  </div>

                  {/* Modern features list with enhanced styling */}
                  <div className="flex-grow mb-6">
                    <ul className="space-y-4">
                      {tier.features.map((feature: string) => (
                        <li className="flex items-start group" key={`${plan.id}-${feature}`}>
                          {/* Sleek check icon with animation */}
                          <div className="flex-shrink-0 mt-1">
                            <svg
                              className="h-5 w-5 text-indigo-600 dark:text-indigo-400 transition-transform group-hover:scale-110"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="ml-3 text-slate-700 dark:text-slate-300 font-medium transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Prices & CTAs Section - Pushed to bottom */}
                  <div className="mt-auto">
                    {plan.prices.map((price: Price) => (
                      <div key={price.id} className="mb-4 last:mb-0">
                        <div className="text-center mb-3">
                          <p className="text-3xl font-extrabold text-slate-800 dark:text-white">
                            {/* Assuming price.amount is in cents */}
                            ${(price.amount ? price.amount : 0).toFixed(2)}

                          </p>
                         
                        </div>

                        {hasActiveSubscription(plan, price) ? (
                          <Button
                            variant="outline" // DaisyUI variant
                            color="ghost" // More subtle for "current"
                            size="md"
                            fullWidth
                            disabled
                            className="rounded-md border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed" // More professional disabled look
                          >
                            {t('current_plan_button', 'Current Plan')}
                          </Button>
                        ) : (
                          // Assuming PaymentButton can take a className or is styled internally
                          // For a more SaaS feel, PaymentButton should ideally render a prominent button
                          <PaymentButton
                            plan={plan}
                            price={price}
                            initiateCheckout={() => initiateCheckout(price.id, 1)} // Pass price.id
                            // You might want to add classes here if PaymentButton accepts them
                            // e.g., className="w-full ..."
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductPricing;