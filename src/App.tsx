import { useCallback, useRef, useState } from 'react'
import type { AppStep, ExportFormat, ExportOptions, OcrSuggestion, Preset, ToolMode, WatermarkConfig } from './domain/documentTypes'
import { defaultWatermarkConfig } from './domain/watermark'
import { useRedactions } from './hooks/useRedactions'
import { readFileAsArrayBuffer, loadImageToCanvas } from './services/imageLoader'
import { renderPdfToCanvases } from './services/pdfRenderer'
import { exportDocument } from './services/exportService'
import { detectSensitiveZones } from './services/ocrService'
import { PRESETS } from './domain/presets'

import { PrivacyNotice } from './components/PrivacyNotice'
import { SecurityChecklist } from './components/SecurityChecklist'
import { FileUploader } from './components/FileUploader'
import { DocumentPreview } from './components/DocumentPreview'
import { RedactionToolbar } from './components/RedactionToolbar'
import { WatermarkPanel } from './components/WatermarkPanel'
import { ExportPanel } from './components/ExportPanel'
import { PresetSelector } from './components/PresetSelector'
import { PageNavigator } from './components/PageNavigator'

type LoadingState = 'idle' | 'loading' | 'error'
const PRESETS_MAP = new Map(PRESETS.map((p) => [p.id, p.recommendedRedactions]))

export default function App() {
  const [step, setStep] = useState<AppStep>('home')
  const [pageCanvases, setPageCanvases] = useState<HTMLCanvasElement[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<ToolMode>('redact-black')
  const [grayscale, setGrayscale] = useState(true)
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>(defaultWatermarkConfig)
  const [zoom, setZoom] = useState(0.75)
  const [activePresetId, setActivePresetId] = useState<string | null>(null)

  // Estado OCR
  const [ocrSuggestions, setOcrSuggestions] = useState<OcrSuggestion[]>([])
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrError, setOcrError] = useState<string | null>(null)

  const redactions = useRedactions(currentPage)
  const ocrRequest = useRef(0)
  const loadRequest = useRef(0)

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const request = ++loadRequest.current
    setLoadingState('loading')
    setLoadingProgress(0)
    setLoadError(null)
    try {
      const canvases: HTMLCanvasElement[] = []
      for (const [index, file] of files.entries()) {
        if (file.type === 'application/pdf') {
          const buffer = await readFileAsArrayBuffer(file)
          const result = await renderPdfToCanvases(buffer)
          canvases.push(...result.canvases)
        } else {
          canvases.push(await loadImageToCanvas(file))
        }
        if (request !== loadRequest.current) return
        setLoadingProgress(Math.round(((index + 1) / files.length) * 100))
      }
      if (canvases.length === 0) throw new Error('Documento vacío')
      setPageCanvases((previous) => [...previous, ...canvases])
      setLoadingState('idle')
      setStep('editor')
    } catch (err) {
      console.error(err)
      if (request !== loadRequest.current) return
      setLoadError('No se pudo cargar el documento. Comprueba que el archivo no está dañado.')
      setLoadingState('error')
    }
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    ocrRequest.current++
    setOcrLoading(false)
    setOcrError(null)
    setOcrSuggestions([])
  }, [])

  const handlePresetSelect = useCallback((preset: Preset) => {
    setActivePresetId(preset.id)
    setGrayscale(preset.grayscale)
    setWatermarkConfig((prev) => ({ ...prev, purpose: preset.watermarkPurpose }))
  }, [])

  const handleExport = useCallback(async (format: ExportFormat, options: ExportOptions) => {
    await exportDocument(format, pageCanvases, currentPage, redactions.redactionsPerPage, watermarkConfig, grayscale, options)
  }, [pageCanvases, currentPage, redactions, watermarkConfig, grayscale])

  const handleClear = useCallback(() => {
    loadRequest.current++
    setPageCanvases([])
    setCurrentPage(0)
    setLoadingState('idle')
    setLoadError(null)
    setLoadingProgress(0)
    redactions.reset()
    ocrRequest.current++
    setGrayscale(true)
    setWatermarkConfig(defaultWatermarkConfig)
    setActivePresetId(null)
    setZoom(0.75)
    setOcrSuggestions([])
    setOcrLoading(false)
    setOcrProgress(0)
    setOcrError(null)
    setStep('home')
  }, [redactions])

  const handleAddRedaction = useCallback((tool: ToolMode, x: number, y: number, w: number, h: number) => {
    if (tool === 'pan') return
    const type = tool === 'redact-black' ? 'black' : tool === 'redact-pixel' ? 'pixel' : 'blur'
    redactions.addRedaction(type, x, y, w, h)
  }, [redactions])

  const handleDetectZones = useCallback(async () => {
    const canvas = pageCanvases[currentPage]
    if (!canvas) return
    const request = ++ocrRequest.current
    setOcrLoading(true)
    setOcrProgress(0)
    setOcrError(null)
    setOcrSuggestions([])
    try {
      const found = await detectSensitiveZones(canvas, (progress) => {
        if (request === ocrRequest.current) setOcrProgress(progress)
      })
      if (request !== ocrRequest.current) return
      setOcrSuggestions(found)
      if (found.length === 0) setOcrError('No se detectaron zonas sensibles. Revisa el documento manualmente.')
    } catch (err) {
      console.error(err)
      if (request !== ocrRequest.current) return
      setOcrError('Error al analizar el documento. Comprueba la conexión (primera vez requiere ~4 MB).')
    } finally {
      if (request === ocrRequest.current) setOcrLoading(false)
    }
  }, [pageCanvases, currentPage])

  const handleApplySuggestions = useCallback(() => {
    for (const s of ocrSuggestions) {
      redactions.addRedaction('black', s.x, s.y, s.width, s.height)
    }
    setOcrSuggestions([])
  }, [ocrSuggestions, redactions])

  const handleDismissSuggestions = useCallback(() => {
    setOcrSuggestions([])
  }, [])

  const sourceCanvas = pageCanvases[currentPage] ?? null

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <span className="app-header__logo" aria-hidden="true">🛡️</span>
          <h1 className="app-header__title">DNI Safe Share</h1>
          <p className="app-header__tagline">Protege tu DNI/NIE antes de compartirlo</p>
        </div>
        {step !== 'home' && (
          <button className="btn btn-danger btn-sm app-header__clear" onClick={handleClear}
            aria-label="Borrar documento y volver al inicio">
            🗑️ Borrar y salir
          </button>
        )}
      </header>

      <main className="app-main">
        {step === 'home' && (
          <div className="step-home">
            <PrivacyNotice />
            <SecurityChecklist onContinue={() => setStep('upload')} />
          </div>
        )}

        {step === 'upload' && (
          <div className="step-upload">
            <h2>Sube tu documento</h2>
            <FileUploader onFilesSelected={handleFilesSelected} disabled={loadingState === 'loading'} />
            {loadingState === 'loading' && (
              <div className="loading-indicator" role="status" aria-live="polite">
                <div className="loading-bar-track">
                  <div className="loading-bar" style={{ width: `${loadingProgress}%` }}
                    role="progressbar" aria-valuenow={loadingProgress}
                    aria-valuemin={0} aria-valuemax={100} />
                </div>
                <p>Cargando caras y páginas… {loadingProgress}%</p>
              </div>
            )}
            {loadError && (
              <p className="error-message" role="alert">⚠️ {loadError}</p>
            )}
          </div>
        )}

        {(step === 'editor' || step === 'export') && sourceCanvas && (
          <div className="step-editor">
            <RedactionToolbar
              activeTool={activeTool} grayscale={grayscale}
              canUndo={redactions.canUndo} canRedo={redactions.canRedo}
              onToolChange={setActiveTool}
              onGrayscaleToggle={() => setGrayscale((g) => !g)}
              onUndo={redactions.undo} onRedo={redactions.redo}
              onClearRedactions={redactions.clearAll}
              hasDocument={!!sourceCanvas}
              ocrLoading={ocrLoading}
              ocrProgress={ocrProgress}
              ocrSuggestionsCount={ocrSuggestions.length}
              ocrError={ocrError}
              onDetect={handleDetectZones}
              onApplySuggestions={handleApplySuggestions}
              onDismissSuggestions={handleDismissSuggestions}
            />
            <div className="editor-layout">
              <aside className="editor-sidebar">
                <PresetSelector activePresetId={activePresetId} onSelect={handlePresetSelect} />
                {activePresetId && (
                  <div className="preset-tips">
                    <h4>Zonas recomendadas para ocultar</h4>
                    <ul>
                      {(PRESETS_MAP.get(activePresetId) ?? []).map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                    <p className="preset-tips__note">
                      Usa las herramientas del editor para marcarlas manualmente.
                    </p>
                  </div>
                )}
                <WatermarkPanel config={watermarkConfig} onChange={setWatermarkConfig} />
                <ExportPanel
                  totalPages={pageCanvases.length}
                  pageSizes={pageCanvases.map((canvas) => ({ width: canvas.width, height: canvas.height }))}
                  onExport={handleExport}
                  onClear={handleClear}
                />
              </aside>
              <div className="editor-canvas-area">
                <section className="add-document" aria-label="Añadir caras del documento">
                  <h3>Añadir otra cara o documento</h3>
                  <FileUploader onFilesSelected={handleFilesSelected} disabled={loadingState === 'loading'} />
                  {loadingState === 'loading' && <p role="status">Cargando… {loadingProgress}%</p>}
                  {loadError && <p className="error-message" role="alert">{loadError}</p>}
                </section>
                <PageNavigator currentPage={currentPage} totalPages={pageCanvases.length}
                  onPageChange={handlePageChange} />
                <DocumentPreview
                  sourceCanvas={sourceCanvas}
                  redactions={redactions.redactions}
                  watermarkConfig={watermarkConfig}
                  grayscale={grayscale}
                  activeTool={activeTool}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  onAddRedaction={handleAddRedaction}
                  ocrSuggestions={ocrSuggestions}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Procesamiento 100% local · Sin servidores · Sin analíticas ·{' '}
          <a href="https://github.com/javiyt/anonymize-dni" target="_blank" rel="noopener noreferrer">
            Código fuente
          </a>
        </p>
        <p className="app-footer__legal">
          Herramienta de uso personal. No garantiza protección absoluta ni sustituye asesoramiento legal.
        </p>
      </footer>
    </div>
  )
}
