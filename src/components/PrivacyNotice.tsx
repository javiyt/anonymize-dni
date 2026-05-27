export function PrivacyNotice() {
  return (
    <section className="privacy-notice" aria-label="Aviso de privacidad">
      <div className="privacy-notice__icon" aria-hidden="true">🔒</div>
      <h1 className="privacy-notice__title">Protege tu DNI/NIE antes de compartirlo</h1>
      <p className="privacy-notice__lead">
        Esta herramienta te ayuda a aplicar medidas de protección sobre la copia de tu
        documento de identidad antes de enviarlo a terceros.
      </p>

      <ul className="privacy-pillars" role="list">
        <li className="privacy-pillar privacy-pillar--ok">
          <span className="privacy-pillar__icon" aria-hidden="true">✅</span>
          <div>
            <strong>Tu documento no sale de tu dispositivo</strong>
            <p>Todo el procesamiento ocurre localmente en tu navegador.</p>
          </div>
        </li>
        <li className="privacy-pillar privacy-pillar--ok">
          <span className="privacy-pillar__icon" aria-hidden="true">✅</span>
          <div>
            <strong>No se sube nada a servidores</strong>
            <p>No existe ningún backend ni almacenamiento remoto.</p>
          </div>
        </li>
        <li className="privacy-pillar privacy-pillar--ok">
          <span className="privacy-pillar__icon" aria-hidden="true">✅</span>
          <div>
            <strong>No guardamos tus documentos</strong>
            <p>Ningún dato sensible se almacena en cookies, localStorage ni bases de datos.</p>
          </div>
        </li>
        <li className="privacy-pillar privacy-pillar--ok">
          <span className="privacy-pillar__icon" aria-hidden="true">✅</span>
          <div>
            <strong>Sin analíticas ni rastreadores</strong>
            <p>No hay Google Analytics, píxeles de seguimiento ni llamadas externas.</p>
          </div>
        </li>
      </ul>

      <div className="privacy-notice__disclaimer">
        <strong>Aviso legal:</strong> No somos una entidad oficial. No validamos identidades. La
        protección aplicada depende de la revisión manual del usuario. Esta herramienta{' '}
        <strong>reduce riesgos, pero no garantiza protección absoluta</strong> ni sustituye
        el asesoramiento legal o profesional. Antes de enviar una copia de tu DNI/NIE, confirma
        que la solicitud es legítima y que no basta con facilitar menos datos.
      </div>
    </section>
  )
}
