"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface Props {
  publishedChatId: string;
}

export default function ForkButton({ publishedChatId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleFork = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", publishedChatId)
      .order("message_index", { ascending: true });

    const { data: originalChat } = await supabase
      .from("chats")
      .select("*")
      .eq("id", publishedChatId)
      .single();

    const { data: newChat, error } = await supabase
      .from("chats")
      .insert({
        user_id: user?.id ?? null,
        model_id: originalChat?.model_id ?? "openai/gpt-4o-mini",
        title: `Fork of ${originalChat?.title ?? "chat"}`,
        forked_from_chat_id: publishedChatId,
        forked_at_message_index: messages?.length ?? 0,
      })
      .select()
      .single();

    if (error || !newChat) {
      setLoading(false);
      return;
    }

    if (messages && messages.length > 0) {
      await supabase.from("messages").insert(
        messages.map((m) => ({
          chat_id: newChat.id,
          role: m.role,
          content: m.content,
          model_id: m.model_id,
          image_urls: m.image_urls,
          message_index: m.message_index,
        }))
      );
    }

    router.push(`/chat/${newChat.id}`);
    setLoading(false);
  };

  return (
    <button
      onClick={handleFork}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-violet-500/20"
    >
      {loading ? (
        <>
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Forking...
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Continue this chat
        </>
      )}
    </button>
  );
}