# PolyChat Setup Guide

A full-stack AI chat application built with Next.js 14, Supabase, and OpenRouter.

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenRouter API key
- OpenAI API key (for Whisper voice transcription)

## Quick Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd PolyChat
npm install
```

### 2. Set Up Supabase

#### Option A: Using Your Own Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project

2. Get your project credentials from **Settings > API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. Create `.env.local` from `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in your credentials in `.env.local`

5. Run the database migration in **SQL Editor**:
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and execute in Supabase SQL Editor

6. Enable Anonymous Sign-ins:
   - Go to **Authentication > Providers > Anonymous Sign-ins**
   - Enable it

#### Option B: Using Supabase Local

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase:
   ```bash
   supabase init
   ```

3. Link to your remote project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

4. Push local migrations:
   ```bash
   supabase db push
   ```

5. Start local development:
   ```bash
   supabase start
   ```

### 3. Set Up OpenRouter

1. Go to [openrouter.ai](https://openrouter.ai) and create an account
2. Go to **Keys** and create a new API key
3. Add the key to your `.env.local` as `OPENROUTER_API_KEY`

### 4. (Optional) Set Up OpenAI for Voice Transcription

1. Go to [platform.openai.com](https://platform.openai.com) and create an API key
2. Add the key to your `.env.local` as `OPENAI_API_KEY`

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema Overview

The app uses the following tables:

### `chats`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References profiles (nullable for guest chats) |
| `title` | TEXT | Chat title (auto-generated) |
| `model_id` | TEXT | AI model ID |
| `is_pinned` | BOOLEAN | Pinned status |
| `guest_session_id` | TEXT | For guest users |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

### `messages`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `chat_id` | UUID | References chats |
| `role` | TEXT | 'user', 'assistant', or 'system' |
| `content` | TEXT | Message content |
| `model_id` | TEXT | Model used |
| `image_urls` | TEXT[] | Image URLs (for vision) |
| `message_index` | INTEGER | Order in conversation |
| `created_at` | TIMESTAMPTZ | Creation time |

### `published_chats`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `chat_id` | UUID | References chats |
| `user_id` | UUID | References profiles |
| `slug` | TEXT | Unique URL slug |
| `title` | TEXT | Published title |
| `description` | TEXT | Optional description |
| `allow_fork` | BOOLEAN | Can others fork? |
| `view_count` | INTEGER | View counter |

### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (matches auth.users) |
| `username` | TEXT | Unique username |
| `avatar_url` | TEXT | Profile picture |

## Storage

The app uses Supabase Storage for image uploads:
- Bucket: `chat-images`
- Policy: Users can only upload to their own folder

## Row Level Security (RLS)

The app uses Supabase RLS to ensure:
- Users can only access their own chats
- Published chats are publicly viewable
- Service role key bypasses RLS for API routes

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |
| `OPENAI_API_KEY` | No | OpenAI API key (for Whisper) |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (for OAuth redirects) |

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── chat/          # Chat endpoint
│   │   └── models/        # Models endpoint
│   ├── chat/              # Chat pages
│   │   └── [id]/          # Individual chat
│   └── login/             # Auth pages
├── components/
│   └── chat/              # Chat UI components
├── hooks/                 # React hooks
│   ├── useChat.ts         # Chat logic
│   └── useChatList.ts      # Chat list logic
├── lib/                   # Utilities
│   ├── constants.ts       # App constants
│   ├── supabase/         # Supabase clients
│   └── openrouter/       # OpenRouter config
└── types/                 # TypeScript types

supabase/
├── config.toml            # Supabase local config
└── migrations/           # Database migrations
```

### Adding New Migrations

```bash
supabase migration new add_new_feature
# Edit the generated file in supabase/migrations/
supabase db push
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Set the environment variables and run:
```bash
npm run build
npm start
```

## Troubleshooting

### "Permission denied" errors
- Check that RLS is enabled on all tables
- Verify your Supabase anon key is correct
- Make sure the service role key is only used server-side

### Images not uploading
- Check storage bucket exists
- Verify storage policies allow uploads
- Ensure bucket is public or proper auth is configured

### Chat not streaming
- Check OpenRouter API key is valid
- Verify API quota hasn't exceeded
- Check browser console for errors
