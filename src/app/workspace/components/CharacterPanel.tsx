'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Character } from '@/types/workspace'
import CharacterForm from './CharacterForm'

interface Props {
  projectId: string
}

export default function CharacterPanel({ projectId }: Props) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Character | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
      setCharacters((data as Character[]) ?? [])
      setLoading(false)
    }
    load()
  }, [projectId])

  function handleSaved(c: Character) {
    setCharacters((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = c
        return next
      }
      return [...prev, c]
    })
    setSelected(null)
    setCreating(false)
  }

  function handleDeleted(id: string) {
    setCharacters((prev) => prev.filter((c) => c.id !== id))
    setSelected(null)
  }

  const showForm = creating || selected !== null

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white border-r border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-sm text-gray-800">Personnages</h2>
        {!showForm && (
          <button
            onClick={() => setCreating(true)}
            className="text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700"
          >
            + Nouveau
          </button>
        )}
      </div>

      {showForm ? (
        <div className="flex-1 overflow-y-auto">
          <CharacterForm
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
          ) : characters.length === 0 ? (
            <p className="text-xs text-gray-400 p-4">
              Aucun personnage. Cliquez sur + Nouveau.
            </p>
          ) : (
            <ul>
              {characters.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelected(c)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b border-gray-100"
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.age && (
                      <span className="text-gray-500 text-xs ml-2">
                        {c.age} ans
                      </span>
                    )}
                    {c.physical_description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {c.physical_description}
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
