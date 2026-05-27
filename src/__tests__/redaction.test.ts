import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRedactions } from '../hooks/useRedactions'
import { createRedaction, addRedaction, removeRedaction } from '../domain/redaction'

describe('domain/redaction', () => {
  it('createRedaction genera una redacción con id único', () => {
    const r1 = createRedaction('black', 10, 20, 100, 50)
    const r2 = createRedaction('pixel', 30, 40, 60, 80)
    expect(r1.id).not.toBe(r2.id)
    expect(r1.type).toBe('black')
    expect(r1.x).toBe(10)
    expect(r1.y).toBe(20)
    expect(r1.width).toBe(100)
    expect(r1.height).toBe(50)
  })

  it('addRedaction añade una redacción a la lista', () => {
    const r = createRedaction('blur', 5, 5, 50, 50)
    const result = addRedaction([], r)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(r)
  })

  it('removeRedaction elimina por id', () => {
    const r1 = createRedaction('black', 0, 0, 10, 10)
    const r2 = createRedaction('pixel', 0, 0, 10, 10)
    const list = [r1, r2]
    const result = removeRedaction(list, r1.id)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(r2.id)
  })
})

describe('useRedactions hook', () => {
  it('empieza con lista vacía', () => {
    const { result } = renderHook(() => useRedactions())
    expect(result.current.redactions).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('addRedaction añade y habilita undo', () => {
    const { result } = renderHook(() => useRedactions())
    act(() => {
      result.current.addRedaction('black', 10, 10, 100, 50)
    })
    expect(result.current.redactions).toHaveLength(1)
    expect(result.current.redactions[0].type).toBe('black')
    expect(result.current.canUndo).toBe(true)
  })

  it('undo deshace la última acción', () => {
    const { result } = renderHook(() => useRedactions())
    act(() => {
      result.current.addRedaction('black', 10, 10, 100, 50)
    })
    act(() => {
      result.current.undo()
    })
    expect(result.current.redactions).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)
  })

  it('redo rehace la acción deshecha', () => {
    const { result } = renderHook(() => useRedactions())
    act(() => {
      result.current.addRedaction('pixel', 5, 5, 50, 50)
    })
    act(() => {
      result.current.undo()
    })
    act(() => {
      result.current.redo()
    })
    expect(result.current.redactions).toHaveLength(1)
    expect(result.current.canRedo).toBe(false)
  })

  it('clearAll reinicia el historial', () => {
    const { result } = renderHook(() => useRedactions())
    act(() => {
      result.current.addRedaction('black', 0, 0, 10, 10)
      result.current.addRedaction('blur', 0, 0, 10, 10)
    })
    act(() => {
      result.current.clearAll()
    })
    expect(result.current.redactions).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
  })
})
