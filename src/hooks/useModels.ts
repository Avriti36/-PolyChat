'use client'

import { useEffect, useState } from 'react'
import { Model, ModelGroup } from '@/types'

export function useModels() {
  const [models, setModels] = useState<Model[]>([])
  const [grouped, setGrouped] = useState<ModelGroup>({ frontier: [], fast: [], vision: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/models')
      .then(r => r.json())
      .then(data => {
        setModels(data.models ?? [])
        setGrouped(data.grouped ?? { frontier: [], fast: [], vision: [] })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { models, grouped, loading }
}
