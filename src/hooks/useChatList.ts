'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Chat } from '@/types'

export function useChatList() {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChats = useCallback(async () => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    setChats(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchChats()

    const channel = supabase
      .channel('chats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
        fetchChats()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchChats])

  const createChat = async (model_id: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('chats')
      .insert({ model_id, title: null })
      .select()
      .single()
    if (error) return null
    return data.id
  }

  const deleteChat = async (id: string) => {
    await supabase.from('chats').delete().eq('id', id)
  }

  const togglePin = async (id: string, is_pinned: boolean) => {
    await supabase.from('chats').update({ is_pinned: !is_pinned }).eq('id', id)
  }

  const renameChat = async (id: string, title: string) => {
    await supabase.from('chats').update({ title }).eq('id', id)
  }

  return { chats, loading, createChat, deleteChat, togglePin, renameChat, refetch: fetchChats }
}
