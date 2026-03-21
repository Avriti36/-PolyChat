"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { useModels } from "@/hooks/useModels";
import MessageThread from "./MessageThread";
import InputArea from "./InputArea";
import ModelSelector from "./ModelSelector";
import { isVisionCapable } from "@/lib/openrouter/models";
import { supabase } from "@/lib/supabase/client";
import { useChatList } from "@/hooks/useChatList";
import { User } from "@supabase/supabase-js";

const GUEST_MESSAGE_LIMIT = 10;

interface Props {
  user: User | null;
}

export default function HomeView({ user }: Props) {
  const router = useRouter();
  const { models } = useModels();
  const { createChat } = useChatList();
  const [localUser, setLocalUser] = useState(user);

  const isGuest = !localUser;

  const {
    messages,
    model,
    setModel,
    streaming,
    streamContent,
    sendMessage,
    stopStreaming,
    editMessage,
    resetChat,
    remainingGuestMessages,
  } = useChat(null, "openai/gpt-4o-mini", isGuest);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const visionCapable = models.some(
    (m) => m.id === model && isVisionCapable(m),
  );

  const handleSend = useCallback(async (content: string, image_urls?: string[]) => {
    // For logged-in users: first message creates DB chat and navigates
    if (localUser && messages.length === 0) {
      // Create chat in DB
      const result = await createChat();
      if (!result.id) {
        return { success: false, error: "Failed to create chat", restore: true };
      }

      // Insert user message directly to DB
      const userMsg = {
        chat_id: result.id,
        role: "user",
        content,
        image_urls: image_urls ?? null,
        message_index: 0,
      };

      const { error: msgError } = await supabase
        .from("messages")
        .insert(userMsg);

      if (msgError) {
        return { success: false, error: msgError.message, restore: true };
      }

      // Navigate to the real chat
      router.push(`/chat/${result.id}`);
      return { success: true };
    }

    // For guests or subsequent messages - use in-memory chat
    const result = await sendMessage(content, image_urls);
    return result;
  }, [localUser, messages.length, createChat, router, sendMessage]);

  const handleRetry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) editMessage(lastUser.message_index, lastUser.content);
  };

  const handleNewChat = () => {
    resetChat();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#E5E5E5] bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-sm font-semibold text-[#0D0D0D] truncate">
            {messages.length === 0 ? "New Chat" : "Chat"}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ModelSelector value={model} onChange={setModel} />

          {localUser ? (
            <button
              onClick={handleNewChat}
              className="text-sm px-3 py-1.5 border border-[#E5E5E5] rounded-lg hover:bg-gray-50 transition-colors text-[#0D0D0D]"
            >
              New Chat
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="text-sm px-3 py-1.5 border border-[#E5E5E5] rounded-lg hover:bg-gray-50 transition-colors text-[#0D0D0D]"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      <MessageThread
        messages={messages}
        streamContent={streamContent}
        streaming={streaming}
        currentModel={model}
        onEdit={editMessage}
        onRetry={handleRetry}
      />

      <InputArea
        onSend={handleSend}
        streaming={streaming}
        onStop={stopStreaming}
        chatId="home"
        isVisionModel={visionCapable}
        guestMessagesRemaining={remainingGuestMessages}
        guestMessageLimit={GUEST_MESSAGE_LIMIT}
      />
    </div>
  );
}
