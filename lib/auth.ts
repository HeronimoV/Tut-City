import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getProfile, createProfile } from "@/lib/db";
import { isEmailVerified, isDisposableEmail } from "@/lib/email-verify";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return null;

        // Require password minimum 6 chars
        if (credentials.password.length < 6) return null;

        // Block disposable emails
        if (isDisposableEmail(email)) return null;

        // Block obviously fake domains
        const domain = email.split("@")[1];
        if (!domain || domain.length < 3) return null;

        // Require email verification
        const verified = await isEmailVerified(email);
        if (!verified) return null;

        return {
          id: email,
          email: email,
          name: email.split("@")[0],
        };
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    },
    async signIn({ user }) {
      // Create profile in Supabase on first login
      try {
        const existing = await getProfile(user.id);
        if (!existing) {
          await createProfile(user.id, user.email || "", user.name || "");
        }
      } catch {
        // Non-blocking — don't prevent sign-in if Supabase is down
      }
      return true;
    },
  },
};
