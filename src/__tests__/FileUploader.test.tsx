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
  it('llama a onFilesSelected con un PDF válido', () => {
    const onFilesSelected = vi.fn()
    render(<FileUploader onFilesSelected={onFilesSelected} />)
    uploadFile(makeFile('documento.pdf', 'application/pdf'))
    expect(onFilesSelected).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('llama a onFilesSelected con una imagen JPEG', () => {
    const onFilesSelected = vi.fn()
    render(<FileUploader onFilesSelected={onFilesSelected} />)
    uploadFile(makeFile('foto.jpg', 'image/jpeg'))
    expect(onFilesSelected).toHaveBeenCalledOnce()
  })

  it('llama a onFilesSelected con una imagen PNG', () => {
    const onFilesSelected = vi.fn()
    render(<FileUploader onFilesSelected={onFilesSelected} />)
    uploadFile(makeFile('escaneado.png', 'image/png'))
    expect(onFilesSelected).toHaveBeenCalledOnce()
  })

  it('carga ambas caras seleccionadas en su orden', () => {
    const onFilesSelected = vi.fn()
    render(<FileUploader onFilesSelected={onFilesSelected} />)
    const files = [makeFile('anverso.jpg', 'image/jpeg'), makeFile('reverso.png', 'image/png')]
    fireEvent.change(screen.getByLabelText(/seleccionar archivo de dni/i), { target: { files } })
    expect(onFilesSelected).toHaveBeenCalledWith(files)
  })

  it('valida todos los archivos antes de cargar y admite arrastrar ambas caras', () => {
    const onFilesSelected = vi.fn()
    render(<FileUploader onFilesSelected={onFilesSelected} />)
    const zone = screen.getByRole('button')
    fireEvent.drop(zone, { dataTransfer: { files: [makeFile('front.png', 'image/png'), makeFile('bad.txt', 'text/plain')] } })
    expect(onFilesSelected).not.toHaveBeenCalled()
    const files = [makeFile('front.png', 'image/png'), makeFile('back.png', 'image/png')]
    fireEvent.drop(zone, { dataTransfer: { files } })
    expect(onFilesSelected).toHaveBeenCalledWith(files)
  })

  it('rechaza formatos no admitidos (DOCX) y muestra error', () => {
    const onFilesSelected = vi.fn()
    render(<FileUploader onFilesSelected={onFilesSelected} />)
    uploadFile(
      makeFile(
        'documento.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    )
    expect(onFilesSelected).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/formato no admitido/i)
  })

  it('rechaza archivos que superen 20 MB', () => {
    const onFilesSelected = vi.fn()
    render(<FileUploader onFilesSelected={onFilesSelected} />)
    uploadFile(makeFile('grande.pdf', 'application/pdf', 21 * 1024 * 1024))
    expect(onFilesSelected).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/20 mb/i)
  })
})
