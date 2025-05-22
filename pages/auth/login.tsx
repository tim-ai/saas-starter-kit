import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from 'next';

import * as Yup from 'yup';
import Link from 'next/link';
import { useFormik } from 'formik';
import { Button } from 'react-daisyui';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import React, { type ReactElement, useEffect, useState, useRef } from 'react';
import type { ComponentStatus } from 'react-daisyui/dist/types';
import { getCsrfToken, signIn, useSession } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import env from '@/lib/env';
import type { NextPageWithLayout } from 'types';
import { AuthLayout } from '@/components/layouts';
import GithubButton from '@/components/auth/GithubButton';
import GoogleButton from '@/components/auth/GoogleButton';
import { Alert, InputWithLabel, Loading } from '@/components/shared';
import { authProviderEnabled } from '@/lib/auth';
import Head from 'next/head';
import TogglePasswordVisibility from '@/components/shared/TogglePasswordVisibility';
import AgreeMessage from '@/components/auth/AgreeMessage';
import GoogleReCAPTCHA from '@/components/shared/GoogleReCAPTCHA';
import ReCAPTCHA from 'react-google-recaptcha';
import { maxLengthPolicies } from '@/lib/common';// Assuming lucide-react is available for icons in the key values section
import { Lightbulb, Users, CheckCircle, Briefcase } from 'lucide-react'; // Example icons

interface Message {
  text: string | null;
  status: ComponentStatus | null;
}

const Login: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ csrfToken, authProviders, recaptchaSiteKey }) => {
  const router = useRouter();
  const { status } = useSession();
  const { t } = useTranslation('common');
  const [recaptchaToken, setRecaptchaToken] = useState<string>('');
  const [message, setMessage] = useState<Message>({ text: null, status: null });
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const { error, success, token } = router.query as {
    error: string;
    success: string;
    token: string;
  };

  // ... your existing useEffect, formik, handlers, and other logic remain unchanged ...
  // I'm copying your existing logic here for completeness of the component structure.
  // No changes to this logic block.
  const handlePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  useEffect(() => {
    if (error) {
      setMessage({ text: error, status: 'error' });
    }
    if (success) {
      setMessage({ text: success, status: 'success' });
    }
  }, [error, success]);

  const redirectUrl = token
    ? `/invitations/${token}`
    : env.redirectIfAuthenticated;

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object().shape({
      email: Yup.string().required().email().max(maxLengthPolicies.email),
      password: Yup.string().required().max(maxLengthPolicies.password),
    }),
    onSubmit: async (values) => {
      const { email, password } = values;
      setMessage({ text: null, status: null });
      const response = await signIn('credentials', {
        email,
        password,
        csrfToken,
        redirect: false,
        callbackUrl: redirectUrl,
        recaptchaToken,
      });
      formik.resetForm();
      recaptchaRef.current?.reset();
      if (response && !response.ok) {
        setMessage({ text: response.error, status: 'error' });
        return;
      }
    },
  });

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'authenticated') {
    router.push(redirectUrl);
  }

  const params = token ? `?token=${token}` : '';
  // End of unchanged logic block

  // New JSX for layout starts here
  return (
    <>
      <Head>
        <title>{t('login-title')}</title>
        {/* Suggestion: For a full-page background image, you might apply it to a parent container
            or in your global styles, e.g., body { background-image: url('/your-bg-image.jpg'); background-size: cover; }
            The layout below creates a card effect that would sit nicely on such a background. */}
      </Head>

      <div className="w-2/3  mx-auto lg:grid lg:grid-cols-12 shadow-2xl rounded-xl overflow-hidden bg-white min-h-[70vh] my-8">
        {/* Left Column: Key Values & Branding (Hidden on smaller screens) */}
        <div className="hidden lg:col-span-5 lg:flex flex-col items-center justify-center p-8 xl:p-12 bg-gradient-to-br from-slate-800 to-slate-700 text-white">
          <div className="space-y-8 text-center">
            {/* Placeholder for your Logo */}
            <div>
              <Briefcase size={48} className="mx-auto mb-3 text-sky-400" /> {/* Example App Icon */}
              <h1 className="text-3xl font-bold tracking-tight">
                NITPICKR
                {/* {env.appName || t('app-name-placeholder', 'Your App Name')} */}
              </h1>
              <p className="text-slate-300 mt-1">
                {t('app-tagline-placeholder', 'Unlock Your Property Potential')}
              </p>
            </div>

            <div className="space-y-6 text-left">
              <div className="flex items-start space-x-3">
                <Lightbulb size={24} className="flex-shrink-0 mt-1 text-sky-400" />
                <div>
                  <h3 className="font-semibold">
                    {t('value-prop-1-title', 'Comprehensive Insights')}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {t('value-prop-1-desc', 'Access detailed information and identify potential issues at a glance.')}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users size={24} className="flex-shrink-0 mt-1 text-sky-400" />
                <div>
                  <h3 className="font-semibold">
                    {t('value-prop-2-title', 'Seamless Collaboration')}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {t('value-prop-2-desc', 'Share, discuss, and get input from your team, family, or advisors in one place.')}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle size={24} className="flex-shrink-0 mt-1 text-sky-400" />
                <div>
                  <h3 className="font-semibold">
                    {t('value-prop-3-title', 'Decide with Confidence')}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {t('value-prop-3-desc', 'Prioritize effectively and move forward with clarity on your property decisions.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-center p-6 sm:p-8 md:p-12">
          {/* The heading and description from AuthLayout will typically appear above this section */}
          {/* You can also add specific titles for the form area if needed */}
          {/* <h2 className="text-2xl font-semibold text-gray-800 mb-1 lg:hidden text-center">
            {t('welcome-back')}
          </h2>
          <p className="text-gray-600 mb-6 lg:hidden text-center">
            {t('log-in-to-account')}
          </p> */}

          {message.text && message.status && (
            <Alert status={message.status} className="mb-5">
              {/* Ensure your t() function can handle null or provide a default for message.text */}
              {message.text ? t(message.text) : t('unknown-error')}
            </Alert>
          )}

          <div className="w-full max-w-md mx-auto">
            {(authProviders.github || authProviders.google) && (
              <>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  {authProviders.github && <GithubButton  />}
                  {authProviders.google && <GoogleButton  />}
                </div>
                {authProviders.credentials && (
                  <div className="my-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">{t('or')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {authProviders.credentials && (
              <form onSubmit={formik.handleSubmit} className="space-y-4 text-xs">
                <InputWithLabel
                  type="email"
                  label={t('email')}
                  name="email"
                  placeholder="you@example.com"
                  value={formik.values.email}
                  error={formik.touched.email ? formik.errors.email : undefined}
                  onChange={formik.handleChange}
                />
                <div className="relative text-xs">
                  <InputWithLabel
                    type={isPasswordVisible ? 'text' : 'password'}
                    name="password"
                    placeholder={t('password')}
                    value={formik.values.password}
                    label={
                      <label className="label !px-0 text-xs"> {/* Adjusted label styling for better alignment if needed */}
                        <span className="label-text">{t('password')}</span>
                        <Link
                            href="/auth/forgot-password"
                            className="text-xs text-primary hover:text-[color-mix(in_oklab,oklch(var(--p)),black_7%)]"
                          >
                            {t('forgot-password')}
                          </Link>
                      </label>
                    }
                    error={
                      formik.touched.password ? formik.errors.password : undefined
                    }
                    onChange={formik.handleChange}
                  />
                  {/* TogglePasswordVisibility is absolutely positioned, ensure its container is relative */}
                  <TogglePasswordVisibility
                    isPasswordVisible={isPasswordVisible}
                    handlePasswordVisibility={handlePasswordVisibility}
                  />
                </div>
                <GoogleReCAPTCHA
                    recaptchaRef={recaptchaRef}
                    onChange={setRecaptchaToken}
                    siteKey={recaptchaSiteKey}
                  />
                <div>
                  <Button
                    type="submit"
                    color="primary" // This is react-daisyui, ensure it matches your desired primary color
                    loading={formik.isSubmitting}
                    active={formik.dirty} // 'active' might not be needed if submit is primary action
                    fullWidth
                    size="md"
                    className="mt-2" // Added some margin top
                  >
                    {t('sign-in')}
                  </Button>
                </div>
                <AgreeMessage text={t('sign-in')} />
              </form>
            )}

            {/* {(authProviders.email || authProviders.saml) && authProviders.credentials && (
              <div className="my-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">{t('more-options')}</span>
                  </div>
                </div>
              </div>
            )} */}

           

            <p className="text-center text-xs text-gray-600 mt-8">
              {t('dont-have-an-account')}
              <Link
                href={`/auth/join${params}`}
                className="font-medium text-primary hover:text-[color-mix(in_oklab,oklch(var(--p)),black_7%)] ml-1"
              >
                {t('create-a-free-account')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// Your Login.getLayout and getServerSideProps remain unchanged
Login.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout heading="welcome-back" description="log-in-to-account">
      {page}
    </AuthLayout>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { locale } = context;
  const csrfToken = await getCsrfToken(context);

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      csrfToken: csrfToken ?? null,
      authProviders: authProviderEnabled(),
      recaptchaSiteKey: env.recaptcha.siteKey,
    },
  };
};

export default Login;