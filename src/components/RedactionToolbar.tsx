import type { ToolMode } from '../domain/documentTypes'

interface RedactionToolbarProps {
  activeTool: ToolMode
  grayscale: boolean
  canUndo: boolean
  canRedo: boolean
  onToolChange: (tool: ToolMode) => void
  onGrayscaleToggle: () => void
  onUndo: () => void
  onRedo: () => void
  onClearRedactions: () => void
  // OCR
  hasDocument: boolean
  ocrLoading: boolean
  ocrProgress: number
  ocrSuggestionsCount: number
  ocrError: string | null
  onDetect: () => void
  onApplySuggestions: () => void
  onDismissSuggestions: () => void
}

const TOOLS: { id: ToolMode; label: string; icon: string; title: string }[] = [
  {
    id: 'redact-black',
    label: 'Caja negra',
    icon: '⬛',
    title: 'Ocultar zona con rectángulo negro',
  },
  {
    id: 'redact-pixel',
    label: 'Pixelar',
    icon: '🟫',
    title: 'Pixelar zona seleccionada',
  },
  {
    id: 'redact-blur',
    label: 'Difuminar',
    icon: '🌫️',
    title: 'Difuminar zona seleccionada',
  },
  {
    id: 'pan',
    label: 'Mover',
    icon: '✋',
    title: 'Modo desplazamiento (sin ocultación)',
  },
]

export function RedactionToolbar({
  activeTool,
  grayscale,
  canUndo,
  canRedo,
  onToolChange,
  onGrayscaleToggle,
  onUndo,
  onRedo,
  onClearRedactions,
  hasDocument,
  ocrLoading,
  ocrProgress,
  ocrSuggestionsCount,
  ocrError,
  onDetect,
  onApplySuggestions,
  onDismissSuggestions,
}: RedactionToolbarProps) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Herramientas de ocultación">
      <div className="toolbar__group" role="group" aria-label="Herramientas de dibujo">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`toolbar__btn ${activeTool === tool.id ? 'toolbar__btn--active' : ''}`}
            onClick={() => onToolChange(tool.id)}
            title={tool.title}
            aria-pressed={activeTool === tool.id}
          >
            <span aria-hidden="true">{tool.icon}</span>
            <span className="toolbar__label">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar__separator" aria-hidden="true" />

      <div className="toolbar__group" role="group" aria-label="Opciones de imagen">
        <button
          className={`toolbar__btn ${grayscale ? 'toolbar__btn--active' : ''}`}
          onClick={onGrayscaleToggle}
          title="Convertir a blanco y negro"
          aria-pressed={grayscale}
        >
          <span aria-hidden="true">🔲</span>
          <span className="toolbar__label">B&N</span>
        </button>
      </div>

      <div className="toolbar__separator" aria-hidden="true" />

      <div className="toolbar__group" role="group" aria-label="Historial">
        <button
          className="toolbar__btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Deshacer"
          aria-label="Deshacer última ocultación"
        >
          <span aria-hidden="true">↩️</span>
          <span className="toolbar__label">Deshacer</span>
        </button>
        <button
          className="toolbar__btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Rehacer"
          aria-label="Rehacer ocultación"
        >
          <span aria-hidden="true">↪️</span>
          <span className="toolbar__label">Rehacer</span>
        </button>
        <button
          className="toolbar__btn toolbar__btn--danger"
          onClick={onClearRedactions}
          title="Eliminar todas las ocultaciones"
          aria-label="Eliminar todas las ocultaciones del documento"
        >
          <span aria-hidden="true">🗑️</span>
          <span className="toolbar__label">Limpiar zonas</span>
        </button>
      </div>

      <div className="toolbar__separator" aria-hidden="true" />

      {/* ── Detección automática OCR ─────────────────────────────────── */}
      <div className="toolbar__group" role="group" aria-label="Detección automática de zonas">
        {!ocrLoading && ocrSuggestionsCount === 0 && (
          <button
            className="toolbar__btn"
            onClick={onDetect}
            disabled={!hasDocument || ocrLoading}
            title="Detectar zonas sensibles automáticamente (requiere internet la primera vez, ~4 MB)"
            aria-label="Detectar zonas sensibles mediante OCR"
          >
            <span aria-hidden="true">🔍</span>
            <span className="toolbar__label">Detectar zonas</span>
          </button>
        )}
        {ocrLoading && (
          <div className="toolbar__ocr-progress" role="status" aria-live="polite" aria-label="Analizando documento">
            <div className="toolbar__progress-track" role="progressbar"
              aria-valuenow={Math.round(ocrProgress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="toolbar__progress-fill" style={{ width: `${Math.round(ocrProgress * 100)}%` }} />
            </div>
            <span>Analizando… {Math.round(ocrProgress * 100)}%</span>
          </div>
        )}
        {!ocrLoading && ocrSuggestionsCount > 0 && (
          <div className="toolbar__ocr-results">
            <span className="toolbar__ocr-badge" aria-live="polite">
              🔍 {ocrSuggestionsCount} zona{ocrSuggestionsCount !== 1 ? 's' : ''} detectada{ocrSuggestionsCount !== 1 ? 's' : ''}
            </span>
            <button
              className="toolbar__btn toolbar__btn--success"
              onClick={onApplySuggestions}
              title="Convertir todas las sugerencias en ocultaciones negras"
            >
              <span aria-hidden="true">✓</span>
              <span className="toolbar__label">Aplicar todas</span>
            </button>
            <button
              className="toolbar__btn"
              onClick={onDismissSuggestions}
              title="Descartar sugerencias"
              aria-label="Descartar todas las sugerencias de OCR"
            >
              <span aria-hidden="true">✕</span>
              <span className="toolbar__label">Descartar</span>
            </button>
          </div>
        )}
        {ocrError && (
          <p className="toolbar__ocr-error" role="alert">⚠️ {ocrError}</p>
        )}
      </div>
    </div>
  )
}
