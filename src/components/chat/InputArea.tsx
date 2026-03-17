'use client'

import { useRef, useState, useEffect } from 'react'
import VoiceButton from './VoiceButton'
import { supabase } from '@/lib/supabase/client'

interface Props {
  onSend: (content: string, image_urls?: string[]) => void
  streaming: boolean
  onStop: () => void
  chatId: string
  isVisionModel: boolean
}

export default function InputArea({ onSend, streaming, onStop, chatId, isVisionModel }: Props) {
  const [text, setText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [text])

  const handleSend = () => {
    if (!text.trim() && images.length === 0) return
    onSend(text.trim(), images.length > 0 ? images : undefined)
    setText('')
    setImages([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)

    for (const file of files) {
      const path = `${chatId}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('images').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('images').getPublicUrl(path)
        setImages(prev => [...prev, data.publicUrl])
      }
    }
    setUploading(false)
  }

  return (
    <div className="border-t border-[#E5E5E5] bg-white p-4">
      {images.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {images.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-[#E5E5E5]" />
              <button
                onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white rounded-full text-xs flex items-center justify-center"
              >×</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-[#E5E5E5]">
        {isVisionModel && (
          <>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="p-2 text-[#6B6B6B] hover:text-[#0D0D0D] transition-colors shrink-0"
            >
              {uploading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              )}
            </button>
          </>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-[#0D0D0D] placeholder-[#6B6B6B] py-1.5"
          style={{ maxHeight: 200 }}
        />

        <VoiceButton onTranscript={t => setText(prev => prev ? prev + ' ' + t : t)} />

        {streaming ? (
          <button
            onClick={onStop}
            className="p-2 bg-black text-white rounded-lg shrink-0 hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim() && images.length === 0}
            className="p-2 bg-black text-white rounded-lg shrink-0 hover:bg-gray-800 transition-colors disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
