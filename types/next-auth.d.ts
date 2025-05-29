import 'next-auth';

declare module 'next-auth' {
  interface User {
    billingId?: string | null;
    billingProvider?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      billingId?: string | null;
      billingProvider?: string | null;
    } & DefaultSession['user'];
  }

  interface Profile {
    requested?: {
      tenant: string;
    };
    roles?: string[];
    groups?: string[];
  }
}
