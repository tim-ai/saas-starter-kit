import { ApiError } from '@/lib/errors';
import { Action, Resource, permissions } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Role, TeamMember } from '@prisma/client';
import type { Session } from 'next-auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { maxLengthPolicies } from '@/lib/common';

export const normalizeUser = (user) => {
  if (user?.name) {
    user.name = user.name.substring(0, maxLengthPolicies.name);
  }

  return user;
};

export const createUser = async (data: {
  name: string;
  email: string;
  password?: string;
  emailVerified?: Date | null;
}) => {
  return await prisma.user.create({
    data: normalizeUser(data),
  });
};

export const updateUser = async ({ where, data }) => {
  // If billing fields are being updated, we don't want to normalize them
  if (data.billingId || data.billingProvider) {
    const { billingId, billingProvider, ...rest } = data;
    data = {
      ...rest,
      ...(billingId && { billingId }),
      ...(billingProvider && { billingProvider })
    };
  } else {
    data = normalizeUser(data);
  }

  return await prisma.user.update({
    where,
    data,
  });
};

export const upsertUser = async ({ where, update, create }) => {
  update = normalizeUser(update);
  create = normalizeUser(create);

  return await prisma.user.upsert({
    where,
    update,
    create,
  });
};

export const getUser = async (key: { id: string } | { email: string }) => {
  const user = await prisma.user.findUnique({
    where: key,
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      password: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      invalid_login_attempts: true,
      lockedAt: true,
      billingId: true,
      billingProvider: true
    }
  });

  return normalizeUser(user);
};

export const getUserBySession = async (session: Session | null) => {
  if (session === null || session.user === null) {
    return null;
  }

  const id = session?.user?.id;

  if (!id) {
    return null;
  }

  return await getUser({ id });
};

export const deleteUser = async (key: { id: string } | { email: string }) => {
  return await prisma.user.delete({
    where: key,
  });
};

export const findFirstUserOrThrow = async ({ where }) => {
  const user = await prisma.user.findFirstOrThrow({
    where,
  });

  return normalizeUser(user);
};

const isAllowed = (role: Role, resource: Resource, action: Action) => {
  const rolePermissions = permissions[role];

  if (!rolePermissions) {
    return false;
  }

  for (const permission of rolePermissions) {
    if (
      permission.resource === resource &&
      (permission.actions === '*' || permission.actions.includes(action))
    ) {
      return true;
    }
  }

  return false;
};

export const throwIfNotAllowed = (
  user: Pick<TeamMember, 'role'>,
  resource: Resource,
  action: Action
) => {
  if (isAllowed(user.role, resource, action)) {
    return true;
  }

  throw new ApiError(
    403,
    `You are not allowed to perform ${action} on ${resource}`
  );
};

// Get current user from session
export const getCurrentUser = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session.user;
};

export const getByCustomerId = async (customerId: string) => {
  return await prisma.user.findFirst({
    where: {
      billingId: customerId,
    },
  });
};
