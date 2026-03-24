'use client'

import { useState } from 'react'
import { useModels } from '@/hooks/useModels'

interface Props {
  value: string
  onChange: (modelId: string) => void
}

// Provider accent colors
function getProviderColor(modelId: string): string {
  if (modelId.startsWith('openai/')) return 'bg-emerald-500/20 text-emerald-400'
  if (modelId.startsWith('anthropic/')) return 'bg-orange-500/20 text-orange-400'
  if (modelId.startsWith('google/')) return 'bg-blue-500/20 text-blue-400'
  if (modelId.startsWith('meta-llama/')) return 'bg-indigo-500/20 text-indigo-400'
  if (modelId.startsWith('mistralai/')) return 'bg-rose-500/20 text-rose-400'
  if (modelId.startsWith('x-ai/')) return 'bg-slate-500/20 text-slate-300'
  return 'bg-white/10 text-white/50'
}

function getProviderDot(modelId: string): string {
  if (modelId.startsWith('openai/')) return 'bg-emerald-400'
  if (modelId.startsWith('anthropic/')) return 'bg-orange-400'
  if (modelId.startsWith('google/')) return 'bg-blue-400'
  if (modelId.startsWith('meta-llama/')) return 'bg-indigo-400'
  if (modelId.startsWith('mistralai/')) return 'bg-rose-400'
  if (modelId.startsWith('x-ai/')) return 'bg-slate-400'
  return 'bg-white/40'
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
        className="flex items-center gap-2 px-2.5 py-1.5 text-xs border border-white/10 rounded-lg hover:bg-white/8 transition-colors bg-white/4"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getProviderDot(value)}`} />
        <span className="max-w-[130px] truncate text-white/70">
          {current?.name ?? value}
        </span>
        <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 w-72 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-white/8">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full px-3 py-1.5 text-xs bg-white/5 border border-white/8 rounded-lg outline-none placeholder-white/25 text-white/70 focus:border-white/20"
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <p className="text-xs text-white/30 p-4 text-center">Loading models...</p>
            )}

            {['Frontier', 'Fast', 'Vision'].map(group => {
              const items = filtered.filter((m: any) => m.group === group)
              if (!items.length) return null
              return (
                <div key={group}>
                  <p className="text-[10px] font-semibold text-white/25 px-3 pt-2.5 pb-1 uppercase tracking-widest">
                    {group}
                  </p>
                  {items.map((m: any) => (
                    <button
                      key={m.id}
                      onClick={() => { onChange(m.id); setOpen(false); setSearch('') }}
                      className={`w-full text-left px-3 py-2 hover:bg-white/5 flex items-center justify-between gap-2 transition-colors ${m.id === value ? 'bg-white/8' : ''}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getProviderDot(m.id)}`} />
                        <div className="min-w-0">
                          <p className="text-xs text-white/80 truncate">{m.name}</p>
                          <p className="text-[10px] text-white/30">{(m.context_length / 1000).toFixed(0)}k ctx</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {group === 'Vision' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">vision</span>
                        )}
                        {m.id === value && (
                          <svg className="w-3 h-3 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}