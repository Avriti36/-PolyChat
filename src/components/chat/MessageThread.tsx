'use client'

import { useEffect, useRef } from 'react'
import { Message as MessageType } from '@/types'
import Message from './Message'

interface Props {
  messages: MessageType[]
  streamContent: string
  streaming: boolean
  currentModel: string
  onEdit: (index: number, content: string) => void
  onRetry: () => void
}

const SUGGESTIONS = [
  { icon: '📄', label: 'Explain My assignment', sub: 'in simple terms' },
  { icon: '⚡', label: 'Write a caption for social media', sub: 'to automate a task' },
  { icon: '🌐', label: 'Translate to formal language', sub: 'paste any text' },
  { icon: '👗👖', label: '  Help me find the correct fit for me', sub: 'for a side project' },
]

export default function MessageThread({
  messages,
  streamContent,
  streaming,
  currentModel,
  onEdit,
  onRetry,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

  if (messages.length === 0 && !streaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">✦</span>
          </div>
          <h2 className="text-lg font-semibold text-white/80 mb-1">What can I help with?</h2>
          <p className="text-sm text-white/30">Ask anything — switch models anytime</p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              className="text-left p-3.5 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 hover:border-white/15 transition-all group"
            >
              <span className="text-base mb-1.5 block">{s.icon}</span>
              <p className="text-xs font-medium text-white/70 group-hover:text-white/90 transition-colors">{s.label}</p>
              <p className="text-xs text-white/30 mt-0.5">{s.sub}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-3xl mx-auto">
        {messages.map(msg => (
          <Message
            key={msg.id}
            message={msg}
            currentModel={currentModel}
            onEdit={msg.role === 'user' ? onEdit : undefined}
            onRetry={msg.role === 'assistant' ? onRetry : undefined}
          />
        ))}

        {/* Streaming message */}
        {streaming && (
          <div className="flex justify-start mb-4 gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs shrink-0 mt-1">
              ✦
            </div>
            <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-white/5 border border-white/8 text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
              {streamContent || (
                <span className="flex gap-1 py-0.5">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
              {streamContent && (
                <span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}