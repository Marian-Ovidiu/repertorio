import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Comparison, Composition, Controls, Intro, Notes, Range } from '../Workbench'
import { useEnvironment } from '../useEnvironment'
import shared from '../Workbench.module.css'
import styles from './CardsExperiment.module.css'
import editor from './ThreadExperiment.module.css'

const initialCards = [
  { title: 'Guardare da vicino.', tag: 'Osservazione', text: [
    'Prima di disegnare, passiamo una mattina nel laboratorio. Guardiamo come entrano i materiali e dove si fermano le persone.',
  ], detail: 'Una visita. Un quaderno. Le domande giuste.', link: 'Cosa osservare nella pila' },
  { title: 'Mettere tutto sul tavolo.', tag: 'Scelta', text: [
    'Fotografie, appunti e campioni diventano una mappa condivisa. Raggruppiamo ciò che serve, separiamo ciò che distrae.',
    'Scegliamo insieme tre priorità: un ingresso chiaro, un piano di lavoro libero e uno spazio in cui conservare gli attrezzi.',
  ], detail: 'Tre priorità, prima delle soluzioni.', link: 'Leggi i criteri di lettura' },
  { title: 'Provare, poi correggere.', tag: 'Prototipo', text: [
    'Costruiamo un modello in scala reale con legno di recupero. La prima versione del banco è troppo profonda: chi lavora non raggiunge gli utensili sul fondo senza piegarsi.',
    'Riduciamo la profondità, spostiamo la morsa e lasciamo libero il passaggio verso la finestra. Poi chiediamo a due persone di lavorarci per un pomeriggio, usando gli attrezzi di tutti i giorni.',
    'Annotiamo anche quello che non funziona: la luce sul piano, il rumore del cassetto, lo spazio per appoggiare un pezzo lungo. Solo dopo questa prova fissiamo le misure. Il modello può ancora cambiare; il mobile finito molto meno.',
  ], detail: 'Questa è la card lunga: prova a leggere fino a qui.', link: 'Vai alle note sul contenuto lungo' },
  { title: 'Lasciare spazio all’uso.', tag: 'Consegna', text: [
    'Il banco entra in laboratorio. Torniamo dopo un mese per capire cosa ha trovato il suo posto e cosa va ancora spostato.',
  ], detail: 'Un progetto continua nelle mani di chi lo usa.', link: 'Concludi la prova' },
]

export function CardsExperiment() {
  const { systemReduced, mobile, height } = useEnvironment()
  const [step, setStep] = useState(32)
  const [top, setTop] = useState(48)
  const [space, setSpace] = useState(35)
  const [composed, setComposed] = useState(false)
  const [offset, setOffset] = useState(70)
  const [rotation, setRotation] = useState(60)
  const [cards, setCards] = useState(initialCards)
  const [normal, setNormal] = useState(false)
  const [simulated, setSimulated] = useState(false)
  const [heights, setHeights] = useState<number[]>([])
  const stack = useRef<HTMLDivElement>(null)
  const effectiveStep = mobile ? Math.min(step, 20) : step
  const effectiveTop = Math.max(mobile ? Math.min(top, 32) : top, composed ? (mobile ? 12 : Math.ceil(32 * rotation / 100) + 12) : 0)
  const effectiveSpace = mobile ? Math.min(space, 25) : space
  // A shorter incoming card covers the previous card down to its bottom edge.
  // Measure inner content, unaffected by this outer minimum height, to avoid feedback.
  const coveredHeights = heights.map((ownHeight, index) => Math.max(ownHeight,
    ...heights.slice(0, index).map((previousHeight, previousIndex) => previousHeight - (index - previousIndex) * effectiveStep)))
  const fits = coveredHeights.length === cards.length && coveredHeights.every((cardHeight, index) => cardHeight + effectiveTop + index * effectiveStep <= height - (composed ? 52 : 24))
  const reduced = simulated || systemReduced
  const animated = !normal && !reduced && fits
  const tail = height * (composed ? .16 : .35)

  useLayoutEffect(() => {
    const elements = Array.from(stack.current?.querySelectorAll<HTMLElement>('[data-card-content]') ?? [])
    const observer = new ResizeObserver(() => setHeights(elements.map(element => element.offsetHeight + 2)))
    elements.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    // A resize can move a still-focused link after the browser's native focus scroll.
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement
      if (!(active instanceof HTMLElement) || !stack.current?.contains(active)) return
      const box = active.getBoundingClientRect()
      if (box.top < 8 || box.bottom > height - 8) active.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [height, heights, animated, composed])

  useEffect(() => {
    const element = stack.current
    if (!element || !composed || !animated) return
    const items = Array.from(element.querySelectorAll<HTMLElement>('[data-card-slot]'))
    let frame = 0
    const clamp = (n: number) => Math.max(0, Math.min(1, n))
    const update = () => {
      frame = 0
      const stackTop = element.getBoundingClientRect().top
      const gap = height * effectiveSpace / 100
      let naturalTop = stackTop
      items.forEach((item, index) => {
        // Flow positions, not transformed/stuck bounds: exactly reversible, no easing clock.
        const remaining = naturalTop - effectiveTop - index * effectiveStep
        const arriving = clamp(remaining / (height * .72))
        const nextTop = naturalTop + item.offsetHeight + gap
        const buried = index === 3 ? 0 : clamp(1 - (nextTop - effectiveTop - (index + 1) * effectiveStep) / (height * .65))
        const sideways = [-.45, 1, -.9, .35][index]
        const entry = [-.25, 1, -1.2, .7][index]
        const restAngle = [-3.8, 4.5, -2.8, 1.4][index]
        const entryAngle = [-3, 9, -8, 5][index]
        const x = (sideways * (1 - arriving) + entry * arriving) * (mobile ? 9 : Math.min(112, element.clientWidth * .12)) * offset / 100
        const angle = (entryAngle * arriving + restAngle * (1 - arriving) * (.45 + .55 * buried)) * rotation / 100 * (mobile ? .35 : 1)
        item.style.setProperty('--x', `${x}px`)
        item.style.setProperty('--angle', `${angle}deg`)
        item.style.setProperty('--scale', `${1 - buried * (mobile ? .015 : .04)}`)
        naturalTop += item.offsetHeight + gap
      })
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(queue)
    observer.observe(element)
    queue()
    window.addEventListener('scroll', queue, { passive: true })
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', queue) }
  }, [composed, animated, height, effectiveSpace, effectiveTop, effectiveStep, mobile, offset, rotation])

  function reset() {
    setStep(32); setTop(48); setSpace(35); setOffset(70); setRotation(60); setCards(initialCards); setNormal(false); setSimulated(false)
  }

  const reason = reduced ? 'Movimento ridotto: quattro card in flusso normale.'
    : normal ? 'Confronto: quattro card in flusso normale.'
      : !fits ? 'Una card non entra nella finestra: tutta la serie resta in flusso, leggibile fino in fondo.'
        : `Pila attiva · gradino ${effectiveStep}px · aggancio ${effectiveTop}px · ingressi ${effectiveSpace}% finestra`

  return <main id="contenuto">
    <div className={shared.layout}>
      <Intro number="02" family="Strutturale" title="Card impilate.">
        Quattro fasi di un lavoro diventano una pila. Osserva i bordi che restano visibili e il tempo per leggere ogni card, soprattutto la più lunga. Poi risali e prova i link con Tab.
      </Intro>
      <Controls mobile={mobile} onReset={reset}>
        <Composition composed={composed} onChange={setComposed} />
        <Range id="step" label="Distanza visibile nella pila" value={step} min={12} max={56} step={4} unit="px" onChange={setStep} />
        <Range id="top" label="Aggancio dall’alto" value={top} min={16} max={120} step={8} unit="px" onChange={setTop} />
        <Range id="space" label="Spazio fra gli ingressi" value={space} min={10} max={70} step={5} unit="% finestra" onChange={setSpace} />
        {composed && <>
          <Range id="card-offset" label="Intensità dello sfalsamento" value={offset} min={0} max={100} step={5} unit="%" onChange={setOffset} />
          <Range id="card-rotation" label="Intensità delle rotazioni" value={rotation} min={0} max={100} step={5} unit="%" onChange={setRotation} />
        </>}
        {mobile && <p className={shared.help}>Su telefono: gradino ≤20px, aggancio ≤32px, ingressi ≤25%.</p>}
        <details className={editor.editor}>
          <summary>Modifica le quattro card <span aria-hidden="true">＋</span></summary>
          {cards.map((card, index) => <fieldset key={index}>
            <legend>Card {index + 1}</legend>
            <label htmlFor={`card-title-${index}`}>Titolo {index + 1}</label>
            <input id={`card-title-${index}`} value={card.title} onChange={event => setCards(current => current.map((value, i) => i === index ? { ...value, title: event.target.value } : value))} />
            <label htmlFor={`card-description-${index}`}>Descrizione {index + 1}</label>
            <textarea id={`card-description-${index}`} rows={4} value={card.text.join('\n\n')} onChange={event => setCards(current => current.map((value, i) => i === index ? { ...value, text: event.target.value.split('\n\n') } : value))} />
          </fieldset>)}
        </details>
        <Comparison normal={normal} onNormal={setNormal} simulated={simulated} onSimulated={setSimulated} systemReduced={systemReduced} />
      </Controls>
    </div>
    <div className={shared.sceneHead}><h2 id="scene-title">02 / Dal sopralluogo all’uso</h2><p role="status" aria-label="Stato della scena">{reason}</p></div>
    <section id="scena" className={styles.scene} aria-labelledby="scene-title">
      <div ref={stack} className={`${styles.stack} ${composed ? styles.composed : ''}`} data-composed={composed} data-animated={animated} style={{
        '--step': `${effectiveStep}px`, '--top': `${effectiveTop}px`, '--space': `${height * effectiveSpace / 100}px`, '--tail': `${tail}px`,
      } as CSSProperties}>
        {cards.map((card, index) => <article key={card.tag} data-card-slot className={styles.card} style={{ '--index': index, '--cover-height': `${animated ? coveredHeights[index] : 0}px` } as CSSProperties} aria-labelledby={`card-${index}`}>
          <div className={styles.surface}>
          <div className={styles.cardContent} data-card-content>
          <div className={styles.cardTop}><span>{String(index + 1).padStart(2, '0')} / 04</span><span>{card.tag}</span></div>
          <div className={styles.cardBody}>
            <h3 id={`card-${index}`}>{card.title}</h3>
            <div className={styles.copy}>{card.text.map((text, i) => <p key={i}>{text}</p>)}
              <p className={styles.detail}>{card.detail}</p>
              <a href="#note">{card.link} <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          </div>
          </div>
        </article>)}
      </div>
    </section>
    <Notes nextHref="/accensione-del-testo" nextTitle="Prova l’accensione del testo">
      <p><strong>Essenziale / Composta.</strong> La prima mette in evidenza lo sticky. La seconda costruisce una pila asimmetrica: base a sinistra, arrivo da destra, controcampo da sinistra, chiusura quasi centrale. Le inclinazioni si attenuano nella fase di lettura, poi i fogli arretrano quando entra il successivo. Nessun valore casuale. I testi modificati sono condivisi fra le due varianti; il ripristino mantiene la variante scelta.</p>
      <p><strong>Disordine, entro un margine.</strong> Sul telefono sfalsamenti e angoli sono ridotti. Se la card lunga non entra, anche la versione composta rinuncia a sticky e trasformazioni. Con il focus la card torna diritta e davanti alle altre: la tastiera interrompe intenzionalmente la coreografia per rendere leggibile il link.</p>
      <p><strong>Una collezione, non un confronto.</strong> I bordi suggeriscono che le fasi fanno parte di un percorso. Per confrontare i contenuti, usa la versione in flusso normale. Risalendo, ogni card torna leggibile.</p>
      <p><strong>Su telefono e finestre basse.</strong> Gradino, aggancio e spazio di ingresso si riducono. Misuriamo le card: se anche una sola non entra sotto il suo aggancio, tutta la serie torna nel flusso. Una card alta può così attraversare lo schermo ed essere letta fino all’ultima riga.</p>
      <p><strong>Tastiera e movimento ridotto.</strong> Con Tab e Maiusc+Tab, la card che contiene il link attivo passa davanti alla pila. Il bordo del focus resta visibile. Con movimento ridotto, agganci e spazi aggiuntivi scompaiono; contenuti e link restano in ordine.</p>
      <p><strong>Il limite della pila.</strong> Una card successiva copre parte della precedente: per rileggere con il tocco occorre risalire o scegliere il flusso normale. Le card più brevi estendono il proprio fondo per coprire quelle già impilate. I testi lunghi rendono l’effetto meno adatto, anche quando entrano nella finestra.</p>
      <p><strong>Lo spazio è parte del costo.</strong> Ingressi e coda allungano questa prova isolata. Prima di usarla in un progetto, verifica il limite di +25% sull’altezza dell’intera pagina.</p>
    </Notes>
  </main>
}
