import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { LoreMatch } from '@/types/workspace'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface RequestBody {
  text: string
  projectId: string
}

interface EntityEntry {
  id: string
  name: string
  type: 'character' | 'lore'
  description: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as RequestBody
  const { text, projectId } = body

  if (!text?.trim() || !projectId) {
    return NextResponse.json({ matches: [] })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  const [{ data: characters }, { data: loreEntries }] = await Promise.all([
    supabase
      .from('characters')
      .select('id, name')
      .eq('project_id', projectId),
    supabase
      .from('lore_entries')
      .select('id, name, description')
      .eq('project_id', projectId),
  ])

  const entities: EntityEntry[] = [
    ...(characters ?? []).map((c: { id: string; name: string }) => ({
      id: c.id,
      name: c.name,
      type: 'character' as const,
      description: '',
    })),
    ...(loreEntries ?? []).map(
      (l: { id: string; name: string; description: string | null }) => ({
        id: l.id,
        name: l.name,
        type: 'lore' as const,
        description: l.description ?? '',
      })
    ),
  ]

  if (entities.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  const entityNames = entities.map((e) => e.name).join(', ')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `You are a fiction writing assistant. Identify which of these named entities appear in the text (case-insensitive).

Text: "${text}"

Entities to match: ${entityNames}

Return ONLY a JSON array of matched entity names. Example: ["Aldric", "Sylvana"]. Return [] if none match.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') return NextResponse.json({ matches: [] })

    let matchedNames: string[] = []
    try {
      matchedNames = JSON.parse(content.text) as string[]
    } catch {
      return NextResponse.json({ matches: [] })
    }

    const matches: LoreMatch[] = matchedNames
      .map((name) =>
        entities.find((e) => e.name.toLowerCase() === name.toLowerCase())
      )
      .filter((e): e is EntityEntry => e !== undefined)

    return NextResponse.json({ matches })
  } catch {
    return NextResponse.json({ matches: [] })
  }
}
