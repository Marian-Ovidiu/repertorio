import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Comparison, Composition, Controls, Intro, Notes, Range } from '../Workbench'
import { ComposedThread } from './ComposedThread'
import { useEnvironment } from '../useEnvironment'
import shared from '../Workbench.module.css'
import styles from './ThreadExperiment.module.css'

const initialPhases = [
  { title: 'Capire il problema.', description: 'Osserviamo come il laboratorio riceve gli ordini. Parliamo con chi li prepara e individuiamo dove si perdono informazioni, tempo e materiali.' },
  { title: 'Progettare la soluzione.', description: 'Disegniamo un unico foglio di lavoro, dal preventivo alla consegna. Lo proviamo su tre ordini reali e correggiamo i passaggi poco chiari.' },
  { title: 'Costruire e verificare.', description: 'Realizziamo lo strumento e lo usiamo per una settimana. Controlliamo gli errori, raccogliamo le osservazioni del gruppo e rivediamo ciò che non funziona.' },
]
type Point = { x: number; y: number }
type Geometry = { width: number; height: number; points: Point[] }
const clamp = (value: number) => Math.min(1, Math.max(0, value))

function segment(from: Point, to: Point, curvature: number, vertical: boolean) {
  const bend = curvature / 100
  if (vertical) {
    // A dedicated side gutter: even maximum curvature stays outside the text.
    const dy = to.y - from.y
    return `M ${from.x} ${from.y} C ${from.x + 40 * bend} ${from.y + dy / 3}, ${to.x - 40 * bend} ${to.y - dy / 3}, ${to.x} ${to.y}`
  }
  const dx = to.x - from.x
  const dy = to.y - from.y
  return `M ${from.x} ${from.y} C ${from.x + dx / 3} ${from.y + dy / 3 + 70 * bend}, ${to.x - dx / 3} ${to.y - dy / 3 + 70 * bend}, ${to.x} ${to.y}`
}

export function ThreadExperiment() {
  const { systemReduced, mobile, height } = useEnvironment()
  const [distance, setDistance] = useState(120)
  const [composed, setComposed] = useState(false)
  const [blockDistance, setBlockDistance] = useState(32)
  const [thickness, setThickness] = useState(3)
  const [curvature, setCurvature] = useState(60)
  const [phases, setPhases] = useState(initialPhases)
  const [normal, setNormal] = useState(false)
  const [simulated, setSimulated] = useState(false)
  const [geometry, setGeometry] = useState<Geometry>({ width: 0, height: 0, points: [] })
  const [scrollProgress, setScrollProgress] = useState(0)
  const diagram = useRef<HTMLDivElement>(null)
  const scene = useRef<HTMLElement>(null)
  const reduced = simulated || systemReduced
  const fits = geometry.height > 0 && geometry.height <= height - 160
  const animated = !composed && !normal && !reduced && fits
  const effectiveDistance = mobile ? Math.min(distance, 90) : distance
  const run = height * effectiveDistance / 100
  const progress = animated ? scrollProgress : 1
  const paths = geometry.points.slice(0, -1).map((point, index) => segment(point, geometry.points[index + 1], curvature, mobile))

  useLayoutEffect(() => {
    const element = diagram.current
    if (!element) return
    const measure = () => {
      const box = element.getBoundingClientRect()
      const points = Array.from(element.querySelectorAll<HTMLElement>('[data-thread-point]')).map(marker => {
        const rect = marker.getBoundingClientRect()
        return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 }
      })
      setGeometry({ width: box.width, height: box.height, points })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    // A middle phase can change height without changing the tallest desktop column.
    element.querySelectorAll('li, [data-thread-point]').forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [composed])

  useEffect(() => {
    const element = scene.current
    if (!element || !animated) return
    let frame = 0
    let visible = true
    const update = () => {
      frame = 0
      setScrollProgress(clamp(Math.round(-element.getBoundingClientRect().top) / run))
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; queue() })
    observer.observe(element)
    // Exit updates must run too: a fast jump may cross the whole scene.
    const onScroll = () => { if (visible) queue() }
    queue()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [animated, run, geometry.height])

  function reset() {
    setDistance(120); setThickness(3); setCurvature(60); setPhases(initialPhases)
    setBlockDistance(32)
    setNormal(false); setSimulated(false)
  }

  function editPhase(index: number, field: 'title' | 'description', value: string) {
    setPhases(current => current.map((phase, i) => i === index ? { ...phase, [field]: value } : phase))
  }

  const reason = reduced ? 'Movimento ridotto: percorso completo, contenuti in flusso.'
    : normal ? 'Confronto: percorso completo, contenuti in flusso.'
      : composed ? 'Un percorso nella pagina · nessun aggancio · il filo segue tre sezioni, anche su finestre basse.'
      : !fits ? 'Le fasi superano lo spazio disponibile: percorso completo in flusso, senza tagli.'
        : `Disegno progressivo · corsa ${effectiveDistance}% della finestra · ${mobile ? 'percorso verticale' : 'percorso orizzontale'}`

  return <main id="contenuto">
    <div className={shared.layout}>
      <Intro number="03" family="Grafico · scheda 04" title="Il filo che si disegna.">
        Una fase porta alla successiva. Segui il filo, fermati e torna indietro: i punti segnano il percorso raggiunto, mentre i testi restano sempre leggibili.
      </Intro>
      <Controls mobile={mobile} onReset={reset}>
        <Composition composed={composed} onChange={setComposed} />
        {composed
          ? <Range id="thread-distance" label="Distanza fra i blocchi" value={blockDistance} min={16} max={64} step={4} unit="% finestra" onChange={setBlockDistance} />
          : <Range id="thread-distance" label="Distanza di scroll" value={distance} min={40} max={240} step={10} unit="% finestra" onChange={setDistance} />}
        <Range id="thread-thickness" label="Spessore della linea" value={thickness} min={1} max={8} unit="px" onChange={setThickness} />
        <Range id="thread-curvature" label="Curvatura del percorso" value={curvature} min={0} max={100} step={5} unit="%" onChange={setCurvature} />
        {mobile && <p className={shared.help}>{composed ? 'Filo in una corsia laterale dedicata. Distanza fra blocchi limitata al 32% della finestra; nessun testo viene trattenuto.' : 'Su telefono: filo laterale, corsa al massimo 90% della finestra.'}</p>}
        <details className={styles.editor}>
          <summary>Modifica le tre fasi <span aria-hidden="true">＋</span></summary>
          {phases.map((phase, index) => <fieldset key={index}>
            <legend>Fase {index + 1}</legend>
            <label htmlFor={`phase-title-${index}`}>Titolo {index + 1}</label>
            <input id={`phase-title-${index}`} value={phase.title} onChange={event => editPhase(index, 'title', event.target.value)} />
            <label htmlFor={`phase-description-${index}`}>Descrizione {index + 1}</label>
            <textarea id={`phase-description-${index}`} rows={3} value={phase.description} onChange={event => editPhase(index, 'description', event.target.value)} />
          </fieldset>)}
        </details>
        <Comparison normal={normal} onNormal={setNormal} simulated={simulated} onSimulated={setSimulated} systemReduced={systemReduced} />
      </Controls>
    </div>
    <div className={shared.sceneHead}><h2 id="scene-title">03 / Dalla domanda alla prova</h2><p role="status" aria-label="Stato della scena">{reason}</p></div>
    {composed ? <ComposedThread phases={phases} distance={blockDistance} thickness={thickness} curvature={curvature} staticMode={normal || reduced} mobile={mobile} height={height} /> : <section ref={scene} id="scena" className={styles.scene} aria-labelledby="scene-title" data-animated={animated} data-progress={progress}
      style={{ '--window-height': `${height}px`, '--run': `${run}px` } as CSSProperties}>
      <div className={styles.stage}>
        <div className={styles.stageLabel} aria-hidden="true"><span>Un progetto, tre passaggi</span><span>{Math.round(progress * 100)}% del percorso</span></div>
        <div className={styles.diagram} ref={diagram} data-thread-diagram>
          {geometry.width > 0 && <svg className={styles.thread} viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true" focusable="false" fill="none">
            {paths.map((d, index) => <g key={index}>
              <path d={d} className={styles.guide} strokeWidth={thickness} vectorEffect="non-scaling-stroke" />
              <path d={d} className={styles.ink} data-thread-segment={index} pathLength="1" strokeWidth={thickness}
                strokeDasharray="1" strokeDashoffset={1 - clamp(progress * 2 - index)} vectorEffect="non-scaling-stroke" />
            </g>)}
          </svg>}
          <ol className={styles.phases} role="list" aria-label="Fasi del progetto">
            {phases.map((phase, index) => {
              const reached = progress >= index / 2
              return <li key={index}>
                <div className={styles.anchor} aria-hidden="true"><span className={styles.point} data-thread-point={index} data-reached={reached}>{reached ? '✓' : String(index + 1).padStart(2, '0')}</span></div>
                <div className={styles.copy} data-phase-copy>
                  <div className={styles.phaseLabel} aria-hidden="true">{String(index + 1).padStart(2, '0')} <span>/ {reached ? 'Punto raggiunto' : 'Da raggiungere'}</span></div>
                  <h3>{phase.title.trim() || `Fase ${index + 1}`}</h3>
                  <p>{phase.description}</p>
                </div>
              </li>
            })}
          </ol>
        </div>
        <div className={styles.stageFoot} aria-hidden="true"><span>{animated ? 'Scorri per collegare. Risali per ripercorrere.' : 'Il collegamento resta. Il tempo di lettura è tuo.'}</span><span>↓</span></div>
      </div>
    </section>}
    <Notes nextHref="/accensione-del-testo" nextTitle="Torna alla prova del testo">
      <p><strong>Due scale diverse.</strong> Essenziale trattiene tre fasi nella stessa finestra. Composta le fa appartenere alla pagina: apertura editoriale, un foglio di lavoro costruito in HTML, conclusione sul lato opposto. Gli stessi titoli e descrizioni cambiano impaginazione, non contenuto. Il ripristino mantiene la variante scelta.</p>
      <p><strong>Un corridoio, non una linea sopra le parole.</strong> Nella Composta il filo scende a fianco di ogni blocco e cambia lato soltanto nello spazio fra due sezioni. Gli ancoraggi e i limiti dei blocchi sono misurati nuovamente quando cambia il testo o la finestra. La curvatura arrotonda i cambi di direzione, senza invadere il contenuto.</p>
      <p><strong>Composta su schermi stretti e bassi.</strong> Il percorso diventa verticale in una corsia di 42px. Non c’è sticky né fallback dovuto all’altezza: anche un testo molto lungo resta nel flusso e il filo continua a disegnarsi. La linea avanza quando la lettura arriva al 62% della finestra; non misura il lavoro realmente completato.</p>
      <p><strong>Il filo racconta una relazione.</strong> Prima si comprende il problema, poi si progetta, infine si verifica la soluzione. La traccia tenue mostra già il collegamento; il tratto pieno e il segno di spunta indicano dove è arrivato il disegno, non lo stato reale del progetto.</p>
      <p><strong>La geometria Essenziale.</strong> Il percorso parte dai centri dei tre punti. Su desktop occupa una fascia sopra i testi; su telefono scorre nel margine laterale. Modifica titoli e descrizioni: gli agganci si ricalcolano senza attraversare le parole.</p>
      <p><strong>Prima la lettura.</strong> Nella Essenziale, se le fasi non entrano nella finestra con un margine di sicurezza, la scena perde lo sticky e il filo appare completo. In entrambe le varianti il confronto normale e il movimento ridotto mostrano subito tutto. L’elenco ordinato mantiene la sequenza senza SVG e senza annunci duplicati.</p>
      <p><strong>Il tempo del disegno.</strong> Nella Essenziale ogni collegamento usa metà della corsa scelta, anche con lunghezze diverse; su mobile la corsa è limitata al 90% della finestra. Nella Composta è la distanza reale fra i punti a determinare l’avanzamento. Qui il meccanismo è isolato: in un sito cliente va ricalcolato il costo rispetto al limite di +25% di altezza pagina.</p>
    </Notes>
  </main>
}
