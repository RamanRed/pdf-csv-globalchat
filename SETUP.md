# ChatApp Setup Guide

## Quick Start (5 minutes)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd chatapp
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details and create
4. Wait for project to initialize (1-2 minutes)

#### Get Your Credentials
1. Go to **Settings > API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure Environment Variables

Create `.env.local` in your project root:
```bash
cp .env.example .env.local
```

Edit `.env.local` and paste your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

### 4. Set Up Database Schema

#### Option A: Using Supabase Dashboard (Recommended)
1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy contents of `/scripts/init-database.sql`
4. Paste into editor
5. Click **Run**
6. Done! Tables are created

#### Option B: Using Node Script
```bash
node scripts/setup-db.js
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Initial User Setup

### Create Your First Account
1. Click "Sign Up" on login page
2. Enter email and password
3. Confirm email (check inbox)
4. Log in with your credentials

### Configure Email Provider (Optional)
By default, Supabase uses a demo email provider. For production:

1. Go to **Authentication > Providers** in Supabase
2. Click **Email**
3. Enable "Confirm email" option
4. Configure your email provider (SMTP or SendGrid)

## Verification Steps

After setup, verify everything works:

1. ✅ Sign up with email/password
2. ✅ See "New Chat" button
3. ✅ Click "New Chat" → new session appears
4. ✅ Send a message → receive response
5. ✅ Go to Documents → upload a PDF
6. ✅ Go to Profile → see your info
7. ✅ Click Logout → redirect to login

## Troubleshooting

### "Invalid Supabase URL"
- Check your `.env.local` file
- Verify URL starts with `https://`
- Copy from Supabase dashboard again

### "Anon key is invalid"
- Ensure you're using Anon Key, not Service Role Key
- Copy from **Settings > API > anon key**

### Email Confirmation Not Sent
- Check spam folder
- Verify email provider is configured in Supabase
- Use Supabase's default email for testing

### Database Tables Don't Exist
- Go to Supabase SQL Editor
- Paste and run `/scripts/init-database.sql`
- Refresh your browser

### Uploads Not Working
- Create `/public/uploads` directory manually
- Ensure write permissions on public folder
- Check file size isn't too large

### Session Issues
- Clear browser cookies
- Try incognito/private mode
- Check if Supabase session is valid

## Next Steps

1. **Customize**: Update colors, fonts, branding in `globals.css`
2. **Connect AI**: Replace mock responses in `/app/api/chat/send/route.ts`
3. **Add Features**: Follow patterns in existing code
4. **Deploy**: Push to GitHub and connect to Vercel

## File Uploads Storage

By default, files are stored in `/public/uploads/{user-id}/`. For production:

1. Use Supabase Storage (recommended)
2. Use AWS S3 or similar
3. Set up proper access controls

To migrate to Supabase Storage:
1. Create storage bucket in Supabase
2. Update upload handler in `/app/api/pdfs/upload/route.ts`
3. Update file paths in database

## Database Backup

Supabase automatically backs up your data. To export:

1. Go to **Backups** in Supabase dashboard
2. Click **Download** on latest backup
3. Store securely

## Production Deployment

### Before Deploying:
1. ✅ Test all features locally
2. ✅ Set up environment variables in Vercel
3. ✅ Enable RLS on all tables (already done)
4. ✅ Configure custom domain
5. ✅ Set up email provider

### Deploy to Vercel:
1. Push code to GitHub
2. Go to [https://vercel.com](https://vercel.com)
3. Click "New Project"
4. Select your repository
5. Add environment variables from `.env.local`
6. Click Deploy

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Shadcn/ui**: https://ui.shadcn.com

## Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Database setup
node scripts/setup-db.js
```

## File Structure Reference

```
├── app/
│   ├── api/          # API routes
│   ├── auth/         # Auth pages
│   ├── protected/    # Main chat page
│   ├── profile/      # Profile page
│   └── layout.tsx    # Root layout
├── components/
│   ├── chat-interface.tsx
│   ├── pdf-upload.tsx
│   ├── sidebar.tsx
│   └── ui/           # UI components
├── lib/
│   └── supabase/     # Supabase clients
├── scripts/
│   └── init-database.sql
└── public/
    └── uploads/      # User file uploads
```

You're all set! Happy chatting! 🚀
