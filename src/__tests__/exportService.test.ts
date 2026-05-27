import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportAsPdf, exportAsImage } from '../services/exportService'

// canvasRenderer necesita un contexto 2D real; lo moqueamos completamente
vi.mock('../services/canvasRenderer', () => ({
  renderDocumentToCanvas: vi.fn(),
}))

// jsPDF no funciona en jsdom (canvas.toDataURL devuelve cadena vacía);
// lo moqueamos para que el test solo verifique que no hay llamadas de red
vi.mock('jspdf', () => {
  class jsPDF {
    addImage = vi.fn()
    addPage = vi.fn()
    save = vi.fn()
    internal = { pageSize: { getWidth: () => 595, getHeight: () => 842 } }
  }
  return { jsPDF }
})

describe('exportService — sin llamadas de red', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  let xhrOpenSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
    xhrOpenSpy = vi.spyOn(XMLHttpRequest.prototype, 'open')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function makeCanvas(w = 200, h = 300): HTMLCanvasElement {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    // jsdom no implementa canvas 2D completo; moqueamos los métodos que usan los servicios
    c.getContext = () => null as unknown as CanvasRenderingContext2D
    c.toDataURL = () => 'data:image/jpeg;base64,/9j/fakedata'
    c.toBlob = (callback: BlobCallback) => {
      callback(new Blob(['fake'], { type: 'image/png' }))
    }
    return c
  }

  const watermarkConfig = {
    enabled: false,
    text: '',
    purpose: '',
    recipient: '',
    date: '27/05/2026',
    opacity: 0.3,
    fontSize: 20,
    angle: -30,
    repeat: true,
    color: '#cc0000',
  }

  it('exportAsPdf no llama a fetch ni XMLHttpRequest', async () => {
    const canvas = makeCanvas()
    const map = new Map([[0, []]])

    // jsPDF.save() genera descarga local — espiamos para no abrir un dialogo real
    const linkSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await exportAsPdf([canvas], map, watermarkConfig, false)

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(xhrOpenSpy).not.toHaveBeenCalled()

    linkSpy.mockRestore()
  })

  it('exportAsImage (png) no llama a fetch ni XMLHttpRequest', async () => {
    const canvas = makeCanvas()
    const linkSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const createObjSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    const revokeObjSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    await exportAsImage(canvas, [], watermarkConfig, false, 'png')

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(xhrOpenSpy).not.toHaveBeenCalled()

    linkSpy.mockRestore()
    createObjSpy.mockRestore()
    revokeObjSpy.mockRestore()
  })

  it('exportAsImage (jpg) no llama a fetch ni XMLHttpRequest', async () => {
    const canvas = makeCanvas()
    const linkSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const createObjSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    const revokeObjSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    await exportAsImage(canvas, [], watermarkConfig, false, 'jpg')

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(xhrOpenSpy).not.toHaveBeenCalled()

    linkSpy.mockRestore()
    createObjSpy.mockRestore()
    revokeObjSpy.mockRestore()
  })
})
