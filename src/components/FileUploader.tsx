import { useRef, useState } from 'react'
import { validateFile, ACCEPTED_TYPES } from '../services/imageLoader'

interface FileUploaderProps {
  onFileSelected: (file: File) => void
}

export function FileUploader({ onFileSelected }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onFileSelected(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset para permitir seleccionar el mismo archivo de nuevo
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  const acceptAttr = ACCEPTED_TYPES.join(',')

  return (
    <div className="file-uploader">
      <div
        className={`drop-zone ${dragging ? 'drop-zone--active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Zona de carga de documento. Haz clic o arrastra un archivo PDF, JPG o PNG"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
      >
        <div className="drop-zone__icon" aria-hidden="true">📄</div>
        <p className="drop-zone__text">
          <strong>Haz clic o arrastra</strong> tu DNI/NIE aquí
        </p>
        <p className="drop-zone__hint">PDF, JPG o PNG · Máximo 20 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          onChange={handleInputChange}
          className="sr-only"
          aria-label="Seleccionar archivo de DNI/NIE"
          tabIndex={-1}
        />
      </div>

      {error && (
        <p className="file-uploader__error" role="alert" aria-live="assertive">
          ⚠️ {error}
        </p>
      )}

      <p className="file-uploader__privacy-note">
        🔒 El archivo <strong>no se enviará a ningún servidor</strong>. El procesamiento es 100%
        local.
      </p>
    </div>
  )
}
