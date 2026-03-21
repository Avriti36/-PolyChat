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
    if (!user) {
      setShowLoginDialog(true)
    } else {
      setShowPublish(true)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#E5E5E5] bg-white">
        <div className="flex items-center gap-3 min-w-0">
          {editingTitle ? (
            <input
              autoFocus
              value={titleText}
              onChange={e => setTitleText(e.target.value)}
              onBlur={handleTitleConfirm}
              onKeyDown={e => e.key === 'Enter' && handleTitleConfirm()}
              className="text-sm font-semibold text-[#0D0D0D] outline-none border-b border-black bg-transparent"
            />
          ) : (
            <h1
              onClick={() => setEditingTitle(true)}
              className="text-sm font-semibold text-[#0D0D0D] truncate cursor-pointer hover:opacity-70 transition-opacity"
            >
              {title ?? 'New Chat'}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ModelSelector value={model} onChange={onModelChange} />

          <button
            onClick={handlePublishClick}
            className="text-sm px-3 py-1.5 border border-[#E5E5E5] rounded-lg hover:bg-gray-50 transition-colors text-[#0D0D0D]"
          >
            Publish
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMore(o => !o)}
              className="p-1.5 text-[#6B6B6B] hover:text-[#0D0D0D] rounded-lg hover:bg-gray-50 transition-colors"
            >
              ⋮
            </button>
            {showMore && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 min-w-[140px] py-1">
                  <button
                    onClick={() => { onDelete(); setShowMore(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50"
                  >
                    Delete Chat
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showPublish && (
        <PublishModal
          chatId={chatId}
          chatTitle={title ?? 'New Chat'}
          onClose={() => setShowPublish(false)}
        />
      )}

      {showLoginDialog && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowLoginDialog(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-50 w-full max-w-md">
            <h2 className="text-lg font-semibold text-[#0D0D0D] mb-2">Sign in to publish</h2>
            <p className="text-sm text-[#6B6B6B] mb-4">
              You need to sign in to publish your chat.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/login')}
                className="flex-1 py-2 bg-[#0D0D0D] text-white rounded-lg hover:bg-black transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowLoginDialog(false)}
                className="flex-1 py-2 border border-[#E5E5E5] text-[#0D0D0D] rounded-lg hover:bg-gray-50 transition-colors"
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
