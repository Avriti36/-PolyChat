export const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

export const openRouterHeaders = {
  'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
  'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  'X-Title': 'AI Chat App',
  'Content-Type': 'application/json',
}
