import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileUploader } from '../components/FileUploader'

function makeFile(name: string, type: string, size = 1024): File {
  const content = new Uint8Array(size)
  return new File([content], name, { type })
}

function uploadFile(file: File) {
  const input = screen.getByLabelText(/seleccionar archivo de dni/i)
  fireEvent.change(input, { target: { files: [file] } })
}

describe('FileUploader', () => {
  it('llama a onFileSelected con un PDF válido', () => {
    const onFileSelected = vi.fn()
    render(<FileUploader onFileSelected={onFileSelected} />)
    uploadFile(makeFile('documento.pdf', 'application/pdf'))
    expect(onFileSelected).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('llama a onFileSelected con una imagen JPEG', () => {
    const onFileSelected = vi.fn()
    render(<FileUploader onFileSelected={onFileSelected} />)
    uploadFile(makeFile('foto.jpg', 'image/jpeg'))
    expect(onFileSelected).toHaveBeenCalledOnce()
  })

  it('llama a onFileSelected con una imagen PNG', () => {
    const onFileSelected = vi.fn()
    render(<FileUploader onFileSelected={onFileSelected} />)
    uploadFile(makeFile('escaneado.png', 'image/png'))
    expect(onFileSelected).toHaveBeenCalledOnce()
  })

  it('rechaza formatos no admitidos (DOCX) y muestra error', () => {
    const onFileSelected = vi.fn()
    render(<FileUploader onFileSelected={onFileSelected} />)
    uploadFile(
      makeFile(
        'documento.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    )
    expect(onFileSelected).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/formato no admitido/i)
  })

  it('rechaza archivos que superen 20 MB', () => {
    const onFileSelected = vi.fn()
    render(<FileUploader onFileSelected={onFileSelected} />)
    uploadFile(makeFile('grande.pdf', 'application/pdf', 21 * 1024 * 1024))
    expect(onFileSelected).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/20 mb/i)
  })
})
