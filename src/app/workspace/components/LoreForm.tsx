'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { LoreEntry, LoreType } from '@/types/workspace'

interface Props {
  projectId: string
  initial?: LoreEntry
  onSaved: (e: LoreEntry) => void
  onDeleted?: (id: string) => void
  onCancel: () => void
}

type FormValues = {
  name: string
  type: LoreType
  description: string
  character_links: string
  notes: string
}

const empty: FormValues = {
  name: '',
  type: 'lieu',
  description: '',
  character_links: '',
  notes: '',
}

const LORE_TYPES: { value: LoreType; label: string }[] = [
  { value: 'lieu', label: 'Lieu' },
  { value: 'faction', label: 'Faction' },
  { value: 'objet', label: 'Objet' },
  { value: 'concept', label: 'Concept' },
]

export default function LoreForm({
  projectId,
  initial,
  onSaved,
  onDeleted,
  onCancel,
}: Props) {
  const [values, setValues] = useState<FormValues>(
    initial
      ? {
          name: initial.name,
          type: initial.type,
          description: initial.description ?? '',
          character_links: initial.character_links ?? '',
          notes: initial.notes ?? '',
        }
      : empty
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.name.trim()) return
    setSaving(true)
    setError(null)

    const payload = {
      project_id: projectId,
      name: values.name.trim(),
      type: values.type,
      description: values.description.trim() || null,
      character_links: values.character_links.trim() || null,
      notes: values.notes.trim() || null,
    }

    if (initial) {
      const { data, error: err } = await supabase
        .from('lore_entries')
        .update(payload)
        .eq('id', initial.id)
        .select()
        .single()

      if (err || !data) {
        setError(err?.message ?? 'Erreur lors de la mise à jour')
      } else {
        onSaved(data as LoreEntry)
      }
    } else {
      const { data, error: err } = await supabase
        .from('lore_entries')
        .insert(payload)
        .select()
        .single()

      if (err || !data) {
        setError(err?.message ?? 'Erreur lors de la création')
      } else {
        onSaved(data as LoreEntry)
      }
    }

    setSaving(false)
  }

  async function handleDelete() {
    if (!initial || !onDeleted) return
    if (!window.confirm(`Supprimer "${initial.name}" ?`)) return
    setSaving(true)
    const { error: err } = await supabase
      .from('lore_entries')
      .delete()
      .eq('id', initial.id)
    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      onDeleted(initial.id)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          {initial ? 'Modifier l'entrée' : 'Nouvelle entrée lore'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ✕ Fermer
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded p-2">{error}</p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">Nom *</span>
        <input
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          required
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">Type</span>
        <select
          value={values.type}
          onChange={(e) => setField('type', e.target.value as LoreType)}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
        >
          {LORE_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {(
        [
          ['description', 'Description'],
          ['character_links', 'Liens avec personnages'],
          ['notes', 'Notes libres'],
        ] as [keyof FormValues, string][]
      ).map(([field, label]) => (
        <label key={field} className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600">{label}</span>
          <textarea
            value={values[field] as string}
            onChange={(e) => setField(field, e.target.value as FormValues[typeof field])}
            rows={2}
            className="border rounded px-2 py-1 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
        </label>
      ))}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-purple-600 text-white rounded px-3 py-1.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {initial && onDeleted && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="bg-red-50 text-red-600 border border-red-200 rounded px-3 py-1.5 text-sm hover:bg-red-100 disabled:opacity-50"
          >
            Supprimer
          </button>
        )}
      </div>
    </form>
  )
}
