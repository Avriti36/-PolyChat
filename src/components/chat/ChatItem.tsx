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
      className={`group relative flex items-center rounded-lg px-2.5 py-2 cursor-pointer transition-all ${
        active
          ? 'bg-white/10 text-white'
          : 'text-white/50 hover:bg-white/5 hover:text-white/80'
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
            className="w-full text-xs outline-none bg-transparent text-white"
          />
        ) : (
          <p className="text-xs truncate flex items-center gap-1.5">
            {chat.is_pinned && (
              <svg className="w-2.5 h-2.5 shrink-0 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 4v8l2 2v2h-6v6l-1 1-1-1v-6H4v-2l2-2V4h10z" />
              </svg>
            )}
            {chat.title ?? 'New Chat'}
          </p>
        )}
      </Link>

      <button
        onClick={e => { e.preventDefault(); setShowMenu(o => !o) }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/30 hover:text-white/70 shrink-0 transition-all"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 min-w-[150px] py-1 overflow-hidden">
            <button
              onClick={() => { setEditing(true); setShowMenu(false) }}
              className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/8 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rename
            </button>
            <button
              onClick={() => { onTogglePin(chat.id, chat.is_pinned); setShowMenu(false) }}
              className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/8 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {chat.is_pinned ? 'Unpin' : 'Pin'}
            </button>
            <div className="border-t border-white/8 my-1" />
            <button
              onClick={() => { onDelete(chat.id); setShowMenu(false) }}
              className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}