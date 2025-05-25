import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authApi } from '../../../../lib/api';
import { LoginResponse } from '../../../../types/auth';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Type the response properly using the LoginResponse type
          const response: LoginResponse = await authApi.login(
            credentials.email,
            credentials.password
          );
          
          // Now TypeScript knows the structure of the response
          return {
            id: String(response.user.id),
            email: response.user.email,
            name: response.user.name,
            image: response.user.profile_pic_url,
            token: response.token,
            isAdmin: response.user.is_admin,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user data and token to JWT token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.token = user.token;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data and token to session
      session.user = {
        id: token.id,
        email: token.email as string,
        name: token.name as string,
        image: token.picture as string,
        isAdmin: token.isAdmin as boolean,
      };
      session.token = token.token as string;
      
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };