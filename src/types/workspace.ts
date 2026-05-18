export interface Character {
  id: string
  project_id: string
  name: string
  age: string | null
  physical_description: string | null
  personality_traits: string | null
  relations: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type LoreType = 'lieu' | 'faction' | 'objet' | 'concept'

export interface LoreEntry {
  id: string
  project_id: string
  name: string
  type: LoreType
  description: string | null
  character_links: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LoreMatch {
  id: string
  name: string
  type: 'character' | 'lore'
  description: string
}

export interface LoreDetectResponse {
  matches: LoreMatch[]
}
