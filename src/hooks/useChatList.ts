"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Chat } from "@/types";
import {
  GUEST_SESSION_KEY,
  GUEST_MESSAGE_COUNT_KEY,
  GUEST_MESSAGE_LIMIT,
  DEFAULT_MODEL,
} from "@/lib/constants";

function getGuestSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(GUEST_SESSION_KEY);
  if (!id) {
    id = `guest-${crypto.randomUUID()}`;
    localStorage.setItem(GUEST_SESSION_KEY, id);
  }
  return id;
}

export function useChatList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Only fetch chats for authenticated users
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("chats")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .eq("user_id", user.id);

    const { data } = await query;
    setChats(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Clear guest data on sign in (no migration)
      if (event === "SIGNED_IN") {
        localStorage.removeItem(GUEST_MESSAGE_COUNT_KEY);
        localStorage.removeItem(GUEST_SESSION_KEY);
      }
      fetchChats();
    });

    fetchChats();

    const channel = supabase
      .channel("chats-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        () => {
          fetchChats();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchChats]);

  const createChat = async (): Promise<{
    id: string | null;
    error?: string;
  }> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const chatData: Record<string, unknown> = {
      model_id: DEFAULT_MODEL,
      title: null,
    };

    if (user) {
      chatData.user_id = user.id;
    } else {
      // Guests create chat with session ID
      chatData.guest_session_id = getGuestSessionId();
    }

    const { data, error } = await supabase
      .from("chats")
      .insert(chatData)
      .select()
      .single();

    if (error) {
      console.error("Error creating chat:", error);
      return { id: null, error: error.message };
    }
    return { id: data.id };
  };

  const deleteChat = async (id: string) => {
    await supabase.from("chats").delete().eq("id", id);
  };

  const togglePin = async (id: string, is_pinned: boolean) => {
    await supabase.from("chats").update({ is_pinned: !is_pinned }).eq("id", id);
  };

  const renameChat = async (id: string, title: string) => {
    await supabase.from("chats").update({ title }).eq("id", id);
  };

  return {
    chats,
    loading,
    createChat,
    deleteChat,
    togglePin,
    renameChat,
    refetch: fetchChats,
    GUEST_MESSAGE_LIMIT,
  };
}
