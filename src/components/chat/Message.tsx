'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Message as MessageType } from '@/types'

interface Props {
  message: MessageType
  currentModel: string
  onEdit?: (index: number, content: string) => void
  onRetry?: () => void
}

export default function Message({ message, currentModel, onEdit, onRetry }: Props) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.content)
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)

  const isUser = message.role === 'user'
  const modelDiffers = message.role === 'assistant' && message.model_id && message.model_id !== currentModel

  const handleEditConfirm = () => {
    onEdit?.(message.message_index, editText)
    setEditing(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className={`group flex ${isUser ? 'justify-end' : 'justify-start'} mb-5`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs shrink-0 mt-1 mr-3 shadow-lg shadow-violet-500/20">
          ✦
        </div>
      )}

      <div className={`max-w-[78%] ${isUser ? 'order-1' : 'order-2'}`}>
        {/* Images */}
        {message.image_urls && message.image_urls.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap justify-end">
            {message.image_urls.map((url, i) => (
              <img key={i} src={url} alt="" className="max-w-[200px] rounded-xl border border-white/10" />
            ))}
          </div>
        )}

        {/* Bubble */}
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-sm text-white outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-white/40 hover:text-white/70"
              >
                Cancel
              </button>
              <button
                onClick={handleEditConfirm}
                className="text-xs bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg"
              >
                Save & Resend
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-gradient-to-br from-violet-600/90 to-indigo-600/90 text-white shadow-lg shadow-violet-500/15'
                : 'bg-white/5 border border-white/8 text-white/85'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none
                prose-p:my-1.5 prose-p:leading-relaxed prose-p:text-white/85
                prose-headings:font-semibold prose-headings:my-2 prose-headings:text-white
                prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-li:text-white/80
                prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-violet-300 prose-code:text-xs
                prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-4
                prose-strong:font-semibold prose-strong:text-white
                prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-violet-500 prose-blockquote:text-white/60">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Model badge */}
        {modelDiffers && (
          <p className="text-[10px] text-white/25 mt-1 px-1">
            via {message.model_id}
          </p>
        )}

        {/* Actions */}
        {hovered && !editing && (
          <div className={`flex gap-2 mt-1.5 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <button
              onClick={handleCopy}
              className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-400">Copied</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            {isUser && onEdit && (
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
            {!isUser && onRetry && (
              <button
                onClick={onRetry}
                className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}