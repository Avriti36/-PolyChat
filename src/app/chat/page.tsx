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
    <div className="flex flex-col h-full bg-[#161616]">
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">✦</span>
          </div>
          <h2 className="text-xl font-semibold text-white/80 mb-2">
            Start a new chat
          </h2>
          <p className="text-sm text-white/30 mb-6">
            Send a message to begin. Your conversation will appear here.
          </p>
          <button
            onClick={handleNewChat}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
          >
            New Chat
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-400 mb-1.5">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-xs font-medium text-violet-400 hover:text-violet-300"
          >
            Sign up for unlimited chats →
          </button>
        </div>
      )}
    </div>
  );
}