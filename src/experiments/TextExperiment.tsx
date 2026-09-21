import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Comparison, Controls, Intro, Notes, Range } from '../Workbench'
import { useEnvironment } from '../useEnvironment'
import shared from '../Workbench.module.css'
import styles from './TextExperiment.module.css'

const initialPhrases = [
  'La porta si apre sul giardino.',
  'Al mattino, la luce attraversa la cucina e raggiunge il tavolo dove facciamo colazione.',
  'Abbiamo lasciato il vecchio banco vicino alla finestra: qui si riparano le sedie, si disegnano nuovi oggetti e si prendono le misure prima di tagliare il legno.',
]

export function TextExperiment() {
  const { systemReduced, mobile, height } = useEnvironment()
  const [distance, setDistance] = useState(120)
  const [size, setSize] = useState(48)
  const [intensity, setIntensity] = useState(65)
  const [phrases, setPhrases] = useState(initialPhrases)
  const [normal, setNormal] = useState(false)
  const [simulated, setSimulated] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const [activeWords, setActiveWords] = useState(0)
  const scene = useRef<HTMLElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const reduced = simulated || systemReduced
  const words = phrases.flatMap(phrase => phrase.match(/\S+/g) ?? [])
  const fits = contentHeight > 0 && contentHeight <= height - 144
  const animated = !normal && !reduced && fits && words.length > 0
  const effectiveDistance = mobile ? Math.min(distance, 100) : distance
  const effectiveSize = mobile ? Math.max(24, Math.round(size * .64)) : size
  // Waiting words remain readable: minimum opacity .56 on a solid light field.
  const waitingOpacity = 1 - intensity / 100 * .44
  const run = height * effectiveDistance / 100

  useLayoutEffect(() => {
    const element = content.current
    if (!element) return
    const observer = new ResizeObserver(() => setContentHeight(Math.ceil(element.getBoundingClientRect().height)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = scene.current
    if (!element || !animated) return
    let frame = 0
    let visible = true
    const update = () => {
      frame = 0
      const progress = Math.min(1, Math.max(0, -element.getBoundingClientRect().top / run))
      setActiveWords(Math.round(progress * words.length))
    }
    const schedule = () => { if (visible && !frame) frame = requestAnimationFrame(update) }
    // The observer also updates on exit, including a jump across the entire scene.
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() })
    observer.observe(element)
    frame = requestAnimationFrame(update)
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
    }
  }, [animated, run, words.length])

  function reset() {
    setDistance(120); setSize(48); setIntensity(65); setPhrases(initialPhrases)
    setNormal(false); setSimulated(false)
  }

  const reason = reduced ? 'Movimento ridotto: testo completo in flusso normale.'
    : normal ? 'Confronto: testo completo in flusso normale.'
      : !words.length ? 'Scrivi una frase nelle regolazioni per iniziare.'
        : !fits ? 'Il testo supera lo spazio disponibile: flusso normale, senza tagli.'
          : `Scena animata · corsa ${effectiveDistance}% della finestra · testo ${effectiveSize}px`
  let wordIndex = 0

  return <main id="contenuto">
    <div className={shared.layout}>
      <Intro number="01" family="Editoriale" title="Accensione del testo.">
        Le parole prendono enfasi, una alla volta. Osserva il ritmo delle tre frasi: scorri piano, fermati, poi torna indietro. La posizione decide cosa si accende.
      </Intro>
      <Controls mobile={mobile} onReset={reset}>
        <Range id="distance" label="Distanza di scroll" value={distance} min={40} max={240} step={10} unit="% finestra" onChange={setDistance} />
        <Range id="size" label="Dimensione del testo" value={size} min={32} max={72} step={2} unit="px" onChange={setSize} />
        <Range id="intensity" label="Differenza di enfasi" value={intensity} min={0} max={100} step={5} unit="%" onChange={setIntensity} />
        {mobile && <p className={shared.help}>Su telefono: corpo {effectiveSize}px, corsa al massimo 100% della finestra.</p>}
        <details className={styles.editor}>
          <summary>Modifica le tre frasi <span aria-hidden="true">＋</span></summary>
          {phrases.map((phrase, index) => <div key={index}><label htmlFor={`phrase-${index}`}>Frase {index + 1}</label>
            <textarea id={`phrase-${index}`} rows={index + 2} value={phrase} onChange={event => {
              const next = [...phrases]; next[index] = event.target.value; setPhrases(next)
            }} />
          </div>)}
        </details>
        <Comparison normal={normal} onNormal={setNormal} simulated={simulated} onSimulated={setSimulated} systemReduced={systemReduced} />
      </Controls>
    </div>
    <div className={shared.sceneHead}>
      <h2 id="scene-title">01 / Una stanza, tre sguardi</h2>
      <p role="status" aria-label="Stato della scena">{reason}</p>
    </div>
    <section ref={scene} id="scena" aria-labelledby="scene-title" className={styles.scene}
      data-animated={animated} data-active-words={animated ? activeWords : words.length}
      style={{ '--scene-height': `${height}px`, '--run': `${run}px`, '--text-size': `${effectiveSize}px`, '--waiting': waitingOpacity } as CSSProperties}>
      <div className={styles.stage}>
        <div className={styles.stageLabel} aria-hidden="true"><span>Il tempo di leggere</span><span>{animated ? `${String(activeWords).padStart(2, '0')} / ${words.length} parole` : 'Tutte le parole, subito'}</span></div>
        <div className={styles.text} ref={content}>
          {phrases.map((phrase, index) => <p key={index}>
            <span className={styles.srOnly}>{phrase}</span>
            <span aria-hidden="true">{phrase.split(/(\s+)/).map((part, partIndex) => {
              if (!part || /^\s+$/.test(part)) return <Fragment key={partIndex}>{part}</Fragment>
              const lit = !animated || wordIndex++ < activeWords
              return <span key={partIndex} className={styles.word} data-accesa={lit}>{part}</span>
            })}</span>
          </p>)}
        </div>
        <div className={styles.stageFoot} aria-hidden="true"><span>{animated ? 'Scorri per accendere. Risali per spegnere.' : 'Una lettura continua, senza attese.'}</span><span>↓</span></div>
      </div>
    </section>
    <Notes nextHref="/card-impilate" nextTitle="Prova le card impilate">
      <p><strong>Il ritmo ha un costo.</strong> La corsa si aggiunge all’altezza della finestra: 120% significa 1,2 finestre di scroll extra. Qui la isoliamo per studiarla; in un progetto va ricalcolata rispetto al limite di +25% dell’intera pagina.</p>
      <p><strong>Su telefono e finestre basse.</strong> Il corpo si riduce su telefono e la corsa si ferma a una finestra. Se le tre frasi non entrano con un margine di lettura, la scena torna in flusso normale. Nessuna frase viene accorciata o tagliata.</p>
      <p><strong>Accessibilità.</strong> Ogni frase è esposta per intero ai lettori di schermo. Le parole in attesa restano leggibili; la differenza massima è volutamente più contenuta del riferimento. Il movimento ridotto elimina aggancio e corsa, e accende tutto.</p>
      <p><strong>Limite da osservare.</strong> Frasi molto lunghe e corpi grandi fanno perdere la scena ferma. Le regolazioni restano disponibili: riduci il corpo o torna al flusso normale per confrontare la lettura.</p>
    </Notes>
  </main>
}
