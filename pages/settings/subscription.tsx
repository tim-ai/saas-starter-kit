import useSWR from 'swr';
// import { useTranslation } from 'next-i18next';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import env from '@/lib/env';
import useTeam from 'hooks/useTeam';
import fetcher from '@/lib/fetcher';
import { Error, Loading } from '@/components/shared';
// import LinkToPortal from '@/components/billing/LinkToPortalUser';
import ProductPricing from '@/components/billing/ProductPricingUser';
// import Subscriptions from '@/components/billing/Subscriptions';

const Subscription = () => {
  // const { t } = useTranslation('common');
  const { isLoading, isError } = useTeam();
  const { data } = useSWR(
    `/api/payments/products`,
    fetcher
  );

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }


  const plans = data?.data?.products || [];
  const subscriptions = data?.data?.subscriptions || [];

  return (
    <>
      {(
        <>

          <ProductPricing plans={plans} subscriptions={subscriptions} />
          
        </>
      )}
    </>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  if (!env.teamFeatures.payments) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      teamFeatures: env.teamFeatures,
    },
  };
}

export default Subscription;
