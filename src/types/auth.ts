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

/** NextAuth error codes (from URL ?error=) to user-facing description. Single source for auth error copy. */
export const AUTH_ERROR_DESCRIPTIONS: Record<string, string> = {
  Configuration:
    "There's a configuration issue with the authentication service. Please check your environment variables and OAuth settings.",
  AccessDenied:
    "Access was denied. You may have cancelled the authentication process or the app doesn't have the required permissions.",
  Verification:
    "The verification token has expired or is invalid. Please try signing in again.",
  OAuthSignin:
    "There was an error during the OAuth sign-in process. Please try again.",
  OAuthCallback:
    "There was an error during the OAuth callback process. Please try again.",
  OAuthCreateAccount:
    "There was an error creating your account. Please try again.",
  EmailCreateAccount:
    "There was an error creating your account with email. Please try again.",
  Callback:
    "There was an error during the callback process. Please try again.",
  OAuthAccountNotLinked:
    "This email is already used with another sign-in method (e.g. Google). Sign in with that method first, then on the app click “Connect Spotify” or “Connect Google” to link both to the same account.",
  EmailSignin:
    "There was an error sending the sign-in email. Please try again.",
  CredentialsSignin:
    "There was an error with your credentials. Please check your username and password.",
  SessionRequired:
    "You need to be signed in to access this page. Please sign in first.",
  SessionBridgeExpired:
    "The connection link expired. Please try connecting Spotify again.",
  SessionBridgeNoSession:
    "Session was lost during connection. Please try connecting Spotify again.",
};

const DEFAULT_AUTH_ERROR =
  "An unexpected error occurred during authentication. Please try again.";

export function getAuthErrorDescription(errorCode: string | null): string {
  if (!errorCode) return DEFAULT_AUTH_ERROR;
  return AUTH_ERROR_DESCRIPTIONS[errorCode] ?? DEFAULT_AUTH_ERROR;
}

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
