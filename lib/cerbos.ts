import { GRPC } from '@cerbos/grpc';

export const cerbos = new GRPC('localhost:3593', { tls: false });
