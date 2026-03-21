'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Chat } from '@/types'

interface Props {
  chat: Chat
  active: boolean
  onDelete: (id: string) => void
  onTogglePin: (id: string, isPinned: boolean) => void
  onRename: (id: string, title: string) => void
}

export default function ChatItem({ chat, active, onDelete, onTogglePin, onRename }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(chat.title ?? 'New Chat')

  const handleRename = () => {
    onRename(chat.id, editText)
    setEditing(false)
  }

  return (
    <div
      className={`group relative flex items-center rounded-lg px-3 py-2 cursor-pointer ${
        active ? 'bg-gray-100' : 'hover:bg-gray-50'
      }`}
    >
      <Link href={`/chat/${chat.id}`} className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            onClick={e => e.preventDefault()}
            className="w-full text-sm outline-none bg-transparent text-[#0D0D0D]"
          />
        ) : (
          <p className="text-sm text-[#0D0D0D] truncate">
            {chat.is_pinned && <span className="mr-1">📌</span>}
            {chat.title ?? 'New Chat'}
          </p>
        )}
      </Link>

      <button
        onClick={e => { e.preventDefault(); setShowMenu(o => !o) }}
        className="opacity-0 group-hover:opacity-100 p-1 text-[#6B6B6B] hover:text-[#0D0D0D] shrink-0"
      >
        ⋮
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 min-w-[140px] py-1">
            <button
              onClick={() => { setEditing(true); setShowMenu(false) }}
              className="w-full text-left px-4 py-2 text-sm text-[#0D0D0D] hover:bg-gray-50"
            >
              Rename
            </button>
            <button
              onClick={() => { onTogglePin(chat.id, chat.is_pinned); setShowMenu(false) }}
              className="w-full text-left px-4 py-2 text-sm text-[#0D0D0D] hover:bg-gray-50"
            >
              {chat.is_pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={() => { onDelete(chat.id); setShowMenu(false) }}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}
