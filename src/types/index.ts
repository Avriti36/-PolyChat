export interface Chat {
  id: string
  title: string | null
  model_id: string
  is_pinned: boolean
  forked_from_chat_id: string | null
  forked_at_message_index: number | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model_id: string | null
  image_urls: string[] | null
  message_index: number
  created_at: string
}

export interface Model {
  id: string
  name: string
  description?: string
  context_length: number
  architecture?: {
    modality?: string
  }
  pricing?: {
    prompt: string
    completion: string
  }
  top_provider?: {
    context_length: number
  }
}

export interface ModelGroup {
  frontier: Model[]
  fast: Model[]
  vision: Model[]
}

export interface PublishedChat {
  id: string
  chat_id: string
  slug: string
  title: string
  description: string | null
  allow_fork: boolean
  view_count: number
  published_at: string
}

export interface StreamChunk {
  content: string
  done: boolean
}
