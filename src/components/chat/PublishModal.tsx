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
  const [copied, setCopied] = useState(false)

  const handlePublish = async () => {
    setLoading(true)
    const slug = generateSlug(chatTitle ?? 'chat')

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('published_chats').upsert({
      chat_id: chatId,
      user_id: user.id, // <--- Add the user_id here so the DB accepts it!
      slug,
      title: chatTitle ?? 'Untitled Chat',
      description: description || null,
      allow_fork: allowFork,
    }, { onConflict: 'chat_id' })
    
    if (!error) setPublished(`${window.location.origin}/p/${slug}`)
    else console.error("Publishing error:", error); // Helpful for debugging!
    
    setLoading(false)
  }

  const handleCopy = () => {
    if (!published) return
    navigator.clipboard.writeText(published)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Publish Chat</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {published ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-xs text-white/60 flex-1 truncate">{published}</p>
              <button
                onClick={handleCopy}
                className="text-xs shrink-0 px-2.5 py-1 rounded-lg bg-white/8 text-white/60 hover:text-white hover:bg-white/12 transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-white/30 text-center">Your chat is now publicly accessible</p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="What's this chat about?"
                className="mt-2 w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl outline-none resize-none text-white/80 placeholder-white/20 focus:border-white/20 transition-colors"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setAllowFork(v => !v)}
                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                  allowFork
                    ? 'bg-violet-600 border-violet-600'
                    : 'border-white/20 bg-white/5'
                }`}
              >
                {allowFork && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                Allow others to fork and continue this chat
              </span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-white/10 text-sm text-white/50 rounded-xl hover:bg-white/5 hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
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