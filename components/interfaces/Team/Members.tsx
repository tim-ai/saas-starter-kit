import { Card, Error, LetterAvatar, Loading } from '@/components/ui';
import { availableRoles } from '@/lib/roles';
import { Team, TeamMember } from '@prisma/client';
import axios from 'axios';
import useTeamMembers from 'hooks/useTeamMembers';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { Button } from 'react-daisyui';
import toast from 'react-hot-toast';

const Members = ({ team }: { team: Team }) => {
  const { data: session } = useSession();
  const { t } = useTranslation('common');

  const { isLoading, error, members, mutateTeamMembers } = useTeamMembers(
    team.slug
  );

  if (!session) {
    return null;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  if (!members) {
    return null;
  }

  const removeTeamMember = async (member: TeamMember) => {
    await axios.delete(`/api/teams/${team.slug}/members`, {
      data: {
        memberId: member.userId,
      },
    });

    mutateTeamMembers();

    toast.success('Deleted the member successfully.');
  };

  return (
    <Card heading="Team Members">
      <Card.Body>
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                {t('name')}
              </th>
              <th scope="col" className="px-6 py-3">
                {t('email')}
              </th>
              <th scope="col" className="px-6 py-3">
                {t('role')}
              </th>
              <th scope="col" className="px-6 py-3">
                {t('action')}
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              return (
                <tr
                  key={member.id}
                  className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-start space-x-2">
                      <LetterAvatar name={member.user.name} />
                      <span>{member.user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">{member.user.email}</td>
                  <td className="px-6 py-3">
                    {member.userId === session.user.id ? (
                      member.role
                    ) : (
                      <UpdateRoleDropdown team={team} member={member} />
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <Button
                      disabled={member.userId === session.user.id}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        removeTeamMember(member);
                      }}
                    >
                      {t('remove')}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card.Body>
    </Card>
  );
};

const UpdateRoleDropdown = ({
  team,
  member,
}: {
  team: Team;
  member: TeamMember;
}) => {
  const updateRole = async (member: TeamMember, role: string) => {
    try {
      await axios.patch(`/api/teams/${team.slug}/members`, {
        memberId: member.userId,
        role,
      });

      toast.success('Updated the role successfully.');
    } catch (error: any) {
      toast.error(error.response.data.error.message);
    }
  };

  return (
    <select
      className="rounded-md text-sm"
      onChange={(e) => updateRole(member, e.target.value)}
      defaultValue={member.role}
    >
      {availableRoles.map((role) => (
        <option value={role.id} key={role.id}>
          {role.id}
        </option>
      ))}
    </select>
  );
};

export default Members;
