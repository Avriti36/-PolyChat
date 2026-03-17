'use client'

import { useState } from 'react'
import ModelSelector from './ModelSelector'
import PublishModal from './PublishModal'

interface Props {
  chatId: string
  title: string | null
  model: string
  onModelChange: (modelId: string) => void
  onRename: (title: string) => void
  onDelete: () => void
}

export default function ChatHeader({ chatId, title, model, onModelChange, onRename, onDelete }: Props) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleText, setTitleText] = useState(title ?? 'New Chat')
  const [showPublish, setShowPublish] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const handleTitleConfirm = () => {
    onRename(titleText)
    setEditingTitle(false)
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
            onClick={() => setShowPublish(true)}
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
    </>
  )
}
