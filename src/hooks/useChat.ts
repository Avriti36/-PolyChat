"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Message } from "@/types";
import {
  GUEST_MESSAGE_COUNT_KEY,
  GUEST_MESSAGE_LIMIT,
  DEFAULT_MODEL,
} from "@/lib/constants";

export function useChat(chatId: string | null, initialModel: string, isGuest: boolean = false) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState(initialModel);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [generatedTitle, setGeneratedTitle] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isGuest) {
      // Clear guest message count on mount for fresh experience each tab open
      if (typeof window !== "undefined") {
        localStorage.removeItem(GUEST_MESSAGE_COUNT_KEY);
      }
      setGuestMessageCount(0);
      return;
    }

    if (!chatId) return;

    supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("message_index", { ascending: true })
      .then(({ data }) => setMessages(data ?? []));
  }, [chatId, isGuest]);

  // Check if user can send a message (guests have limited messages)
  const canSendMessage = useCallback(async (): Promise<{
    allowed: boolean;
    reason?: string;
  }> => {
    if (isGuest) {
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
    }

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
  }, [isGuest]);

  // Increment guest message count when they send a message
  const incrementGuestMessageCount = useCallback(() => {
    const newCount =
      parseInt(localStorage.getItem(GUEST_MESSAGE_COUNT_KEY) || "0", 10) + 1;
    localStorage.setItem(GUEST_MESSAGE_COUNT_KEY, newCount.toString());
    setGuestMessageCount(newCount);
  }, []);

  // Reset chat (clear all messages)
  const resetChat = useCallback(() => {
    setMessages([]);
    setStreamContent("");
    setGeneratedTitle(null);
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      image_urls?: string[],
    ): Promise<{ success: boolean; error?: string; restore?: boolean }> => {
      if (!content.trim() || streaming)
        return { success: false, error: "Invalid message", restore: false };

      // Check if user can send (guest limit check)
      const { allowed, reason } = await canSendMessage();
      if (!allowed) return { success: false, error: reason, restore: false };

      // Create user message (in-memory for guests)
      const userMsg: Message = {
        id: `guest-${Date.now()}-${Math.random()}`,
        chat_id: chatId ?? "guest",
        role: "user",
        content,
        model_id: null,
        image_urls: image_urls ?? null,
        message_index: messages.length,
        created_at: new Date().toISOString(),
      };

      // Add user message to state immediately
      setMessages((prev) => [...prev, userMsg]);

      // Increment guest message count
      if (isGuest) {
        incrementGuestMessageCount();
      }

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
            is_guest: isGuest,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          // Clean up: remove user message from state
          setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
          const errorData = await res.json();
          return {
            success: false,
            error: errorData.error || "Failed to get response",
            restore: true,
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

        // Create assistant message (in-memory for guests)
        const assistantMsg: Message = {
          id: `guest-${Date.now()}-${Math.random()}`,
          chat_id: chatId ?? "guest",
          role: "assistant",
          content: full,
          model_id: model,
          image_urls: null,
          message_index: messages.length + 1,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Generate title after first assistant response (only for authenticated)
        if (!isGuest && messages.length === 0) {
          try {
            const res = await fetch("/api/chat/generate-title", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, first_message: content }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.title) {
                setGeneratedTitle(data.title);
              }
            } else {
              console.error("Title generation failed:", res.status);
            }
          } catch (err) {
            console.error("Title generation failed:", err);
          }
        }

        return { success: true };
      } catch (err: any) {
        // Clean up: remove user message from state on abort/error
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        if (err.name !== "AbortError") {
          console.error(err);
          return { success: false, error: "An error occurred", restore: true };
        }
        return { success: false, error: "Cancelled", restore: true };
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
      isGuest,
      canSendMessage,
      incrementGuestMessageCount,
    ],
  );

  // Start streaming for existing user messages (called when navigating to a chat with pending messages)
  const startStreamingForExistingMessages = useCallback(async () => {
    if (streaming || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "user") return; // Already has assistant response

    setStreaming(true);
    setStreamContent("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model_id: model,
          chat_id: chatId,
          is_guest: isGuest,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        setStreaming(false);
        return;
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

      // Create assistant message (in-memory for guests, in DB for authenticated)
      if (!isGuest && chatId) {
        const assistantMsg = {
          chat_id: chatId,
          role: "assistant",
          content: full,
          model_id: model,
          message_index: messages.length,
        };
        await supabase.from("messages").insert(assistantMsg);
      }

      const assistantMsg: Message = {
        id: `guest-${Date.now()}-${Math.random()}`,
        chat_id: chatId ?? "guest",
        role: "assistant",
        content: full,
        model_id: model,
        image_urls: null,
        message_index: messages.length,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Generate title after first assistant response
      if (!isGuest && chatId && messages.length === 1) {
        try {
          const res = await fetch("/api/chat/generate-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, first_message: messages[0].content }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.title) {
              setGeneratedTitle(data.title);
            }
          }
        } catch (err) {
          console.error("Title generation failed:", err);
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error(err);
      }
    } finally {
      setStreaming(false);
      setStreamContent("");
    }
  }, [chatId, messages, model, streaming, isGuest]);

  const stopStreaming = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setStreamContent("");
  };

  const editMessage = useCallback(
    async (messageIndex: number, newContent: string) => {
      // For guests, just filter messages up to that index
      if (isGuest) {
        const trimmed = messages.filter((m) => m.message_index < messageIndex);
        setMessages(trimmed);
        await sendMessage(newContent);
        return;
      }

      // Delete all messages from this index onward
      const toDelete = messages.filter((m) => m.message_index >= messageIndex);
      for (const m of toDelete) {
        await supabase.from("messages").delete().eq("id", m.id);
      }
      const trimmed = messages.filter((m) => m.message_index < messageIndex);
      setMessages(trimmed);
      await sendMessage(newContent);
    },
    [messages, sendMessage, isGuest],
  );

  return {
    messages,
    model,
    setModel,
    streaming,
    streamContent,
    generatedTitle,
    sendMessage,
    stopStreaming,
    editMessage,
    resetChat,
    startStreamingForExistingMessages,
    guestMessageCount,
    guestMessageLimit: GUEST_MESSAGE_LIMIT,
    remainingGuestMessages: Math.max(
      0,
      GUEST_MESSAGE_LIMIT - guestMessageCount,
    ),
  };
}
