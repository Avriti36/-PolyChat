'use client'

import { useCallback, useRef, useState } from 'react'

type VoiceState = 'idle' | 'recording' | 'processing'

export function useVoice(onTranscript: (text: string) => void) {
  const [state, setState] = useState<VoiceState>('idle')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []

    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = async () => {
      setState('processing')
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', blob)

      try {
        const res = await fetch('/api/voice/transcribe', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (data.text) onTranscript(data.text)
      } catch (err) {
        console.error('Transcription error:', err)
      } finally {
        setState('idle')
        stream.getTracks().forEach(t => t.stop())
      }
    }

    mediaRef.current = recorder
    recorder.start()
    setState('recording')
  }, [onTranscript])

  const stopRecording = useCallback(() => {
    mediaRef.current?.stop()
  }, [])

  return { state, startRecording, stopRecording }
}
