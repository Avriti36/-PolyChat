-- Complete Database Schema for AI Chat App
-- Supports both authenticated users AND anonymous/guest users
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHATS TABLE (user_id is nullable for anonymous users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,  -- NULL for anonymous/guest chats
  title TEXT,
  model_id TEXT NOT NULL DEFAULT 'openai/gpt-4o-mini',
  is_pinned BOOLEAN DEFAULT FALSE,
  forked_from_chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
  forked_at_message_index INTEGER,
  guest_session_id TEXT,  -- For anonymous users to identify their chats
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_id TEXT,
  image_urls TEXT[],
  message_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PUBLISHED CHATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.published_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  allow_fork BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_chats ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- CHATS RLS
-- Authenticated users can only see their own chats
CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can create chats
CREATE POLICY "Users can create own chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own chats
CREATE POLICY "Users can update own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = user_id);

-- Authenticated users can delete their own chats
CREATE POLICY "Users can delete own chats" ON public.chats
  FOR DELETE USING (auth.uid() = user_id);

-- Anonymous users can view/manage chats with matching guest_session_id
-- This is handled via service role key in API routes for anonymous access

-- MESSAGES RLS
CREATE POLICY "Users can view messages in own chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own chats" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in own chats" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own chats" ON public.messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()
    )
  );

-- PUBLISHED_CHATS RLS
CREATE POLICY "Published chats are viewable by everyone" ON public.published_chats
  FOR SELECT USING (true);

CREATE POLICY "Users can publish own chats" ON public.published_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own published chats" ON public.published_chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own published chats" ON public.published_chats
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE PROFILE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'preferred_username',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ============================================
-- STORAGE BUCKET FOR IMAGES
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload images to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-images'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] LIKE 'guest-%')
  );

CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');

-- ============================================
-- ANONYMOUS USER SUPPORT
-- ============================================
-- Enable anonymous sign-ins in Supabase dashboard:
-- Authentication > Providers > Anonymous Sign-ins > Enable
-- This allows creating guest sessions that persist across browser sessions
