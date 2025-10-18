# HIVE Platform Setup Guide

## Overview

This guide will help you set up the HIVE platform with authentication and Neon.tech PostgreSQL database.

## Prerequisites

- Python 3.8+
- Node.js 18+
- Neon.tech account (free tier available)
- Google OAuth credentials (optional)
- GitHub OAuth credentials (optional)

## Step 1: Database Setup (Neon.tech)

### 1.1 Create Neon.tech Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy your connection string (it looks like: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`)

### 1.2 Configure Database

1. Copy `backend/env_example.txt` to `backend/.env`
2. Update the `DATABASE_URL` with your Neon.tech connection string
3. Generate a secure JWT secret key:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
4. Generate an encryption key:
   ```bash
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

## Step 2: OAuth Setup (Optional but Recommended)

### 2.1 Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
6. Copy Client ID and Client Secret to `.env`

### 2.2 GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/api/auth/github/callback` (development)
   - `https://yourdomain.com/api/auth/github/callback` (production)
4. Copy Client ID and Client Secret to `.env`

## Step 3: Backend Setup

### 3.1 Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3.2 Initialize Database

```bash
python init_neon_db.py
```

### 3.3 Start Backend Server

```bash
python app.py
```

The backend will be available at `http://localhost:5001`

## Step 4: Frontend Setup

### 4.1 Install Dependencies

```bash
cd frontend
npm install
```

### 4.2 Start Frontend Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Step 5: Testing the Setup

### 5.1 Test Database Connection

1. Visit `http://localhost:3000`
2. You should be redirected to the landing page
3. Click "Get Started with Google" or "Continue with GitHub"
4. Complete OAuth flow
5. You should be redirected to the dashboard

### 5.2 Test Scan Functionality

1. Go to "Scan File" in the sidebar
2. Upload a Python file
3. Verify the scan completes and results are saved
4. Check "My Scans" to see the scan history

## Environment Variables Reference

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Authentication
JWT_SECRET_KEY=your_jwt_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here

# Google API (for AI analysis)
GOOGLE_API_KEY=your_gemini_api_key_here
```

### Optional Variables (for OAuth)

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

## Troubleshooting

### Database Connection Issues

- Verify your Neon.tech connection string is correct
- Check if your IP is whitelisted in Neon.tech (if using IP restrictions)
- Ensure SSL mode is set to `require` in the connection string

### OAuth Issues

- Verify redirect URIs match exactly (including trailing slashes)
- Check that OAuth credentials are correctly set in `.env`
- Ensure OAuth apps are properly configured in Google/GitHub

### Authentication Issues

- Check that JWT_SECRET_KEY is set and consistent
- Verify cookies are being set correctly in browser dev tools
- Check browser console for authentication errors

### Scan Issues

- Ensure GOOGLE_API_KEY is valid and has Gemini API access
- Check backend logs for scan processing errors
- Verify file uploads are working correctly

## Production Deployment

### Environment Variables

- Set `NODE_ENV=production`
- Use production OAuth redirect URIs
- Use production database URL
- Set secure JWT and encryption keys

### Security Considerations

- Use HTTPS in production
- Set secure cookie flags
- Regularly rotate JWT secrets
- Monitor database access logs
- Implement rate limiting

## Support

If you encounter issues:

1. Check the logs in both frontend and backend
2. Verify all environment variables are set correctly
3. Test database connection independently
4. Check OAuth configuration in provider dashboards

For additional help, refer to the individual component documentation or create an issue in the project repository.
