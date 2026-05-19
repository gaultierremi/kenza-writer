'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Character } from '@/types/workspace'

interface Props {
  projectId: string
  initial?: Character
  onSaved: (c: Character) => void
  onDeleted?: (id: string) => void
  onCancel: () => void
}

type FormValues = {
  name: string
  age: string
  physical_description: string
  personality_traits: string
  relations: string
  notes: string
}

const empty: FormValues = {
  name: '',
  age: '',
  physical_description: '',
  personality_traits: '',
  relations: '',
  notes: '',
}

export default function CharacterForm({
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
          age: initial.age ?? '',
          physical_description: initial.physical_description ?? '',
          personality_traits: initial.personality_traits ?? '',
          relations: initial.relations ?? '',
          notes: initial.notes ?? '',
        }
      : empty
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof FormValues) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setValues((v) => ({ ...v, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.name.trim()) return
    setSaving(true)
    setError(null)

    const payload = {
      project_id: projectId,
      name: values.name.trim(),
      age: values.age.trim() || null,
      physical_description: values.physical_description.trim() || null,
      personality_traits: values.personality_traits.trim() || null,
      relations: values.relations.trim() || null,
      notes: values.notes.trim() || null,
    }

    if (initial) {
      const { data, error: err } = await supabase
        .from('characters')
        .update(payload)
        .eq('id', initial.id)
        .select()
        .single()

      if (err || !data) {
        setError(err?.message ?? 'Erreur lors de la mise à jour')
      } else {
        onSaved(data as Character)
      }
    } else {
      const { data, error: err } = await supabase
        .from('characters')
        .insert(payload)
        .select()
        .single()

      if (err || !data) {
        setError(err?.message ?? 'Erreur lors de la création')
      } else {
        onSaved(data as Character)
      }
    }

    setSaving(false)
  }

  async function handleDelete() {
    if (!initial || !onDeleted) return
    if (!window.confirm(`Supprimer "${initial.name}" ?`)) return
    setSaving(true)
    const { error: err } = await supabase
      .from('characters')
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
        <h3 className="font-semibold text-sm dark:text-gray-100">
          {initial ? 'Modifier le personnage' : 'Nouveau personnage'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕ Fermer
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded p-2">{error}</p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Nom *</span>
        <input
          value={values.name}
          onChange={set('name')}
          required
          className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Âge</span>
        <input
          value={values.age}
          onChange={set('age')}
          className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </label>

      {(
        [
          ['physical_description', 'Description physique'],
          ['personality_traits', 'Traits de caractère'],
          ['relations', 'Relations'],
          ['notes', 'Notes libres'],
        ] as [keyof FormValues, string][]
      ).map(([field, label]) => (
        <label key={field} className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
          <textarea
            value={values[field]}
            onChange={set(field)}
            rows={2}
            className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm resize-none bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </label>
      ))}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-blue-600 text-white rounded px-3 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {initial && onDeleted && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 rounded px-3 py-1.5 text-sm hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50"
          >
            Supprimer
          </button>
        )}
      </div>
    </form>
  )
}
