import type { DefaultSession } from 'next-auth';
import type { SessionUser } from '@/lib/schema';
declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & { id: string; role: SessionUser['role']; active: boolean };
  }
}
