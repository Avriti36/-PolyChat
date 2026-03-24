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
  // Added = [] default to prevent crashes if chats is ever undefined
  const { chats = [], createChat, deleteChat, togglePin, renameChat } = useChatList() || {};
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
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
    // Guest User Bouncer: Skip the database and just route to the clean chat screen
    if (!user) {
      router.push("/chat");
      return;
    }

    // Authenticated User Logic: Safely create a row in the database
    const result = await createChat();
    if (result?.id) {
      router.push(`/chat/${result.id}`);
    } else if (result?.error) {
      console.error("Database error:", result.error);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteChat(id);
    if (activeChatId === id) router.push("/chat");
  };

  const pinnedChats = chats.filter((c) => c.is_pinned);
  const unpinnedChats = chats.filter((c) => !c.is_pinned);

  const filtered = (list: typeof chats) =>
    search ? list.filter((c) => c.title?.toLowerCase().includes(search.toLowerCase())) : list;

  const grouped = groupChatsByDate(filtered(unpinnedChats));

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <aside className="w-[260px] h-full flex flex-col bg-[#111111] border-r border-white/[0.06]">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <span className="text-[9px] text-white font-bold">P</span>
          </div>
          <span className="text-sm font-semibold text-white/90 tracking-tight">PolyChat</span>
        </div>
        <button
          onClick={handleNewChat}
          title="New Chat"
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/5 border border-white/8 rounded-lg outline-none placeholder-white/25 text-white/70 focus:border-white/20 focus:bg-white/8 transition-all"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
        {pinnedChats.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-white/25 px-2 py-1 uppercase tracking-widest">
              Pinned
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

        {Object.entries(grouped).map(([label, groupChats]) => (
          <div key={label} className="mb-3">
            <p className="text-[10px] font-semibold text-white/25 px-2 py-1 uppercase tracking-widest">
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
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-xs text-white/20">No chats yet</p>
          </div>
        )}
      </div>

      {/* Auth Footer */}
      <div className="p-3 border-t border-white/[0.06]">
        {user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 px-1">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10 shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {userInitials}
                </div>
              )}
              <span className="text-xs text-white/50 truncate flex-1" title={user.email}>
                {user.user_metadata?.full_name ?? user.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
}