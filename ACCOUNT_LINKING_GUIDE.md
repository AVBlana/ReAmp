# NextAuth Account Linking Implementation Guide

This guide documents the comprehensive NextAuth setup that allows users to link multiple OAuth accounts to a single user profile and handles OAuth/session errors gracefully.

## 🎯 Features Implemented

### ✅ Account Linking

- **Multiple OAuth providers** can be linked to a single user profile
- **Email-based linking** ensures users with the same email get their accounts merged
- **Automatic account creation** for new users
- **Conflict prevention** prevents duplicate accounts

### ✅ Error Handling

- **OAuth errors** are caught and redirected with friendly messages
- **Session errors** are handled gracefully in middleware
- **User-friendly error messages** displayed in the UI
- **Automatic error recovery** with retry mechanisms

### ✅ Type Safety

- **TypeScript types** for all error scenarios
- **Structured error messages** with titles and actions
- **Type-safe account linking** utilities

## 🏗️ Architecture

### Core Components

1. **`src/lib/auth.ts`** - NextAuth configuration with account linking logic
2. **`src/middleware.ts`** - Error handling middleware
3. **`src/app/page.tsx`** - Login page with error display
4. **`src/types/auth.ts`** - TypeScript definitions
5. **`src/utils/account-linking.ts`** - Utility functions

### Database Schema

The Prisma schema supports account linking with these key relationships:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  accounts      Account[] // One-to-many relationship
  sessions      Session[]
}

model Account {
  id                String   @id @default(cuid())
  userId            String   // Foreign key to User
  provider          String   // e.g., "spotify", "google"
  providerAccountId String   // Unique provider ID
  @@unique([provider, providerAccountId]) // Prevents duplicate accounts
}
```

## 🔧 Configuration Details

### NextAuth Configuration

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Spotify and Google providers configured
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Account linking logic
      // Prevents duplicate accounts
      // Allows linking multiple providers to same user
    },
    async redirect({ url, baseUrl }) {
      // Error handling for OAuth flows
      // Maps OAuth errors to friendly messages
    },
  },
});
```

### Error Handling Flow

1. **OAuth Error Occurs** → NextAuth redirect callback
2. **Error Mapped** → Friendly error code (e.g., `account-not-linked`)
3. **User Redirected** → Login page with error parameter
4. **Error Displayed** → User-friendly message with action
5. **Auto-cleanup** → URL cleaned after 10 seconds

## 📝 Error Types Handled

| OAuth Error             | Friendly Error         | User Message                                            |
| ----------------------- | ---------------------- | ------------------------------------------------------- |
| `OAuthAccountNotLinked` | `account-not-linked`   | "This account is already linked to a different user..." |
| `OAuthCallbackError`    | `oauth-callback-error` | "There was an error during the OAuth process..."        |
| `AccessDenied`          | `access-denied`        | "Access was denied. Please grant permissions..."        |
| `Verification`          | `verification-failed`  | "Email verification failed..."                          |
| `SessionTokenError`     | `session-expired`      | "Your session has expired..."                           |

## 🚀 Usage Examples

### Account Linking Flow

1. **User signs in with Spotify** → Account created
2. **Same user signs in with Google** → Account linked to existing user
3. **Both accounts** now accessible under single profile

### Error Handling Flow

1. **User tries to link conflicting account** → `OAuthAccountNotLinked` error
2. **Error caught in middleware** → Redirected to login page
3. **Friendly message displayed** → "Account already linked" message
4. **User can try again** → With correct provider or contact support

### API Integration

```typescript
// Get user with all linked accounts
const userWithAccounts = await getUserWithAccounts(email);

// Check if account is linked
const isLinked = await isAccountLinked("spotify", "user123");

// Link new account to user
const linkedAccount = await linkAccountToUser(userId, accountData);
```

## 🧪 Testing

The implementation includes comprehensive testing:

- **Database constraints** verified
- **Account linking** tested
- **Error handling** validated
- **No duplicate users** confirmed
- **No orphaned accounts** verified

## 🔒 Security Considerations

1. **Email-based linking** is secure for OAuth providers
2. **Unique constraints** prevent account conflicts
3. **Error messages** don't leak sensitive information
4. **Session validation** prevents unauthorized access
5. **Automatic cleanup** of expired sessions

## 📋 Best Practices

1. **Always handle OAuth errors** gracefully
2. **Provide clear error messages** to users
3. **Log errors** for debugging (but not in production)
4. **Use TypeScript** for type safety
5. **Test account linking** thoroughly
6. **Monitor for duplicate accounts** in production

## 🐛 Troubleshooting

### Common Issues

1. **"Account already linked" errors**

   - User has multiple accounts with same email
   - Solution: Merge accounts or use original provider

2. **SessionTokenError in middleware**

   - Expired or invalid session
   - Solution: Redirect to login page

3. **OAuth callback errors**
   - Provider configuration issues
   - Solution: Check client ID/secret configuration

### Debug Commands

```bash
# Check account linking status
node -e "const { getAllUsersWithEmail } = require('./src/utils/account-linking'); getAllUsersWithEmail('user@example.com').then(console.log)"

# Verify database constraints
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.account.findMany().then(console.log)"
```

## 🎉 Benefits

- **Single sign-on experience** across multiple providers
- **Graceful error handling** improves user experience
- **Type-safe implementation** reduces bugs
- **Comprehensive testing** ensures reliability
- **Clear documentation** for maintenance

This implementation provides a robust, user-friendly authentication system that handles the complexities of multi-provider OAuth while maintaining security and providing excellent user experience.
