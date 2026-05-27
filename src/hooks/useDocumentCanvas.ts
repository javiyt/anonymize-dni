import { useEffect, type RefObject } from 'react'
import type { Redaction, WatermarkConfig } from '../domain/documentTypes'
import { renderDocumentToCanvas } from '../services/canvasRenderer'

interface UseDocumentCanvasOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>
  sourceCanvas: HTMLCanvasElement | null
  redactions: Redaction[]
  watermarkConfig: WatermarkConfig
  grayscale: boolean
  zoom: number
}

/**
 * Sincroniza el canvas de visualización cada vez que cambia alguna dependencia.
 * La actualización es síncrona (siguiente frame de pintura del navegador).
 */
export function useDocumentCanvas({
  canvasRef,
  sourceCanvas,
  redactions,
  watermarkConfig,
  grayscale,
  zoom,
}: UseDocumentCanvasOptions): void {
  useEffect(() => {
    if (!canvasRef.current || !sourceCanvas) return
    renderDocumentToCanvas(canvasRef.current, sourceCanvas, {
      redactions,
      watermarkConfig,
      grayscale,
      zoom,
    })
  }, [canvasRef, sourceCanvas, redactions, watermarkConfig, grayscale, zoom])
}
