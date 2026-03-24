'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ModelSelector from './ModelSelector'
import PublishModal from './PublishModal'
import { User } from '@supabase/supabase-js'

interface Props {
  chatId: string
  title: string | null
  model: string
  user: User | null
  onModelChange: (modelId: string) => void
  onRename: (title: string) => void
  onDelete: () => void
}

export default function ChatHeader({ chatId, title, model, user, onModelChange, onRename, onDelete }: Props) {
  const router = useRouter()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleText, setTitleText] = useState(title ?? 'New Chat')
  const [showPublish, setShowPublish] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const handleTitleConfirm = () => {
    onRename(titleText)
    setEditingTitle(false)
  }

  const handlePublishClick = () => {
    if (!user) setShowLoginDialog(true)
    else setShowPublish(true)
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#161616]">
        <div className="flex items-center gap-3 min-w-0">
          {editingTitle ? (
            <input
              autoFocus
              value={titleText}
              onChange={e => setTitleText(e.target.value)}
              onBlur={handleTitleConfirm}
              onKeyDown={e => e.key === 'Enter' && handleTitleConfirm()}
              className="text-sm font-medium text-white outline-none border-b border-violet-500 bg-transparent"
            />
          ) : (
            <h1
              onClick={() => setEditingTitle(true)}
              className="text-sm font-medium text-white/80 truncate cursor-pointer hover:text-white transition-colors"
            >
              {title ?? 'New Chat'}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ModelSelector value={model} onChange={onModelChange} />

          <button
            onClick={handlePublishClick}
            className="text-xs px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/8 transition-colors text-white/60 hover:text-white/90 flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMore(o => !o)}
              className="p-1.5 text-white/30 hover:text-white/70 rounded-lg hover:bg-white/8 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {showMore && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 min-w-[150px] py-1">
                  <button
                    onClick={() => { onDelete(); setShowMore(false) }}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Chat
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showPublish && (
        <PublishModal chatId={chatId} chatTitle={title ?? 'New Chat'} onClose={() => setShowPublish(false)} />
      )}

      {showLoginDialog && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setShowLoginDialog(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-6 z-50 w-full max-w-sm">
            <h2 className="text-base font-semibold text-white mb-1">Sign in to publish</h2>
            <p className="text-sm text-white/40 mb-5">You need an account to share your chat publicly.</p>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/login')}
                className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowLoginDialog(false)}
                className="flex-1 py-2 border border-white/10 text-white/60 text-sm rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}