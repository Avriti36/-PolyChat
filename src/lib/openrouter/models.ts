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

  // Filter: context window >= 8k
  cachedModels = models.filter(m => (m.context_length ?? 0) >= 8000)
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
  const frontierIds = ['gpt-4o', 'claude-3', 'gemini-1.5']
  const fastIds = ['mistral', 'llama', 'haiku', 'mixtral', 'phi']

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
