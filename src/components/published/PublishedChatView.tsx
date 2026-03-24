import { Message, PublishedChat } from '@/types'
import ForkButton from './ForkButton'
import ReactMarkdown from 'react-markdown'

interface Props {
  published: PublishedChat
  messages: Message[]
}

export default function PublishedChatView({ published, messages }: Props) {
  return (
    <div className="min-h-screen bg-[#161616]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-[9px] text-white font-bold">P</span>
            </div>
            <span className="text-xs text-white/30 font-medium">PolyChat</span>
          </div>
          <h1 className="text-2xl font-semibold text-white/90 mb-2">{published.title}</h1>
          {published.description && (
            <p className="text-white/40 text-sm mb-4">{published.description}</p>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-white/25">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(published.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/25">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {published.view_count} views
            </div>
            {published.allow_fork && (
              <ForkButton publishedChatId={published.chat_id} />
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-5">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs shrink-0 mt-1 shadow-lg shadow-violet-500/20">
                  ✦
                </div>
              )}
              <div
                className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600/90 to-indigo-600/90 text-white shadow-lg shadow-violet-500/15'
                    : 'bg-white/5 border border-white/8 text-white/85'
                }`}
              >
                {msg.image_urls?.map((url, i) => (
                  <img key={i} src={url} alt="" className="max-w-full rounded-lg mb-2 border border-white/10" />
                ))}
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none
                    prose-p:my-1.5 prose-p:text-white/85
                    prose-headings:text-white prose-headings:font-semibold
                    prose-code:bg-white/10 prose-code:text-violet-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
                    prose-strong:text-white prose-a:text-violet-400">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        {published.allow_fork && messages.length > 0 && (
          <div className="mt-10 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-sm text-white/30 mb-3">Want to continue this conversation?</p>
            <ForkButton publishedChatId={published.chat_id} />
          </div>
        )}
      </div>
    </div>
  )
}