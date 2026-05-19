'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import type { JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { supabase } from '@/lib/supabase'
import { LoreHighlight, applyLoreHighlights } from './LoreHighlight'
import type { LoreDetectResponse, LoreMatch } from '@/types/workspace'

interface Props {
  projectId: string
}

interface PopoverState {
  x: number
  y: number
  entry: LoreMatch
}

// ─── toolbar button ─────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

// ─── lore popover ────────────────────────────────────────────────────────────

function LorePopover({ state }: { state: PopoverState }) {
  const typeLabel: Record<string, string> = {
    character: 'Personnage',
    lore: 'Lore',
  }

  return createPortal(
    <div
      className="lore-popover fixed z-50 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg shadow-xl p-3 max-w-[240px] pointer-events-none"
      style={{
        left: state.x,
        top: state.y - 12,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {state.entry.name}
        </span>
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
          {typeLabel[state.entry.type] ?? state.entry.type}
        </span>
      </div>
      {state.entry.description && (
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
          {state.entry.description}
        </p>
      )}
      <div
        className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-r border-b border-amber-200 dark:border-amber-700 rotate-45"
        aria-hidden
      />
    </div>,
    document.body
  )
}

// ─── main panel ─────────────────────────────────────────────────────────────

export default function EditorPanel({ projectId }: Props) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  )
  const [aiEnabled, setAiEnabled] = useState(true)
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const [contentLoaded, setContentLoaded] = useState(false)
  const [wordCount, setWordCount] = useState(0)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const detectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const aiEnabledRef = useRef(aiEnabled)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    aiEnabledRef.current = aiEnabled
  }, [aiEnabled])

  const saveDocument = useCallback(
    async (content: JSONContent) => {
      setSaveStatus('saving')
      await supabase.from('documents').upsert(
        { project_id: projectId, content },
        { onConflict: 'project_id' }
      )
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    [projectId]
  )

  const runLoreDetect = useCallback(
    async (text: string, editor: ReturnType<typeof useEditor>) => {
      if (!aiEnabledRef.current || !text.trim() || !editor) return
      try {
        const res = await fetch('/api/lore-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, projectId }),
        })
        const data = (await res.json()) as LoreDetectResponse
        if (data.matches.length > 0) {
          const { from } = editor.state.selection
          const $from = editor.state.doc.resolve(from)
          applyLoreHighlights(
            editor,
            data.matches,
            $from.start(),
            $from.end()
          )
        }
      } catch {
        // fire-and-forget — never block the writer
      }
    },
    [projectId]
  )

  const editor = useEditor({
    extensions: [StarterKit, LoreHighlight],
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none p-6 min-h-full leading-relaxed text-gray-900 dark:text-gray-100',
      },
    },
    onUpdate({ editor: ed, transaction }) {
      if (transaction.getMeta('loreHighlightUpdate')) return

      setWordCount(ed.getText().split(/\s+/).filter(Boolean).length)

      // debounced save (1 500 ms)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveDocument(ed.getJSON())
      }, 1500)

      // debounced lore detection (600 ms)
      if (aiEnabledRef.current) {
        if (detectTimer.current) clearTimeout(detectTimer.current)
        detectTimer.current = setTimeout(() => {
          const { from } = ed.state.selection
          const $from = ed.state.doc.resolve(from)
          const text = $from.parent.textContent
          void runLoreDetect(text, ed)
        }, 600)
      }
    },
  })

  // load saved content
  useEffect(() => {
    if (!editor || contentLoaded) return
    async function load() {
      const { data } = await supabase
        .from('documents')
        .select('content')
        .eq('project_id', projectId)
        .single()
      if (data?.content) {
        editor!.commands.setContent(data.content as JSONContent)
        setWordCount(editor!.getText().split(/\s+/).filter(Boolean).length)
      }
      setContentLoaded(true)
    }
    void load()
  }, [editor, projectId, contentLoaded])

  // lore highlight popover on hover
  useEffect(() => {
    const container = editorContainerRef.current
    if (!container) return

    function handleMouseover(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-lore-id]'
      )
      if (!target) return
      const rect = target.getBoundingClientRect()
      setPopover({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY,
        entry: {
          id: target.dataset['loreId'] ?? '',
          name: target.dataset['loreName'] ?? '',
          type: (target.dataset['loreType'] ?? 'lore') as 'character' | 'lore',
          description: target.dataset['loreDescription'] ?? '',
        },
      })
    }

    function handleMouseout(e: MouseEvent) {
      const related = e.relatedTarget as HTMLElement | null
      if (
        !related?.closest('.lore-popover') &&
        !related?.closest('[data-lore-id]')
      ) {
        setPopover(null)
      }
    }

    container.addEventListener('mouseover', handleMouseover)
    container.addEventListener('mouseout', handleMouseout)
    return () => {
      container.removeEventListener('mouseover', handleMouseover)
      container.removeEventListener('mouseout', handleMouseout)
    }
  }, [])

  // cleanup timers
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (detectTimer.current) clearTimeout(detectTimer.current)
    }
  }, [])

  if (!editor) return null

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800">
      {/* toolbar */}
      <div className="relative z-40 bg-white dark:bg-gray-800 flex items-center gap-0.5 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Gras"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italique"
        >
          <em>I</em>
        </ToolbarButton>

        <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {([1, 2, 3] as const).map((level) => (
          <ToolbarButton
            key={level}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level }).run()
            }
            active={editor.isActive('heading', { level })}
            title={`Titre H${level}`}
          >
            H{level}
          </ToolbarButton>
        ))}

        <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Liste à puces"
        >
          ≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Liste numérotée"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Citation"
        >
          ❝
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHardBreak().run()}
          title="Saut de ligne"
        >
          ↵
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-xs text-gray-400 dark:text-gray-500">Enregistrement…</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600 dark:text-green-400">✓ Enregistré</span>
          )}

          <span className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

          <button
            type="button"
            onClick={() => setAiEnabled((v) => !v)}
            title={aiEnabled ? 'Désactiver la surveillance IA' : 'Activer la surveillance IA'}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium transition-colors ${
              aiEnabled
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
            }`}
          >
            <span>{aiEnabled ? '✦' : '○'}</span>
            <span>Surveillance IA</span>
          </button>
        </div>
      </div>

      {/* editor area */}
      <div ref={editorContainerRef} className="relative flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
        <span className="absolute bottom-2 right-3 text-sm text-gray-400 dark:text-gray-500">
          {wordCount} mots
        </span>
      </div>

      {popover && <LorePopover state={popover} />}
    </div>
  )
}
