"use client";

import { useRef, useState, useEffect } from "react";
import VoiceButton from "./VoiceButton";
import { supabase } from "@/lib/supabase/client";

interface Props {
  onSend: (content: string, image_urls?: string[]) => Promise<{ success: boolean; error?: string; restore?: boolean }>;
  streaming: boolean;
  onStop: () => void;
  chatId: string;
  isVisionModel: boolean;
  guestMessagesRemaining?: number;
  guestMessageLimit?: number;
}

export default function InputArea({
  onSend, streaming, onStop, chatId, isVisionModel,
  guestMessagesRemaining = Infinity, guestMessageLimit = Infinity,
}: Props) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingTextRef = useRef<string>("");
  const pendingImagesRef = useRef<string[]>([]);

  const isGuest = !Number.isFinite(guestMessagesRemaining);
  const showGuestLimit = isGuest && guestMessageLimit < Infinity;

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [text]);

  useEffect(() => {
    if (error) setError(null);
  }, [text]);

  const handleSend = async () => {
    if (!text.trim() && images.length === 0) return;
    setError(null);
    pendingTextRef.current = text.trim();
    pendingImagesRef.current = images;
    const textToSend = text.trim();
    const imagesToSend = images.length > 0 ? [...images] : undefined;
    setText("");
    setImages([]);
    const result = await onSend(textToSend, imagesToSend);
    if (!result.success && result.restore) {
      setText(pendingTextRef.current);
      setImages(pendingImagesRef.current);
      setError(result.error || "Message was not sent");
      return;
    }
    if (!result.success) {
      setError(result.error || "Failed to send message");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const path = `${chatId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("chat-images").upload(path, file);
      if (!uploadError) {
        const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
        setImages((prev) => [...prev, data.publicUrl]);
      }
    }
    setUploading(false);
  };

  const isDisabled = !text.trim() && images.length === 0;

  return (
    <div className="px-4 pb-4 pt-2">
      {/* Error */}
      {error && (
        <div className="mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Guest limit warning */}
      {showGuestLimit && guestMessagesRemaining <= 3 && (
        <div className="mb-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-400">
            {guestMessagesRemaining === 0 ? "Guest limit reached. " : `${guestMessagesRemaining} messages left. `}
            <a href="/login" className="text-violet-400 hover:underline">Sign up for unlimited →</a>
          </p>
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap px-1">
          {images.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="" className="w-14 h-14 object-cover rounded-lg border border-white/10" />
              <button
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -top-1 -right-1 w-4 h-4 bg-white/20 backdrop-blur text-white rounded-full text-xs flex items-center justify-center hover:bg-white/40"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input box */}
      <div className="flex items-end gap-2 bg-white/5 rounded-2xl px-3 py-2.5 border border-white/10 focus-within:border-white/20 transition-colors">
        {isVisionModel && (
          <>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="p-1.5 text-white/30 hover:text-white/60 transition-colors shrink-0"
            >
              {uploading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={showGuestLimit && guestMessagesRemaining === 0 ? "Guest limit reached..." : "Message..."}
          rows={1}
          disabled={showGuestLimit && guestMessagesRemaining === 0}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-white/85 placeholder-white/25 py-1 disabled:opacity-50"
          style={{ maxHeight: 200 }}
        />

        <VoiceButton onTranscript={(t) => setText((prev) => (prev ? prev + " " + t : t))} />

        {streaming ? (
          <button
            onClick={onStop}
            className="p-2 bg-white/10 text-white/80 rounded-xl shrink-0 hover:bg-white/15 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={isDisabled || (showGuestLimit && guestMessagesRemaining === 0)}
            className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-xl shrink-0 hover:opacity-90 transition-opacity disabled:opacity-20 shadow-lg shadow-violet-500/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </div>

      {showGuestLimit && (
        <div className="mt-1.5 flex justify-end">
          <span className="text-[10px] text-white/20">
            {guestMessagesRemaining} of {guestMessageLimit} messages remaining
          </span>
        </div>
      )}
    </div>
  );
}