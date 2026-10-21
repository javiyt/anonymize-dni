import { useState } from 'react'
import type { ExportFormat, ExportOptions } from '../domain/documentTypes'

interface ExportPanelProps {
  totalPages: number
  pageSizes: { width: number; height: number }[]
  onExport: (format: ExportFormat, options: ExportOptions) => Promise<void>
  onClear: () => void
}

export function ExportPanel({ totalPages, pageSizes, onExport, onClear }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)

  const [scalePercent, setScalePercent] = useState('100')
  const [layout, setLayout] = useState<ExportOptions['layout']>('together')
  const [error, setError] = useState<string | null>(null)
  const percent = Number(scalePercent)
  const validScale = Number.isFinite(percent) && percent >= 10 && percent <= 300
  const sizes = pageSizes.map(({ width, height }) => ({
    width: Math.max(1, Math.round(width * percent / 100)),
    height: Math.max(1, Math.round(height * percent / 100)),
  }))
  const outputSizes = layout === 'together' && sizes.length > 0
    ? [{ width: Math.max(...sizes.map((size) => size.width)), height: sizes.reduce((sum, size) => sum + size.height, 0) }]
    : sizes

  async function handleExport(format: ExportFormat) {
    setExporting(true)
    setExported(false)
    setError(null)
    try {
      await onExport(format, { scalePercent: percent, layout })
      setExported(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar el documento.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="export-panel" aria-labelledby="export-title">
      <h3 id="export-title">Exportar documento protegido</h3>

      <div className="export-warning" role="note">
        <strong>⚠️ Importante:</strong> Revisa manualmente el archivo descargado antes de enviarlo.
        Comprueba que has ocultado correctamente todos los datos que no deseas compartir.
      </div>

      <div className="form-row">
        <label htmlFor="export-layout">Distribución de las caras</label>
        <select id="export-layout" className="form-input" value={layout}
          disabled={exporting} onChange={(event) => { setLayout(event.target.value as ExportOptions['layout']); setExported(false) }}>
          <option value="together">Juntas en una página o imagen</option>
          <option value="separate">Separadas: páginas PDF o archivos de imagen</option>
        </select>
        <p className="form-hint">Se incluyen todas las caras cargadas, en su orden de carga. Juntas se colocan una debajo de otra.</p>
      </div>
      {layout === 'separate' && totalPages > 1 && (
        <p className="form-hint">Para PNG y JPG se descarga un archivo por cara. Tu navegador puede pedir permiso para descargar varios archivos.</p>
      )}
      <div className="form-row">
        <label htmlFor="export-scale">Tamaño de descarga (%)</label>
        <input id="export-scale" className="form-input" type="number" min="10" max="300" step="1"
          value={scalePercent} disabled={exporting} aria-invalid={!validScale}
          aria-describedby="export-scale-hint"
          onChange={(event) => { setScalePercent(event.target.value); setExported(false) }} />
        <p id="export-scale-hint" className="form-hint">Del 10 % al 300 %. 100 % conserva el tamaño original. El zoom del editor no afecta a la descarga.</p>
        {validScale ? <p className="form-hint">Salida: {outputSizes.map((size) => `${size.width} × ${size.height} px`).join(' · ')}</p>
          : <p className="error-message" role="alert">Introduce un porcentaje entre 10 y 300.</p>}
      </div>

      <div className="export-actions">
        <button
          className="btn btn-primary btn-lg"
          onClick={() => handleExport('pdf')}
          disabled={exporting || !validScale}
          aria-label={`Exportar como PDF${totalPages > 1 ? ` (${totalPages} caras, ${layout === 'together' ? 'una página' : 'páginas separadas'})` : ''}`}
        >
          {exporting ? '⏳ Generando…' : '📄 Descargar PDF'}
          {totalPages > 1 && !exporting && (
            <span className="btn__badge">{totalPages} caras</span>
          )}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => handleExport('png')}
          disabled={exporting || !validScale}
          aria-label="Exportar todas las caras como PNG"
        >
          🖼️ PNG
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => handleExport('jpg')}
          disabled={exporting || !validScale}
          aria-label="Exportar todas las caras como JPG"
        >
          🖼️ JPG
        </button>
      </div>

      {error && <p className="error-message" role="alert">{error}</p>}

      {exported && (
        <p className="export-success" role="status" aria-live="polite">
          ✅ Descarga generada. <strong>Revísalo antes de enviarlo.</strong>
        </p>
      )}

      <hr className="export-divider" />

      <button
        className="btn btn-danger btn-lg"
        onClick={onClear}
        aria-label="Borrar el documento de la memoria y empezar de nuevo"
      >
        🗑️ Borrar documento de memoria
      </button>
      <p className="export-clear-hint">
        Elimina todas las referencias al documento cargado. No queda ningún dato en el navegador.
      </p>
    </section>
  )
}
