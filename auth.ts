import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
// @ts-ignore -- adapter expects legacy Prisma client interface; works at runtime
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      if (user.email === process.env.ADMIN_EMAIL) {
        // createUser only fires on first creation; update existing accounts too
        if (user.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { approved: true, isAdmin: true },
          });
        }
        return true;
      }

      // Everyone else must already be approved
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { approved: true },
      });

      return dbUser?.approved === true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  events: {
    // Fires after the adapter creates the record — safe to update here
    async createUser({ user }) {
      if (user.email === process.env.ADMIN_EMAIL) {
        await prisma.user.update({
          where: { id: user.id },
          data: { approved: true, isAdmin: true },
        });
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});
