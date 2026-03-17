import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'

export default async function ChatPage() {
  const { data: latest } = await supabaseServer
    .from('chats')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (latest?.id) {
    redirect(`/chat/${latest.id}`)
  }

  // Create a new chat if none exist
  const { data: newChat } = await supabaseServer
    .from('chats')
    .insert({ model_id: 'openai/gpt-4o-mini' })
    .select()
    .single()

  if (newChat?.id) redirect(`/chat/${newChat.id}`)

  return null
}
