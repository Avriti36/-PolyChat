# PolyChat
<img width="1914" height="884" alt="Screenshot 2026-03-30 114327" src="https://github.com/user-attachments/assets/df8bd396-8e68-43a7-a2fb-e5479f23aad8" />

A full-stack AI chat application that lets you chat with 50+ LLMs through a single interface, switch models mid-conversation, use voice input, and share chats publicly.

Built with **Next.js 14**, **TypeScript**, **Supabase**, and **OpenRouter**.

---

## Features

- **Multi-model support** — Access 50+ LLMs (GPT-4o, Claude, Gemini, Mistral, Llama and more) via OpenRouter
- **Mid-conversation model switching** — Switch models at any point without losing history
- **Streaming responses** — Real-time word-by-word streaming with animated cursor
- **Voice input** — Record audio, transcribed via OpenAI Whisper with AI-powered cleanup
- **Image uploads** — Send images to vision-capable models (GPT-4o, Claude 3, Gemini)
- **Chat history** — Searchable, pinnable sidebar grouped by date
- **Auto-generated titles** — Titles generated automatically after the first exchange
- **Publish & share** — Publish any chat to a public URL (`/p/[slug]`)
- **Fork chats** — Continue someone else's published chat as your own private branch
- **Edit messages** — Edit any user message and resend from that point

---

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | Next.js 14 (App Router, TypeScript) |
| Database     | Supabase (Postgres)                 |
| Realtime     | Supabase Realtime                   |
| File Storage | Supabase Storage                    |
| LLM Gateway  | OpenRouter API                      |
| Voice        | OpenAI Whisper API                  |
| Styling      | Tailwind CSS                        |
| Deployment   | Vercel                              |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Avriti36/-PolyChat.git
cd -PolyChat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
touch .env.local
```

Fill in your keys in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up the database

Go to your Supabase project → SQL Editor and run the migration:

```
supabase/migrations/001_initial_schema.sql
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/             # Streaming chat completion
│   │   ├── models/           # OpenRouter model list
│   │   └── voice/transcribe/ # Whisper transcription
│   ├── chat/[id]/            # Chat view
│   └── p/[slug]/             # Public published chat
├── components/
│   ├── chat/                 # Sidebar, MessageThread, InputArea, etc.
│   └── published/            # PublishedChatView, ForkButton
├── hooks/                    # useChat, useChatList, useModels, useVoice
├── lib/
│   ├── supabase/             # Client + server Supabase instances
│   ├── openrouter/           # Model fetching, streaming helpers
│   └── whisper.ts            # Whisper API wrapper
└── types/                    # Shared TypeScript types
```

---

## Environment Variables

| Variable                        | Description                             |
| ------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server only) |
| `OPENROUTER_API_KEY`            | OpenRouter API key                      |
| `OPENAI_API_KEY`                | OpenAI key for Whisper transcription    |
| `NEXT_PUBLIC_APP_URL`           | Your app's public URL                   |

---

## Deployment

Deploy to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Add all environment variables in the Vercel dashboard before deploying.

---

## License

MIT
