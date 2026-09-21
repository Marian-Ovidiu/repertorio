import { type ReactNode } from 'react'
import styles from './Workbench.module.css'

export function Intro({ number, family, title, children }: {
  number: string; family: string; title: string; children: ReactNode
}) {
  return <div className={styles.intro}>
    <div className={styles.eyebrow}>Prova {number} <span>/</span> {family}</div>
    <h1>{title}</h1>
    <p>{children}</p>
    <a className={styles.sceneLink} href="#scena">Entra nella prova <span aria-hidden="true">↓</span></a>
  </div>
}

export function Controls({ children, mobile, onReset }: {
  children: ReactNode; mobile: boolean; onReset: () => void
}) {
  return <details className={styles.controls} open={!mobile} id="regolazioni">
    <summary>Regolazioni <span className={styles.summaryHint}>apri / chiudi</span></summary>
    <div className={styles.controlBody}>
      {children}
      <button className={styles.reset} type="button" onClick={onReset}>Ripristina valori iniziali <span aria-hidden="true">↺</span></button>
    </div>
  </details>
}

export function Range({ id, label, value, min, max, step = 1, unit, onChange }: {
  id: string; label: string; value: number; min: number; max: number; step?: number;
  unit: string; onChange: (value: number) => void
}) {
  return <div className={styles.range}>
    <div><label htmlFor={id}>{label}</label><output htmlFor={id}>{value}{unit}</output></div>
    <input id={id} type="range" min={min} max={max} step={step} value={value}
      aria-valuetext={`${value} ${unit}`} onChange={event => onChange(Number(event.target.value))} />
  </div>
}

export function Comparison({ normal, onNormal, simulated, onSimulated, systemReduced }: {
  normal: boolean; onNormal: (value: boolean) => void; simulated: boolean;
  onSimulated: (value: boolean) => void; systemReduced: boolean
}) {
  return <>
    <fieldset className={styles.comparison}>
      <legend>Confronta la stessa scena</legend>
      <label><input type="radio" name="versione" checked={!normal} onChange={() => onNormal(false)} /> Animata</label>
      <label><input type="radio" name="versione" checked={normal} onChange={() => onNormal(true)} /> Flusso normale</label>
    </fieldset>
    <label className={styles.motion}><input type="checkbox" checked={simulated} onChange={event => onSimulated(event.target.checked)} /> Simula movimento ridotto</label>
    <p className={styles.help}>{systemReduced
      ? 'Movimento ridotto attivo nel sistema: ha sempre la precedenza.'
      : 'La simulazione si aggiunge alla preferenza del sistema.'}</p>
  </>
}

export function Composition({ composed, onChange }: { composed: boolean; onChange: (value: boolean) => void }) {
  return <fieldset className={styles.comparison}>
    <legend>Composizione · stesso contenuto</legend>
    <label><input type="radio" name="composizione" checked={!composed} onChange={() => onChange(false)} /> Essenziale</label>
    <label><input type="radio" name="composizione" checked={composed} onChange={() => onChange(true)} /> Composta</label>
  </fieldset>
}

export function Notes({ children, nextHref, nextTitle }: { children: ReactNode; nextHref: string; nextTitle: string }) {
  return <section className={styles.notes} id="note" tabIndex={-1} aria-labelledby="notes-title">
    <div><div className={styles.eyebrow}>Dopo la prova</div><h2 id="notes-title">Cosa portarsi via.</h2></div>
    <div className={styles.noteContent}>{children}
      <div className={styles.endLinks}><a href="#regolazioni">Torna alle regolazioni ↑</a><a href={nextHref}>{nextTitle} →</a></div>
    </div>
  </section>
}
