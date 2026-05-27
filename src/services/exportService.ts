/**
 * Servicio de exportación — genera PDF, PNG o JPG de forma 100% local.
 * No hay llamadas de red en ningún caso.
 */
import { jsPDF } from 'jspdf'
import type { Redaction, WatermarkConfig, ExportFormat } from '../domain/documentTypes'
import { renderDocumentToCanvas } from './canvasRenderer'

function _formatDateForFilename(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function _downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/**
 * Genera el canvas renderizado para una página (a resolución 1:1).
 */
function _buildRenderedCanvas(
  sourceCanvas: HTMLCanvasElement,
  redactions: Redaction[],
  watermarkConfig: WatermarkConfig,
  grayscale: boolean,
): HTMLCanvasElement {
  const out = document.createElement('canvas')
  renderDocumentToCanvas(out, sourceCanvas, { redactions, watermarkConfig, grayscale, zoom: 1 })
  return out
}

/** Exporta como PDF con jsPDF (una página por elemento de `pageCanvases`). */
export async function exportAsPdf(
  pageCanvases: HTMLCanvasElement[],
  redactionsPerPage: Map<number, Redaction[]>,
  watermarkConfig: WatermarkConfig,
  grayscale: boolean,
): Promise<void> {
  if (pageCanvases.length === 0) return

  const first = _buildRenderedCanvas(
    pageCanvases[0],
    redactionsPerPage.get(0) ?? [],
    watermarkConfig,
    grayscale,
  )

  const orientation = first.width >= first.height ? 'l' : 'p'
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [first.width, first.height],
    hotfixes: ['px_scaling'],
  })

  // Primera página
  const firstDataUrl = first.toDataURL('image/jpeg', 0.92)
  pdf.addImage(firstDataUrl, 'JPEG', 0, 0, first.width, first.height)

  // Páginas adicionales
  for (let i = 1; i < pageCanvases.length; i++) {
    const rendered = _buildRenderedCanvas(
      pageCanvases[i],
      redactionsPerPage.get(i) ?? [],
      watermarkConfig,
      grayscale,
    )
    pdf.addPage([rendered.width, rendered.height])
    const dataUrl = rendered.toDataURL('image/jpeg', 0.92)
    pdf.addImage(dataUrl, 'JPEG', 0, 0, rendered.width, rendered.height)
  }

  const filename = `dni-protegido-${_formatDateForFilename()}.pdf`
  pdf.save(filename)
}

/** Exporta la página actual como imagen (PNG o JPG). */
export async function exportAsImage(
  sourceCanvas: HTMLCanvasElement,
  redactions: Redaction[],
  watermarkConfig: WatermarkConfig,
  grayscale: boolean,
  format: 'png' | 'jpg',
): Promise<void> {
  const rendered = _buildRenderedCanvas(sourceCanvas, redactions, watermarkConfig, grayscale)
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
  const quality = format === 'jpg' ? 0.92 : undefined
  const filename = `dni-protegido-${_formatDateForFilename()}.${format}`

  rendered.toBlob(
    (blob) => {
      if (!blob) return
      _downloadBlob(blob, filename)
    },
    mimeType,
    quality,
  )
}

/** Punto de entrada unificado */
export async function exportDocument(
  format: ExportFormat,
  pageCanvases: HTMLCanvasElement[],
  currentPage: number,
  redactionsPerPage: Map<number, Redaction[]>,
  watermarkConfig: WatermarkConfig,
  grayscale: boolean,
): Promise<void> {
  if (format === 'pdf') {
    await exportAsPdf(pageCanvases, redactionsPerPage, watermarkConfig, grayscale)
  } else {
    const source = pageCanvases[currentPage]
    const redactions = redactionsPerPage.get(currentPage) ?? []
    await exportAsImage(source, redactions, watermarkConfig, grayscale, format)
  }
}
