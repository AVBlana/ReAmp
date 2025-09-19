// NextAuth error types for better type safety
export type OAuthError =
  | "OAuthAccountNotLinked"
  | "OAuthCallbackError"
  | "AccessDenied"
  | "Verification"
  | "Configuration"
  | "Default";

export type FriendlyError =
  | "account-not-linked"
  | "oauth-callback-error"
  | "access-denied"
  | "verification-failed"
  | "session-expired"
  | "oauth-error";

export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
}

export const ERROR_MESSAGES: Record<FriendlyError, ErrorMessage> = {
  "account-not-linked": {
    title: "Account Already Linked",
    message:
      "This account is already linked to a different user. Please sign in with the original provider or contact support.",
    action: "Try signing in with the original provider",
  },
  "oauth-callback-error": {
    title: "OAuth Error",
    message: "There was an error during the OAuth process. Please try again.",
    action: "Try connecting again",
  },
  "access-denied": {
    title: "Access Denied",
    message:
      "Access was denied. Please grant the required permissions to continue.",
    action: "Grant permissions and try again",
  },
  "verification-failed": {
    title: "Verification Failed",
    message: "Email verification failed. Please try again.",
    action: "Try again",
  },
  "session-expired": {
    title: "Session Expired",
    message: "Your session has expired. Please sign in again.",
    action: "Sign in again",
  },
  "oauth-error": {
    title: "Authentication Error",
    message: "An OAuth error occurred. Please try again.",
    action: "Try again",
  },
};

// Account linking types
export interface LinkedAccount {
  provider: string;
  providerAccountId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
}

export interface UserWithAccounts {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  accounts: LinkedAccount[];
}
