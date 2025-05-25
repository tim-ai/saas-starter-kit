import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import Stripe from 'stripe';


export const StripePricingTable = dynamic(() => Promise.resolve(() => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return React.createElement("stripe-pricing-table", {
    "pricing-table-id": "prctbl_1RRayxI2BIHTI2ogIUuBphxt",
    "publishable-key": "pk_test_51ROjfoI2BIHTI2ogrEvGi8X5hQAdKNY4fk5B2Woh89d88bACcCKSAaUpb2zK7OqMpmVbJjopofGh9hnF7GtPlgcK00ur4gjvn1",
  }
);
}), { ssr: false });


const Products: NextPageWithLayout = () => {
  return (
    <div className="p-3">
      <StripePricingTable />
    </div>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Products;
