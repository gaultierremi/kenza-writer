'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { LoreEntry } from '@/types/workspace'
import LoreForm from './LoreForm'

interface Props {
  projectId: string
}

const TYPE_BADGE: Record<string, string> = {
  lieu: 'bg-green-100 text-green-700',
  faction: 'bg-blue-100 text-blue-700',
  objet: 'bg-yellow-100 text-yellow-700',
  concept: 'bg-pink-100 text-pink-700',
}

export default function LorePanel({ projectId }: Props) {
  const [entries, setEntries] = useState<LoreEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<LoreEntry | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('lore_entries')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
      setEntries((data as LoreEntry[]) ?? [])
      setLoading(false)
    }
    load()
  }, [projectId])

  function handleSaved(e: LoreEntry) {
    setEntries((prev) => {
      const idx = prev.findIndex((x) => x.id === e.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = e
        return next
      }
      return [...prev, e]
    })
    setSelected(null)
    setCreating(false)
  }

  function handleDeleted(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setSelected(null)
  }

  const showForm = creating || selected !== null

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white border-r border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-sm text-gray-800">Lore</h2>
        {!showForm && (
          <button
            onClick={() => setCreating(true)}
            className="text-xs bg-purple-600 text-white rounded px-2 py-1 hover:bg-purple-700"
          >
            + Nouveau
          </button>
        )}
      </div>

      {showForm ? (
        <div className="flex-1 overflow-y-auto">
          <LoreForm
            projectId={projectId}
            initial={selected ?? undefined}
            onSaved={handleSaved}
            onDeleted={selected ? handleDeleted : undefined}
            onCancel={() => {
              setSelected(null)
              setCreating(false)
            }}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-gray-400 p-4">Chargement…</p>
          ) : entries.length === 0 ? (
            <p className="text-xs text-gray-400 p-4">
              Aucune entrée. Cliquez sur + Nouveau.
            </p>
          ) : (
            <ul>
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    onClick={() => setSelected(entry)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.name}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          TYPE_BADGE[entry.type] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {entry.type}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {entry.description}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
