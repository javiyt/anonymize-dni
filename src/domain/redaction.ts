import type { Redaction, RedactionType } from './documentTypes'

let _idCounter = 0

export function generateRedactionId(): string {
  return `r-${++_idCounter}-${Date.now()}`
}

export function createRedaction(
  type: RedactionType,
  x: number,
  y: number,
  width: number,
  height: number,
): Redaction {
  return { id: generateRedactionId(), type, x, y, width, height }
}

export function addRedaction(list: Redaction[], redaction: Redaction): Redaction[] {
  return [...list, redaction]
}

export function removeRedaction(list: Redaction[], id: string): Redaction[] {
  return list.filter((r) => r.id !== id)
}

export function clearRedactions(): Redaction[] {
  return []
}
