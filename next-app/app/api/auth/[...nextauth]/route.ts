import { PrismaClient } from "@prisma/client";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET ?? "secret",

  callbacks: {
    async signIn({ user }) {
      console.log("🔐 [signIn] Callback triggered");

      if (!user.email) {
        console.warn("⚠️ No email found in user object");
        return false;
      }

      try {
        console.log(`ℹ️ Attempting upsert for email: ${user.email}`);

        await prisma.user.upsert({
  where: { email: user.email },
  update: {},
  create: {
    email: user.email,
    provider: "Google",
    name: user.name ?? "", 
  },
});

        console.log(`✅ User upserted successfully: ${user.email}`);
        return true;

      } catch (error) {
        console.error("❌ Error during user upsert:", error);
        return false;
      }
    },

    async session({ session }) {
      console.log("🔁 [session] Callback triggered");
      console.log("Session:", session);
      return session;
    },

    async jwt({ token }) {
      console.log("🔑 [jwt] Callback triggered");
      return token;
    },
  },
});

export const GET = async (...args: any) => {
  console.log("📥 GET /api/auth request received");
  return handler(...args);
};

export const POST = async (...args: any) => {
  console.log("📥 POST /api/auth request received");
  return handler(...args);
};
