/**
 * Servicio OCR para detectar zonas sensibles en DNI/NIE españoles.
 * Usa Tesseract.js para reconocimiento de texto en el canvas del documento.
 *
 * NOTA: El primer uso descarga el modelo de idioma español (~4 MB) desde la CDN
 * de Tesseract. El procesamiento posterior es 100% local en el navegador.
 */
import { createWorker } from 'tesseract.js'
import type { OcrSuggestion } from '../domain/documentTypes'

// Patrón DNI español: 8 dígitos + letra de control
const RE_DNI = /\b\d{8}[A-Z]\b/i
// Patrón NIE español: X/Y/Z + 7 dígitos + letra de control
const RE_NIE = /\b[XYZ]\d{7}[A-Z]\b/i
// Fechas: DD/MM/AAAA, DD-MM-AAAA, DD.MM.AAAA, DD MM AAAA o con mes en texto (ENE, FEB…)
const RE_DATE =
  /\b\d{1,2}[\s./\-]\d{1,2}[\s./\-]\d{2,4}\b|\b\d{2}\s+(?:ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+\d{4}\b/i
// CAN: exactamente 6 dígitos (código de acceso de la tarjeta)
const RE_CAN = /^\d{6}$/
// Línea MRZ: 20+ caracteres de A-Z, 0-9 y < (fuente OCR-B)
const RE_MRZ = /^[A-Z0-9<]{20,}$/

let _idSeq = 0
const nextId = () => `ocr-${++_idSeq}`

/** Añade padding a una bbox para no cortar el texto */
function pad(x: number, y: number, w: number, h: number, px = 6, py = 4) {
  return {
    x: Math.max(0, x - px),
    y: Math.max(0, y - py),
    width: w + px * 2,
    height: h + py * 2,
  }
}

/**
 * Ejecuta OCR sobre el canvas y devuelve sugerencias de zonas sensibles.
 * @param canvas  Canvas fuente del documento (coordenadas 1:1 con Redaction)
 * @param onProgress  Callback con progreso de 0 a 1
 */
export async function detectSensitiveZones(
  canvas: HTMLCanvasElement,
  onProgress?: (progress: number) => void,
): Promise<OcrSuggestion[]> {
  onProgress?.(0.02)

  const worker = await createWorker('spa', 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'loading language traineddata') {
        onProgress?.(0.05 + m.progress * 0.1)
      } else if (m.status === 'initializing api') {
        onProgress?.(0.18)
      } else if (m.status === 'recognizing text') {
        onProgress?.(0.22 + m.progress * 0.7)
      }
    },
  })

  try {
    const { data } = await worker.recognize(canvas)
    onProgress?.(0.95)

    const suggestions: OcrSuggestion[] = []
    const canvasH = canvas.height
    const canvasW = canvas.width

    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs ?? []) {
        for (const line of para.lines ?? []) {
          const rawLine = line.text.replace(/\s+/g, '').toUpperCase()

          // ── Zona MRZ ────────────────────────────────────────────────────
          // Líneas en el 35% inferior que sólo contienen caracteres MRZ
          if (
            RE_MRZ.test(rawLine) &&
            rawLine.length >= 20 &&
            line.bbox.y0 > canvasH * 0.55
          ) {
            const b = line.bbox
            suggestions.push({
              id: nextId(),
              label: 'Zona MRZ',
              ...pad(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 8, 4),
            })
            // No analizar palabras dentro de líneas MRZ
            continue
          }

          // ── Número DNI/NIE ───────────────────────────────────────────────
          for (const word of line.words ?? []) {
            const text = word.text.trim()
            if (text.length < 3) continue
            const { x0, y0, x1, y1 } = word.bbox

            if (RE_DNI.test(text) || RE_NIE.test(text)) {
              suggestions.push({
                id: nextId(),
                label: 'Número DNI/NIE',
                ...pad(x0, y0, x1 - x0, y1 - y0),
              })
            }
          }

          // ── Fechas ───────────────────────────────────────────────────────
          // Se detectan a nivel de línea (la fecha puede ocupar varias palabras)
          if (RE_DATE.test(line.text)) {
            const b = line.bbox
            const alreadyCovered = suggestions.some(
              (s) => s.label === 'Fecha' && Math.abs(s.y - b.y0) < 20,
            )
            if (!alreadyCovered) {
              suggestions.push({
                id: nextId(),
                label: 'Fecha',
                ...pad(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0),
              })
            }
          }
        }
      }
    }

    // ── CAN ───────────────────────────────────────────────────────────────
    // El CAN es un número de 6 dígitos en la zona inferior-derecha del DNI
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs ?? []) {
        for (const line of para.lines ?? []) {
          for (const word of line.words ?? []) {
            const text = word.text.trim()
            if (
              RE_CAN.test(text) &&
              word.bbox.y0 > canvasH * 0.45 &&
              word.bbox.x0 > canvasW * 0.35
            ) {
              const { x0, y0, x1, y1 } = word.bbox
              const duplicate = suggestions.some(
                (s) => Math.abs(s.x - x0) < 30 && Math.abs(s.y - y0) < 20,
              )
              if (!duplicate) {
                suggestions.push({
                  id: nextId(),
                  label: 'CAN (posible)',
                  ...pad(x0, y0, x1 - x0, y1 - y0),
                })
              }
            }
          }
        }
      }
    }

    onProgress?.(1)
    return suggestions
  } finally {
    await worker.terminate()
  }
}
