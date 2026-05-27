import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Cambia el valor de `base` si el nombre de tu repositorio en GitHub es distinto.
// Por ejemplo, si el repo se llama "mi-repo", pon base: '/mi-repo/'
// Para dominio raíz propio, pon base: '/'
export default defineConfig({
  plugins: [react()],
  base: '/anonymize-dni/',
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
    include: ['tesseract.js'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
})
