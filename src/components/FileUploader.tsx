import { useRef, useState } from 'react'
import { validateFile, ACCEPTED_TYPES } from '../services/imageLoader'

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function FileUploader({ onFilesSelected, disabled = false }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: File[]) {
    if (disabled || files.length === 0) return
    const validationError = files.map(validateFile).find(Boolean)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onFilesSelected(files)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    handleFiles(Array.from(e.dataTransfer.files ?? []))
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
        onClick={() => !disabled && inputRef.current?.click()}
        aria-disabled={disabled}
        role="button"
        tabIndex={0}
        aria-label="Zona de carga de documento. Haz clic o arrastra archivos PDF, JPG o PNG"
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click()
        }}
      >
        <div className="drop-zone__icon" aria-hidden="true">📄</div>
        <p className="drop-zone__text">
          <strong>Haz clic o arrastra</strong> las caras de tu DNI/NIE aquí
        </p>
        <p className="drop-zone__hint">Selecciona ambas caras o añádelas una a una · PDF, JPG o PNG · Máximo 20 MB por archivo</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          disabled={disabled}
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
        🔒 Los archivos <strong>no se enviarán a ningún servidor</strong>. El procesamiento es 100%
        local.
      </p>
    </div>
  )
}
