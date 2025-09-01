# Google OAuth Troubleshooting Guide for ReAMP

## Quick Fix Checklist

### 1. Environment Variables (Most Common Issue)

**Local Development (.env.local):**

```bash
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
DATABASE_URL="postgresql://username:password@localhost:5432/database"
```

**Production (Vercel):**

```bash
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="https://re-amp-git-main-avblanas-projects.vercel.app"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### 2. Google Cloud Console Configuration

**Redirect URIs to add:**

- `http://localhost:3000/api/auth/callback/google` (local)
- `https://re-amp-git-main-avblanas-projects.vercel.app/api/auth/callback/google` (production)

**OAuth Consent Screen:**

- Add your email as a test user
- Set scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/youtube.readonly`

### 3. Database Connection

Run these commands to test:

```bash
npm run test:db
npx prisma db push
```

## Detailed Error Analysis

### Error: "Configuration" (500 Internal Server Error)

**Causes:**

1. Missing `NEXTAUTH_SECRET`
2. Missing `NEXTAUTH_URL`
3. Invalid `DATABASE_URL`
4. Missing OAuth credentials

**Solutions:**

1. Generate a strong secret: `openssl rand -base64 32`
2. Set `NEXTAUTH_URL` to exact domain (no trailing slash)
3. Verify database connection
4. Check all OAuth credentials are set

### Error: "Access Denied"

**Causes:**

1. Incorrect redirect URIs
2. App not verified by Google
3. Missing scopes in consent screen

**Solutions:**

1. Add exact redirect URIs to Google Cloud Console
2. Add your email as test user in OAuth consent screen
3. Verify scopes are configured correctly

### Error: "OAuthCallback"

**Causes:**

1. Redirect URI mismatch
2. Invalid client secret
3. Network connectivity issues

**Solutions:**

1. Double-check redirect URIs match exactly
2. Regenerate OAuth client secret
3. Check network connectivity

## Step-by-Step Fix

### Step 1: Verify Environment Variables

Run the database test:

```bash
npm run test:db
```

This will check all required environment variables and database connection.

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: 74116071717
3. Navigate to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 client
5. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://re-amp-git-main-avblanas-projects.vercel.app/api/auth/callback/google`

### Step 3: Configure OAuth Consent Screen

1. Go to "OAuth consent screen"
2. Add your email as a test user
3. Add required scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/youtube.readonly`

### Step 4: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000/signin` and test Google login.

### Step 5: Deploy to Production

```bash
vercel --prod
```

Test production login at your Vercel URL.

## Common Issues and Solutions

### Issue: "Google hasn't verified this app"

**Solution:** This is normal for development. Click "Advanced" > "Go to [App Name] (unsafe)".

### Issue: Database connection fails in production

**Solution:** Ensure `DATABASE_URL` includes `?sslmode=require` for Vercel.

### Issue: NextAuth secret is too short

**Solution:** Generate a new secret with at least 32 characters:

```bash
openssl rand -base64 32
```

### Issue: Redirect URI mismatch

**Solution:** Ensure URIs match exactly - no trailing slashes, correct protocol (http/https).

## Debug Mode

Enable debug logging by setting in your environment:

```bash
NODE_ENV=development
```

This will show detailed NextAuth logs in the console.

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] `NEXTAUTH_URL` matches production domain exactly
- [ ] `NEXTAUTH_SECRET` is 32+ characters
- [ ] Redirect URIs added to Google Cloud Console
- [ ] Database connection includes SSL
- [ ] OAuth consent screen configured
- [ ] Test users added (if app unverified)

## Support Commands

```bash
# Test environment and database
npm run test:db

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# View database
npx prisma studio

# Deploy to Vercel
vercel --prod
```

## Still Having Issues?

1. Check browser console for JavaScript errors
2. Check Vercel function logs for server errors
3. Verify all environment variables are set correctly
4. Test with a fresh OAuth client
5. Ensure database is accessible from Vercel's IPs

