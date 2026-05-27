import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

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
})
