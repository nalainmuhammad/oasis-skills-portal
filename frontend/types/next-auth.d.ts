import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      emailVerified: boolean;
      avatarType: string;
      avatarIcon: string;
    } & DefaultSession["user"];
    accessToken: string;
  }

  interface User extends DefaultUser {
    role: string;
    emailVerified: boolean;
    avatarType: string;
    avatarIcon: string;
    accessToken: string;
    refreshToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    emailVerified: boolean;
    avatarType: string;
    avatarIcon: string;
    accessToken: string;
    refreshToken: string;
    image?: string;
  }
}
