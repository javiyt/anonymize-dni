import { useCallback, useState } from 'react'
import type { Redaction, RedactionType } from '../domain/documentTypes'
import { createRedaction, removeRedaction } from '../domain/redaction'

interface PageHistory {
  snapshots: Redaction[][]
  index: number
}
const emptyHistory: PageHistory = { snapshots: [[]], index: 0 }

/** Cada cara conserva sus ocultaciones y su historial de deshacer/rehacer. */
export function useRedactions(page = 0) {
  const [pages, setPages] = useState<Record<number, PageHistory>>({})
  const current = pages[page] ?? emptyHistory
  const redactions = current.snapshots[current.index]

  const commit = useCallback((update: (previous: Redaction[]) => Redaction[]) => {
    setPages((previous) => {
      const history = previous[page] ?? emptyHistory
      return {
        ...previous,
        [page]: {
          snapshots: [...history.snapshots.slice(0, history.index + 1), update(history.snapshots[history.index])],
          index: history.index + 1,
        },
      }
    })
  }, [page])

  const addRedaction = useCallback((type: RedactionType, x: number, y: number, w: number, h: number) => {
    const redaction = createRedaction(type, x, y, w, h)
    commit((previous) => [...previous, redaction])
  }, [commit])
  const deleteRedaction = useCallback((id: string) => {
    commit((previous) => removeRedaction(previous, id))
  }, [commit])
  const moveHistory = useCallback((offset: number) => {
    setPages((previous) => {
      const history = previous[page] ?? emptyHistory
      return { ...previous, [page]: { ...history, index: Math.max(0, Math.min(history.snapshots.length - 1, history.index + offset)) } }
    })
  }, [page])
  const clearAll = useCallback(() => {
    setPages((previous) => ({ ...previous, [page]: emptyHistory }))
  }, [page])
  const reset = useCallback(() => setPages({}), [])

  return {
    redactions,
    redactionsPerPage: new Map(Object.entries(pages).map(([key, history]) => [Number(key), history.snapshots[history.index]])),
    canUndo: current.index > 0,
    canRedo: current.index < current.snapshots.length - 1,
    addRedaction,
    deleteRedaction,
    undo: () => moveHistory(-1),
    redo: () => moveHistory(1),
    clearAll,
    reset,
  }
}
