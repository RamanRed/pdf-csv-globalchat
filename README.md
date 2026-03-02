# ChatApp - Intelligent Document Analysis Platform

A modern web application for uploading and analyzing documents through an interactive chat interface. Built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## Features

- **User Authentication**: Secure JWT-based authentication with Supabase Auth
- **Interactive Chat**: Real-time chat interface with message history
- **Document Upload**: Support for multiple file types (PDF, CSV, Graph, Space)
- **Chat Sessions**: Create and manage multiple chat conversations
- **User Profile**: View and edit user information
- **Document Management**: Organize and manage uploaded documents
- **Row Level Security**: Data isolation using Supabase RLS policies

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (JWT)
- **File Storage**: Local filesystem storage

## Project Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── login/
│   │   ├── signup/
│   │   └── logout/
│   ├── chat/
│   │   ├── send/
│   │   ├── sessions/
│   │   └── messages/
│   ├── pdfs/
│   │   ├── upload/
│   │   └── list/
│   └── user/
│       └── profile/
├── auth/
│   ├── login/page.tsx
│   ├── sign-up/page.tsx
│   └── error/page.tsx
├── protected/page.tsx (Chat Interface)
├── profile/page.tsx (User Profile)
├── page.tsx (Home/Auth Check)
└── layout.tsx
components/
├── chat-interface.tsx
├── pdf-upload.tsx
├── sidebar.tsx
└── ui/ (shadcn/ui components)
lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
└── utils.ts
scripts/
├── init-database.sql
└── setup-db.js
```

## Database Schema

### Users Table
```sql
- id (UUID) - Primary key from auth.users
- email (VARCHAR)
- username (VARCHAR)
- avatar_url (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### PDFs Table
```sql
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- file_name (VARCHAR)
- file_path (TEXT)
- file_size (INTEGER)
- category (VARCHAR) - 'pdf', 'csv', 'graph', 'space'
- uploaded_at (TIMESTAMP)
```

### Chat Sessions Table
```sql
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- title (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Chat Messages Table
```sql
- id (UUID) - Primary key
- session_id (UUID) - Foreign key to chat_sessions
- user_id (UUID) - Foreign key to users
- pdf_id (UUID) - Optional foreign key to pdfs
- role (VARCHAR) - 'user' or 'assistant'
- content (TEXT)
- created_at (TIMESTAMP)
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/logout` - Logout user

### Chat
- `GET /api/chat/sessions` - Get all chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/messages?sessionId={id}` - Get messages for session
- `POST /api/chat/send` - Send message to chat

### PDFs
- `POST /api/pdfs/upload` - Upload document
- `GET /api/pdfs/list` - List user's documents

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account and project

### Installation

1. **Clone and Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Environment Variables**
   Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
   ```

3. **Database Setup**
   The database schema is defined in `/scripts/init-database.sql`. You can:
   - Run the SQL directly in Supabase SQL editor
   - Or use the setup script: `npm run setup:db`

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Usage

### Sign Up / Login
- Navigate to `/auth/login` or `/auth/sign-up`
- Create an account or log in with existing credentials
- Email verification may be required depending on Supabase settings

### Chat Interface
- Click "New Chat" to start a conversation
- Type messages and send them
- Upload documents from the Documents tab to analyze

### Upload Documents
- Go to Documents tab
- Select document type (PDF, CSV, Graph, Space)
- Click to upload or drag and drop files
- Use uploaded documents in chat conversations

### Manage Profile
- Click Profile in sidebar
- Update username and other settings
- View account information

## Features Explained

### Document Categories
- **PDF**: PDF documents
- **CSV**: Comma-separated data files
- **Graph**: Chart and graph data files
- **Space**: Layout and spatial documents

### Chat Sessions
- Each session maintains its own conversation history
- Sessions are automatically created with "New Chat"
- You can switch between sessions from the sidebar
- All messages are linked to the current session

### Security
- Row Level Security (RLS) ensures users can only access their own data
- JWT authentication through Supabase
- Password hashing handled by Supabase Auth
- File uploads are stored in user-specific directories

## Development

### Create New API Endpoint
1. Create file in `app/api/route/endpoint/route.ts`
2. Use Supabase client for database operations
3. Handle authentication with `supabase.auth.getUser()`
4. Return JSON responses with appropriate status codes

### Add New Component
1. Create `.tsx` file in `components/` directory
2. Use existing UI components from `components/ui/`
3. Follow the naming convention for consistency
4. Export component for use in pages

### Database Migrations
- SQL files go in `/scripts/` directory
- Run migrations in Supabase SQL editor or via Node.js script
- Always include RLS policies for new tables

## Environment Variables

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key |
| SUPABASE_SERVICE_ROLE_KEY | Service role key for server operations |
| NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL | Redirect URL after auth |

## Deployment

### Vercel
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy with one click

### Other Platforms
- Ensure Node.js 18+ is available
- Set environment variables
- Run `npm run build` then `npm start`

## Troubleshooting

### Authentication Issues
- Check Supabase credentials in environment variables
- Verify email confirmation is enabled in Supabase Auth settings
- Check browser console for error messages

### Database Connection
- Verify Supabase URL and keys are correct
- Check that tables exist in database
- Review RLS policies for permissions

### File Upload Failing
- Ensure public/uploads directory has write permissions
- Check file size isn't exceeding limits
- Verify file format is supported

## Future Enhancements

- AI-powered document analysis with actual LLM integration
- Advanced search across documents
- Document export and sharing
- Real-time collaboration features
- Mobile app version
- Dark mode improvements
- Analytics dashboard

## Contributing

1. Create feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open Pull Request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
1. Check documentation above
2. Review error messages in browser console
3. Check Supabase dashboard for database issues
4. Open an issue on GitHub
