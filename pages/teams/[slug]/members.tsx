import {
  InviteMember,
  PendingInvitations,
} from '@/components/interfaces/Invitation';
import { Members, TeamTab } from '@/components/interfaces/Team';
import { Error, Loading } from '@/components/ui';
import useTeam from 'hooks/useTeam';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Button } from 'react-daisyui';
import type { NextPageWithLayout } from 'types';

const TeamMembers: NextPageWithLayout = () => {
  const router = useRouter();
  const { slug } = router.query as { slug: string };

  const { t } = useTranslation('common');
  const [visible, setVisible] = useState(false);
  const { team, error, isLoading } = useTeam(slug);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  if (!team) {
    return null;
  }

  return (
    <>
      <h3 className="text-2xl font-bold">{team.name}</h3>
      <TeamTab team={team} activeTab="members" />
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          color="primary"
          className="text-white"
          onClick={() => {
            setVisible(!visible);
          }}
        >
          {t('add-member')}
        </Button>
      </div>
      <Members team={team} />
      <PendingInvitations team={team} />
      <InviteMember visible={visible} setVisible={setVisible} team={team} />
    </>
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

export default TeamMembers;
