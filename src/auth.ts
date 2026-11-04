import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { activeMember } from '@/lib/server/members';
import { verifiedGoogleEmail } from '@/lib/permissions';
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      checks: ['pkce', 'state', 'nonce'],
      authorization: { params: { prompt: 'select_account' } },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    async signIn({ account, profile }) {
      const email = verifiedGoogleEmail(account?.provider, profile);
      if (!email) return false;
      try {
        return !!(await activeMember(email));
      } catch {
        return '/login?error=configuration';
      }
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && profile?.email_verified === true) {
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.picture as string | undefined;
      }
      return token;
    },
    async session({ session, token }) {
      const member = token.email ? await activeMember(token.email) : null;
      if (!member)
        return {
          ...session,
          user: {
            ...session.user,
            id: '',
            email: null,
            name: null,
            role: 'viewer' as const,
            active: false,
          },
        };
      return {
        ...session,
        user: {
          ...session.user,
          id: member.id,
          email: member.email,
          name: member.name,
          role: member.role,
          active: true,
        },
      };
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return new URL(url).origin === baseUrl ? url : `${baseUrl}/dashboard`;
    },
  },
});
