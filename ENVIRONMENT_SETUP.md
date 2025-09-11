# Environment Configuration Guide for ReAMP

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Local Development (.env.local)

```bash
# Database
NEXT_PUBLIC_DATABASE_URL="postgresql://username:password@localhost:5432/reamp_db"

# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secret-key-here-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# Spotify OAuth
NEXT_PUBLIC_SPOTIFY_CLIENT_ID="your-spotify-client-id"
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Production (Vercel Environment Variables)

Set these in your Vercel project settings:

```bash
# Database
NEXT_PUBLIC_DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secret-key-here-minimum-32-characters"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Spotify OAuth
NEXT_PUBLIC_SPOTIFY_CLIENT_ID="your-spotify-client-id"
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Google Cloud Console Configuration

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (ID: 74116071717)
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Choose "Web application"

### 2. Configure OAuth Consent Screen

1. Go to "OAuth consent screen"
2. Set User Type to "External" (for development)
3. Fill in required fields:
   - App name: "ReAMP"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/youtube.readonly`

### 3. Add Authorized Redirect URIs

Add these redirect URIs to your OAuth 2.0 client:

**For Local Development:**

```
http://localhost:3000/api/auth/callback/google
```

**For Production:**

```
https://re-amp-git-main-avblanas-projects.vercel.app/api/auth/callback/google
```

### 4. Handle "Unverified App" Warning

For development, you can:

1. Click "Advanced" on the warning screen
2. Click "Go to [Your App Name] (unsafe)"
3. This is normal for unverified apps in development

For production, you should:

1. Submit your app for verification
2. Or add test users in the OAuth consent screen

## Spotify Developer Dashboard Configuration

### 1. Add Redirect URIs

**For Local Development:**

```
http://localhost:3000/api/auth/callback/spotify
```

**For Production:**

```
https://re-amp-git-main-avblanas-projects.vercel.app/api/auth/callback/spotify
```

## Database Setup

### 1. Local Database

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) View database
npx prisma studio
```

### 2. Production Database (Vercel)

```bash
# Link to Vercel project
vercel link

# Pull environment variables
vercel env pull .env.local

# Push schema to production database
npx prisma db push
```

## Troubleshooting

### Common Issues

1. **"Configuration" Error**

   - Check all environment variables are set
   - Verify `NEXTAUTH_URL` matches your domain exactly
   - Ensure `NEXTAUTH_SECRET` is at least 32 characters

2. **"Access Denied" Error**

   - Check redirect URIs in Google Cloud Console
   - Verify OAuth consent screen is configured
   - Add your email as a test user if app is unverified

3. **Database Connection Issues**

   - Verify `NEXT_PUBLIC_DATABASE_URL` format
   - Check database is accessible from Vercel
   - Ensure SSL is enabled for production

4. **"Unverified App" Warning**
   - This is normal for development
   - Click "Advanced" > "Go to [App Name] (unsafe)"
   - For production, add test users or verify the app

### Debug Mode

Enable debug mode in development by setting:

```bash
NODE_ENV=development
```

This will show detailed NextAuth logs in the console.

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is a strong, random string (32+ characters)
- [ ] OAuth client secrets are secure and not exposed
- [ ] Database connection uses SSL in production
- [ ] Environment variables are not committed to git
- [ ] HTTPS is enforced in production
- [ ] Redirect URIs match exactly (no trailing slashes)

## Testing

1. **Local Testing**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000/signin`

2. **Production Testing**
   - Deploy to Vercel
   - Test both Spotify and Google login
   - Verify database records are created

## Support

If issues persist:

1. Check browser console for errors
2. Check Vercel function logs
3. Verify all environment variables are set
4. Test with a fresh OAuth client




