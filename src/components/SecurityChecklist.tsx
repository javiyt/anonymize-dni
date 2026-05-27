import { useState } from 'react'

const CHECKS = [
  '¿Es realmente obligatorio enviar una copia del DNI/NIE?',
  '¿Podrías facilitar solo los datos necesarios sin enviar copia?',
  '¿Has verificado la identidad y legitimidad de quien lo solicita?',
  '¿Vas a añadir finalidad, destinatario y fecha en la copia?',
  '¿Has ocultado firma, foto, CAN, MRZ y otros datos innecesarios?',
]

interface SecurityChecklistProps {
  onContinue: () => void
}

export function SecurityChecklist({ onContinue }: SecurityChecklistProps) {
  const [checked, setChecked] = useState<boolean[]>(CHECKS.map(() => false))

  const toggle = (i: number) =>
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))

  const allChecked = checked.every(Boolean)

  return (
    <section className="checklist-panel" aria-labelledby="checklist-title">
      <h2 id="checklist-title">Antes de continuar, revisa estas preguntas</h2>
      <p className="checklist-subtitle">
        Marca todas las casillas cuando hayas reflexionado sobre cada punto.
      </p>
      <ul className="checklist-list" role="list">
        {CHECKS.map((text, i) => (
          <li key={i}>
            <label className="checklist-item">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                aria-checked={checked[i]}
              />
              <span>{text}</span>
            </label>
          </li>
        ))}
      </ul>
      <button
        className="btn btn-primary btn-lg"
        onClick={onContinue}
        disabled={!allChecked}
        aria-disabled={!allChecked}
      >
        {allChecked ? 'Continuar a subir documento →' : 'Marca todas las casillas para continuar'}
      </button>
    </section>
  )
}
