# Supabase Authentication Setup Guide

## Overview
This project now uses Supabase for authentication with both email/password and Google OAuth. The authentication system includes:
- Email/password sign in and sign up
- Google OAuth sign in
- Password reset functionality
- Protected routes with role-based access
- Session management

## Environment Variables Required

Create a `.env.local` file in your project root with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database URL (use Transaction Pooler for Vercel)
DATABASE_URL=postgresql://postgres.your-project-id:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres

# Optional: NextAuth backup
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## Supabase Project Setup

1. **Create a Supabase project** at https://supabase.com
2. **Get your project URL and anon key** from Settings → API
3. **Set up authentication** in Authentication → Settings:
   - Enable email confirmations
   - Set redirect URLs to include your domain
   - Configure password policies

## Google OAuth Setup

### 1. Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set Application Type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://your-vercel-domain.vercel.app/auth/callback` (for production)

### 2. Configure Supabase Google Provider
1. In Supabase Dashboard, go to Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - **Client ID**: Your Google OAuth client ID
   - **Client Secret**: Your Google OAuth client secret
4. Save the configuration

### 3. Update Redirect URLs
In Supabase Authentication → Settings → URL Configuration, add:
- `http://localhost:3000/auth/callback`
- `https://your-vercel-domain.vercel.app/auth/callback`

## Database Setup

1. **Run Prisma migrations** on your production database:
   ```bash
   npx prisma db push --schema=./prisma/schema.prisma
   ```

2. **For Vercel deployment**, use the **Transaction Pooler** connection string:
   ```
   postgresql://postgres.your-project-id:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres
   ```

## Authentication Flow

1. **Email/Password Sign Up**: Users can create accounts with email/password
2. **Google OAuth**: Users can sign in with their Google account
3. **Email Confirmation**: Supabase sends confirmation emails for email signups
4. **Sign In**: Users sign in with email/password or Google
5. **Password Reset**: Users can request password reset links (email only)
6. **Protected Routes**: Dashboard and admin pages require authentication

## Components

- `SupabaseAuthProvider`: Context provider for auth state
- `AuthGuard`: Protects routes from unauthenticated access
- `SignIn`: Main authentication page with Google OAuth and email tabs
- `AuthCallback`: Handles OAuth redirects and completes authentication
- `ResetPassword`: Handles password reset flow

## Usage

```tsx
import { useSupabaseAuth } from '@/lib/supabase-auth';

function MyComponent() {
  const { user, session, signIn, signInWithGoogle, signOut } = useSupabaseAuth();
  
  if (!session) {
    return <div>Please sign in</div>;
  }
  
  return <div>Welcome {user.email}</div>;
}
```

## Vercel Deployment

1. **Set environment variables** in Vercel project settings
2. **Use Transaction Pooler** connection string for database
3. **Ensure redirect URLs** include your Vercel domain in both:
   - Google Cloud Console OAuth credentials
   - Supabase Authentication settings
4. **Run database migrations** after deployment

## Troubleshooting

- **Authentication loop**: Check database connection and environment variables
- **No users**: Ensure database migrations are run
- **Google OAuth errors**: Verify redirect URLs match in Google Console and Supabase
- **Password reset issues**: Verify redirect URLs in Supabase settings
- **Session persistence**: Check browser storage and cookies

## Security Notes

- Passwords are hashed by Supabase
- Google OAuth uses secure OAuth 2.0 flow
- Sessions use secure HTTP-only cookies
- PKCE flow prevents authorization code interception
- Automatic token refresh maintains security
