import type { WatermarkConfig } from './documentTypes'

export const defaultWatermarkConfig: WatermarkConfig = {
  enabled: true,
  text: '',
  purpose: '',
  recipient: '',
  date: new Date().toLocaleDateString('es-ES'),
  opacity: 0.35,
  fontSize: 26,
  angle: -35,
  repeat: true,
  color: '#cc0000',
}

/**
 * Compone el texto de la marca de agua a partir de los campos de configuración.
 * Si `config.text` está relleno, lo usa directamente.
 */
export function composeWatermarkText(config: WatermarkConfig): string {
  if (config.text.trim()) return config.text.trim()

  const parts: string[] = ['COPIA DNI PROTEGIDA']
  if (config.purpose.trim()) parts.push(`FINALIDAD: ${config.purpose.trim().toUpperCase()}`)
  if (config.recipient.trim()) parts.push(`PARA: ${config.recipient.trim().toUpperCase()}`)
  if (config.date.trim()) parts.push(config.date.trim())
  parts.push('NO AUTORIZADO OTRO USO')

  return parts.join(' · ')
}

export function createWatermarkConfig(overrides: Partial<WatermarkConfig> = {}): WatermarkConfig {
  return { ...defaultWatermarkConfig, ...overrides }
}
