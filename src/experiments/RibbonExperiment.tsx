import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Comparison, Controls, Intro, Notes, Range } from '../Workbench'
import { useEnvironment } from '../useEnvironment'
import shared from '../Workbench.module.css'
import editor from './ThreadExperiment.module.css'
import styles from './RibbonExperiment.module.css'

const initialProjects = [
  { title: 'Un quartiere, a passo lento.', description: 'Un atlante tascabile per orientarsi fra botteghe, cortili e spazi condivisi. La mappa diventa il punto di partenza di un piccolo sistema editoriale.', type: 'Atlante / identità editoriale', note: 'La mappa mette in relazione i luoghi; la stessa griglia ordina copertina, legenda e didascalie.' },
  { title: 'Fare spazio a chi fa.', description: 'Manifesti e inviti per un laboratorio aperto al quartiere. Un solo segno tiene insieme formati diversi, dal muro al biglietto da portare con sé.', type: 'Officina / comunicazione culturale', note: 'Il manifesto e il piccolo invito usano lo stesso linguaggio, ma non la stessa impaginazione.' },
  { title: 'La materia, da vicino.', description: 'Un quaderno di campioni per guardare le superfici prima di scegliere. Tipografia, margini e dettagli rendono consultabile una raccolta di materiali.', type: 'Materia / progetto di pubblicazione', note: 'Il dettaglio ravvicinato rende visibili gerarchia, margini e sistema di classificazione del quaderno.' },
]
const clamp = (n: number, max = 1) => Math.min(max, Math.max(0, n))
type Geometry = { travel: number; required: number; viewport: number }

export function ProjectVisual({ index }: { index: number }) {
  if (index === 0) return <div className={`${styles.visual} ${styles.atlas}`} role="img" aria-label="Studio di atlante: copertina scura con grande tipografia e mappa a griglia di luoghi numerati.">
    <div className={styles.atlasType} aria-hidden="true"><span>Atlante di quartiere / 01</span><strong>Vicino.<br />A piedi.</strong><span>Piccoli luoghi<br />in comune. ↗</span></div>
    <div className={styles.map} aria-hidden="true"><div className={styles.mapGrid}><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><span className={styles.mapOne}>01</span><span className={styles.mapTwo}>02</span><span className={styles.mapThree}>03</span><div className={styles.mapKey}>N ↑<br />Botteghe · cortili · incontri</div></div>
  </div>
  if (index === 1) return <div className={`${styles.visual} ${styles.workshop}`} role="img" aria-label="Studio di comunicazione: un manifesto verticale Officina aperta affiancato da un piccolo invito, con la stessa griglia e il segno circolare.">
    <div className={styles.poster} aria-hidden="true"><span>Uno spazio per fare insieme</span><strong>Officina<br />aperta.</strong><div className={styles.posterMark}>↗</div><span>Progettare · costruire · condividere</span></div>
    <div className={styles.ticket} aria-hidden="true"><span>Invito / studio 02</span><b>Si entra<br />con un’idea.</b><i>Si esce con<br />una domanda nuova.</i><span>Officina aperta ↗</span></div>
    <span className={styles.workshopLabel} aria-hidden="true">Un sistema, due scale.</span>
  </div>
  return <div className={`${styles.visual} ${styles.material}`} role="img" aria-label="Dettaglio di una doppia pagina del quaderno Materia: un grande numero 03, righe di classificazione e campioni grafici di superfici.">
    <div className={styles.spread} aria-hidden="true"><div className={styles.specimen}><span>Materia / quaderno di ricerca</span><strong>03</strong><div className={styles.swatches}><i /><i /><i /></div></div><div className={styles.specification}><span>Osservare<br />prima di scegliere.</span><b>Superfici.<br />Segni.<br />Possibilità.</b><div><span>01 / Grana</span><span>02 / Trama</span><span>03 / Luce</span></div><small>Dettaglio di impaginazione<br />Scala 1:1 — studio</small></div></div>
  </div>
}

export function RibbonExperiment() {
  const { systemReduced, mobile, height } = useEnvironment()
  const [distance, setDistance] = useState(100)
  const [width, setWidth] = useState(84)
  const [gap, setGap] = useState(48)
  const [projects, setProjects] = useState(initialProjects)
  const [normal, setNormal] = useState(false)
  const [simulated, setSimulated] = useState(false)
  const [geometry, setGeometry] = useState<Geometry>({ travel: 0, required: 0, viewport: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const scene = useRef<HTMLElement>(null)
  const rail = useRef<HTMLOListElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLDivElement>(null)
  const foot = useRef<HTMLDivElement>(null)
  const reduced = simulated || systemReduced
  const fits = geometry.required > 0 && geometry.required <= height - 16
  const animated = !normal && !reduced && fits && geometry.travel > 0
  const run = Math.max(1, geometry.travel) * distance / 100
  const progress = animated ? scrollProgress : 1
  const effectiveGap = mobile ? Math.min(gap, 48) : gap

  useLayoutEffect(() => {
    let alive = true
    const measure = () => {
      if (!alive) return
      const track = rail.current!, window = viewport.current!
      const panels = Array.from(track.children) as HTMLElement[]
      const railStyle = getComputedStyle(track)
      // Sum the actual laid-out widths, including both end gutters. This stays
      // valid in the static column too, without hidden measurement duplicates.
      const totalWidth = panels.reduce((sum, panel) => sum + panel.getBoundingClientRect().width, 0)
        + parseFloat(getComputedStyle(scene.current!).getPropertyValue('--gap')) * (panels.length - 1)
        + parseFloat(railStyle.paddingLeft) + parseFloat(railStyle.paddingRight)
      const required = heading.current!.offsetHeight + foot.current!.offsetHeight
        + Math.max(...panels.map(panel => panel.offsetHeight)) + 24
      const next = { travel: Math.max(0, totalWidth - window.clientWidth), required, viewport: window.clientWidth }
      setGeometry(old => old.travel === next.travel && old.required === next.required && old.viewport === next.viewport ? old : next)
    }
    const observer = new ResizeObserver(measure)
    ;[viewport.current!, rail.current!, heading.current!, foot.current!, ...Array.from(rail.current!.children)].forEach(element => observer.observe(element))
    document.fonts.ready.then(measure)
    document.fonts.addEventListener('loadingdone', measure)
    return () => { alive = false; observer.disconnect(); document.fonts.removeEventListener('loadingdone', measure) }
  }, [width, effectiveGap])

  useEffect(() => {
    if (!animated) return
    let frame = 0
    const update = () => { frame = 0; setScrollProgress(clamp(-scene.current!.getBoundingClientRect().top / run)) }
    const queue = () => { if (!frame) frame = requestAnimationFrame(update) }
    queue()
    window.addEventListener('scroll', queue, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', queue) }
  }, [animated, run, geometry])

  const revealFocus = useCallback(() => {
    const target = document.activeElement
    if (!(target instanceof HTMLElement) || !rail.current?.contains(target)) return
    if (!animated) { target.scrollIntoView({ block: 'nearest', behavior: 'instant' }); return }
    const panel = target.closest<HTMLElement>('[data-project]')!
    const panelBox = panel.getBoundingClientRect(), targetBox = target.getBoundingClientRect()
    if (panelBox.left >= 12 && panelBox.right <= geometry.viewport - 12 && targetBox.top >= 12 && targetBox.bottom <= height - 12) return
    const shift = clamp(panel.offsetLeft - (geometry.viewport - panel.offsetWidth) / 2, geometry.travel)
    const position = shift / geometry.travel
    const sceneTop = scene.current!.getBoundingClientRect().top + window.scrollY
    // Reveal in the same native vertical coordinate system as wheel/touch.
    // Apply synchronously before the browser's own focus scroll can run.
    rail.current.style.transform = `translate3d(${-shift}px, 0, 0)`
    window.scrollTo({ top: sceneTop + position * run, behavior: 'instant' })
    setScrollProgress(position)
  }, [animated, geometry, height, run])

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(revealFocus)
    return () => cancelAnimationFrame(frame)
  }, [revealFocus])

  function reset() {
    setDistance(100); setWidth(84); setGap(48); setProjects(initialProjects); setNormal(false); setSimulated(false)
  }
  function edit(index: number, key: 'title' | 'description', value: string) {
    setProjects(current => current.map((project, i) => i === index ? { ...project, [key]: value } : project))
  }
  const reason = reduced ? 'Movimento ridotto: tre progetti completi nel flusso verticale.'
    : normal ? 'Confronto: stessi progetti, nessuna traslazione né corsa aggiuntiva.'
      : !fits ? `Il contenuto richiede ${geometry.required}px di altezza utile: flusso completo, senza tagli.`
        : geometry.travel <= 0 ? 'Tutto entra nella finestra: non serve una corsa orizzontale.'
          : `Nastro attivo · spostamento ${Math.round(geometry.travel)}px · corsa verticale ${Math.round(run)}px`

  return <main id="contenuto">
    <div className={shared.layout}>
      <Intro number="04" family="Strutturale · scheda 05" title="Nastro orizzontale.">
        Un titolo fermo, tre composizioni da attraversare. Scorri verso il basso, fermati e risali: osserva il tempo per leggere, il primo ingresso e il passaggio dall’ultimo progetto al resto della pagina.
      </Intro>
      <Controls mobile={mobile} onReset={reset}>
        <Range id="ribbon-distance" label="Corsa verticale" value={distance} min={60} max={160} step={10} unit="% spostamento" onChange={setDistance} />
        <Range id="ribbon-width" label="Ampiezza composizioni" value={width} min={68} max={100} step={4} unit="% spazio utile" onChange={setWidth} />
        <Range id="ribbon-gap" label="Distanza fra composizioni" value={gap} min={16} max={96} step={8} unit="px" onChange={setGap} />
        <p className={shared.help}>100%: un pixel verticale per ogni pixel laterale. L’ampiezza varia fra i tre studi; ogni composizione rimane entro la finestra. Su telefono: distanza ≤48px.</p>
        <details className={editor.editor}><summary>Modifica i tre progetti <span aria-hidden="true">＋</span></summary>
          {projects.map((project, index) => <fieldset key={index}>
            <legend>Studio {index + 1}</legend>
            <label htmlFor={`ribbon-title-${index}`}>Titolo {index + 1}</label><input id={`ribbon-title-${index}`} value={project.title} onChange={event => edit(index, 'title', event.target.value)} />
            <label htmlFor={`ribbon-description-${index}`}>Descrizione {index + 1}</label><textarea id={`ribbon-description-${index}`} rows={3} value={project.description} onChange={event => edit(index, 'description', event.target.value)} />
          </fieldset>)}
        </details>
        <Comparison normal={normal} onNormal={setNormal} simulated={simulated} onSimulated={setSimulated} systemReduced={systemReduced} />
      </Controls>
    </div>
    <section className={styles.context} aria-labelledby="before-title"><div className={shared.eyebrow}>Prima del nastro / il contesto</div><div><h2 id="before-title">Tre modi di dare forma<br />a un’idea.</h2><p>Una piccola selezione di studi dimostrativi, realizzati per questo banco. Non sono lavori per clienti né risultati commerciali: servono a mettere alla prova scala, gerarchia e ritmo.</p></div></section>
    <div className={shared.sceneHead}><h2 id="scene-title">04 / Studi in sequenza</h2><p role="status" aria-label="Stato della scena">{reason}</p></div>
    <section ref={scene} id="scena" className={styles.scene} aria-labelledby="scene-title" data-animated={animated} data-progress={progress} data-travel={geometry.travel} data-run={run} data-required={geometry.required}
      style={{ '--window-height': `${height}px`, '--run': `${run}px`, '--amplitude': width / 100, '--gap': `${effectiveGap}px` } as CSSProperties}>
      <div className={styles.stage} data-ribbon-stage>
        <div ref={heading} className={styles.heading}><div><span>Selezione / tre studi dimostrativi</span><h2>Idee che prendono spazio.</h2></div><p>{animated ? 'Continua a scendere. Il percorso va di lato.' : 'Tre studi, un unico percorso di lettura.'}</p></div>
        <div ref={viewport} className={styles.window} data-ribbon-window>
          <ol ref={rail} className={styles.rail} role="list" aria-label="Progetti dimostrativi" onFocusCapture={revealFocus} style={{ transform: animated ? `translate3d(${-geometry.travel * progress}px, 0, 0)` : 'none' }}>
            {projects.map((project, index) => <li key={index} data-project={index} className={styles.project}>
              <ProjectVisual index={index} />
              <div className={styles.caption}><div><span className={styles.projectType}>0{index + 1} / {project.type}</span><h3>{project.title.trim() || `Studio ${index + 1}`}</h3></div><div><p>{project.description}</p><a href={`#studio-${index + 1}`}>Nota sullo studio 0{index + 1} <span aria-hidden="true">↗</span></a></div></div>
            </li>)}
          </ol>
        </div>
        <div ref={foot} className={styles.foot}><span>{animated ? '↓ Scroll verticale / lettura orizzontale' : '↓ Flusso verticale / tutti i contenuti'}</span><span aria-hidden="true">{animated ? `${Math.round(progress * 100)}%` : '01 — 03'}</span></div>
      </div>
    </section>
    <section id="dopo-nastro" className={`${styles.context} ${styles.after}`} aria-labelledby="after-title"><div className={shared.eyebrow}>Dopo il nastro / di nuovo in pagina</div><div><h2 id="after-title">Cambia il formato.<br />Resta il criterio.</h2><p>Il nastro mette gli studi in relazione; non sostituisce una pagina di progetto. Qui riprende la lettura verticale, con una nota su ciò che ogni composizione vuole rendere visibile.</p><div className={styles.projectNotes}>{projects.map((project, index) => <p key={index} id={`studio-${index + 1}`} tabIndex={-1}><strong>0{index + 1} / {project.type.split(' / ')[0]}.</strong> {project.note}</p>)}</div></div></section>
    <Notes nextHref="/filo-che-si-disegna" nextTitle="Torna al filo che si disegna">
      <p><strong>Una selezione, non tre card uguali.</strong> Una mappa editoriale ampia, un manifesto con invito sfalsato, un dettaglio di pubblicazione: i visual sono costruiti in HTML/CSS. I nomi sono dimostrativi. Nessun marchio, cliente o risultato reale è implicato.</p>
      <p><strong>La geometria determina la corsa.</strong> Si misurano le tre larghezze, le distanze e i margini. Il nastro si ferma quando l’ultimo progetto è interamente visibile; da lì lo sticky si rilascia senza una coda vuota. Font, testi, regolazioni e resize aggiornano le misure.</p>
      <p><strong>Telefono, finestre basse e testi lunghi.</strong> Il titolo diventa compatto, i visual cambiano proporzioni e le didascalie si dispongono in colonna. L’effetto resta attivo finché titolo, composizione più alta e indicazioni entrano nella finestra. Altrimenti tutta la selezione va in flusso, senza scroller interni. La misura richiesta è indicata sopra la scena.</p>
      <p><strong>Tastiera e movimento ridotto.</strong> Tab e Maiusc+Tab portano il progetto focalizzato in vista spostando la pagina alla posizione verticale corrispondente. Non serve trascinare. Con movimento ridotto o nel confronto statico gli stessi elementi diventano una colonna, senza duplicazioni e senza corsa aggiuntiva.</p>
      <p><strong>Il costo di attraversare.</strong> Una corsa breve accelera il passaggio, una lunga chiede più scroll. Il banco usa tre studi, anche se la scheda storica consiglia serie più numerose: qui testiamo composizioni ampie, non una lista. Nel sito destinatario va verificato il budget massimo di +25% sull’intera pagina.</p>
    </Notes>
  </main>
}
