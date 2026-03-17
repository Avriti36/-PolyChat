'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Message } from '@/types'

export function useChat(chatId: string, initialModel: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [model, setModel] = useState(initialModel)
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!chatId) return

    supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('message_index', { ascending: true })
      .then(({ data }) => setMessages(data ?? []))
  }, [chatId])

  const sendMessage = useCallback(
    async (content: string, image_urls?: string[]) => {
      if (!content.trim() || streaming) return

      // Optimistically add user message
      const userMsg: Partial<Message> = {
        chat_id: chatId,
        role: 'user',
        content,
        image_urls: image_urls ?? null,
        message_index: messages.length,
      }

      // Save user message to DB
      const { data: savedUser } = await supabase
        .from('messages')
        .insert(userMsg)
        .select()
        .single()

      if (savedUser) setMessages(prev => [...prev, savedUser])

      setStreaming(true)
      setStreamContent('')

      abortRef.current = new AbortController()

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg].map(m => ({
              role: m.role,
              content: m.content,
            })),
            model_id: model,
            chat_id: chatId,
          }),
          signal: abortRef.current.signal,
        })

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let full = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value, { stream: true })
          const lines = text.split('\n')
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const parsed = JSON.parse(line.slice(6))
              full += parsed.content ?? ''
              setStreamContent(full)
            } catch {}
          }
        }

        // Refresh messages from DB
        const { data: fresh } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('message_index', { ascending: true })
        setMessages(fresh ?? [])

        // Fire-and-forget title generation after 2nd message
        if (messages.length === 0) {
          fetch('/api/chat/generate-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, first_message: content }),
          })
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err)
      } finally {
        setStreaming(false)
        setStreamContent('')
      }
    },
    [chatId, messages, model, streaming]
  )

  const stopStreaming = () => {
    abortRef.current?.abort()
    setStreaming(false)
    setStreamContent('')
  }

  const editMessage = useCallback(
    async (messageIndex: number, newContent: string) => {
      // Delete all messages from this index onward
      const toDelete = messages.filter(m => m.message_index >= messageIndex)
      for (const m of toDelete) {
        await supabase.from('messages').delete().eq('id', m.id)
      }
      const trimmed = messages.filter(m => m.message_index < messageIndex)
      setMessages(trimmed)
      await sendMessage(newContent)
    },
    [messages, sendMessage]
  )

  return {
    messages,
    model,
    setModel,
    streaming,
    streamContent,
    sendMessage,
    stopStreaming,
    editMessage,
  }
}
