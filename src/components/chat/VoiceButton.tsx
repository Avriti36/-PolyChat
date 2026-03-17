'use client'

import { useVoice } from '@/hooks/useVoice'

interface Props {
  onTranscript: (text: string) => void
}

export default function VoiceButton({ onTranscript }: Props) {
  const { state, startRecording, stopRecording } = useVoice(onTranscript)

  if (state === 'processing') {
    return (
      <button disabled className="p-2 text-[#6B6B6B]">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </button>
    )
  }

  if (state === 'recording') {
    return (
      <button
        onClick={stopRecording}
        className="p-2 text-red-500 relative"
      >
        <span className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-75" />
        <svg className="w-5 h-5 relative" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={startRecording}
      className="p-2 text-[#6B6B6B] hover:text-[#0D0D0D] transition-colors"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z" />
      </svg>
    </button>
  )
}
