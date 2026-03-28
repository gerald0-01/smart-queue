import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { JWT } from "next-auth/jwt";
import type { User, Session, AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        idOrEmail: { label: "ID Number or MyIIT Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.idOrEmail || !credentials.password) return null;

        let user = await prisma.user.findUnique({ where: { idNumber: credentials.idOrEmail } });
        if (!user) user = await prisma.user.findUnique({ where: { email: credentials.idOrEmail } });
        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  jwt: { secret: process.env.JWT_SECRET },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;

        token.accessToken = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: "15m" });

        const newRefreshToken = crypto.randomUUID();

        await prisma.refreshToken.create({
          data: {
            hashedToken: newRefreshToken,
            userId: user.id,
            expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        token.refreshToken = newRefreshToken; // assign here for first login
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000;
      }

      // refresh token if expired
      if (Date.now() >= (token.accessTokenExpires as number)) {
        return await refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    },
  },
}

async function refreshAccessToken(token: any) {
  try {
    const existing = await prisma.refreshToken.findUnique({ where: { hashedToken: token.refreshToken } });
    if (!existing) throw new Error("Invalid refresh token");

    await prisma.refreshToken.deleteMany({ where: { userId: existing.userId } });

    const newRefreshToken = crypto.randomUUID();
    await prisma.refreshToken.create({
      data: { hashedToken: newRefreshToken, userId: existing.userId, expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    const newAccessToken = jwt.sign({ sub: existing.userId }, process.env.JWT_SECRET!, { expiresIn: "15m" });

    return { ...token, accessToken: newAccessToken, refreshToken: newRefreshToken, accessTokenExpires: Date.now() + 15 * 60 * 1000 };
  } catch {
    return { ...token, error: "RefreshTokenError" };
  }
}