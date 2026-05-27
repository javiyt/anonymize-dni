/**
 * Renderiza un PDF a un array de HTMLCanvasElement (una por página)
 * usando pdf.js. Todo el procesamiento es local — no hay llamadas de red.
 */
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'

// Configurar el worker local (Vite resuelve la URL en tiempo de compilación)
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

const RENDER_SCALE = 2 // Factor de calidad para el canvas (equivale a retina @2x)

export interface PdfRenderResult {
  canvases: HTMLCanvasElement[]
  totalPages: number
}

/**
 * Carga un archivo PDF desde un ArrayBuffer y renderiza cada página.
 * @param data  Contenido del archivo en ArrayBuffer
 * @param onProgress  Callback de progreso opcional (página actual, total)
 */
export async function renderPdfToCanvases(
  data: ArrayBuffer,
  onProgress?: (current: number, total: number) => void,
): Promise<PdfRenderResult> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) })
  const pdf: PDFDocumentProxy = await loadingTask.promise
  const totalPages = pdf.numPages
  const canvases: HTMLCanvasElement[] = []

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: RENDER_SCALE })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height

    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, canvas, viewport }).promise

    canvases.push(canvas)
    onProgress?.(pageNum, totalPages)
  }

  return { canvases, totalPages }
}
