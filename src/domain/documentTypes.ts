// Tipos de ocultación disponibles
export type RedactionType = 'black' | 'pixel' | 'blur'

// Una zona de ocultación sobre el documento
export interface Redaction {
  id: string
  type: RedactionType
  /** Coordenadas en píxeles del canvas fuente (sin zoom) */
  x: number
  y: number
  width: number
  height: number
}

// Configuración de la marca de agua
export interface WatermarkConfig {
  enabled: boolean
  /** Texto libre (si no está vacío, sobreescribe la composición automática) */
  text: string
  /** Finalidad del envío */
  purpose: string
  /** Destinatario */
  recipient: string
  /** Fecha en formato legible */
  date: string
  /** Opacidad de 0 (transparente) a 1 (opaco) */
  opacity: number
  /** Tamaño de fuente en px */
  fontSize: number
  /** Ángulo en grados */
  angle: number
  /** Si se repite en mosaico */
  repeat: boolean
  /** Color CSS */
  color: string
}

// Herramienta activa en el editor
export type ToolMode = 'redact-black' | 'redact-pixel' | 'redact-blur' | 'pan'

// Formato de exportación
export type ExportFormat = 'pdf' | 'png' | 'jpg'

// Paso actual en el flujo de la aplicación
export type AppStep = 'home' | 'upload' | 'editor' | 'export'

// Sugerencia de zona sensible detectada por OCR
export interface OcrSuggestion {
  id: string
  /** Etiqueta legible: "Número DNI/NIE", "Fecha", "Zona MRZ", "CAN (posible)" */
  label: string
  /** Coordenadas en píxeles del canvas fuente (mismo espacio que Redaction) */
  x: number
  y: number
  width: number
  height: number
}

// Preset de protección predefinido
export interface Preset {
  id: string
  name: string
  description: string
  grayscale: boolean
  watermarkPurpose: string
  /** Lista de zonas que se recomienda ocultar (informativo, no automático) */
  recommendedRedactions: string[]
}
