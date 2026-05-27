import { useCallback, useEffect, useRef, useState } from 'react'
import type { OcrSuggestion, Redaction, ToolMode, WatermarkConfig } from '../domain/documentTypes'
import { useDocumentCanvas } from '../hooks/useDocumentCanvas'

interface DrawState {
  drawing: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
}

interface DocumentPreviewProps {
  sourceCanvas: HTMLCanvasElement | null
  redactions: Redaction[]
  watermarkConfig: WatermarkConfig
  grayscale: boolean
  activeTool: ToolMode
  zoom: number
  onZoomChange: (zoom: number) => void
  onAddRedaction: (type: ToolMode, x: number, y: number, w: number, h: number) => void
  ocrSuggestions?: OcrSuggestion[]
}

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2]
const MIN_REDACTION_PX = 8 // píxeles mínimos en espacio fuente

export function DocumentPreview({
  sourceCanvas,
  redactions,
  watermarkConfig,
  grayscale,
  activeTool,
  zoom,
  onZoomChange,
  onAddRedaction,
  ocrSuggestions = [],
}: DocumentPreviewProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [drawState, setDrawState] = useState<DrawState>({
    drawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  })
  // Ref espejo para leer drawState en callbacks sin closure stale
  // y sin tener que llamar a onAddRedaction dentro de un setState updater.
  const drawStateRef = useRef<DrawState>(drawState)

  // Sincroniza el canvas principal (no afecta al overlay)
  useDocumentCanvas({
    canvasRef: mainCanvasRef,
    sourceCanvas,
    redactions,
    watermarkConfig,
    grayscale,
    zoom,
  })

  // Sincroniza tamaño del overlay con el canvas principal
  useEffect(() => {
    const overlay = overlayCanvasRef.current
    const main = mainCanvasRef.current
    if (!overlay || !main) return
    overlay.width = main.width
    overlay.height = main.height
  }, [sourceCanvas, zoom])

  // Dibuja las sugerencias OCR en el overlay (naranja discontinuo)
  const drawSuggestions = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      for (const s of ocrSuggestions) {
        const sx = s.x * zoom
        const sy = s.y * zoom
        const sw = s.width * zoom
        const sh = s.height * zoom
        ctx.save()
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 3])
        ctx.strokeRect(sx, sy, sw, sh)
        ctx.fillStyle = 'rgba(245, 158, 11, 0.08)'
        ctx.fillRect(sx, sy, sw, sh)
        // Etiqueta
        const fontSize = Math.max(10, Math.round(11 * zoom))
        ctx.font = `bold ${fontSize}px system-ui, sans-serif`
        const textW = ctx.measureText(s.label).width
        const tagH = fontSize + 4
        const tagY = sy > tagH + 4 ? sy - tagH - 2 : sy + sh + 2
        ctx.fillStyle = '#f59e0b'
        ctx.fillRect(sx, tagY, textW + 8, tagH)
        ctx.fillStyle = '#000'
        ctx.setLineDash([])
        ctx.fillText(s.label, sx + 4, tagY + fontSize - 1)
        ctx.restore()
      }
    },
    [ocrSuggestions, zoom],
  )

  // Limpia el overlay cuando termina el dibujo y redibuja sugerencias OCR
  useEffect(() => {
    if (drawState.drawing) return
    const overlay = overlayCanvasRef.current
    if (!overlay) return
    const ctx = overlay.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, overlay.width, overlay.height)
    drawSuggestions(ctx)
  }, [drawState.drawing, drawSuggestions])

  const getSourceCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
      const rect = e.currentTarget.getBoundingClientRect()
      return {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      }
    },
    [zoom],
  )

  const drawOverlayPreview = useCallback(
    (state: DrawState) => {
      const overlay = overlayCanvasRef.current
      if (!overlay) return
      const ctx = overlay.getContext('2d')!
      ctx.clearRect(0, 0, overlay.width, overlay.height)
      if (!state.drawing) return

      const x = Math.min(state.startX, state.currentX) * zoom
      const y = Math.min(state.startY, state.currentY) * zoom
      const w = Math.abs(state.currentX - state.startX) * zoom
      const h = Math.abs(state.currentY - state.startY) * zoom

      ctx.save()
      ctx.strokeStyle = '#2563eb'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(x, y, w, h)
      ctx.fillStyle = 'rgba(37, 99, 235, 0.12)'
      ctx.fillRect(x, y, w, h)
      ctx.restore()
    },
    [zoom],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (activeTool === 'pan' || !sourceCanvas) return
      e.preventDefault()
      const { x, y } = getSourceCoords(e)
      const next: DrawState = { drawing: true, startX: x, startY: y, currentX: x, currentY: y }
      drawStateRef.current = next
      setDrawState(next)
    },
    [activeTool, sourceCanvas, getSourceCoords],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawStateRef.current.drawing) return
      const rect = e.currentTarget.getBoundingClientRect()
      const cx = (e.clientX - rect.left) / zoom
      const cy = (e.clientY - rect.top) / zoom
      const next: DrawState = { ...drawStateRef.current, currentX: cx, currentY: cy }
      drawStateRef.current = next
      setDrawState(next)
      drawOverlayPreview(next)
    },
    [zoom, drawOverlayPreview],
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const cx = (e.clientX - rect.left) / zoom
      const cy = (e.clientY - rect.top) / zoom

      const prev = drawStateRef.current
      if (!prev.drawing) return

      // Resetear estado primero (sin updater funcional para no mezclar fases)
      const reset: DrawState = { drawing: false, startX: 0, startY: 0, currentX: 0, currentY: 0 }
      drawStateRef.current = reset
      setDrawState(reset)

      // Llamar onAddRedaction fuera de cualquier setState updater
      const x = Math.min(prev.startX, cx)
      const y = Math.min(prev.startY, cy)
      const w = Math.abs(cx - prev.startX)
      const h = Math.abs(cy - prev.startY)

      if (w >= MIN_REDACTION_PX && h >= MIN_REDACTION_PX) {
        onAddRedaction(activeTool, x, y, w, h)
      }
    },
    [zoom, activeTool, onAddRedaction],
  )

  const handleMouseLeave = useCallback(() => {
    if (!drawStateRef.current.drawing) return
    const reset: DrawState = { drawing: false, startX: 0, startY: 0, currentX: 0, currentY: 0 }
    drawStateRef.current = reset
    setDrawState(reset)
  }, [])

  const displayWidth = sourceCanvas ? Math.round(sourceCanvas.width * zoom) : 0
  const displayHeight = sourceCanvas ? Math.round(sourceCanvas.height * zoom) : 0

  if (!sourceCanvas) {
    return (
      <div className="document-preview document-preview--empty" aria-label="Sin documento cargado">
        <p>Carga un documento para comenzar la edición.</p>
      </div>
    )
  }

  const cursorStyle =
    activeTool === 'pan' ? 'grab' : drawState.drawing ? 'crosshair' : 'crosshair'

  return (
    <div className="document-preview">
      {/* Controles de zoom */}
      <div className="zoom-controls" role="group" aria-label="Controles de zoom">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            const idx = ZOOM_STEPS.indexOf(zoom)
            if (idx > 0) onZoomChange(ZOOM_STEPS[idx - 1])
          }}
          disabled={zoom <= ZOOM_STEPS[0]}
          aria-label="Reducir zoom"
        >
          −
        </button>
        <span className="zoom-level" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            const idx = ZOOM_STEPS.indexOf(zoom)
            if (idx < ZOOM_STEPS.length - 1) onZoomChange(ZOOM_STEPS[idx + 1])
          }}
          disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
          aria-label="Ampliar zoom"
        >
          +
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onZoomChange(1)}
          aria-label="Zoom al 100%"
        >
          100%
        </button>
      </div>

      {/* Canvas principal + overlay */}
      <div
        className="canvas-scroll-container"
        ref={containerRef}
        aria-label="Área de edición del documento"
      >
        <div
          className="canvas-wrapper"
          style={{ width: displayWidth, height: displayHeight }}
        >
          <canvas
            ref={mainCanvasRef}
            className="main-canvas"
            aria-label="Documento cargado"
            aria-describedby="canvas-instructions"
          />
          <canvas
            ref={overlayCanvasRef}
            className="overlay-canvas"
            style={{ cursor: cursorStyle }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            aria-hidden="true"
          />
        </div>
      </div>

      <p id="canvas-instructions" className="sr-only">
        Usa la herramienta activa para hacer clic y arrastrar sobre el documento y ocultar zonas
        sensibles.
      </p>

      {(redactions ?? []).length > 0 && (
        <p className="redaction-count" aria-live="polite">
          {redactions.length} zona{redactions.length !== 1 ? 's' : ''} ocultada
          {redactions.length !== 1 ? 's' : ''} en esta página.
        </p>
      )}
    </div>
  )
}
