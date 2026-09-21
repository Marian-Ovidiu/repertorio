import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Comparison } from '../Workbench'
import { useEnvironment } from '../useEnvironment'
import { LiquidExperiment } from '../experiments/LiquidExperiment'
import { ProjectVisual } from '../experiments/RibbonExperiment'
import shared from '../Workbench.module.css'
import styles from './CompositionPage.module.css'

const introduction = 'Progettiamo identità e siti web per chi apre un’attività, cambia direzione o vuole farsi capire meglio.'
const projects = [
  { title: 'Vicino, a piedi.', type: 'Identità / guida di quartiere', text: 'Una mappa per trovare botteghe e spazi in comune. Lo stesso sistema di segni tiene insieme la guida e i suoi piccoli formati.', visual: 0 },
  { title: 'Officina aperta.', type: 'Sito web / laboratorio condiviso', text: 'Un sito per capire come funziona uno spazio, trovare un’attività e preparare la prima visita. Poche informazioni, nel posto giusto.', visual: 1 },
  { title: 'Materia, in ordine.', type: 'Identità / archivio di materiali', text: 'Un quaderno per confrontare superfici e trame. Numeri, campioni e descrizioni brevi trasformano una raccolta in uno strumento da usare.', visual: 2 },
]
const services = {
  copy: [
    'Mettere a fuoco ciò che rende riconoscibile un’attività, poi tradurlo in un linguaggio che si possa usare ogni giorno.',
    'Organizzare contenuti e percorsi intorno alle domande delle persone, dal primo schema fino al sito funzionante.',
    'Rendere chiaro cosa si può fare e cosa è appena successo. Il movimento serve alla comprensione, non a riempire lo schermo.',
  ],
  activities: [
    ['Direzione visiva e sistema di segni', 'Tipografia e palette', 'Applicazioni e guida all’uso'],
    ['Struttura dei contenuti', 'Design responsive e prototipo', 'Sviluppo e verifica accessibile'],
    ['Flussi e stati dell’interfaccia', 'Prototipi interattivi', 'Test di tastiera e movimento ridotto'],
  ],
}
const clamp = (n: number) => Math.max(0, Math.min(1, n))

export function CompositionPage() {
  const { mobile, height, systemReduced } = useEnvironment()
  const [normal, setNormal] = useState(false)
  const [simulated, setSimulated] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [introHeight, setIntroHeight] = useState(0)
  const [cardHeights, setCardHeights] = useState<number[]>([])
  const [lit, setLit] = useState(0)
  const intro = useRef<HTMLElement>(null)
  const introContent = useRef<HTMLDivElement>(null)
  const stack = useRef<HTMLDivElement>(null)
  const still = normal || simulated || systemReduced
  // Header is in normal flow. One inset serves sticky positions and anchors.
  const inset = 24
  const step = mobile ? 18 : 28
  const top = mobile ? 32 : 48
  const gap = height * (mobile ? .18 : .24)
  const run = height * (mobile ? .32 : .5)
  const covers = cardHeights.map((own, index) => Math.max(own,
    ...cardHeights.slice(0, index).map((previous, i) => previous - (index - i) * step)))
  const textAnimated = !still && introHeight > 0 && introHeight <= height - inset * 2
  const cardsAnimated = !still && covers.length === 3 && covers.every((h, i) => h + top + i * step <= height - 52)
  const words = introduction.match(/\S+/g) ?? []

  useLayoutEffect(() => {
    const content = introContent.current!
    const cards = Array.from(stack.current!.querySelectorAll<HTMLElement>('[data-project-content]'))
    const measure = () => {
      setIntroHeight(Math.ceil(content.offsetHeight))
      setCardHeights(cards.map(card => Math.ceil(card.offsetHeight)))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(content); cards.forEach(card => observer.observe(card))
    document.fonts.ready.then(measure)
    return () => observer.disconnect()
  }, [])

  // The approved text mechanism: scroll position alone determines emphasis.
  useEffect(() => {
    if (!textAnimated) return
    let frame = 0
    const update = () => {
      frame = 0
      setLit(Math.round(clamp((inset - intro.current!.getBoundingClientRect().top) / run) * words.length))
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(update) }
    queue(); window.addEventListener('scroll', queue, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', queue) }
  }, [textAnimated, run, words.length])

  // Same deterministic choreography as Composta, with three sheets and a short tail.
  useEffect(() => {
    if (!cardsAnimated) return
    const element = stack.current!
    const items = Array.from(element.querySelectorAll<HTMLElement>('[data-project-slot]'))
    let frame = 0
    const update = () => {
      frame = 0
      let naturalTop = element.getBoundingClientRect().top
      items.forEach((item, i) => {
        const arriving = clamp((naturalTop - top - i * step) / (height * .72))
        const next = naturalTop + item.offsetHeight + gap
        const buried = i === items.length - 1 ? 0 : clamp(1 - (next - top - (i + 1) * step) / (height * .65))
        const x = ([-.45, 1, -.9][i] * (1 - arriving) + [-.25, 1, -1.2][i] * arriving) * (mobile ? 9 : Math.min(112, element.clientWidth * .12)) * .7
        const angle = ([-3, 9, -8][i] * arriving + [-3.8, 4.5, -2.8][i] * (1 - arriving) * (.45 + .55 * buried)) * .6 * (mobile ? .35 : 1)
        item.style.setProperty('--x', `${x}px`)
        item.style.setProperty('--angle', `${angle}deg`)
        item.style.setProperty('--scale', String(1 - buried * (mobile ? .015 : .04)))
        naturalTop += item.offsetHeight + gap
      })
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(queue); observer.observe(element)
    queue(); window.addEventListener('scroll', queue, { passive: true })
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', queue) }
  }, [cardsAnimated, height, mobile, top, step, gap])

  // Direct hashes are resolved after the initial measurements, not before the
  // scroll scenes acquire their real height. No global scroll-padding is added.
  useEffect(() => {
    let frame = 0
    const anchor = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => {
        const id = decodeURIComponent(window.location.hash.slice(1))
        if (id) document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' })
      }) })
    }
    anchor(); window.addEventListener('hashchange', anchor)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('hashchange', anchor) }
  }, [])

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement
      if (!(active instanceof HTMLElement) || !stack.current?.contains(active)) return
      const box = active.getBoundingClientRect()
      if (box.top < inset || box.bottom > height - inset) active.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [height, cardHeights, cardsAnimated])

  function reset() { setNormal(false); setSimulated(false); setResetKey(key => key + 1) }
  let wordIndex = 0
  return <main id="contenuto" className={styles.page} style={{ '--anchor-offset': `${inset}px` } as CSSProperties}>
    <div className={styles.utility}>
      <span>Studio indipendente / una pagina dimostrativa</span>
      <details className={styles.panel} id="opzioni"><summary>Opzioni della prova <span aria-hidden="true">＋</span></summary>
        <div><Comparison normal={normal} onNormal={setNormal} simulated={simulated} onSimulated={setSimulated} systemReduced={systemReduced} />
          <button className={shared.reset} onClick={reset}>Ripristina la pagina ↺</button>
          <p>Le regolazioni dettagliate restano nelle <a href="/">singole prove</a>. Se il contenuto non entra in altezza, la relativa scena torna in flusso.</p>
        </div>
      </details>
    </div>

    <section id="introduzione" ref={intro} className={styles.intro} data-animated={textAnimated} data-lit={textAnimated ? lit : words.length} aria-labelledby="intro-title" style={{ '--intro-height': `${introHeight}px`, '--run': `${run}px` } as CSSProperties}>
      <div ref={introContent} className={styles.introContent}>
        <p className={styles.kicker}>Identità visiva + siti web</p>
        <h1 id="intro-title"><span className={styles.srOnly}>{introduction}</span><span aria-hidden="true">{introduction.split(/(\s+)/).map((word, i) => /^\s+$/.test(word) ? <Fragment key={i}>{word}</Fragment> : <span key={i} data-lit={!textAnimated || wordIndex++ < lit}>{word}</span>)}</span></h1>
        <div className={styles.introFoot}><p>Dal primo segno al sito funzionante.<br />Un linguaggio riconoscibile, pensato per l’uso.</p><a href="#progetti">Guarda i tre studi <span aria-hidden="true">↓</span></a></div>
      </div>
    </section>

    <section id="progetti" className={styles.projects} aria-labelledby="projects-title">
      <div className={styles.sectionHead}><div><span className={styles.kicker}>01 / Una selezione</span><h2 id="projects-title">Tre modi di dare forma<br />a un’idea concreta.</h2></div><p>Una guida, un laboratorio, un archivio.<br />Studi dimostrativi, non lavori commissionati: tre occasioni per mettere insieme identità, contenuti e uso.</p></div>
      <div ref={stack} className={styles.stack} data-animated={cardsAnimated} style={{ '--step': `${step}px`, '--top': `${top}px`, '--gap': `${gap}px`, '--tail': `${height * .1}px` } as CSSProperties}>
        {projects.map((project, i) => <article key={project.title} className={styles.slot} data-project-slot style={{ '--index': i, '--cover': `${cardsAnimated ? covers[i] : 0}px` } as CSSProperties} aria-labelledby={`project-${i}`}>
          <div className={styles.surface}><div data-project-content className={styles.projectContent}>
            <div className={styles.projectMeta}><span>0{i + 1} / Studio dimostrativo</span><span>{project.type}</span></div>
            <div className={styles.visual}>{i === 1 ? <div className={styles.webVisual} role="img" aria-label="Proposta di sito Officina aperta: titolo grande, segno circolare e programma delle attività su un pannello laterale."><div className={styles.webPoster} aria-hidden="true"><span>OFFICINA APERTA</span><strong>Uno spazio<br />per fare.</strong><i>↗</i></div><div className={styles.webPage} aria-hidden="true"><span>Il laboratorio / Le attività</span><h4>Si comincia<br />da un’idea.</h4><div><b>01</b> Disegnare insieme</div><div><b>02</b> Capire i materiali</div><div><b>03</b> Costruire un prototipo</div><small>Un programma, tre punti di partenza.</small></div></div> : <ProjectVisual index={project.visual} />}</div>
            <div className={styles.caption}><h3 id={`project-${i}`}>{project.title}</h3><div><p>{project.text}</p><a href="#servizi">Come affrontiamo il progetto <span aria-hidden="true">↗</span></a></div></div>
          </div></div>
        </article>)}
      </div>
    </section>

    <section id="servizi" className={styles.services} aria-label="Servizi dello studio">
      <div className={styles.serviceLead}><span className={styles.kicker}>02 / Dal progetto al lavoro</span><p>Si può partire da un’identità, da un sito o da un passaggio che non funziona. Il punto è scegliere che cosa serve, prima di disegnarlo.</p></div>
      <LiquidExperiment key={resetKey} embedded={{ reduced: still, ...services }} />
    </section>
    <section id="chiusura" className={styles.closing} aria-labelledby="closing-title">
      <div><span className={styles.kicker}>Una prova, non un portfolio</span><h2 id="closing-title">Qui si studia<br />come stanno insieme.</h2></div>
      <div><p>Questa pagina combina lettura, progetti e scelta. Lo studio e i progetti sono dimostrativi: nessun cliente o risultato commerciale è rappresentato.</p><a href="/">Esplora le sei prove del Repertorio <span aria-hidden="true">↗</span></a></div>
    </section>
  </main>
}
