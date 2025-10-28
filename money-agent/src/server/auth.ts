import NextAuth from "next-auth/next";
// import { getServerSession } from "next-auth/next";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Resend } from "resend";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/server/db";
import { env } from "@/env";
import type { Session } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";

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

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        await sendVerificationRequest({ identifier, url });
      },
      from: env.EMAIL_FROM,
    }),
  ],
  session: { strategy: "database" as const },
  pages: { signIn: "/signin" },
  secret: env.NEXTAUTH_SECRET,
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

export async function auth(): Promise<Session | null> {
  // Minimal placeholder for server session in App Router with next-auth v4
  return null;
}
