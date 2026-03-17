'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'

interface Props {
  chatId: string
  chatTitle: string
  onClose: () => void
}

export default function PublishModal({ chatId, chatTitle, onClose }: Props) {
  const [description, setDescription] = useState('')
  const [allowFork, setAllowFork] = useState(true)
  const [loading, setLoading] = useState(false)
  const [published, setPublished] = useState<string | null>(null)

  const handlePublish = async () => {
    setLoading(true)
    const slug = generateSlug(chatTitle ?? 'chat')

    const { error } = await supabase.from('published_chats').upsert({
      chat_id: chatId,
      slug,
      title: chatTitle ?? 'Untitled Chat',
      description: description || null,
      allow_fork: allowFork,
    }, { onConflict: 'chat_id' })

    if (!error) {
      setPublished(`${window.location.origin}/p/${slug}`)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#0D0D0D]">Publish Chat</h2>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#0D0D0D]">✕</button>
        </div>

        {published ? (
          <div className="space-y-3">
            <p className="text-sm text-[#6B6B6B]">Your chat is now public at:</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-[#0D0D0D] flex-1 truncate">{published}</p>
              <button
                onClick={() => navigator.clipboard.writeText(published)}
                className="text-xs text-[#6B6B6B] hover:text-[#0D0D0D] shrink-0"
              >
                Copy
              </button>
            </div>
            <button onClick={onClose} className="w-full mt-2 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide">Description (optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="What's this chat about?"
                className="mt-1 w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg outline-none resize-none"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowFork}
                onChange={e => setAllowFork(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-[#0D0D0D]">Allow others to fork and continue this chat</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="flex-1 px-4 py-2 border border-[#E5E5E5] text-sm rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
