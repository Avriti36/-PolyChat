"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useChat } from "@/hooks/useChat";
import { useChatList } from "@/hooks/useChatList";
import { isVisionCapable } from "@/lib/openrouter/models";
import { useModels } from "@/hooks/useModels";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageThread from "@/components/chat/MessageThread";
import InputArea from "@/components/chat/InputArea";
import { Chat } from "@/types";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [chat, setChat] = useState<Chat | null>(null);
  const { models } = useModels();
  const { deleteChat, renameChat } = useChatList();
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const GUEST_MESSAGE_LIMIT = 10;

  const {
    messages,
    model,
    setModel,
    streaming,
    streamContent,
    sendMessage,
    stopStreaming,
    editMessage,
  } = useChat(id, chat?.model_id ?? "openai/gpt-4o-mini");

  useEffect(() => {
    if (!id) return;

    supabase
      .from("chats")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setChat(data));

    // Realtime title updates
    const channel = supabase
      .channel(`chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chats",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setChat(payload.new as Chat);
        },
      )
      .subscribe();

    // Load guest message count
    if (typeof window !== "undefined") {
      const count = parseInt(
        localStorage.getItem("guest_message_count") || "0",
        10,
      );
      setGuestMessageCount(count);
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const visionCapable = models.some(
    (m) => m.id === model && isVisionCapable(m),
  );

  const handleDelete = async () => {
    await deleteChat(id);
    router.push("/chat");
  };

  const handleRetry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) editMessage(lastUser.message_index, lastUser.content);
  };

  const handleSend = async (content: string, image_urls?: string[]) => {
    const result = await sendMessage(content, image_urls);

    // Update guest message count after send
    if (result.success && typeof window !== "undefined") {
      const count = parseInt(
        localStorage.getItem("guest_message_count") || "0",
        10,
      );
      setGuestMessageCount(count);
    }

    return result;
  };

  const remainingGuestMessages = Math.max(
    0,
    GUEST_MESSAGE_LIMIT - guestMessageCount,
  );

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        chatId={id}
        title={chat?.title ?? null}
        model={model}
        onModelChange={setModel}
        onRename={(title) => renameChat(id, title)}
        onDelete={handleDelete}
      />

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
        chatId={id}
        isVisionModel={visionCapable}
        guestMessagesRemaining={remainingGuestMessages}
        guestMessageLimit={GUEST_MESSAGE_LIMIT}
      />
    </div>
  );
}
