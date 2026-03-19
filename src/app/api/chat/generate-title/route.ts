import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { OPENROUTER_BASE, openRouterHeaders } from '@/lib/openrouter/client'

export async function POST(req: NextRequest) {
  try {
    const { chat_id, first_message } = await req.json()

    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: openRouterHeaders,
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          {
            role: 'user',
            content: `Generate a short 4-6 word title for a chat that starts with: "${first_message}". Reply with ONLY the title, no quotes, no punctuation.`,
          },
        ],
        max_tokens: 20,
      }),
    })

    const data = await response.json()
    const title = data.choices?.[0]?.message?.content?.trim() ?? 'New Chat'

    await supabaseServer
      .from('chats')
      .update({ title })
      .eq('id', chat_id)

    return NextResponse.json({ title })
  } catch {
    return NextResponse.json(
      { error: 'Title generation failed', code: 'TITLE_ERROR' },
      { status: 500 }
    )
  }
}
