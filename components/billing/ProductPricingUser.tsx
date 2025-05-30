import toast from 'react-hot-toast';
import { Button } from 'react-daisyui';
import { useTranslation } from 'next-i18next';

import { Price } from '@prisma/client';
import PaymentButton from './PaymentButton';
import { Service, Subscription } from '@prisma/client';

interface ProductPricingProps {
  plans: any[];
  subscriptions: (Subscription & { product: Service })[];
}

const ProductPricing = ({ plans, subscriptions }: ProductPricingProps) => {
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

  const hasActiveSubscription = (price: Price) =>
    subscriptions.some((s) => s.priceId === price.id);

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
                    <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm min-h-[3rem] sm:min-h-[4rem]"> {/* Consistent height for description */}
                      {plan.description}
                    </p>
                  </div>

                  {/* Features Section */}
                  <ul className="space-y-3 text-sm flex-grow mb-8">
                    {plan.features.map((feature: string) => (
                      <li className="flex items-start" key={`${plan.id}-${feature}`}>
                        <svg
                          className="flex-shrink-0 h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5} // Adjusted stroke width
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

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

                        {hasActiveSubscription(price) ? (
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