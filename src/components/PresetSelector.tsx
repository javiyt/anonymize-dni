import type { Preset } from '../domain/documentTypes'
import { PRESETS } from '../domain/presets'

interface PresetSelectorProps {
  activePresetId: string | null
  onSelect: (preset: Preset) => void
}

export function PresetSelector({ activePresetId, onSelect }: PresetSelectorProps) {
  return (
    <section className="preset-selector" aria-labelledby="presets-title">
      <h3 id="presets-title">Plantillas de protección</h3>
      <p className="preset-selector__hint">
        Elige una plantilla para ver qué datos se recomienda ocultar. Las zonas{' '}
        <strong>debes marcarlas tú manualmente</strong> en el editor.
      </p>
      <ul className="preset-list" role="list">
        {PRESETS.map((preset) => (
          <li key={preset.id}>
            <button
              className={`preset-card ${activePresetId === preset.id ? 'preset-card--active' : ''}`}
              onClick={() => onSelect(preset)}
              aria-pressed={activePresetId === preset.id}
            >
              <span className="preset-card__name">{preset.name}</span>
              <span className="preset-card__desc">{preset.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
