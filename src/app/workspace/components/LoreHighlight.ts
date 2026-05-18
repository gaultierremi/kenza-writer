import { Mark, mergeAttributes } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import type { LoreMatch } from '@/types/workspace'

export const LoreHighlight = Mark.create({
  name: 'loreHighlight',

  addAttributes() {
    return {
      loreId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-lore-id'),
        renderHTML: (attrs: Record<string, string>) => ({
          'data-lore-id': attrs['loreId'],
        }),
      },
      loreName: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-lore-name'),
        renderHTML: (attrs: Record<string, string>) => ({
          'data-lore-name': attrs['loreName'],
        }),
      },
      loreType: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-lore-type'),
        renderHTML: (attrs: Record<string, string>) => ({
          'data-lore-type': attrs['loreType'],
        }),
      },
      loreDescription: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-lore-description'),
        renderHTML: (attrs: Record<string, string>) => ({
          'data-lore-description': attrs['loreDescription'],
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-lore-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { class: 'lore-highlight' }),
      0,
    ]
  },
})

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function applyLoreHighlights(
  editor: Editor,
  matches: LoreMatch[],
  rangeFrom: number,
  rangeTo: number
): void {
  const { state } = editor
  const tr = state.tr
  const loreMarkType = state.schema.marks['loreHighlight']

  if (!loreMarkType) return

  tr.removeMark(rangeFrom, rangeTo, loreMarkType)

  for (const match of matches) {
    const regex = new RegExp(
      `(?<![\\wÀ-ÿ])${escapeRegex(match.name)}(?![\\wÀ-ÿ])`,
      'gi'
    )

    state.doc.nodesBetween(rangeFrom, rangeTo, (node, pos) => {
      if (!node.isText || !node.text) return
      let m
      while ((m = regex.exec(node.text)) !== null) {
        const from = pos + m.index
        const to = from + m[0].length
        if (from >= rangeFrom && to <= rangeTo) {
          tr.addMark(
            from,
            to,
            loreMarkType.create({
              loreId: match.id,
              loreName: match.name,
              loreType: match.type,
              loreDescription: match.description,
            })
          )
        }
      }
    })
  }

  tr.setMeta('addToHistory', false)
  tr.setMeta('loreHighlightUpdate', true)
  editor.view.dispatch(tr)
}
