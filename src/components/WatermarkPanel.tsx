import type { WatermarkConfig } from '../domain/documentTypes'

interface WatermarkPanelProps {
  config: WatermarkConfig
  onChange: (config: WatermarkConfig) => void
}

export function WatermarkPanel({ config, onChange }: WatermarkPanelProps) {
  function update<K extends keyof WatermarkConfig>(key: K, value: WatermarkConfig[K]) {
    onChange({ ...config, [key]: value })
  }

  return (
    <section className="watermark-panel" aria-labelledby="watermark-title">
      <h3 id="watermark-title">Marca de agua</h3>

      <div className="form-row form-row--checkbox">
        <input
          type="checkbox"
          id="wm-enabled"
          checked={config.enabled}
          onChange={(e) => update('enabled', e.target.checked)}
        />
        <label htmlFor="wm-enabled">Activar marca de agua</label>
      </div>

      {config.enabled && (
        <>
          <div className="form-row">
            <label htmlFor="wm-purpose">Finalidad</label>
            <input
              type="text"
              id="wm-purpose"
              className="form-input"
              value={config.purpose}
              placeholder="Ej: Alquiler piso, Trámite notaría…"
              onChange={(e) => update('purpose', e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="form-row">
            <label htmlFor="wm-recipient">Destinatario</label>
            <input
              type="text"
              id="wm-recipient"
              className="form-input"
              value={config.recipient}
              placeholder="Ej: Inmobiliaria García"
              onChange={(e) => update('recipient', e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="form-row">
            <label htmlFor="wm-date">Fecha</label>
            <input
              type="text"
              id="wm-date"
              className="form-input"
              value={config.date}
              onChange={(e) => update('date', e.target.value)}
              maxLength={30}
            />
          </div>

          <div className="form-row">
            <label htmlFor="wm-text">
              Texto personalizado{' '}
              <span className="form-hint">(deja en blanco para generarlo automáticamente)</span>
            </label>
            <textarea
              id="wm-text"
              className="form-input form-textarea"
              value={config.text}
              placeholder="Texto libre de la marca de agua (opcional)"
              onChange={(e) => update('text', e.target.value)}
              maxLength={200}
              rows={2}
            />
          </div>

          <div className="form-row">
            <label htmlFor="wm-opacity">
              Opacidad: <strong>{Math.round(config.opacity * 100)}%</strong>
            </label>
            <input
              type="range"
              id="wm-opacity"
              min={0.05}
              max={0.9}
              step={0.05}
              value={config.opacity}
              onChange={(e) => update('opacity', parseFloat(e.target.value))}
              className="form-range"
            />
          </div>

          <div className="form-row">
            <label htmlFor="wm-size">
              Tamaño fuente: <strong>{config.fontSize}px</strong>
            </label>
            <input
              type="range"
              id="wm-size"
              min={14}
              max={60}
              step={2}
              value={config.fontSize}
              onChange={(e) => update('fontSize', parseInt(e.target.value, 10))}
              className="form-range"
            />
          </div>

          <div className="form-row">
            <label htmlFor="wm-angle">
              Ángulo: <strong>{config.angle}°</strong>
            </label>
            <input
              type="range"
              id="wm-angle"
              min={-90}
              max={90}
              step={5}
              value={config.angle}
              onChange={(e) => update('angle', parseInt(e.target.value, 10))}
              className="form-range"
            />
          </div>

          <div className="form-row">
            <label htmlFor="wm-color">Color</label>
            <input
              type="color"
              id="wm-color"
              value={config.color}
              onChange={(e) => update('color', e.target.value)}
              className="form-color"
            />
          </div>

          <div className="form-row form-row--checkbox">
            <input
              type="checkbox"
              id="wm-repeat"
              checked={config.repeat}
              onChange={(e) => update('repeat', e.target.checked)}
            />
            <label htmlFor="wm-repeat">Repetir en mosaico diagonal</label>
          </div>
        </>
      )}
    </section>
  )
}
