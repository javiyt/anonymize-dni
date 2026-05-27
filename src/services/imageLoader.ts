/**
 * Carga una imagen (JPG / PNG) en un HTMLCanvasElement local.
 * No se realiza ninguna llamada de red.
 */
export async function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo cargar la imagen.'))
    }

    img.src = objectUrl
  })
}

/** Lee un File como ArrayBuffer (para pasarlo a pdf.js) */
export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Error leyendo el archivo.'))
    reader.readAsArrayBuffer(file)
  })
}

export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const
export type AcceptedMimeType = (typeof ACCEPTED_TYPES)[number]
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type as AcceptedMimeType)) {
    return `Formato no admitido. Sube un archivo PDF, JPG o PNG.`
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `El archivo supera el límite de 20 MB.`
  }
  return null
}
