/**
 * Motor de renderizado de canvas.
 * Aplica escala de grises, ocultaciones y marca de agua sobre una copia del documento.
 * No hay llamadas de red.
 */
import type { Redaction, WatermarkConfig } from '../domain/documentTypes'
import { composeWatermarkText } from '../domain/watermark'

export interface RenderOptions {
  redactions: Redaction[]
  watermarkConfig: WatermarkConfig
  grayscale: boolean
  /** Factor de escala respecto al canvas fuente (1 = resolución original) */
  zoom?: number
}

/**
 * Renderiza el documento con todas las capas sobre `targetCanvas`.
 */
export function renderDocumentToCanvas(
  targetCanvas: HTMLCanvasElement,
  sourceCanvas: HTMLCanvasElement,
  options: RenderOptions,
): void {
  const { redactions, watermarkConfig, grayscale, zoom = 1 } = options

  const dW = Math.round(sourceCanvas.width * zoom)
  const dH = Math.round(sourceCanvas.height * zoom)

  targetCanvas.width = dW
  targetCanvas.height = dH

  const ctx = targetCanvas.getContext('2d')!

  // 1. Dibujar imagen base (con escala de grises si procede)
  if (grayscale) {
    ctx.filter = 'grayscale(100%)'
  }
  ctx.drawImage(sourceCanvas, 0, 0, dW, dH)
  ctx.filter = 'none'

  // 2. Aplicar ocultaciones
  for (const r of redactions) {
    const rx = Math.round(r.x * zoom)
    const ry = Math.round(r.y * zoom)
    const rw = Math.round(r.width * zoom)
    const rh = Math.round(r.height * zoom)
    if (rw <= 0 || rh <= 0) continue

    switch (r.type) {
      case 'black':
        ctx.fillStyle = '#000000'
        ctx.fillRect(rx, ry, rw, rh)
        break
      case 'pixel':
        _pixelateRegion(ctx, rx, ry, rw, rh, Math.max(6, Math.round(14 * zoom)))
        break
      case 'blur':
        _blurRegion(ctx, rx, ry, rw, rh, Math.round(12 * zoom))
        break
    }
  }

  // 3. Aplicar marca de agua
  if (watermarkConfig.enabled) {
    _drawWatermark(ctx, dW, dH, watermarkConfig)
  }
}

// ─── helpers internos ───────────────────────────────────────────────────────

function _pixelateRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  blockSize: number,
): void {
  const imageData = ctx.getImageData(x, y, w, h)
  const data = imageData.data

  for (let by = 0; by < h; by += blockSize) {
    for (let bx = 0; bx < w; bx += blockSize) {
      const bW = Math.min(blockSize, w - bx)
      const bH = Math.min(blockSize, h - by)
      let r = 0, g = 0, b = 0, a = 0, count = 0
      for (let py = by; py < by + bH; py++) {
        for (let px = bx; px < bx + bW; px++) {
          const i = (py * w + px) * 4
          r += data[i]; g += data[i + 1]; b += data[i + 2]; a += data[i + 3]
          count++
        }
      }
      r = Math.round(r / count); g = Math.round(g / count)
      b = Math.round(b / count); a = Math.round(a / count)
      for (let py = by; py < by + bH; py++) {
        for (let px = bx; px < bx + bW; px++) {
          const i = (py * w + px) * 4
          data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a
        }
      }
    }
  }
  ctx.putImageData(imageData, x, y)
}

function _blurRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  if (w <= 0 || h <= 0) return
  const off = document.createElement('canvas')
  off.width = w
  off.height = h
  const offCtx = off.getContext('2d')!
  offCtx.filter = `blur(${radius}px)`
  offCtx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h)
  offCtx.filter = 'none'
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(off, 0, 0, w, h, x, y, w, h)
  ctx.restore()
}

function _drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: WatermarkConfig,
): void {
  const text = composeWatermarkText(config)
  if (!text) return

  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, config.opacity))
  ctx.fillStyle = config.color || '#cc0000'
  ctx.font = `bold ${config.fontSize}px Arial, Helvetica, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const angleRad = (config.angle * Math.PI) / 180
  ctx.translate(width / 2, height / 2)
  ctx.rotate(angleRad)

  if (config.repeat) {
    const metrics = ctx.measureText(text)
    const textW = metrics.width
    const stepX = textW + config.fontSize * 3
    const stepY = config.fontSize * 4
    const diagonal = Math.sqrt(width * width + height * height)
    const nX = Math.ceil(diagonal / stepX) + 2
    const nY = Math.ceil(diagonal / stepY) + 2

    for (let row = -nY; row <= nY; row++) {
      for (let col = -nX; col <= nX; col++) {
        ctx.fillText(text, col * stepX, row * stepY)
      }
    }
  } else {
    ctx.fillText(text, 0, 0)
  }

  ctx.restore()
}
