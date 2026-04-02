import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            email?: string;
            name?: string;
        } & DefaultSession["user"];

        accessToken?: string;
        refreshToken?: string;
    }

    interface User extends DefaultUser {
        role: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: string;
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpires?: number;
    }
}
