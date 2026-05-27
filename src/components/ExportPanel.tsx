import { useState } from 'react'
import type { ExportFormat } from '../domain/documentTypes'

interface ExportPanelProps {
  totalPages: number
  onExport: (format: ExportFormat) => Promise<void>
  onClear: () => void
}

export function ExportPanel({ totalPages, onExport, onClear }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)

  async function handleExport(format: ExportFormat) {
    setExporting(true)
    setExported(false)
    try {
      await onExport(format)
      setExported(true)
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

      <div className="export-actions">
        <button
          className="btn btn-primary btn-lg"
          onClick={() => handleExport('pdf')}
          disabled={exporting}
          aria-label={`Exportar como PDF${totalPages > 1 ? ` (${totalPages} páginas)` : ''}`}
        >
          {exporting ? '⏳ Generando…' : '📄 Descargar PDF'}
          {totalPages > 1 && !exporting && (
            <span className="btn__badge">{totalPages} págs.</span>
          )}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => handleExport('png')}
          disabled={exporting}
          aria-label="Exportar página actual como PNG"
        >
          🖼️ PNG
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => handleExport('jpg')}
          disabled={exporting}
          aria-label="Exportar página actual como JPG"
        >
          🖼️ JPG
        </button>
      </div>

      {exported && (
        <p className="export-success" role="status" aria-live="polite">
          ✅ Archivo descargado. <strong>Revísalo antes de enviarlo.</strong>
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
