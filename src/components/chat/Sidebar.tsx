'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useChatList } from '@/hooks/useChatList'
import { groupChatsByDate } from '@/lib/utils'
import ChatItem from './ChatItem'

const DEFAULT_MODEL = 'openai/gpt-4o-mini'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { chats, createChat, deleteChat, togglePin, renameChat } = useChatList()
  const [search, setSearch] = useState('')

  const activeChatId = pathname?.split('/chat/')?.[1] ?? null

  const handleNewChat = async () => {
    const id = await createChat(DEFAULT_MODEL)
    if (id) router.push(`/chat/${id}`)
  }

  const handleDelete = async (id: string) => {
    await deleteChat(id)
    if (activeChatId === id) router.push('/chat')
  }

  const pinnedChats = chats.filter(c => c.is_pinned)
  const unpinnedChats = chats.filter(c => !c.is_pinned)

  const filtered = (list: typeof chats) =>
    search
      ? list.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()))
      : list

  const grouped = groupChatsByDate(filtered(unpinnedChats))

  return (
    <aside className="w-[260px] h-full flex flex-col bg-[#F9F9F8] border-r border-[#E5E5E5]">
      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#0D0D0D] hover:bg-gray-200 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search chats..."
          className="w-full px-3 py-1.5 text-sm bg-white border border-[#E5E5E5] rounded-lg outline-none placeholder-[#6B6B6B]"
        />
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {/* Pinned */}
        {pinnedChats.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-[#6B6B6B] px-2 py-1 uppercase tracking-wide">📌 Pinned</p>
            {filtered(pinnedChats).map(chat => (
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
            <p className="text-xs font-semibold text-[#6B6B6B] px-2 py-1 uppercase tracking-wide">{label}</p>
            {groupChats.map(chat => (
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
          <p className="text-xs text-[#6B6B6B] px-3 py-4 text-center">No chats yet</p>
        )}
      </div>
    </aside>
  )
}
