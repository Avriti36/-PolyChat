"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Message } from "@/types";
import {
  GUEST_MESSAGE_COUNT_KEY,
  GUEST_MESSAGE_LIMIT,
  DEFAULT_MODEL,
} from "@/lib/constants";

export function useChat(chatId: string, initialModel: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState(initialModel);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!chatId) return;

    // Load guest message count from localStorage
    if (typeof window !== "undefined") {
      const count = parseInt(
        localStorage.getItem(GUEST_MESSAGE_COUNT_KEY) || "0",
        10,
      );
      setGuestMessageCount(count);
    }

    supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("message_index", { ascending: true })
      .then(({ data }) => setMessages(data ?? []));
  }, [chatId]);

  // Check if user can send a message (guests have limited messages)
  const canSendMessage = useCallback(async (): Promise<{
    allowed: boolean;
    reason?: string;
  }> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Authenticated users can always send
    if (user) return { allowed: true };

    // Check guest message limit
    const currentCount = parseInt(
      localStorage.getItem(GUEST_MESSAGE_COUNT_KEY) || "0",
      10,
    );
    if (currentCount >= GUEST_MESSAGE_LIMIT) {
      return {
        allowed: false,
        reason: `Guest limit reached. You've used ${GUEST_MESSAGE_LIMIT} messages. Please sign up to continue.`,
      };
    }

    return { allowed: true };
  }, []);

  // Increment guest message count when they send a message
  const incrementGuestMessageCount = useCallback(() => {
    const newCount =
      parseInt(localStorage.getItem(GUEST_MESSAGE_COUNT_KEY) || "0", 10) + 1;
    localStorage.setItem(GUEST_MESSAGE_COUNT_KEY, newCount.toString());
    setGuestMessageCount(newCount);
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      image_urls?: string[],
    ): Promise<{ success: boolean; error?: string }> => {
      if (!content.trim() || streaming)
        return { success: false, error: "Invalid message" };

      // Check if user can send (guest limit check)
      const { allowed, reason } = await canSendMessage();
      if (!allowed) return { success: false, error: reason };

      // Optimistically add user message
      const userMsg: Partial<Message> = {
        chat_id: chatId,
        role: "user",
        content,
        image_urls: image_urls ?? null,
        message_index: messages.length,
      };

      // Save user message to DB
      const { data: savedUser, error: userError } = await supabase
        .from("messages")
        .insert(userMsg)
        .select()
        .single();

      if (userError) return { success: false, error: userError.message };
      if (savedUser) setMessages((prev) => [...prev, savedUser]);

      // Increment guest message count after user message is saved
      incrementGuestMessageCount();

      setStreaming(true);
      setStreamContent("");

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            model_id: model,
            chat_id: chatId,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errorData = await res.json();
          return {
            success: false,
            error: errorData.error || "Failed to get response",
          };
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              full += parsed.content ?? "";
              setStreamContent(full);
            } catch {}
          }
        }

        // Refresh messages from DB
        const { data: fresh } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chatId)
          .order("message_index", { ascending: true });
        setMessages(fresh ?? []);

        // Fire-and-forget title generation after first assistant response
        // messages.length is the count BEFORE this user message was added
        // After streaming, fresh will have user + assistant, so fresh.length === 2 means first exchange
        if (messages.length === 0) {
          fetch("/api/chat/generate-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, first_message: content }),
          });
        }

        return { success: true };
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          return { success: false, error: "An error occurred" };
        }
        return { success: false, error: "Cancelled" };
      } finally {
        setStreaming(false);
        setStreamContent("");
      }
    },
    [
      chatId,
      messages,
      model,
      streaming,
      canSendMessage,
      incrementGuestMessageCount,
    ],
  );

  const stopStreaming = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setStreamContent("");
  };

  const editMessage = useCallback(
    async (messageIndex: number, newContent: string) => {
      // Delete all messages from this index onward
      const toDelete = messages.filter((m) => m.message_index >= messageIndex);
      for (const m of toDelete) {
        await supabase.from("messages").delete().eq("id", m.id);
      }
      const trimmed = messages.filter((m) => m.message_index < messageIndex);
      setMessages(trimmed);
      await sendMessage(newContent);
    },
    [messages, sendMessage],
  );

  return {
    messages,
    model,
    setModel,
    streaming,
    streamContent,
    sendMessage,
    stopStreaming,
    editMessage,
    guestMessageCount,
    guestMessageLimit: GUEST_MESSAGE_LIMIT,
    remainingGuestMessages: Math.max(
      0,
      GUEST_MESSAGE_LIMIT - guestMessageCount,
    ),
  };
}
