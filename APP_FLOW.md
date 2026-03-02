# ChatApp - User Flow & Architecture

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHATAPP USER FLOW                            │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├──> Home Page (/)
  │     ├─ Checks if user is logged in
  │     ├─ If YES → Redirect to /protected (Chat)
  │     └─ If NO → Redirect to /auth/login
  │
  ├──> Login Page (/auth/login)
  │     ├─ Enter email & password
  │     ├─ Submit → API checks credentials
  │     ├─ If valid → Create session
  │     └─ If valid → Redirect to /protected
  │
  ├──> Sign Up Page (/auth/sign-up)
  │     ├─ Enter email, password, confirm password
  │     ├─ Submit → API creates account
  │     ├─ If success → Redirect to confirmation page
  │     └─ If success → Check email to confirm
  │
  ├──> Chat Page (/protected) [AUTHENTICATED]
  │     │
  │     ├─ SIDEBAR
  │     │  ├─ Logo/Brand
  │     │  ├─ New Chat Button
  │     │  ├─ Recent Chats List
  │     │  │  └─ Click chat → Load messages
  │     │  └─ Profile & Logout
  │     │
  │     ├─ TAB 1: CHAT
  │     │  ├─ Message Display Area
  │     │  │  ├─ User messages (right, blue)
  │     │  │  └─ Assistant messages (left, white)
  │     │  └─ Input Area
  │     │     ├─ Type message
  │     │     ├─ Send button
  │     │     └─ Save to database
  │     │
  │     └─ TAB 2: DOCUMENTS
  │        ├─ Upload Section
  │        │  ├─ Select file
  │        │  ├─ Choose category (PDF/CSV/Graph/Space)
  │        │  └─ Upload → Save to /public/uploads/{userId}/
  │        │
  │        └─ Documents List
  │           ├─ Show all uploaded files
  │           ├─ Display filename & size
  │           └─ Show category
  │
  └──> Profile Page (/profile) [AUTHENTICATED]
       ├─ View account info
       ├─ Edit username
       ├─ View account created date
       └─ Save changes → Update database
```

## Technical Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Next.js Pages/Components (React + TypeScript)              │ │
│  │                                                             │ │
│  │ Pages:                                                      │ │
│  │ ├─ /             (Home - Auth check)                       │ │
│  │ ├─ /auth/login   (Login)                                   │ │
│  │ ├─ /auth/sign-up (Sign up)                                 │ │
│  │ ├─ /protected    (Chat interface)                          │ │
│  │ └─ /profile      (User profile)                            │ │
│  │                                                             │ │
│  │ Components:                                                 │ │
│  │ ├─ ChatInterface (Message display + input)                 │ │
│  │ ├─ PDFUpload     (File upload form)                        │ │
│  │ ├─ Sidebar       (Navigation + sessions)                   │ │
│  │ └─ UI Components (Button, Input, Card, Tabs, etc)         │ │
│  │                                                             │ │
│  │ State Management:                                           │ │
│  │ └─ React hooks (useState, useEffect)                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              ↓                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Supabase Client (Browser)                                  │ │
│  │ ├─ Authentication (supabase.auth.*)                        │ │
│  │ └─ Session management                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────── FETCH/HTTP ──────────────────────────────┘
         ↓                                                    ↑
┌──────────────────────────────────────────────────────────────────┐
│                      SERVER SIDE (API)                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Next.js API Routes (TypeScript)                            │ │
│  │                                                             │ │
│  │ Authentication:                                             │ │
│  │ ├─ POST /api/auth/signup     (Create user)                 │ │
│  │ └─ POST /api/auth/logout     (End session)                 │ │
│  │                                                             │ │
│  │ Chat Operations:                                            │ │
│  │ ├─ GET  /api/chat/sessions   (List chats)                  │ │
│  │ ├─ POST /api/chat/sessions   (Create chat)                 │ │
│  │ ├─ GET  /api/chat/messages   (Get messages)                │ │
│  │ └─ POST /api/chat/send       (Send message)                │ │
│  │                                                             │ │
│  │ Document Operations:                                        │ │
│  │ ├─ POST /api/pdfs/upload     (Upload file)                 │ │
│  │ └─ GET  /api/pdfs/list       (List documents)              │ │
│  │                                                             │ │
│  │ User Profile:                                               │ │
│  │ ├─ GET  /api/user/profile    (Get user info)               │ │
│  │ └─ PUT  /api/user/profile    (Update user)                 │ │
│  │                                                             │ │
│  │ Features:                                                   │ │
│  │ ├─ JWT validation on all requests                          │ │
│  │ ├─ User context from session                               │ │
│  │ └─ File storage management                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              ↓                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Supabase Client (Server)                                   │ │
│  │ ├─ Database queries (select, insert, update, delete)       │ │
│  │ ├─ User authentication verification                        │ │
│  │ └─ Service role operations                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
         ↓                                                    ↑
┌──────────────────────────────────────────────────────────────────┐
│                    DATABASE (SUPABASE)                           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    Users     │  │    PDFs      │  │Chat Sessions │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │           │
│  │ email        │  │ user_id (FK) │  │ user_id (FK) │           │
│  │ username     │  │ file_name    │  │ title        │           │
│  │ avatar_url   │  │ file_path    │  │ created_at   │           │
│  │ created_at   │  │ file_size    │  │ updated_at   │           │
│  │ updated_at   │  │ category     │  │              │           │
│  └──────────────┘  │ uploaded_at  │  └──────────────┘           │
│                    └──────────────┘                              │
│  ┌──────────────────────────────────────┐                        │
│  │        Chat Messages                 │                        │
│  ├──────────────────────────────────────┤                        │
│  │ id (PK)              │ session_id (FK)                        │
│  │ user_id (FK)         │ pdf_id (FK)                            │
│  │ role (user/assistant)│ content                                │
│  │ created_at                                                    │
│  └──────────────────────────────────────┘                        │
│                                                                  │
│  ┌──────────────────────────────────────┐                        │
│  │      Row Level Security (RLS)        │                        │
│  ├──────────────────────────────────────┤                        │
│  │ Users can only access their own:     │                        │
│  │ ├─ Profile data                      │                        │
│  │ ├─ Documents                         │                        │
│  │ ├─ Chat sessions                     │                        │
│  │ └─ Chat messages                     │                        │
│  └──────────────────────────────────────┘                        │
│                                                                  │
│  ┌──────────────────────────────────────┐                        │
│  │   File Storage                       │                        │
│  ├──────────────────────────────────────┤                        │
│  │ Location: /public/uploads/{userId}/  │                        │
│  │ Access: Via API, not direct URL      │                        │
│  └──────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
START
  │
  ├─> User enters email & password
  │
  ├─> Frontend sends to /api/auth/signup or login
  │
  ├─> Backend verifies with Supabase Auth
  │   ├─ If valid → Issue JWT token
  │   └─ If invalid → Return error
  │
  ├─> Frontend stores JWT in secure HTTP-only cookie
  │
  ├─> Subsequent requests include JWT in header
  │
  ├─> Backend validates JWT before processing
  │   ├─ Extract user ID from token
  │   ├─ Verify token signature
  │   └─ If valid → Process request
  │
  └─> User session persists until logout
```

## Data Flow Example: Sending a Message

```
1. User types message in chat input
   │
2. User clicks Send button
   │
3. Frontend calls POST /api/chat/send with:
   ├─ sessionId
   ├─ message text
   └─ optional pdfId
   │
4. Backend receives request:
   ├─ Extract JWT from request
   ├─ Verify token & get user ID
   └─ Validate session belongs to user
   │
5. Backend saves user message to database:
   ├─ INSERT into chat_messages
   ├─ role = 'user'
   └─ Session verified via RLS
   │
6. Backend generates response (currently mock):
   ├─ Create response text
   └─ Could call external AI API here
   │
7. Backend saves assistant message:
   ├─ INSERT into chat_messages
   └─ role = 'assistant'
   │
8. Backend returns both messages to frontend
   │
9. Frontend updates component state
   │
10. Chat interface re-renders with new messages
    │
11. Auto-scroll to bottom shows latest message
    │
12. User sees both messages in chat
```

## Component Hierarchy

```
RootLayout
└── children
    ├── /auth/login
    │   └── LoginForm
    ├── /auth/sign-up
    │   └── SignUpForm
    ├── /protected
    │   ├── Sidebar
    │   │   ├── SessionsList
    │   │   └── UserMenu
    │   ├── Tabs
    │   │   ├── ChatTab
    │   │   │   └── ChatInterface
    │   │   │       ├── MessageList
    │   │   │       └── MessageInput
    │   │   └── DocumentsTab
    │   │       ├── PDFUpload
    │   │       └── DocumentsList
    │   └── Footer
    └── /profile
        ├── Sidebar
        └── ProfileForm
```

## State Management

```
Each Page Component Manages:

/protected (Chat Page):
├─ sessions: ChatSession[]
├─ messages: Message[]
├─ pdfs: PDF[]
├─ currentSessionId: string
├─ isLoading: boolean
└─ activeTab: 'chat' | 'documents'

/profile (Profile Page):
├─ user: UserProfile
├─ username: string
├─ isLoading: boolean
├─ isSaving: boolean
├─ error: string | null
└─ success: boolean
```

## Security Layers

```
Layer 1: JWT Authentication
├─ Required for all API requests
└─ Validated on server

Layer 2: Row Level Security (RLS)
├─ Database enforces user isolation
└─ Users can only see their own data

Layer 3: Route Protection
├─ Middleware redirects unauthenticated users
└─ Protected pages require valid session

Layer 4: Data Validation
├─ File type checking on upload
├─ Message content validation
└─ Query parameter validation

Layer 5: Error Handling
├─ Try-catch blocks on all routes
├─ User-friendly error messages
└─ Secure error logging
```

---

This architecture ensures scalability, security, and maintainability as the application grows.
