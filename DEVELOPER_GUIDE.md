# ChatApp - Developer Guide

## Getting Started as a Developer

### Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager
- Supabase account (free tier works)
- Code editor (VSCode recommended)
- Basic knowledge of Next.js and React

### First Time Setup (Complete Checklist)

- [ ] Clone repository: `git clone <url> && cd chatapp`
- [ ] Install dependencies: `npm install`
- [ ] Copy environment template: `cp .env.example .env.local`
- [ ] Get Supabase credentials from dashboard
- [ ] Fill in `.env.local` with Supabase values
- [ ] Create database tables (use init-database.sql)
- [ ] Start dev server: `npm run dev`
- [ ] Create test account at http://localhost:3000
- [ ] Test chat functionality
- [ ] Test document upload
- [ ] Test profile page
- [ ] Read through README.md and SETUP.md

## Project Structure Understanding

### Quick Navigation

```
Where to find what:

Authentication Logic
→ /lib/supabase/client.ts (browser auth)
→ /lib/supabase/server.ts (server auth)
→ /app/api/auth/* (auth routes)
→ /app/auth/* (auth pages)

Chat Functionality
→ /components/chat-interface.tsx (UI)
→ /app/api/chat/* (backend routes)
→ /app/protected/page.tsx (main page)

Document Upload
→ /components/pdf-upload.tsx (UI)
→ /app/api/pdfs/* (backend routes)

User Profile
→ /components/sidebar.tsx (navigation)
→ /app/profile/page.tsx (profile page)
→ /app/api/user/* (user routes)

Database
→ /scripts/init-database.sql (schema)
→ All tables use RLS policies

Styling
→ /app/globals.css (theme & colors)
→ /components/ui/* (reusable components)
```

## Development Workflow

### Adding a New Feature

1. **Plan**: Understand what data needs to be stored
2. **Database**: Add migrations if needed
3. **API**: Create endpoints in `/app/api/`
4. **Frontend**: Create components in `/components/`
5. **Pages**: Connect to pages in `/app/`
6. **Test**: Verify locally before committing
7. **Commit**: Push to Git with clear message

### Example: Adding a Feature

```
Feature: Delete Chat Sessions

Step 1: Database
└─ Already have sessions table
└─ Add RLS policy for DELETE (already done)

Step 2: API Route
└─ Create: app/api/chat/sessions/delete/route.ts
└─ POST request with sessionId
└─ Verify user owns session
└─ Delete from database

Step 3: Component
└─ Update sidebar.tsx
└─ Add delete button to each session
└─ Call new API endpoint

Step 4: Test
└─ Create session
└─ Delete session
└─ Verify it's gone
└─ Check database

Step 5: Commit
└─ git add .
└─ git commit -m "feat: add delete session"
└─ git push
```

## Common Tasks

### Modify Color Scheme

1. Open `/app/globals.css`
2. Update color variables in `:root` section
3. For dark mode, update `.dark` section
4. Colors use OKLch format (see comments)
5. All components auto-apply new colors

### Add a New UI Component

1. Create `/components/my-component.tsx`
2. Use existing shadcn/ui components
3. Follow TypeScript patterns in other components
4. Export at bottom: `export function MyComponent() { ... }`
5. Import and use in pages/components

### Create New API Endpoint

```typescript
// app/api/feature/action/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = 
      await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    // Get request body
    const { param1, param2 } = await request.json()
    
    // Validate input
    if (!param1) {
      return NextResponse.json(
        { error: 'param1 is required' }, 
        { status: 400 }
      )
    }
    
    // Database operation
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id)
    
    if (error) throw error
    
    // Success response
    return NextResponse.json({ data }, { status: 200 })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
```

### Add Database Table

1. Create SQL migration in `/scripts/migration_name.sql`
2. Add RLS policies for security
3. Create indexes for performance
4. Test in Supabase SQL editor
5. Document in README.md

```sql
-- Example migration
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_table_user_id ON table_name(user_id);
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);
```

## Testing Checklist

Before submitting code, test:

- [ ] Feature works as expected
- [ ] No console errors
- [ ] No TypeScript errors: `npm run lint`
- [ ] Authentication required where needed
- [ ] Error messages are user-friendly
- [ ] Mobile responsive (check on phone/tablet)
- [ ] Database changes are secure (RLS policies)
- [ ] File uploads work with different formats
- [ ] Session persists on page reload
- [ ] Logout and login works

## Debugging Tips

### Check Authentication
```typescript
// In browser console
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
console.log(session) // Should show JWT token
```

### View Database
```
Supabase Dashboard → SQL Editor
→ SELECT * FROM table_name LIMIT 10
→ Check if data is there
→ Check user_id matches your account
```

### API Testing
```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{"param":"value"}'
```

### Database Errors
- Check RLS policies allow your action
- Verify user_id matches authenticated user
- Check foreign key constraints
- Look at Supabase logs

## Code Standards

### Naming Conventions
```typescript
// Components: PascalCase, descriptive
export function ChatInterface() { }
export function PDFUpload() { }

// Functions: camelCase, verb-based
function handleSendMessage() { }
function loadSessions() { }

// Variables: camelCase, noun-based
const isLoading = false
const sessionId = "uuid"

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 1024 * 1024 * 10
const API_TIMEOUT = 5000
```

### TypeScript Patterns
```typescript
// Always type props
interface ChatProps {
  sessionId: string
  messages: Message[]
  onSend: (msg: string) => void
}

// Define types for API responses
interface APIResponse<T> {
  data?: T
  error?: string
  status: number
}

// Use const assertions
const categories = ['pdf', 'csv', 'graph', 'space'] as const
type Category = typeof categories[number]
```

### Error Handling
```typescript
// Always use try-catch in API routes
try {
  // Do something
} catch (error) {
  console.error('Context:', error)
  return NextResponse.json(
    { error: 'User-friendly message' },
    { status: 500 }
  )
}

// In components, show errors to user
if (error) {
  return <div className="text-red-600">{error}</div>
}
```

## Performance Tips

1. **Lazy Load**: Use React lazy() for large components
2. **Memoize**: Wrap components with memo() if needed
3. **Database**: Add indexes on frequently filtered columns
4. **Images**: Use Next.js Image component
5. **Bundle**: Monitor build size with `npm run build`

## Deployment Checklist

- [ ] All environment variables set in production
- [ ] Database migrations run
- [ ] RLS policies correct for production
- [ ] Error messages don't leak sensitive info
- [ ] File upload directory has correct permissions
- [ ] Logs monitored for errors
- [ ] Performance acceptable (check Network tab)
- [ ] All features tested in production
- [ ] Rollback plan if issues occur

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and test
npm run dev
# ... test feature ...

# Commit with clear message
git add .
git commit -m "feat: add feature description"

# Push to remote
git push origin feature/feature-name

# Create Pull Request
# → Review
# → Approve
# → Merge
# → Deploy
```

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://radix-ui.com

## Common Issues & Solutions

### "Cannot find module '@/lib/supabase/client'"
```bash
# The @ alias might not be configured
# Check tsconfig.json has:
"compilerOptions": {
  "paths": {
    "@/*": ["./*"]
  }
}
```

### "RLS policy error on insert"
```sql
-- Make sure policy includes INSERT for creation
CREATE POLICY "Users can insert own data" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### "File upload not working"
```bash
# Create uploads directory
mkdir -p public/uploads

# Check permissions
ls -la public/uploads

# Should be writable
chmod 755 public/uploads
```

### "Session lost on refresh"
```typescript
// Check middleware.ts is configured
// Verify cookies are being set
// Check NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL is correct
```

## Performance Monitoring

```typescript
// Log API response times
const start = Date.now()
const response = await fetch(url)
const time = Date.now() - start
console.log(`API call took ${time}ms`)

// Log component renders
useEffect(() => {
  console.log('ChatInterface rendered')
}, [])
```

## Future Development Ideas

- [ ] Add message search
- [ ] Implement real LLM integration
- [ ] Add user preferences/settings
- [ ] Create admin dashboard
- [ ] Add email notifications
- [ ] Implement rate limiting
- [ ] Add usage analytics
- [ ] Create mobile app
- [ ] Add collaborative chats
- [ ] Implement document versioning

---

Happy coding! Refer back to this guide as you develop new features.
