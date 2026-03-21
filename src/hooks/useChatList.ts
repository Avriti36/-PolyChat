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

function getGuestMessageCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(GUEST_MESSAGE_COUNT_KEY) || "0", 10);
}

function incrementGuestMessageCount(): number {
  if (typeof window === "undefined") return 0;
  const count = getGuestMessageCount() + 1;
  localStorage.setItem(GUEST_MESSAGE_COUNT_KEY, count.toString());
  return count;
}

function clearGuestMessageCount(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_MESSAGE_COUNT_KEY);
}

export function useChatList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase
      .from("chats")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (user) {
      query = query.eq("user_id", user.id);
    } else {
      const sessionId = getGuestSessionId();
      query = query.eq("guest_session_id", sessionId);
    }

    const { data } = await query;
    setChats(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const sessionId = getGuestSessionId();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await migrateGuestDataToUser(session.user.id, sessionId);
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

  // Migrate guest chats to authenticated user
  const migrateGuestDataToUser = async (
    userId: string,
    guestSessionId: string,
  ) => {
    const { data: guestChats } = await supabase
      .from("chats")
      .select("*")
      .eq("guest_session_id", guestSessionId)
      .is("user_id", null);

    if (!guestChats || guestChats.length === 0) return;

    for (const chat of guestChats) {
      await supabase
        .from("chats")
        .update({
          user_id: userId,
          guest_session_id: null,
        })
        .eq("id", chat.id)
        .eq("guest_session_id", guestSessionId);
    }

    clearGuestMessageCount();
    fetchChats();
  };

  // Check if guest user already has a chat
  const hasGuestChat = useCallback(async (): Promise<boolean> => {
    const sessionId = getGuestSessionId();
    const { data: existingChats } = await supabase
      .from("chats")
      .select("id")
      .eq("guest_session_id", sessionId)
      .is("user_id", null)
      .limit(1);

    return (existingChats && existingChats.length > 0) || false;
  }, []);

  const createChat = async (): Promise<{
    id: string | null;
    error?: string;
  }> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const sessionId = getGuestSessionId();

    // Guests can only have one chat
    if (!user) {
      const alreadyHasChat = await hasGuestChat();
      if (alreadyHasChat) {
        return {
          id: null,
          error:
            "Guest users can only have one chat. Please sign up to create more chats.",
        };
      }
    }

    const chatData: Record<string, unknown> = {
      model_id: DEFAULT_MODEL,
      title: null,
    };

    if (user) {
      chatData.user_id = user.id;
    } else {
      chatData.guest_session_id = sessionId;
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
