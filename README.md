# 🛡️ DNI Safe Share

Herramienta web estática para proteger copias de DNI/NIE antes de compartirlas.
Todo el procesamiento ocurre **localmente en tu navegador**. Ningún archivo se sube a ningún servidor.

---

## ¿Por qué es peligroso compartir una copia de tu DNI?

Compartir una copia íntegra del DNI o NIE expone información que puede usarse para:

- **Suplantación de identidad** en contratos, alquileres o créditos.
- **Fraudes bancarios y financieros** usando el número, nombre y fecha de nacimiento.
- **Uso no autorizado** de datos biométricos o de la MRZ (zona de lectura mecánica).

Las recomendaciones de la **AEPD** y el **INCIBE** indican que se deben tomar medidas antes de facilitar copias de documentos de identidad.

---

## ¿Qué hace esta herramienta?

1. Carga el documento localmente (PDF, JPG o PNG) sin enviarlo a ningún servidor.
2. Permite ocultar zonas sensibles (caja negra, pixelado, difuminado).
3. Convierte a blanco y negro.
4. Añade marca de agua con finalidad, destinatario y fecha.
5. Exporta como PDF, PNG o JPG.
6. Borra todo de memoria al terminar.

---

## Datos que se recomienda ocultar

| Dato                            | Cuándo ocultarlo                                     |
|---------------------------------|------------------------------------------------------|
| Firma                           | Siempre salvo que se exija expresamente              |
| Fotografía (o parte)            | Si solo necesitan verificar el número                |
| CAN / número de soporte         | Siempre                                              |
| MRZ (zona de lectura mecánica)  | Siempre salvo frontera                               |
| Fecha de caducidad              | Si el trámite no requiere verificar vigencia         |
| Fecha de expedición             | En la mayoría de trámites civiles                    |
| Dirección                       | Si no es relevante para el trámite                   |
| Código QR / código de barras    | Siempre que sea posible                              |

---

## Instalación local

```bash
git clone https://github.com/javiyt/anonymize-dni.git
cd anonymize-dni
npm install
npm run dev
```

Abre http://localhost:5173/anonymize-dni/ en tu navegador.

---

## Desarrollo

```bash
npm run dev          # Servidor de desarrollo
npm run lint         # Lint
npm test             # Tests
npm run test:coverage # Tests con cobertura
npm run build        # Build de producción
npm run preview      # Preview del build
```

---

## Tests

```bash
npm test
```

Cubre: FileUploader, watermark, redaction/useRedactions, exportService (sin red), App (flujo y borrado).

---

## Despliegue en GitHub Pages

1. Ve a **Settings → Pages** en tu repositorio.
2. En **Source**, selecciona **GitHub Actions**.
3. Haz push a `main` — el workflow `.github/workflows/deploy.yml` se encarga del resto.

### Cambiar el nombre del repositorio

Edita `base` en `vite.config.ts`:

```ts
export default defineConfig({
  base: '/nombre-de-tu-repo/',  // para dominio raíz: '/'
})
```

---

## Cabeceras CSP recomendadas (si usas proxy/CDN propio)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; worker-src 'self' blob:; connect-src 'none'; frame-src 'none'; object-src 'none';
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

GitHub Pages tiene limitaciones para cabeceras personalizadas.

---

## Limitaciones

- La ocultación es **manual** (no hay detección automática) para evitar errores silenciosos.
- El rectángulo negro es el método más seguro; pixelado y difuminado pueden ser parcialmente reversibles.
- La marca de agua no es criptográficamente segura.
- No sustituye el criterio legal o profesional.

---

## Aviso legal

> Esta herramienta no garantiza protección absoluta ni sustituye asesoramiento legal.
> El usuario debe comprobar si realmente necesita enviar una copia del documento y verificar siempre al destinatario.
> No somos una entidad oficial. No validamos identidades. No almacenamos documentos ni datos personales.
> La protección aplicada depende de la revisión manual del usuario.

---

## Licencia

MIT
