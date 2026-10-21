import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { exportDocument } from '../services/exportService'

vi.mock('../services/exportService', () => ({ exportDocument: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../components/DocumentPreview', () => ({
  DocumentPreview: ({ redactions, onAddRedaction }: Parameters<typeof import('../components/DocumentPreview').DocumentPreview>[0]) => (
    <button onClick={() => onAddRedaction('redact-black', 10, 20, 30, 40)}>
      Ocultar zona de prueba ({redactions.length})
    </button>
  ),
}))

// pdf.js no está disponible en jsdom — lo silenciamos
vi.mock('../services/pdfRenderer', () => ({
  renderPdfToCanvases: vi.fn().mockResolvedValue({ canvases: [], totalPages: 0 }),
}))

// imageLoader se mockea para inyectar un canvas falso
vi.mock('../services/imageLoader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/imageLoader')>()
  return {
    ...actual,
    loadImageToCanvas: vi.fn().mockResolvedValue(
      (() => {
        const c = document.createElement('canvas')
        c.width = 100
        c.height = 100
        return c
      })(),
    ),
  }
})

describe('App', () => {
  it('muestra el aviso de privacidad en la pantalla inicial', () => {
    render(<App />)
    expect(screen.getByText(/tu documento no sale de tu dispositivo/i)).toBeInTheDocument()
  })

  it('muestra la checklist antes de permitir subir', () => {
    render(<App />)
    expect(
      screen.getByText(/¿es realmente obligatorio enviar una copia del dni\/nie\?/i),
    ).toBeInTheDocument()
  })

  it('el botón "Continuar" está desactivado hasta marcar todas las casillas', () => {
    render(<App />)
    const continueBtn = screen.getByRole('button', { name: /marca todas las casillas/i })
    expect(continueBtn).toBeDisabled()
  })

  it('avanza al paso de subida tras marcar todos los checks', async () => {
    const user = userEvent.setup()
    render(<App />)

    const checkboxes = screen.getAllByRole('checkbox')
    for (const checkbox of checkboxes) {
      await user.click(checkbox)
    }

    const continueBtn = screen.getByRole('button', { name: /continuar a subir/i })
    expect(continueBtn).not.toBeDisabled()
    await user.click(continueBtn)

    expect(screen.getByText(/sube tu documento/i)).toBeInTheDocument()
  })

  it('el botón "Borrar y salir" vuelve a la pantalla inicial', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Avanzar al paso de subida
    const checkboxes = screen.getAllByRole('checkbox')
    for (const checkbox of checkboxes) {
      await user.click(checkbox)
    }
    await user.click(screen.getByRole('button', { name: /continuar a subir/i }))

    // Borrar
    await user.click(screen.getByRole('button', { name: /borrar documento/i }))

    // Debe volver al inicio
    expect(screen.getByText(/tu documento no sale de tu dispositivo/i)).toBeInTheDocument()
  })
  it('añade otra cara, conserva las ocultaciones y exporta ambas con el tamaño elegido', async () => {
    const user = userEvent.setup()
    render(<App />)
    for (const checkbox of screen.getAllByRole('checkbox')) await user.click(checkbox)
    await user.click(screen.getByRole('button', { name: /continuar a subir/i }))
    await user.upload(screen.getByLabelText(/seleccionar archivo de dni/i), new File(['front'], 'anverso.png', { type: 'image/png' }))
    await user.click(await screen.findByRole('button', { name: 'Ocultar zona de prueba (0)' }))
    await user.upload(screen.getByLabelText(/seleccionar archivo de dni/i), new File(['back'], 'reverso.jpg', { type: 'image/jpeg' }))
    expect(await screen.findByRole('button', { name: /página siguiente/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Ocultar zona de prueba (1)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /página siguiente/i }))
    await user.click(screen.getByRole('button', { name: 'Ocultar zona de prueba (0)' }))
    await user.click(screen.getByRole('button', { name: /página anterior/i }))
    expect(screen.getByRole('button', { name: 'Ocultar zona de prueba (1)' })).toBeInTheDocument()
    const scale = screen.getByLabelText('Tamaño de descarga (%)')
    await user.clear(scale)
    expect(screen.getByRole('button', { name: /exportar como pdf/i })).toBeDisabled()
    await user.type(scale, '50')
    await user.click(screen.getByRole('button', { name: /exportar como pdf/i }))
    const args = vi.mocked(exportDocument).mock.lastCall!
    expect(args[0]).toBe('pdf')
    expect(args[1]).toHaveLength(2)
    expect(args[3].get(0)).toHaveLength(1)
    expect(args[3].get(1)).toHaveLength(1)
    expect(args[6]).toEqual({ scalePercent: 50, layout: 'together' })
    await user.selectOptions(screen.getByLabelText('Distribución de las caras'), 'separate')
    await user.click(screen.getByRole('button', { name: /exportar todas las caras como png/i }))
    expect(vi.mocked(exportDocument).mock.lastCall![6]).toEqual({ scalePercent: 50, layout: 'separate' })
  })

})
