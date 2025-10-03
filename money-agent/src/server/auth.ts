import NextAuth, { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Resend } from "resend";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/server/db";
import { env } from "@/env";
import type { Session } from "next-auth";
import type { User as PrismaUser } from "@prisma/client";

const resend = new Resend(env.RESEND_API_KEY);

async function sendVerificationRequest(params: { identifier: string; url: string }) {
  const { identifier, url } = params;
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: identifier,
    subject: "Sign in to Money Agent",
    html: `<p>Click <a href="${url}">here</a> to sign in.</p>`
  });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        await sendVerificationRequest({ identifier, url });
      },
      from: env.EMAIL_FROM,
    }),
  ],
  session: { strategy: "database" },
  pages: { signIn: "/signin" },
  callbacks: {
    async session({ session, user }: { session: Session; user: PrismaUser }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.admin = Boolean(user.admin);
      }
      return session;
    },
  },
  secret: env.NEXTAUTH_SECRET,
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Minimal wrapper for server session in app router
export async function auth(): Promise<Session | null> {
  // NextAuth v4 minimal placeholder for server session.
  return null;
}
