import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRedactions } from '../hooks/useRedactions'

describe('ocultaciones por cara', () => {
  it('conserva los cambios y el historial independiente al navegar', () => {
    const { result, rerender } = renderHook(({ page }) => useRedactions(page), { initialProps: { page: 0 } })
    act(() => result.current.addRedaction('black', 1, 2, 30, 40))
    const front = result.current.redactions
    rerender({ page: 1 })
    expect(result.current.redactions).toEqual([])
    act(() => result.current.addRedaction('black', 10, 20, 30, 40))
    act(() => result.current.undo())
    expect(result.current.redactions).toEqual([])
    rerender({ page: 0 })
    expect(result.current.redactions).toEqual(front)
    expect(result.current.canRedo).toBe(false)
    rerender({ page: 1 })
    act(() => result.current.redo())
    expect(result.current.redactions[0].x).toBe(10)
    expect(result.current.redactionsPerPage.get(0)).toEqual(front)
    act(() => result.current.clearAll())
    expect(result.current.redactions).toEqual([])
    expect(result.current.redactionsPerPage.get(0)).toEqual(front)
    act(() => result.current.reset())
    expect(result.current.redactionsPerPage.size).toBe(0)
  })

  it('conserva todas las sugerencias OCR añadidas en el mismo evento', () => {
    const { result } = renderHook(() => useRedactions())
    act(() => {
      result.current.addRedaction('black', 1, 1, 10, 10)
      result.current.addRedaction('black', 20, 20, 10, 10)
    })
    expect(result.current.redactions).toHaveLength(2)
  })
})
