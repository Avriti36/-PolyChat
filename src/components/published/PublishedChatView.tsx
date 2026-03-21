import { Message, PublishedChat } from '@/types'
import ForkButton from './ForkButton'

interface Props {
  published: PublishedChat
  messages: Message[]
}

export default function PublishedChatView({ published, messages }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-[#E5E5E5]">
          <h1 className="text-2xl font-semibold text-[#0D0D0D] mb-2">{published.title}</h1>
          {published.description && (
            <p className="text-[#6B6B6B] text-sm mb-4">{published.description}</p>
          )}
          <div className="flex items-center gap-4">
            <p className="text-xs text-[#6B6B6B]">
              {new Date(published.published_at).toLocaleDateString()}
            </p>
            {published.allow_fork && <ForkButton publishedChatId={published.chat_id} />}
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gray-100 text-[#0D0D0D]'
                    : 'bg-white text-[#0D0D0D] border border-[#E5E5E5]'
                }`}
              >
                {msg.image_urls?.map((url, i) => (
                  <img key={i} src={url} alt="" className="max-w-full rounded-lg mb-2" />
                ))}
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
