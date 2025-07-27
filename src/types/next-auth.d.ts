// ✅ FIXED Phase 4D True Fix - Replace Role and Plan enums with proper UserRole type
import NextAuth, { DefaultSession } from 'next-auth';
import { UserRole } from '@/lib/permissions';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: UserRole;
      plan: string;
      image?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    plan: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    plan: string;
  }
}
