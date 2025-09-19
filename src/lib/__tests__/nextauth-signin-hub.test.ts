import { NextAuthOptions } from "next-auth";

// Mock the auth configuration
const mockAuthOptions: NextAuthOptions = {
  pages: {
    signIn: "/", // landing page is the sign-in hub
    error: "/auth/error",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("🔀 Redirect callback called:", { url, baseUrl });

      // If URL contains an error, redirect to landing page
      if (url.includes("error=OAuthAccountNotLinked")) {
        console.log(
          "🔀 OAuthAccountNotLinked error detected - redirecting to landing page"
        );
        return baseUrl;
      }

      // If relative path, keep it
      if (url.startsWith("/")) {
        console.log("🔀 Redirecting to relative URL:", `${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }

      // If same origin, allow it
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          console.log("🔀 Redirecting to same origin:", url);
          return url;
        }
      } catch (e) {
        console.log("🔀 Invalid URL, using baseUrl:", e);
      }

      // Default to baseUrl (landing page) - no forced redirect to /reamp
      console.log("🔀 Default redirect to landing page");
      return baseUrl;
    },
  },
};

describe("NextAuth Configuration", () => {
  it("uses landing page as sign-in page", () => {
    expect(mockAuthOptions.pages?.signIn).toBe("/");
  });

  it("redirects to landing page when OAuthAccountNotLinked error occurs", async () => {
    const url = `${mockAuthOptions.pages?.signIn}/api/auth/callback/spotify?error=OAuthAccountNotLinked`;
    const baseUrl = "http://localhost:3000";
    const result = await mockAuthOptions.callbacks!.redirect!({ url, baseUrl });
    expect(result).toBe(baseUrl);
  });

  it("redirects to relative URL when URL starts with /", async () => {
    const url = "/?connected=spotify";
    const baseUrl = "http://localhost:3000";
    const result = await mockAuthOptions.callbacks!.redirect!({ url, baseUrl });
    expect(result).toBe(`${baseUrl}${url}`);
  });

  it("redirects to same origin URL when valid", async () => {
    const url = "http://localhost:3000/?connected=spotify";
    const baseUrl = "http://localhost:3000";
    const result = await mockAuthOptions.callbacks!.redirect!({ url, baseUrl });
    expect(result).toBe(url);
  });

  it("redirects to landing page by default", async () => {
    const url = "https://malicious-site.com/steal-tokens";
    const baseUrl = "http://localhost:3000";
    const result = await mockAuthOptions.callbacks!.redirect!({ url, baseUrl });
    expect(result).toBe(baseUrl);
  });

  it("respects callbackUrl parameter from OAuth flow", async () => {
    const callbackUrl = "http://localhost:3000/?connected=spotify";
    const baseUrl = "http://localhost:3000";
    const result = await mockAuthOptions.callbacks!.redirect!({
      url: callbackUrl,
      baseUrl,
    });
    expect(result).toBe(callbackUrl);
  });
});
