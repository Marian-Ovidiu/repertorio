import { useCallback, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Controls, Intro, Notes, Range } from '../Workbench'
import { useEnvironment } from '../useEnvironment'
import shared from '../Workbench.module.css'
import editor from './ThreadExperiment.module.css'
import styles from './LiquidExperiment.module.css'

const names = ['Identità', 'Siti', 'Interazioni']
const initialCopy = [
  'Mettere a fuoco ciò che rende riconoscibile un progetto. Parole, segni e colori diventano un sistema coerente, capace di vivere in contesti diversi.',
  'Dare una struttura chiara ai contenuti e alle azioni. Un sito mette in relazione ciò che una persona cerca con ciò che il progetto può raccontare.',
  'Rendere comprensibile un cambiamento. Stati, risposte e passaggi aiutano a capire che cosa è successo e quale azione è possibile fare dopo.',
]
type Box = { x: number; y: number; w: number; h: number }
type Shape = { x: number; y: number; rx: number; ry: number }
type Geometry = { width: number; height: number; boxes: Box[] }
const targetShape = (box: Box): Shape => ({ x: box.x + box.w / 2, y: box.y + box.h / 2, rx: box.w * .51, ry: box.h / 2 + Math.min(16, box.h * .14) })

// The composition reuses the approved scene and its input/animation logic;
// only the laboratory shell is omitted. Defaults of the isolated test stay intact.
export function LiquidExperiment({ embedded }: { embedded?: {
  reduced: boolean; copy: string[]; activities: string[][];
} } = {}) {
  const { mobile, systemReduced } = useEnvironment()
  const [gap, setGap] = useState(48)
  const [softness, setSoftness] = useState(12)
  const [duration, setDuration] = useState(900)
  const [copy, setCopy] = useState(embedded?.copy ?? initialCopy)
  const [selected, setSelected] = useState(0)
  const [plain, setPlain] = useState(false)
  const [simulated, setSimulated] = useState(false)
  const [supported] = useState(() => typeof SVGFEGaussianBlurElement !== 'undefined' && typeof SVGFEColorMatrixElement !== 'undefined' && CSS.supports('filter', 'url("#goo-probe")'))
  const [geometry, setGeometry] = useState<Geometry>({ width: 1, height: 1, boxes: [] })
  const arena = useRef<HTMLDivElement>(null)
  const material = useRef<SVGSVGElement>(null)
  const mass = useRef<SVGEllipseElement>(null)
  const labels = useRef<(HTMLLabelElement | null)[]>([])
  const measured = useRef(geometry)
  const active = useRef(0)
  const shape = useRef<Shape | null>(null)
  const frame = useRef(0)
  const filterId = `liquid-${useId().replace(/:/g, '')}`
  const reduced = systemReduced || simulated || Boolean(embedded?.reduced)
  const effectiveGap = mobile ? Math.max(36, Math.round(gap * .65)) : gap
  const effectiveSoftness = mobile ? Math.min(softness, 12) : softness

  const draw = useCallback((next: Shape, progress = 1) => {
    shape.current = next
    const element = mass.current!
    element.setAttribute('cx', String(next.x)); element.setAttribute('cy', String(next.y))
    element.setAttribute('rx', String(next.rx)); element.setAttribute('ry', String(next.ry))
    material.current!.dataset.progress = String(progress)
    material.current!.dataset.moving = String(progress < 1)
  }, [])
  const settle = useCallback(() => {
    cancelAnimationFrame(frame.current); frame.current = 0
    const box = measured.current.boxes[active.current]
    if (box) draw(targetShape(box))
  }, [draw])

  useLayoutEffect(() => {
    let alive = true
    const measure = () => {
      if (!alive) return
      const rect = arena.current!.getBoundingClientRect()
      const next = { width: rect.width, height: rect.height, boxes: labels.current.map(label => {
        const r = label!.getBoundingClientRect()
        return { x: r.left - rect.left, y: r.top - rect.top, w: r.width, h: r.height }
      }) }
      if (JSON.stringify(next) === JSON.stringify(measured.current)) return
      measured.current = next
      setGeometry(next)
      // A new layout ends the old trajectory at the confirmed choice. It must
      // never continue using coordinates from the previous orientation.
      settle()
    }
    const observer = new ResizeObserver(measure)
    observer.observe(arena.current!)
    labels.current.forEach(label => observer.observe(label!))
    measure()
    const resize = () => { measure(); settle() }
    window.addEventListener('resize', resize)
    document.fonts.ready.then(measure)
    document.fonts.addEventListener('loadingdone', measure)
    return () => { alive = false; observer.disconnect(); window.removeEventListener('resize', resize); document.fonts.removeEventListener('loadingdone', measure) }
  }, [effectiveGap, copy, settle])

  useLayoutEffect(() => { if (reduced) settle() }, [reduced, settle])
  useLayoutEffect(() => {
    const hidden = () => { if (document.hidden) settle() }
    document.addEventListener('visibilitychange', hidden)
    return () => { cancelAnimationFrame(frame.current); document.removeEventListener('visibilitychange', hidden) }
  }, [settle])

  function choose(index: number) {
    if (index === active.current) return
    active.current = index
    setSelected(index) // Content and native selection change before the animation.
    cancelAnimationFrame(frame.current)
    const box = measured.current.boxes[index]
    if (!box || !shape.current || reduced) { settle(); return }
    const from = { ...shape.current }, to = targetShape(box)
    const vertical = Math.abs(to.y - from.y) > Math.abs(to.x - from.x)
    let start: number | undefined
    const tick = (now: number) => {
      start ??= now
      const t = Math.min(1, (now - start) / duration)
      const eased = t * t * (3 - 2 * t)
      const along = 1 - .18 * Math.sin(t * Math.PI) ** 2
      const neck = 1 - .42 * Math.sin(t * Math.PI) ** 2
      const mix = (a: number, b: number) => a + (b - a) * eased
      draw({ x: mix(from.x, to.x), y: mix(from.y, to.y),
        rx: mix(from.rx, to.rx) * (vertical ? neck : along),
        ry: mix(from.ry, to.ry) * (vertical ? along : neck) }, t)
      if (t < 1) frame.current = requestAnimationFrame(tick)
      else { frame.current = 0; draw(to) }
    }
    frame.current = requestAnimationFrame(tick)
  }
  function reset() {
    active.current = 0; setSelected(0); settle()
    setGap(48); setSoftness(12); setDuration(900); setCopy(initialCopy); setPlain(false); setSimulated(false)
  }

  const Container = embedded ? 'div' : 'main'
  return <Container id={embedded ? undefined : 'contenuto'}>
    {!embedded && <>
    <div className={shared.layout}>
      <Intro number="06" family="Materico · scheda 06" title="Liquido.">
        Una selezione che prende forma. Il materiale si avvicina, costruisce un ponte e si separa; parole, controlli e contenuti restano nitidi. È fusione grafica “gooey”, non una simulazione dell’acqua.
      </Intro>
      <Controls mobile={mobile} onReset={reset}>
        <Range id="liquid-gap" label="Distanza fra le forme" value={gap} min={36} max={96} step={4} unit="px" onChange={setGap} />
        <Range id="liquid-softness" label="Morbidezza / fusione" value={softness} min={6} max={18} unit="px" onChange={setSoftness} />
        <Range id="liquid-duration" label="Durata della transizione" value={duration} min={400} max={1400} step={100} unit="ms" onChange={setDuration} />
        <p className={shared.help}>Distanza: allunga il tratto libero. Morbidezza: estende il collo fra le forme. Durata: tempo del prossimo passaggio, non del contenuto. Su telefono distanza ×0,65, minimo 36px, e morbidezza ≤12px.</p>
        <details className={editor.editor}><summary>Modifica le descrizioni <span aria-hidden="true">＋</span></summary>
          {copy.map((text, i) => <div key={i}><label htmlFor={`liquid-copy-${i}`}>{names[i]}</label><textarea id={`liquid-copy-${i}`} rows={4} value={text} onChange={event => setCopy(current => current.map((entry, n) => n === i ? event.target.value : entry))} /></div>)}
        </details>
        <fieldset className={shared.comparison}><legend>Confronta lo stesso movimento</legend>
          <label><input type="radio" name="fusione" checked={!plain} onChange={() => setPlain(false)} /> Con fusione</label>
          <label><input type="radio" name="fusione" checked={plain} onChange={() => setPlain(true)} /> Senza fusione</label>
        </fieldset>
        <label className={shared.motion}><input type="checkbox" checked={simulated} onChange={event => setSimulated(event.target.checked)} /> Simula movimento ridotto</label>
        <p className={shared.help}>{systemReduced ? 'Movimento ridotto attivo nel sistema: ha sempre la precedenza.' : 'La simulazione si aggiunge alla preferenza del sistema.'} La scelta e la massa si assestano subito, senza ponte animato.</p>
      </Controls>
    </div>
    <div className={shared.sceneHead}><h2 id="liquid-scene-title">06 / Una scelta, una risposta</h2><p role="status">{!supported ? 'Filtro SVG non disponibile: forme nitide, selezione completa.' : reduced ? 'Movimento ridotto: selezione immediata, nessun ponte animato.' : plain ? 'Senza fusione: stessi corpi e percorso, nessun filtro.' : 'Fusione grafica · tre scelte, nessun movimento continuo.'}</p></div>
    </>}
    <section id={embedded ? undefined : 'scena'} className={styles.scene} aria-label={embedded ? 'Esplora i servizi' : undefined} aria-labelledby={embedded ? undefined : 'liquid-scene-title'} data-reduced={reduced} data-supported={supported} data-plain={plain}>
      <div className={styles.sceneIntro}><div><span className={shared.eyebrow}>Da dove cominciamo?</span><h2>Cosa vuoi esplorare?</h2></div><p>Tre modi di guardare un progetto.<br />Scegli con clic, tocco o frecce da tastiera. La risposta arriva subito.</p></div>
      <div ref={arena} className={styles.arena} style={{ '--gap': `${effectiveGap}px` } as CSSProperties}>
        <svg ref={material} className={styles.material} width="100%" height="100%" viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true" focusable="false" data-material>
          <defs><filter id={filterId} filterUnits="userSpaceOnUse" x="0" y="0" width={geometry.width} height={geometry.height} colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={effectiveSoftness} result="soft" />
            <feColorMatrix in="soft" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" />
          </filter></defs>
          <g filter={!plain && supported ? `url(#${filterId})` : undefined} data-goo-layer>
            {geometry.boxes.map((box, i) => <rect key={i} x={box.x} y={box.y} width={box.w} height={box.h} rx={box.h / 2} fill="#cdd4bb" />)}
            <ellipse ref={mass} fill="#d5fa54" data-mass />
          </g>
        </svg>
        <fieldset className={styles.choices}><legend className={styles.srOnly}>Cosa vuoi esplorare?</legend>
          {names.map((name, i) => <label key={name} ref={node => { labels.current[i] = node }} className={styles.choice} data-choice={i}>
            <input type="radio" name="esplorare" value={name} checked={selected === i} onChange={() => choose(i)} aria-controls={`liquid-description-${i}`} />
            <span className={styles.choiceName}>{name}</span><span className={styles.choiceState} aria-hidden="true">{selected === i ? '✓ Scelta attiva' : `0${i + 1} / Esplora`}</span>
          </label>)}
        </fieldset>
      </div>
      <div className={styles.response} aria-live="polite" aria-atomic="true">
        {copy.map((text, i) => <article key={i} id={`liquid-description-${i}`} aria-hidden={selected !== i} className={styles.description} data-active={selected === i}>
          <div><span className={shared.eyebrow}>0{i + 1} / Direzione scelta</span><h3>{names[i]}</h3></div>{embedded ? <div data-service-copy><p>{text}</p><ul>{embedded.activities[i].map(activity => <li key={activity}>{activity}</li>)}</ul></div> : <p>{text}</p>}
        </article>)}
      </div>
      {!embedded && <div className={styles.sceneFoot}><span>Il contenuto è immediato. Il materiale lo accompagna.</span><span>Studio dimostrativo / nessuna richiesta inviata</span></div>}
      {embedded && !supported && <p>Filtro non disponibile: la selezione resta completa, senza fusione.</p>}
    </section>
    {!embedded && <Notes nextHref="/vetro" nextTitle="Torna al vetro satinato">
      <p><strong>Il ponte è grafico.</strong> Tre superfici e una massa mobile condividono un filtro SVG: sfocatura più soglia alfa. La massa si stringe durante il passaggio, poi torna alla sua forma. Senza fusione vedi gli stessi corpi e lo stesso movimento, senza il collo morbido.</p>
      <p><strong>Prima la scelta.</strong> I radio sono nativi, nitidi e fermi; stato selezionato e descrizione cambiano subito. I testi non entrano mai nel filtro. Anche un passaggio dalla prima alla terza opzione conferma solo la destinazione, non quella attraversata.</p>
      <p><strong>Nessuna coda.</strong> Un nuovo input interrompe la traiettoria e riparte dalla posizione visibile. Scegliere di nuovo l’opzione attiva non riavvia nulla. Un cambio di geometria conclude il passaggio sulla scelta confermata: niente coordinate rimaste dalla disposizione precedente.</p>
      <p><strong>Mobile e lettura.</strong> Sul telefono le opzioni sono verticali e anche la massa percorre quell’asse. Le descrizioni condividono l’altezza della più lunga, così la selezione non sposta la pagina. Nessuno sticky o blocco dello scroll; con movimento ridotto il posizionamento è immediato.</p>
      <p><strong>Fallback e costo.</strong> Il filtro è confinato alla fascia decorativa, con margine per la fusione. Senza filtro rimangono forme nette e controlli completi. Il rilevamento delle API non garantisce il rendering in ogni browser: “Senza fusione” è anche un’alternativa esplicita. Prestazioni e compatibilità sui dispositivi reali restano da verificare.</p>
    </Notes>}
  </Container>
}
