'use client'

import { useEffect, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import CharacterPanel from './components/CharacterPanel'
import LorePanel from './components/LorePanel'
import EditorPanel from './components/EditorPanel'

interface Props {
  projectId: string
}

type Drawer = 'characters' | 'lore' | null

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function update() {
      setIsMobile(window.innerWidth < 768)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return isMobile
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

// ─── mobile layout ───────────────────────────────────────────────────────────

function MobileLayout({ projectId }: Props) {
  const [drawer, setDrawer] = useState<Drawer>(null)

  function openDrawer(d: Exclude<Drawer, null>) {
    setDrawer(d)
  }

  function closeDrawer() {
    setDrawer(null)
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* Editor fullscreen */}
      <div className="h-full">
        <EditorPanel projectId={projectId} />
      </div>

      {/* Floating buttons — top-left, mobile only */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-30">
        <button
          onClick={() => openDrawer('characters')}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg shadow-md hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          👤 Personnages
        </button>
        <button
          onClick={() => openDrawer('lore')}
          className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg shadow-md hover:bg-purple-700 active:bg-purple-800 transition-colors"
        >
          📖 Lore
        </button>
      </div>

      {/* Semi-transparent overlay — closes drawer on tap outside */}
      {drawer !== null && (
        <div
          className="absolute inset-0 z-40 bg-black/40"
          onClick={closeDrawer}
        />
      )}

      {/* Characters drawer — slides from left */}
      <div
        className={`absolute inset-y-0 left-0 w-72 z-50 shadow-xl transition-transform duration-300 ease-in-out ${
          drawer === 'characters' ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-gray-200 shrink-0">
            <span className="text-sm font-semibold text-blue-800">Personnages</span>
            <button
              onClick={closeDrawer}
              className="text-gray-500 hover:text-gray-700 p-1 rounded transition-colors"
              aria-label="Fermer le panneau personnages"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CharacterPanel projectId={projectId} />
          </div>
        </div>
      </div>

      {/* Lore drawer — slides from left */}
      <div
        className={`absolute inset-y-0 left-0 w-72 z-50 shadow-xl transition-transform duration-300 ease-in-out ${
          drawer === 'lore' ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-3 py-2 bg-purple-50 border-b border-gray-200 shrink-0">
            <span className="text-sm font-semibold text-purple-800">Lore</span>
            <button
              onClick={closeDrawer}
              className="text-gray-500 hover:text-gray-700 p-1 rounded transition-colors"
              aria-label="Fermer le panneau lore"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <LorePanel projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── root ────────────────────────────────────────────────────────────────────

export default function WorkspaceClient({ projectId }: Props) {
  const isMobile = useIsMobile()

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
        {isMobile ? (
          <MobileLayout projectId={projectId} />
        ) : (
          <DesktopLayout projectId={projectId} />
        )}
      </div>
    </div>
  )
}
