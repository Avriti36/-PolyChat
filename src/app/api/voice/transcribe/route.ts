import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/whisper'
import { OPENROUTER_BASE, openRouterHeaders } from '@/lib/openrouter/client'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio') as Blob

    if (!audio) {
      return NextResponse.json(
        { error: 'No audio provided', code: 'NO_AUDIO' },
        { status: 400 }
      )
    }

    // Step 1: Whisper transcription
    const rawText = await transcribeAudio(audio)

    // Step 2: LLM cleanup
    const cleanupRes = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: openRouterHeaders,
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          {
            role: 'user',
            content: `Clean up this voice transcription. Fix grammar, remove filler words like "um" and "uh", keep the meaning intact. Reply with ONLY the cleaned text:\n\n"${rawText}"`,
          },
        ],
        max_tokens: 500,
      }),
    })

    const cleanupData = await cleanupRes.json()
    const cleanedText =
      cleanupData.choices?.[0]?.message?.content?.trim() ?? rawText

    return NextResponse.json({ text: cleanedText, raw: rawText })
  } catch (err) {
    return NextResponse.json(
      { error: 'Transcription failed', code: 'TRANSCRIPTION_ERROR' },
      { status: 500 }
    )
  }
}
