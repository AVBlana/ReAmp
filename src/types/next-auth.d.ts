// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
    provider?: string;
    providers: {
      spotify?: {
        accessToken: string | null;
        expiresAt?: number | null;
      };
      google?: {
        accessToken: string | null;
        expiresAt?: number | null;
      };
    };
  }

  interface JWT {
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    provider?: string;
    error?: string;
    spotify?: {
      accessToken: string;
      refreshToken: string;
      expires_at: number;
    };
    google?: {
      accessToken: string;
      refreshToken: string;
      expires_at: number;
    };
  }
}
