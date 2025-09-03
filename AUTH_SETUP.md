# ReAMP Authentication Setup Guide

This guide will help you set up the production-ready authentication system for ReAMP.

## Prerequisites

1. **Spotify Developer Account**

   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`

2. **Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable YouTube Data API v3
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:3000/api/auth/callback/google`

## Environment Setup

1. **Create `.env.local` file** in the root directory:

```bash
# Database
NEXT_PUBLIC_DATABASE_URL="file:./dev.db"

# NextAuth
NEXT_PUBLIC_NEXTAUTH_SECRET="your-nextauth-secret-key-here-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Spotify OAuth
NEXT_PUBLIC_SPOTIFY_CLIENT_ID="your-spotify-client-id"
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"

# Google OAuth (for YouTube)
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Legacy variables (for backward compatibility)
REACT_APP_SPOTIFY_CLIENT_ID="your-spotify-client-id"
REACT_APP_SPOTIFY_API_KEY="your-spotify-client-secret"
REACT_APP_YOUTUBE_API_KEY="your-youtube-api-key"
```

2. **Generate a secure NEXT_PUBLIC_NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```

## Database Setup

1. **Initialize the database**:

   ```bash
   npx prisma db push
   ```

2. **Generate Prisma client** (if not already done):
   ```bash
   npx prisma generate
   ```

## Running the Application

1. **Install dependencies**:

   ```bash
   yarn install
   ```

2. **Start the development server**:

   ```bash
   yarn dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Authentication Flow

1. **Home Page** (`/`) - Shows landing page with "Get Started" button
2. **Sign In** (`/signin`) - Choose between Spotify and Google authentication
3. **Dashboard** (`/dashboard`) - Protected page showing user info and connected services
4. **Music Player** (`/reamp`) - Protected page with the main application

## Features

### ✅ Implemented

- [x] NextAuth.js v5 with App Router support
- [x] Spotify OAuth with token refresh
- [x] Google OAuth with YouTube scope
- [x] SQLite database with Prisma
- [x] Protected routes with middleware
- [x] Automatic token refresh
- [x] Session management
- [x] AuthContext bridge to existing app
- [x] Updated API routes to use NextAuth tokens

### 🔄 Migration Notes

- Existing `UnifiedContext` is preserved and bridged to NextAuth
- API routes now use session tokens instead of hardcoded ones
- Token refresh is handled automatically by NextAuth
- No breaking changes to existing components

## API Routes

### New Protected Routes

- `/api/spotify/search` - Uses NextAuth Spotify token
- `/api/youtube/search` - Uses NextAuth Google token

### Legacy Routes (for backward compatibility)

- `/api/spotify/*` - Old Spotify routes (deprecated)
- `/api/youtube/*` - Old YouTube routes (deprecated)

## Troubleshooting

### Common Issues

1. **"Environment variable not found: NEXT_PUBLIC_DATABASE_URL"**

   - Ensure `.env.local` file exists and contains `NEXT_PUBLIC_DATABASE_URL="file:./dev.db"`

2. **"Unauthorized" errors**

   - Check that OAuth credentials are correctly set in `.env.local`
   - Verify redirect URIs match exactly

3. **Token refresh issues**

   - Ensure `access_type=offline` and `prompt=consent` are set for Google OAuth
   - Check that refresh tokens are being stored in the database

4. **Database errors**
   - Run `npx prisma db push` to sync schema
   - Run `npx prisma generate` to regenerate client

### Development Commands

```bash
# Database management
yarn db:generate    # Generate Prisma client
yarn db:push        # Push schema to database
yarn db:migrate     # Run migrations
yarn db:studio      # Open Prisma Studio

# Development
yarn dev            # Start development server
yarn build          # Build for production
yarn start          # Start production server
```

## Production Deployment

1. **Update environment variables** for production
2. **Use a production database** (PostgreSQL recommended)
3. **Set secure NEXT_PUBLIC_NEXTAUTH_SECRET**
4. **Configure HTTPS** for production domains
5. **Update redirect URIs** in OAuth providers

## Security Notes

- Never commit `.env.local` to version control
- Use strong, unique secrets for production
- Regularly rotate OAuth client secrets
- Monitor token usage and refresh patterns
- Implement rate limiting for API routes
