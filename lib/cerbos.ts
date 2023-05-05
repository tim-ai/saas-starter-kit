import type { IsAllowedRequest } from '@cerbos/core';
import { GRPC } from '@cerbos/grpc';

export const cerbos = new GRPC('localhost:3593', { tls: false });

export const throwIfNotAllowed = async (request: IsAllowedRequest) => {
  const isAllowed = await cerbos.isAllowed(request);

  if (!isAllowed) {
    throw new Error(`You don't have permission to do this action.`);
  }
};
