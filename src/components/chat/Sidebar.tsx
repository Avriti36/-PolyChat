"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useChatList } from "@/hooks/useChatList";
import { groupChatsByDate } from "@/lib/utils";
import ChatItem from "./ChatItem";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { chats, createChat, deleteChat, togglePin, renameChat } =
    useChatList();
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [guestLimitError, setGuestLimitError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const activeChatId = pathname?.split("/chat/")?.[1] ?? null;

  const handleNewChat = async () => {
    const result = await createChat();
    if (result.id) {
      setGuestLimitError(null);
      router.push(`/chat/${result.id}`);
    } else if (result.error) {
      setGuestLimitError(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteChat(id);
    if (activeChatId === id) router.push("/chat");
  };

  const pinnedChats = chats.filter((c) => c.is_pinned);
  const unpinnedChats = chats.filter((c) => !c.is_pinned);

  const filtered = (list: typeof chats) =>
    search
      ? list.filter((c) =>
          c.title?.toLowerCase().includes(search.toLowerCase()),
        )
      : list;

  const grouped = groupChatsByDate(filtered(unpinnedChats));

  return (
    <aside className="w-[260px] h-full flex flex-col bg-[#F9F9F8] border-r border-[#E5E5E5]">
      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#0D0D0D] hover:bg-gray-200 rounded-lg transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Chat
        </button>
      </div>

      {/* Guest limit error */}
      {guestLimitError && (
        <div className="mx-3 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700 mb-2">{guestLimitError}</p>
          <button
            onClick={() => {
              setGuestLimitError(null);
              router.push("/login");
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Sign up for unlimited chats
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-3 pb-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chats..."
          className="w-full px-3 py-1.5 text-sm bg-white border border-[#E5E5E5] rounded-lg outline-none placeholder-[#6B6B6B]"
        />
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {/* Pinned */}
        {pinnedChats.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-[#6B6B6B] px-2 py-1 uppercase tracking-wide">
              📌 Pinned
            </p>
            {filtered(pinnedChats).map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                active={chat.id === activeChatId}
                onDelete={handleDelete}
                onTogglePin={togglePin}
                onRename={renameChat}
              />
            ))}
          </div>
        )}

        {/* Grouped recent */}
        {Object.entries(grouped).map(([label, groupChats]) => (
          <div key={label} className="mb-3">
            <p className="text-xs font-semibold text-[#6B6B6B] px-2 py-1 uppercase tracking-wide">
              {label}
            </p>
            {groupChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                active={chat.id === activeChatId}
                onDelete={handleDelete}
                onTogglePin={togglePin}
                onRename={renameChat}
              />
            ))}
          </div>
        ))}

        {chats.length === 0 && (
          <p className="text-xs text-[#6B6B6B] px-3 py-4 text-center">
            No chats yet
          </p>
        )}
      </div>

      {/* Auth Footer */}
      <div className="p-3 border-t border-[#E5E5E5] mt-auto">
        {user ? (
          <div className="flex items-center justify-between px-2">
            <span
              className="text-sm text-[#6B6B6B] truncate max-w-[120px]"
              title={user.email}
            >
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              Log out
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium bg-[#0D0D0D] text-white rounded-lg hover:bg-black transition-colors"
          >
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
}
