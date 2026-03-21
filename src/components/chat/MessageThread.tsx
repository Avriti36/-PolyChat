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
      <div className="flex-1 flex items-center justify-center text-center px-8">
        <div>
          <div className="text-4xl mb-3">✦</div>
          <p className="text-[#6B6B6B] text-sm">Start a conversation</p>
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
          <div className="flex justify-start mb-4">
            <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-white text-sm text-[#0D0D0D] leading-relaxed whitespace-pre-wrap">
              {streamContent || (
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#6B6B6B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#6B6B6B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#6B6B6B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
              {streamContent && <span className="inline-block w-0.5 h-4 bg-black ml-0.5 animate-pulse align-middle" />}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
