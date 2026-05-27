import { describe, it, expect } from 'vitest'
import { composeWatermarkText, createWatermarkConfig, defaultWatermarkConfig } from '../domain/watermark'

describe('watermark', () => {
  it('createWatermarkConfig devuelve la config por defecto con merges', () => {
    const config = createWatermarkConfig({ purpose: 'Alquiler', recipient: 'Inmobiliaria' })
    expect(config.purpose).toBe('Alquiler')
    expect(config.recipient).toBe('Inmobiliaria')
    expect(config.enabled).toBe(true)
    expect(config.repeat).toBe(true)
    expect(config.opacity).toBeGreaterThan(0)
  })

  it('composeWatermarkText usa el texto libre si está relleno', () => {
    const config = { ...defaultWatermarkConfig, text: 'Texto personalizado' }
    expect(composeWatermarkText(config)).toBe('Texto personalizado')
  })

  it('composeWatermarkText compone automáticamente si text está vacío', () => {
    const config = createWatermarkConfig({
      text: '',
      purpose: 'Trámite notaría',
      recipient: 'Notaría Pérez',
      date: '27/05/2026',
    })
    const result = composeWatermarkText(config)
    expect(result).toContain('COPIA DNI PROTEGIDA')
    expect(result).toContain('TRÁMITE NOTARÍA')
    expect(result).toContain('NOTARÍA PÉREZ')
    expect(result).toContain('27/05/2026')
    expect(result).toContain('NO AUTORIZADO OTRO USO')
  })

  it('composeWatermarkText omite finalidad/destinatario si están vacíos', () => {
    const config = createWatermarkConfig({ text: '', purpose: '', recipient: '' })
    const result = composeWatermarkText(config)
    expect(result).not.toContain('FINALIDAD:')
    expect(result).not.toContain('PARA:')
    expect(result).toContain('COPIA DNI PROTEGIDA')
    expect(result).toContain('NO AUTORIZADO OTRO USO')
  })
})
