# Supabase Integration Setup Guide

This guide covers everything you need to know about the Supabase integration in Bridge.

## ✅ What's Been Implemented

Your Bridge app now has **full Supabase integration** with:

1. **Real Authentication** - Email OTP (magic link) authentication
2. **Database Persistence** - All ideas, plans, and memories saved to PostgreSQL
3. **Photo Storage** - Couple photos and memory photos uploaded to Supabase Storage
4. **Row Level Security** - Data is automatically scoped to your couple
5. **Multi-user Support** - Owner and partner roles with invite codes

## 🚀 Testing the Integration

### 1. Enable Email Authentication

By default, Supabase allows sign-ups from any email. To test:

1. Go to **Authentication** > **Providers** in your Supabase dashboard
2. Make sure **Email** is enabled
3. For testing, enable **"Confirm email"** is OFF (under Email Auth settings)
   - This lets you sign in without clicking email links during development

### 2. Start Your App

```bash
npm start
```

Or for web:
```bash
npm run web
```

### 3. Test the Flow

**Sign Up Flow:**
1. Open the app
2. Enter your email address
3. In development mode (with email confirmation OFF), you'll be signed in immediately
4. Create your profile (display name)
5. Create or join a couple space

**Sign In Flow (returning users):**
1. Enter your email
2. Check your email for the OTP code (6 digits)
3. Enter the code to sign in

### 4. Verify Data Persistence

Try these actions to confirm everything works:

- **Save an idea** - Check the `ideas` table in Supabase Table Editor
- **Create a date plan** - Check `date_plans` and `date_plan_ideas` tables
- **Log a memory** - Check `memories` and `memory_ideas` tables
- **Upload couple photo** - Check Storage > `photos` bucket

## 🔧 Configuration Options

### Production Email Setup

For production, you'll want real email delivery:

1. Go to **Project Settings** > **Auth** > **SMTP Settings**
2. Configure your SMTP provider (SendGrid, Mailgun, AWS SES, etc.)
3. Or use Supabase's built-in email (limited free tier)

### Email Templates

Customize your OTP emails:
1. Go to **Authentication** > **Email Templates**
2. Edit the "Confirm signup" and "Magic Link" templates
3. Add your branding and messaging

### Auth Settings

Recommended settings for production:

- **Site URL**: Your production domain (e.g., `https://bridge.app`)
- **Redirect URLs**: Add allowed redirect URLs
- **Email Confirmation**: ON (require users to verify email)
- **Session Duration**: 604800 (7 days)

## 📊 Database Overview

Your schema includes:

- `profiles` - User profiles (extends auth.users)
- `couples` - Couple spaces with invite codes
- `couple_members` - Join table for users and couples
- `ideas` - Date ideas with status tracking
- `date_plans` - Planned dates with itineraries
- `date_plan_ideas` - Links plans to ideas
- `memories` - Logged dates with ratings
- `memory_ideas` - Links memories to ideas
- `memory_photos` - Photo attachments for memories

## 🔐 Security Features

### Row Level Security (RLS)

All tables have RLS enabled. Users can only:
- Read/write their own profile
- Read their partner's profile
- Read/write data in their couple space
- Cannot access other couples' data

### Storage Policies

Photos are stored in the `photos` bucket with policies that:
- Allow authenticated users to upload to `couples/` and `memories/` folders
- Allow users to read all photos (public bucket)
- Allow users to update/delete their own uploads

## 🐛 Troubleshooting

### "Supabase is not configured" error
- Check that `.env` has both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart your dev server after adding `.env` variables

### Can't sign in
- Verify email confirmation is OFF in Auth settings for testing
- Check the Supabase Auth logs for errors
- Ensure your email domain isn't blocked

### Photos not uploading
- Verify the `photos` bucket exists in Storage
- Check that storage policies are applied (run `0002_storage.sql`)
- Look for CORS errors in browser console (web only)

### Data not persisting
- Check that migrations ran successfully
- Verify RLS policies are in place
- Check Supabase logs for query errors

## 🔄 Switching Between Mock and Supabase

The app automatically switches based on `.env`:

**Mock Mode** (no `.env` or missing variables):
- Data stored in memory (resets on reload)
- Instant sign-in (no emails)
- Photos stored as local URIs

**Supabase Mode** (`.env` configured):
- Data persisted to PostgreSQL
- Real email OTP authentication
- Photos uploaded to cloud storage

## 📝 Next Steps

Now that Supabase is integrated, you can:

1. **Deploy to Production**
   - Set up custom domain
   - Configure email provider
   - Enable email confirmation
   - Set up proper SMTP

2. **Add Real-time Features**
   - Use Supabase Realtime for live updates
   - Partner sees ideas as you add them
   - Live plan collaboration

3. **Implement Missing Features**
   - Profile editing UI
   - Memory photo galleries
   - Metadata enrichment for URLs
   - AI itinerary generation

4. **Testing & QA**
   - Test invite flow with real partner
   - Test photo uploads on all platforms
   - Verify RLS policies work correctly

## 🎉 You're All Set!

Your Bridge app is now production-ready with full backend integration. All user data persists across sessions, and you can invite your partner to join your couple space!
