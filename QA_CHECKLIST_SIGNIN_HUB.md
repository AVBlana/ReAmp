# QA Checklist: Landing Page as Sign-In Hub

## ✅ Implementation Summary

All `/signin` redirects have been removed and the landing page (`/`) is now the canonical sign-in hub. Users can connect Spotify and Google accounts without being forced to a separate sign-in page.

## 🧪 Manual Testing Checklist

### 1. Landing Page Functionality

- [ ] **Landing page loads correctly** - Visit `/` and verify it shows connect buttons
- [ ] **Connect buttons are visible** - Spotify (green) and Google (blue) buttons with icons
- [ ] **Status indicators work** - Gray dots show when not connected, green when connected
- [ ] **"Drop a beat!" button behavior** - Disabled when no services connected, enabled when at least one connected
- [ ] **Responsive design** - Buttons stack on mobile, side-by-side on desktop

### 2. OAuth Flow Testing

- [ ] **Spotify OAuth flow** - Click "Connect Spotify" → Complete OAuth → Return to landing page with `?connected=spotify`
- [ ] **Google OAuth flow** - Click "Connect Google" → Complete OAuth → Return to landing page with `?connected=google`
- [ ] **Success toast appears** - Green toast shows "Spotify connected successfully!" or "Google connected successfully!"
- [ ] **Status indicator updates** - Green dot appears next to connected service
- [ ] **URL cleanup** - Query parameter is removed after processing
- [ ] **"Drop a beat!" becomes active** - Button enables when service is connected

### 3. Sign-In Page Redirect

- [ ] **Direct /signin access** - Visit `/signin` → Should redirect to `/` (landing page)
- [ ] **No legacy sign-in UI** - No old sign-in screen should appear
- [ ] **Redirect is immediate** - No loading or flash of old content

### 4. Protected Route Behavior

- [ ] **Dashboard redirect** - Visit `/dashboard` without auth → Redirects to `/` (not `/signin`)
- [ ] **Reamp redirect** - Visit `/reamp` without auth → Redirects to `/` (not `/signin`)
- [ ] **Auth error redirect** - OAuth errors redirect to `/` (not `/signin`)

### 5. Component Integration

- [ ] **UserAvatar connect actions** - Click connect in notifications → Uses landing page callback URLs
- [ ] **NotificationArea connect actions** - Click connect in notifications → Uses landing page callback URLs
- [ ] **SpotifyAuthCheck connect** - Click connect button → Redirects to `/` (not `/signin`)
- [ ] **Dashboard connect buttons** - Click connect buttons → Uses landing page callback URLs

### 6. Player Integration

- [ ] **SpotifyPlayerManager redirects** - Authentication failures redirect to `/` (not `/signin`)
- [ ] **Reamp page redirects** - Authentication failures redirect to `/` (not `/signin`)
- [ ] **Server-side token usage** - Player uses tokens from Prisma, not client session

### 7. Multiple Service Connection

- [ ] **Connect Spotify first** - Connect Spotify → Green indicator appears → "Drop a beat!" enabled
- [ ] **Connect Google second** - Connect Google → Both indicators green → "Drop a beat!" still enabled
- [ ] **Connect both independently** - Can connect services in any order
- [ ] **Reconnect services** - Can reconnect services if needed

### 8. Navigation Flow

- [ ] **Landing to Reamp** - Click "Drop a beat!" → Navigate to `/reamp`
- [ ] **Reamp to Landing** - Use header navigation to return to landing
- [ ] **No forced redirects** - Authenticated users stay on landing page unless they explicitly navigate

## 🔍 Automated Testing

### Unit Tests

- [ ] **Landing page tests** - `src/app/__tests__/landing-page-signin-hub.test.tsx`
- [ ] **Signin redirect test** - `src/app/signin/__tests__/redirect.test.tsx`
- [ ] **NextAuth config test** - `src/lib/__tests__/nextauth-signin-hub.test.ts`
- [ ] **No signin redirects test** - `src/__tests__/no-signin-redirects.test.ts`

### Test Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern="signin-hub"
npm test -- --testPathPattern="no-signin-redirects"
```

## 🐛 Troubleshooting

### Common Issues

1. **Still redirecting to /signin** - Check NextAuth `pages.signIn` configuration
2. **OAuth not returning to landing** - Verify `callbackUrl` parameter in signIn calls
3. **Status indicators not updating** - Check `/api/user/connected-services` endpoint
4. **Success toast not showing** - Verify query parameter handling in landing page

### Debug Steps

1. **Check browser console** - Look for redirect logs and errors
2. **Check network tab** - Verify OAuth callback URLs
3. **Check NextAuth logs** - Look for redirect callback logs
4. **Verify environment variables** - Ensure `NEXTAUTH_URL` is set correctly

## ✅ Acceptance Criteria Verification

- [ ] **No code-path forces redirect to /signin** during or after OAuth flows
- [ ] **Connect buttons return to landing page** with `?connected=...` parameter
- [ ] **Green indicators appear** after successful connection
- [ ] **/signin redirects to landing** and doesn't show legacy UI
- [ ] **No router.push('/signin') calls** remain in codebase
- [ ] **Middleware respects landing** as sign-in entry point
- [ ] **All existing functionality** (player, tokens, notifications, search) remains intact
- [ ] **Tests pass** and cover all scenarios

## 📝 Notes

- The landing page is now the single source of truth for authentication
- OAuth flows always return to landing page with connection status
- Users can connect multiple services before navigating to the player
- All redirects have been updated to use landing page instead of `/signin`
- Server-side token usage ensures immediate playback after connection
