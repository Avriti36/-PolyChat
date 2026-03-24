"use client";

import { useRouter } from "next/navigation";
import { useChatList } from "@/hooks/useChatList";
import { supabase } from "@/lib/supabase/client";

export default function EmptyChatPage() {
  const router = useRouter();
  const { createChat } = useChatList();

  const handleNewChat = async () => {
    // 1. Check if the user is logged in
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Guest Bouncer: If not logged in, route them to the main HomeView to chat freely
    if (!user) {
      router.push("/"); // Assuming "/" is where your HomeView.tsx lives!
      return;
    }

    // 3. Authenticated User Logic: Safely create the chat in the database
    const result = await createChat();
    if (result?.id) {
      router.push(`/chat/${result.id}`);
    } else if (result?.error) {
      console.error("Failed to create chat:", result.error);
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
    </div>
  );
}