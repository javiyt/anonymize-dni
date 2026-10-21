import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportAsPdf, exportAsImage, exportDocument } from '../services/exportService'
import { renderDocumentToCanvas } from '../services/canvasRenderer'
import { defaultWatermarkConfig } from '../domain/watermark'
import type { Redaction } from '../domain/documentTypes'

vi.mock('../services/canvasRenderer', () => ({
  renderDocumentToCanvas: vi.fn((target: HTMLCanvasElement, source: HTMLCanvasElement) => {
    target.width = source.width
    target.height = source.height
  }),
}))
const pdf = vi.hoisted(() => ({ addImage: vi.fn(), addPage: vi.fn(), save: vi.fn(), options: vi.fn() }))
vi.mock('jspdf', () => ({
  jsPDF: class {
    constructor(options: unknown) { pdf.options(options) }
    addImage = pdf.addImage
    addPage = pdf.addPage
    save = pdf.save
  },
}))

const drawImage = vi.fn()
const downloads: string[] = []
const watermark = { ...defaultWatermarkConfig, enabled: false }
function canvas(width = 200, height = 100) {
  const result = document.createElement('canvas')
  result.width = width
  result.height = height
  return result
}

beforeEach(() => {
  vi.clearAllMocks()
  downloads.length = 0
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage, fillRect: vi.fn() } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,fake')
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, type) {
    callback(new Blob(['fake'], { type }))
  })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { downloads.push(this.download) })
})
afterEach(() => vi.restoreAllMocks())

describe('exportación de ambas caras', () => {
  it('combina caras de tamaños distintos en una página PDF al 50 % y aplica sus ocultaciones', async () => {
    const redaction: Redaction = { id: 'front', type: 'black', x: 5, y: 5, width: 20, height: 10 }
    const back = { ...redaction, id: 'back', x: 40 }
    const sources = [canvas(), canvas(100, 200)]
    await exportAsPdf(sources, new Map([[0, [redaction]], [1, [back]]]), watermark, true, { scalePercent: 50, layout: 'together' })
    expect(renderDocumentToCanvas).toHaveBeenNthCalledWith(1, expect.any(HTMLCanvasElement), sources[0], {
      redactions: [redaction], watermarkConfig: watermark, grayscale: true, zoom: 1,
    })
    expect(renderDocumentToCanvas).toHaveBeenNthCalledWith(2, expect.any(HTMLCanvasElement), sources[1], {
      redactions: [back], watermarkConfig: watermark, grayscale: true, zoom: 1,
    })
    expect(pdf.options).toHaveBeenCalledWith(expect.objectContaining({ format: [100, 150], orientation: 'p' }))
    expect(pdf.addImage).toHaveBeenCalledWith(expect.any(String), 'PNG', 0, 0, 100, 150)
    expect(pdf.addPage).not.toHaveBeenCalled()
    expect(drawImage).toHaveBeenLastCalledWith(expect.any(HTMLCanvasElement), 25, 50)
    expect(pdf.save).toHaveBeenCalledOnce()
  })

  it('exporta páginas separadas con sus dimensiones y orientación al 200 %', async () => {
    await exportAsPdf([canvas(), canvas(100, 300)], new Map(), watermark, false, { scalePercent: 200, layout: 'separate' })
    expect(pdf.options).toHaveBeenCalledWith(expect.objectContaining({ format: [400, 200], orientation: 'l' }))
    expect(pdf.addPage).toHaveBeenCalledWith([200, 600], 'p')
    expect(pdf.addImage).toHaveBeenCalledTimes(2)
  })

  it.each(['png', 'jpg'] as const)('descarga ambas caras juntas en un único %s', async (format) => {
    await exportDocument(format, [canvas(), canvas()], 1, new Map(), watermark, false, { scalePercent: 100, layout: 'together' })
    expect(downloads).toHaveLength(1)
    expect(downloads[0]).toMatch(new RegExp(`\\.${format}$`))
    expect(drawImage).toHaveBeenLastCalledWith(expect.objectContaining({ width: 200, height: 100 }), 0, 100)
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(expect.any(Function), format === 'png' ? 'image/png' : 'image/jpeg', format === 'jpg' ? 0.92 : undefined)
  })

  it('descarga imágenes separadas con nombres distintos', async () => {
    await exportDocument('png', [canvas(), canvas()], 0, new Map(), watermark, false, { scalePercent: 100, layout: 'separate' })
    expect(downloads).toHaveLength(2)
    expect(downloads[0]).toMatch(/-cara-1.png$/)
    expect(downloads[1]).toMatch(/-cara-2.png$/)
  })

  it('espera al blob y propaga errores de generación', async () => {
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((callback) => callback(null))
    await expect(exportAsImage(canvas(), [], watermark, false, 'jpg')).rejects.toThrow('No se pudo generar')
    expect(downloads).toHaveLength(0)
  })

  it.each([0, 301, NaN])('rechaza el porcentaje inválido %s', async (scalePercent) => {
    await expect(exportAsImage(canvas(), [], watermark, false, 'png', { scalePercent, layout: 'together' })).rejects.toThrow('entre el 10 % y el 300 %')
  })

  it('rechaza una composición excesiva antes de renderizar', async () => {
    await expect(exportAsPdf([canvas(10000, 4000), canvas(10000, 4000)], new Map(), watermark, false)).rejects.toThrow('demasiado grande')
    expect(renderDocumentToCanvas).not.toHaveBeenCalled()
  })

  it('no realiza llamadas de red al exportar', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'open')
    await exportAsPdf([canvas(), canvas()], new Map(), watermark, false)
    await exportAsImage(canvas(), [], watermark, false, 'png')
    await exportAsImage(canvas(), [], watermark, false, 'jpg')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(xhrSpy).not.toHaveBeenCalled()
  })
})
