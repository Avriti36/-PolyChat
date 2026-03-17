import { NextResponse } from 'next/server'
import { fetchModels, groupModels } from '@/lib/openrouter/models'

export async function GET() {
  try {
    const models = await fetchModels()
    const grouped = groupModels(models)
    return NextResponse.json({ models, grouped })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch models', code: 'MODELS_FETCH_ERROR' },
      { status: 500 }
    )
  }
}
