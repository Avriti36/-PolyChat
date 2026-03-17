'use client'

import { useState } from 'react'
import { useModels } from '@/hooks/useModels'
import { Model } from '@/types'

interface Props {
  value: string
  onChange: (modelId: string) => void
}

export default function ModelSelector({ value, onChange }: Props) {
  const { grouped, loading } = useModels()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const allModels = [
    ...grouped.frontier.map(m => ({ ...m, group: 'Frontier' })),
    ...grouped.fast.map(m => ({ ...m, group: 'Fast' })),
    ...grouped.vision.map(m => ({ ...m, group: 'Vision' })),
  ]

  const filtered = allModels.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase())
  )

  const current = allModels.find(m => m.id === value)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[#E5E5E5] rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="max-w-[160px] truncate text-[#0D0D0D]">
          {current?.name ?? value}
        </span>
        <svg className="w-4 h-4 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 w-80 bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50">
          <div className="p-2 border-b border-[#E5E5E5]">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full px-3 py-1.5 text-sm bg-gray-50 rounded-lg outline-none"
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <p className="text-sm text-[#6B6B6B] p-4 text-center">Loading models...</p>
            )}

            {['Frontier', 'Fast', 'Vision'].map(group => {
              const items = filtered.filter((m: any) => m.group === group)
              if (!items.length) return null
              return (
                <div key={group}>
                  <p className="text-xs font-semibold text-[#6B6B6B] px-3 pt-2 pb-1 uppercase tracking-wide">
                    {group}
                  </p>
                  {items.map((m: any) => (
                    <button
                      key={m.id}
                      onClick={() => { onChange(m.id); setOpen(false); setSearch('') }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${m.id === value ? 'bg-gray-100' : ''}`}
                    >
                      <div>
                        <p className="text-sm text-[#0D0D0D]">{m.name}</p>
                        <p className="text-xs text-[#6B6B6B]">{(m.context_length / 1000).toFixed(0)}k ctx</p>
                      </div>
                      {group === 'Vision' && <span className="text-sm">👁</span>}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  )
}
