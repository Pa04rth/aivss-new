# OAuth Configuration Fix

## Issue Fixed

The Google OAuth callback was getting a 404 error because the redirect URI was pointing to the frontend instead of the backend.

## Changes Made

1. Updated backend OAuth redirect URIs to point to backend server
2. Added BACKEND_URL environment variable for flexibility

## Required OAuth App Updates

### Google OAuth App

You need to update your Google Cloud Console OAuth app:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Click on your OAuth 2.0 Client ID
4. Update the **Authorized redirect URIs** to:
   - `http://localhost:5001/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)

### GitHub OAuth App

You need to update your GitHub OAuth app:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on your OAuth App
3. Update the **Authorization callback URL** to:
   - `http://localhost:5001/api/auth/github/callback` (for development)
   - `https://yourdomain.com/api/auth/github/callback` (for production)

## Environment Variables

Add these to your `.env` file:

```env
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5001
```

## Testing

After updating the OAuth apps:

1. Restart the backend server
2. Try the Google/GitHub login flow
3. You should be redirected to the dashboard after successful authentication

The OAuth flow now works as follows:

1. User clicks "Get Started with Google" → Frontend redirects to backend `/api/auth/google`
2. Backend redirects to Google OAuth → User authenticates
3. Google redirects to backend `/api/auth/google/callback` → Backend processes auth
4. Backend redirects to frontend `/auth/success?token=...` → Frontend sets cookie
5. Frontend redirects to `/dashboard` → User sees authenticated dashboard
