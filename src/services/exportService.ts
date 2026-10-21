/** Exportación local de copias rasterizadas con todas las protecciones aplicadas. */
import { jsPDF } from 'jspdf'
import type { Redaction, WatermarkConfig, ExportFormat, ExportOptions } from '../domain/documentTypes'
import { renderDocumentToCanvas } from './canvasRenderer'

const defaults: ExportOptions = { scalePercent: 100, layout: 'together' }

function filename(): string {
  const d = new Date()
  return `dni-protegido-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function checkSize(width: number, height: number) {
  if (width > 16384 || height > 16384 || width * height > 64_000_000) {
    throw new Error('El tamaño de salida es demasiado grande. Reduce el porcentaje o exporta las caras por separado.')
  }
}

function renderPages(
  sources: HTMLCanvasElement[], redactions: Map<number, Redaction[]>,
  watermark: WatermarkConfig, grayscale: boolean, options: ExportOptions,
): HTMLCanvasElement[] {
  if (!Number.isFinite(options.scalePercent) || options.scalePercent < 10 || options.scalePercent > 300) {
    throw new Error('El tamaño debe estar entre el 10 % y el 300 %.')
  }
  const scale = options.scalePercent / 100
  const sizes = sources.map((source) => ({
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  }))
  sizes.forEach(({ width, height }) => checkSize(width, height))
  if (options.layout === 'together') {
    checkSize(Math.max(0, ...sizes.map((s) => s.width)), sizes.reduce((sum, s) => sum + s.height, 0))
  }
  const pages = sources.map((source, index) => {
    const protectedCanvas = document.createElement('canvas')
    renderDocumentToCanvas(protectedCanvas, source, {
      redactions: redactions.get(index) ?? [], watermarkConfig: watermark, grayscale, zoom: 1,
    })
    // Redimensionar después de aplicar las protecciones conserva también la escala de la marca de agua.
    const output = document.createElement('canvas')
    output.width = sizes[index].width
    output.height = sizes[index].height
    const ctx = output.getContext('2d')
    if (!ctx) throw new Error('No se pudo crear la imagen de salida.')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, output.width, output.height)
    ctx.drawImage(protectedCanvas, 0, 0, output.width, output.height)
    return output
  })
  if (options.layout === 'separate' || pages.length <= 1) return pages
  const combined = document.createElement('canvas')
  combined.width = Math.max(...pages.map((page) => page.width))
  combined.height = pages.reduce((sum, page) => sum + page.height, 0)
  const ctx = combined.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear la imagen conjunta.')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, combined.width, combined.height)
  let y = 0
  for (const page of pages) {
    ctx.drawImage(page, Math.round((combined.width - page.width) / 2), y)
    y += page.height
  }
  return [combined]
}

export async function exportAsPdf(
  pageCanvases: HTMLCanvasElement[], redactionsPerPage: Map<number, Redaction[]>,
  watermarkConfig: WatermarkConfig, grayscale: boolean, options: ExportOptions = defaults,
): Promise<void> {
  if (!pageCanvases.length) return
  const pages = renderPages(pageCanvases, redactionsPerPage, watermarkConfig, grayscale, options)
  const first = pages[0]
  const pdf = new jsPDF({
    orientation: first.width >= first.height ? 'l' : 'p', unit: 'px',
    format: [first.width, first.height], hotfixes: ['px_scaling'],
  })
  pages.forEach((page, index) => {
    if (index > 0) pdf.addPage([page.width, page.height], page.width >= page.height ? 'l' : 'p')
    pdf.addImage(page.toDataURL('image/png'), 'PNG', 0, 0, page.width, page.height)
  })
  pdf.save(`${filename()}.pdf`)
}

async function downloadImage(canvas: HTMLCanvasElement, format: 'png' | 'jpg', suffix = ''): Promise<void> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('No se pudo generar la imagen. Reduce el porcentaje e inténtalo de nuevo.'))
    }, format === 'png' ? 'image/png' : 'image/jpeg', format === 'jpg' ? 0.92 : undefined)
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename()}${suffix}.${format}`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function exportAsImage(
  sourceCanvas: HTMLCanvasElement, redactions: Redaction[], watermarkConfig: WatermarkConfig,
  grayscale: boolean, format: 'png' | 'jpg', options: ExportOptions = defaults,
): Promise<void> {
  const [page] = renderPages([sourceCanvas], new Map([[0, redactions]]), watermarkConfig, grayscale, options)
  await downloadImage(page, format)
}

export async function exportDocument(
  format: ExportFormat, pageCanvases: HTMLCanvasElement[], _currentPage: number,
  redactionsPerPage: Map<number, Redaction[]>, watermarkConfig: WatermarkConfig,
  grayscale: boolean, options: ExportOptions = defaults,
): Promise<void> {
  if (!pageCanvases.length) return
  if (format === 'pdf') {
    await exportAsPdf(pageCanvases, redactionsPerPage, watermarkConfig, grayscale, options)
  } else {
    const pages = renderPages(pageCanvases, redactionsPerPage, watermarkConfig, grayscale, options)
    for (const [index, page] of pages.entries()) {
      await downloadImage(page, format, pages.length > 1 ? `-cara-${index + 1}` : '')
    }
  }
}
