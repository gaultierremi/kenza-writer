'use client'

import { useEffect, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import CharacterPanel from './components/CharacterPanel'
import LorePanel from './components/LorePanel'
import EditorPanel from './components/EditorPanel'

interface Props {
  projectId: string
}

type Layout = 'desktop' | 'tablet' | 'mobile'
type MobileTab = 'characters' | 'lore' | 'editor'
type SidebarPanel = 'characters' | 'lore' | null

function useLayout(): Layout {
  const [layout, setLayout] = useState<Layout>('desktop')

  useEffect(() => {
    function update() {
      const w = window.innerWidth
      if (w >= 1024) setLayout('desktop')
      else if (w >= 640) setLayout('tablet')
      else setLayout('mobile')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return layout
}

// ─── resize handle ───────────────────────────────────────────────────────────

function ResizeHandle() {
  return (
    <PanelResizeHandle className="group relative w-1.5 bg-gray-100 hover:bg-blue-200 transition-colors flex items-center justify-center">
      <div className="absolute w-0.5 h-8 bg-gray-300 group-hover:bg-blue-400 rounded-full transition-colors" />
    </PanelResizeHandle>
  )
}

// ─── desktop layout ──────────────────────────────────────────────────────────

function DesktopLayout({ projectId }: Props) {
  return (
    <PanelGroup direction="horizontal" autoSaveId={`workspace-${projectId}`}>
      <Panel defaultSize={22} minSize={14} className="overflow-hidden">
        <CharacterPanel projectId={projectId} />
      </Panel>
      <ResizeHandle />
      <Panel defaultSize={22} minSize={14} className="overflow-hidden">
        <LorePanel projectId={projectId} />
      </Panel>
      <ResizeHandle />
      <Panel defaultSize={56} minSize={30} className="overflow-hidden">
        <EditorPanel projectId={projectId} />
      </Panel>
    </PanelGroup>
  )
}

// ─── tablet layout ───────────────────────────────────────────────────────────

function TabletLayout({ projectId }: Props) {
  const [open, setOpen] = useState<SidebarPanel>(null)

  function toggle(panel: Exclude<SidebarPanel, null>) {
    setOpen((prev) => (prev === panel ? null : panel))
  }

  return (
    <div className="flex h-full relative overflow-hidden">
      {/* icon sidebar */}
      <div className="w-11 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-3 gap-2">
        <SidebarIconButton
          label="Personnages"
          active={open === 'characters'}
          onClick={() => toggle('characters')}
        >
          👤
        </SidebarIconButton>
        <SidebarIconButton
          label="Lore"
          active={open === 'lore'}
          onClick={() => toggle('lore')}
        >
          📖
        </SidebarIconButton>
      </div>

      {/* sliding overlay panel */}
      {open && (
        <>
          <div
            className="absolute inset-0 left-11 z-10 bg-black/20"
            onClick={() => setOpen(null)}
          />
          <div className="absolute top-0 bottom-0 left-11 w-72 z-20 shadow-xl">
            {open === 'characters' ? (
              <CharacterPanel projectId={projectId} />
            ) : (
              <LorePanel projectId={projectId} />
            )}
          </div>
        </>
      )}

      {/* editor */}
      <div className="flex-1 overflow-hidden">
        <EditorPanel projectId={projectId} />
      </div>
    </div>
  )
}

function SidebarIconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-colors ${
        active ? 'bg-blue-100 ring-1 ring-blue-300' : 'hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

// ─── mobile layout ───────────────────────────────────────────────────────────

function MobileLayout({ projectId }: Props) {
  const [tab, setTab] = useState<MobileTab>('editor')

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {tab === 'characters' && <CharacterPanel projectId={projectId} />}
        {tab === 'lore' && <LorePanel projectId={projectId} />}
        {tab === 'editor' && <EditorPanel projectId={projectId} />}
      </div>

      <nav className="flex border-t border-gray-200 bg-white">
        {(
          [
            { id: 'characters', label: 'Persos', icon: '👤' },
            { id: 'editor', label: 'Éditeur', icon: '✏️' },
            { id: 'lore', label: 'Lore', icon: '📖' },
          ] as { id: MobileTab; label: string; icon: string }[]
        ).map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              tab === id
                ? 'text-blue-600 border-t-2 border-blue-600 -mt-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── root ────────────────────────────────────────────────────────────────────

export default function WorkspaceClient({ projectId }: Props) {
  const layout = useLayout()

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-sm">Kenza Writer</span>
          <span className="text-gray-300 text-xs">|</span>
          <span className="text-gray-500 text-xs truncate max-w-[160px]">
            Projet : {projectId}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {layout === 'desktop' && <DesktopLayout projectId={projectId} />}
        {layout === 'tablet' && <TabletLayout projectId={projectId} />}
        {layout === 'mobile' && <MobileLayout projectId={projectId} />}
      </div>
    </div>
  )
}
