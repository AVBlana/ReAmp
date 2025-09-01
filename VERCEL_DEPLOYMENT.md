# Vercel Deployment Guide for ReAMP

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Your code should be pushed to GitHub
3. **Database** - You'll need a PostgreSQL database (recommended: Vercel Postgres)

## Step 1: Set up Database

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Create a new Postgres database
3. Copy the connection string

### Option B: External PostgreSQL

- Use services like:
  - [Neon](https://neon.tech) (Free tier available)
  - [Supabase](https://supabase.com) (Free tier available)
  - [Railway](https://railway.app) (Free tier available)

## Step 2: Deploy to Vercel

1. **Connect Repository**

   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the repository

2. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `yarn build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

## Step 3: Environment Variables

Add these environment variables in your Vercel project settings:

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth
NEXTAUTH_SECRET="your-secure-secret-key-here"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Spotify OAuth
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Optional (for backward compatibility)

```bash
# Legacy variables
REACT_APP_SPOTIFY_CLIENT_ID="your-spotify-client-id"
REACT_APP_SPOTIFY_API_KEY="your-spotify-client-secret"
REACT_APP_YOUTUBE_API_KEY="your-youtube-api-key"
```

## Step 4: OAuth Configuration

### Spotify Developer Dashboard

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Edit your app settings
3. Add redirect URI: `https://your-domain.vercel.app/api/auth/callback/spotify`

### Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Edit your OAuth 2.0 credentials
3. Add redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`

## Step 5: Database Migration

After deployment, you need to run the database migration:

1. **Install Vercel CLI**:

   ```bash
   npm i -g vercel
   ```

2. **Link to your project**:

   ```bash
   vercel link
   ```

3. **Run database migration**:
   ```bash
   vercel env pull .env.local
   npx prisma db push
   ```

## Step 6: Verify Deployment

1. **Check the deployment** - Your app should be live at `https://your-domain.vercel.app`
2. **Test authentication** - Try signing in with Spotify/Google
3. **Check database** - Verify users are being created in your database

## Troubleshooting

### Common Issues

1. **"Database connection failed"**

   - Check your `DATABASE_URL` format
   - Ensure database is accessible from Vercel's IPs
   - Verify database credentials

2. **"OAuth callback error"**

   - Verify redirect URIs match exactly
   - Check OAuth client IDs and secrets
   - Ensure `NEXTAUTH_URL` matches your domain

3. **"Prisma client not generated"**

   - The `postinstall` script should handle this automatically
   - Check build logs for Prisma generation errors

4. **"Environment variable not found"**
   - Verify all required variables are set in Vercel
   - Check variable names match exactly (case-sensitive)

### Build Logs

If you encounter build issues:

1. **Check build logs** in Vercel dashboard
2. **Verify dependencies** are correctly installed
3. **Check for TypeScript errors** in the build output

### Performance Optimization

1. **Enable caching** for static assets
2. **Use Vercel's Edge Functions** for API routes
3. **Optimize images** with Next.js Image component
4. **Enable compression** for better loading times

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is a strong, random string
- [ ] OAuth client secrets are secure
- [ ] Database connection uses SSL
- [ ] Environment variables are not exposed in client code
- [ ] HTTPS is enforced (automatic on Vercel)

## Monitoring

1. **Vercel Analytics** - Monitor performance and errors
2. **Database monitoring** - Check connection health
3. **OAuth usage** - Monitor authentication patterns
4. **Error tracking** - Set up error reporting (e.g., Sentry)

## Cost Optimization

- **Vercel Hobby Plan** - Free for personal projects
- **Database costs** - Choose free tier databases when possible
- **Bandwidth** - Monitor usage to stay within limits

## Support

If you encounter issues:

1. **Check Vercel documentation** - [vercel.com/docs](https://vercel.com/docs)
2. **NextAuth.js docs** - [next-auth.js.org](https://next-auth.js.org)
3. **Prisma docs** - [prisma.io/docs](https://prisma.io/docs)
4. **GitHub Issues** - Check existing issues in the repositories

Your ReAMP application should now be successfully deployed on Vercel with full authentication support! 🎉
