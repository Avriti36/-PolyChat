"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChatList } from "@/hooks/useChatList";

export default function EmptyChatPage() {
  const router = useRouter();
  const { createChat } = useChatList();
  const [error, setError] = useState<string | null>(null);

  const handleNewChat = async () => {
    const result = await createChat();
    if (result.id) {
      setError(null);
      router.push(`/chat/${result.id}`);
    } else if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-semibold text-[#0D0D0D] mb-2">
            Start a new chat
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            Send a message to begin. Your conversation will appear here.
          </p>
          <button
            onClick={handleNewChat}
            className="px-6 py-2 bg-[#0D0D0D] text-white rounded-lg hover:bg-black transition-colors"
          >
            New Chat
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700 mb-2">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Sign up for unlimited chats
          </button>
        </div>
      )}
    </div>
  );
}
