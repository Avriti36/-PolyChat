-- Simplified schema (no auth, no user_id)

CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  model_id TEXT NOT NULL DEFAULT 'openai/gpt-4o-mini',
  is_pinned BOOLEAN DEFAULT FALSE,
  forked_from_chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
  forked_at_message_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_id TEXT,
  image_urls TEXT[],
  message_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS published_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  allow_fork BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id)
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
