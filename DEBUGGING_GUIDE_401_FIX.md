# Debugging Guide: 401 Unauthorized from /api/user/connected-services

## 🚨 Root Cause Identified

The configuration test revealed that **all required environment variables are missing**. This is the primary cause of the 401 Unauthorized errors.

## 📋 Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Spotify OAuth
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your-spotify-client-id
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=your-database-url
```

## 🔧 Environment Setup Steps

### 1. Generate NEXTAUTH_SECRET

```bash
# Generate a random secret
openssl rand -base64 32
# Or use online generator: https://generate-secret.vercel.app/32
```

### 2. Set NEXTAUTH_URL

- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`

### 3. Spotify OAuth Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
4. Copy Client ID and Client Secret

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret

## 🧪 Testing Steps

### 1. Verify Environment Variables

```bash
node test-nextauth-config.js
```

Should show all variables as "✅ SET"

### 2. Check Database State

```bash
node test-database-state.js
```

Should show users, accounts, and sessions

### 3. Test OAuth Flow

1. Start development server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Click "Connect Spotify" or "Connect Google"
4. Complete OAuth flow
5. Check server logs for debugging output

## 🔍 Debugging Logs Added

The following debugging has been added to help diagnose issues:

### Connected Services API (`/api/user/connected-services`)

- Logs incoming cookies and headers
- Logs session retrieval results
- Logs database account queries

### NextAuth Callbacks (`src/lib/auth.ts`)

- **signIn callback**: Logs account and user info
- **jwt callback**: Logs token storage
- **session callback**: Logs session creation

### Landing Page (`src/app/page.tsx`)

- Retry logic for OAuth callbacks
- Detailed logging of API calls
- Credentials: 'include' for cookie handling

## 🚀 Expected Behavior After Fix

1. **OAuth Flow**: Click connect → OAuth → Return to landing with `?connected=provider`
2. **API Call**: Landing page calls `/api/user/connected-services` with retry logic
3. **Session**: API finds valid session and returns connected services
4. **UI Update**: Green indicators appear, "Drop a beat!" button enables

## 🔧 Additional Fixes Applied

### Cookie Configuration

```typescript
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === 'production'
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    }
  }
}
```

### Retry Logic

- 5 retry attempts with 300ms delay
- Only used when `?connected=provider` query param is present
- Includes `credentials: 'include'` for cookie handling

### Enhanced Logging

- Detailed NextAuth callback logging
- Cookie and header inspection
- Database query results

## 📝 Next Steps

1. **Set up environment variables** (most critical)
2. **Test OAuth flow** with debugging enabled
3. **Check server logs** for detailed debugging output
4. **Verify database state** after OAuth completion
5. **Remove debug logs** once issue is resolved

## 🐛 If Issues Persist

### Check Browser Cookies

1. Open DevTools → Application → Cookies
2. Look for `next-auth.session-token` cookie
3. Verify cookie domain and path

### Check Network Tab

1. Monitor `/api/user/connected-services` requests
2. Verify cookies are being sent
3. Check response status and headers

### Check Server Logs

Look for the following debug markers:

- `[connected-services] === DEBUG START ===`
- `[nextauth] === SIGNIN CALLBACK START ===`
- `[nextauth] === JWT CALLBACK START ===`
- `[nextauth] === SESSION CALLBACK START ===`

The debugging output will help identify exactly where the session is being lost.
