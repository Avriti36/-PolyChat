import { Model, ModelGroup } from '@/types'
import { OPENROUTER_BASE, openRouterHeaders } from './client'

const VISION_CAPABLE_IDS = new Set([
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-opus',
  'google/gemini-pro-vision',
  'google/gemini-1.5-pro',
  'google/gemini-1.5-flash',
  'google/gemini-2.0-flash-exp',
  'google/gemini-2.0-pro-exp-02-05',
])

// Free models available on OpenRouter (from user's verified list - March 2025)
// These models are marked as 'free' on OpenRouter
const FREE_MODEL_IDS = new Set([
  // Google models
  'google/gemini-2.0-flash-exp',
  'google/gemini-2.0-pro-exp-02-05',
  // DeepSeek models
  'deepseek/deepseek-r1',
  'deepseek/deepseek-r1-distill-llama-70b',
  // Meta Llama models
  'meta-llama/llama-3.3-70b-instruct',
  'meta-llama/llama-3.1-8b-instruct',
  // NVIDIA models
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'nvidia/nemotron-nano-9b-v2',
  'nvidia/nemotron-3-super',
  'nvidia/nemotron-3-nano-30b-a3b',
  // OpenAI models
  'openai/gpt-oss-120b',
  // Qwen models
  'qwen/qwen3-coder-480b-a35b-instruct',
  'qwen/qwen-2.5-7b-instruct',
  // Mistral models
  'mistralai/mistral-small-24b-instruct-2501',
  'mistralai/mistral-nemo',
  // Other models
  'z-ai/glm-4.5-air',
  'arcee-ai/trinity-large-preview',
  'arcee-ai/trinity-mini',
  'stepfun/step-3.5-flash',
  // OpenRouter Featured models
  'openrouter/hunter-alpha',
  'openrouter/healer-alpha',
  'openrouter/free',
])

let cachedModels: Model[] | null = null
let cacheTime = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function fetchModels(): Promise<Model[]> {
  if (cachedModels && Date.now() - cacheTime < CACHE_TTL) {
    return cachedModels
  }

  const res = await fetch(`${OPENROUTER_BASE}/models`, {
    headers: openRouterHeaders,
  })

  if (!res.ok) throw new Error('Failed to fetch models')

  const data = await res.json()
  const models: Model[] = data.data ?? []

  // Filter: only show free models for showcase (no cost)
  // Also require context window >= 8k for quality
  cachedModels = models.filter(m =>
    FREE_MODEL_IDS.has(m.id) &&
    (m.context_length ?? 0) >= 8000
  )
  cacheTime = Date.now()

  return cachedModels
}

export function isVisionCapable(model: Model): boolean {
  return (
    VISION_CAPABLE_IDS.has(model.id) ||
    model.architecture?.modality?.includes('image') === true
  )
}

export function groupModels(models: Model[]): ModelGroup {
  const frontierIds = ['gpt-4o', 'claude-3', 'gemini-1.5', 'gemini-2.0', 'llama-3.3', 'nemotron', 'deepseek-r1']
  const fastIds = ['mistral', 'llama', 'haiku', 'mixtral', 'phi', 'qwen', 'deepseek', 'gpt-oss', 'glm', 'trinity', 'stepfun', 'hunter', 'healer', 'free']

  const frontier: Model[] = []
  const fast: Model[] = []
  const vision: Model[] = []

  for (const m of models) {
    const id = m.id.toLowerCase()
    if (isVisionCapable(m)) {
      vision.push(m)
    } else if (frontierIds.some(f => id.includes(f))) {
      frontier.push(m)
    } else if (fastIds.some(f => id.includes(f))) {
      fast.push(m)
    } else {
      fast.push(m) // default bucket
    }
  }

  return { frontier, fast, vision }
}
