import { useCallback, useState } from 'react'
import type { Redaction, RedactionType } from '../domain/documentTypes'
import { createRedaction, removeRedaction } from '../domain/redaction'

interface UseRedactionsReturn {
  redactions: Redaction[]
  canUndo: boolean
  canRedo: boolean
  addRedaction: (type: RedactionType, x: number, y: number, w: number, h: number) => void
  deleteRedaction: (id: string) => void
  undo: () => void
  redo: () => void
  clearAll: () => void
}

/**
 * Gestiona la lista de ocultaciones con historial de deshacer/rehacer.
 */
export function useRedactions(): UseRedactionsReturn {
  // Historial: array de snapshots de la lista
  const [history, setHistory] = useState<Redaction[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)

  const redactions = history[historyIndex]

  const _commit = useCallback(
    (next: Redaction[]) => {
      setHistory((prev) => {
        const truncated = prev.slice(0, historyIndex + 1)
        return [...truncated, next]
      })
      setHistoryIndex((i) => i + 1)
    },
    [historyIndex],
  )

  const addRedaction = useCallback(
    (type: RedactionType, x: number, y: number, w: number, h: number) => {
      const r = createRedaction(type, x, y, w, h)
      _commit([...redactions, r])
    },
    [redactions, _commit],
  )

  const deleteRedaction = useCallback(
    (id: string) => {
      _commit(removeRedaction(redactions, id))
    },
    [redactions, _commit],
  )

  const undo = useCallback(() => {
    setHistoryIndex((i) => Math.max(0, i - 1))
  }, [])

  const redo = useCallback(() => {
    setHistoryIndex((i) => Math.min(history.length - 1, i + 1))
  }, [history.length])

  const clearAll = useCallback(() => {
    setHistory([[]])
    setHistoryIndex(0)
  }, [])

  return {
    redactions,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    addRedaction,
    deleteRedaction,
    undo,
    redo,
    clearAll,
  }
}
