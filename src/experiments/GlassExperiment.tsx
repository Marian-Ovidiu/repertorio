import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { Controls, Intro, Notes, Range } from '../Workbench'
import { useEnvironment } from '../useEnvironment'
import shared from '../Workbench.module.css'
import styles from './GlassExperiment.module.css'

type Position = { x: number; y: number }
type Gesture = { id: number; grabX: number; grabY: number; origin: Position }
const clamp = (value: number) => Math.max(0, Math.min(1, value))

export function GlassExperiment() {
  const { mobile, systemReduced } = useEnvironment()
  const [blur, setBlur] = useState(16)
  const [tint, setTint] = useState(22)
  const [edge, setEdge] = useState(60)
  const [opaque, setOpaque] = useState(false)
  const [simulated, setSimulated] = useState(false)
  const [supported] = useState(() => CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)'))
  const [announcement, setAnnouncement] = useState('Pannello al centro.')
  const stage = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const handle = useRef<HTMLButtonElement>(null)
  const position = useRef<Position>({ x: .5, y: .5 })
  const gesture = useRef<Gesture | null>(null)
  const reduced = simulated || systemReduced
  const effectiveBlur = mobile ? Math.min(blur, 12) : blur

  const bounds = useCallback(() => ({
    x: Math.max(0, stage.current!.clientWidth - panel.current!.offsetWidth - 24),
    y: Math.max(0, stage.current!.clientHeight - panel.current!.offsetHeight - 24),
  }), [])
  // Pointer moves write only the transform, without continuous React renders.
  const place = useCallback((next: Position) => {
    const limits = bounds()
    position.current = { x: clamp(next.x), y: clamp(next.y) }
    const element = panel.current!
    element.style.transform = `translate3d(${12 + position.current.x * limits.x}px, ${12 + position.current.y * limits.y}px, 0)`
    element.dataset.x = String(position.current.x)
    element.dataset.y = String(position.current.y)
  }, [bounds])
  const announce = useCallback(() => {
    setAnnouncement(`Posizione: ${Math.round(position.current.x * 100)}% da sinistra, ${Math.round(position.current.y * 100)}% dall’alto.`)
  }, [])
  const finish = useCallback((restore = false) => {
    const current = gesture.current
    if (!current) return
    gesture.current = null
    if (restore) place(current.origin)
    if (handle.current?.hasPointerCapture(current.id)) handle.current.releasePointerCapture(current.id)
    if (panel.current) panel.current.dataset.dragging = 'false'
    announce()
  }, [announce, place])

  useLayoutEffect(() => {
    const measure = () => { finish(); place(position.current) }
    const observer = new ResizeObserver(measure)
    observer.observe(stage.current!)
    observer.observe(panel.current!)
    measure()
    const interrupt = () => finish()
    const hidden = () => { if (document.hidden) finish() }
    window.addEventListener('blur', interrupt)
    document.addEventListener('visibilitychange', hidden)
    return () => {
      observer.disconnect(); gesture.current = null
      window.removeEventListener('blur', interrupt)
      document.removeEventListener('visibilitychange', hidden)
    }
  }, [finish, place])

  function start(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || gesture.current) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    const rect = panel.current!.getBoundingClientRect()
    gesture.current = { id: event.pointerId, grabX: event.clientX - rect.left, grabY: event.clientY - rect.top, origin: { ...position.current } }
    event.currentTarget.setPointerCapture(event.pointerId)
    panel.current!.dataset.dragging = 'true'
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current
    if (!current || event.pointerId !== current.id) return
    const rect = stage.current!.getBoundingClientRect(), limits = bounds()
    place({ x: limits.x ? (event.clientX - rect.left - current.grabX - 12) / limits.x : .5,
      y: limits.y ? (event.clientY - rect.top - current.grabY - 12) / limits.y : .5 })
  }
  function end(event: PointerEvent<HTMLButtonElement>) {
    if (gesture.current?.id === event.pointerId) finish()
  }
  function keyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape') { event.preventDefault(); finish(true); return }
    if (event.key === 'Home') { event.preventDefault(); finish(); place({ x: .5, y: .5 }); announce(); return }
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
    if (!direction) return
    event.preventDefault(); finish()
    const limits = bounds(), step = event.shiftKey ? 32 : 8
    place({ x: position.current.x + direction[0] * step / (limits.x || 1), y: position.current.y + direction[1] * step / (limits.y || 1) })
    announce()
  }
  function preset(x: number, y: number) { finish(); place({ x, y }); announce() }
  function reset() {
    finish(); setBlur(16); setTint(22); setEdge(60); setOpaque(false); setSimulated(false)
    place({ x: .5, y: .5 }); setAnnouncement('Pannello al centro. Valori iniziali ripristinati.')
  }

  return <main id="contenuto">
    <div className={shared.layout}>
      <Intro number="05" family="Materico · scheda 03" title="Vetro satinato.">
        La stessa superficie, sopra luce, colore e lettere. Sposta il campione e osserva cosa lascia passare, cosa attenua e come si separa dal fondo. Nessuna simulazione di rifrazione: qui il materiale nasce dalla sfocatura.
      </Intro>
      <Controls mobile={mobile} onReset={reset}>
        <Range id="glass-blur" label="Sfocatura" value={blur} min={0} max={28} unit="px" onChange={setBlur} />
        <Range id="glass-tint" label="Tinta / opacità" value={tint} min={8} max={65} unit="%" onChange={setTint} />
        <Range id="glass-edge" label="Bordo / riflesso" value={edge} min={0} max={100} step={5} unit="%" onChange={setEdge} />
        <p className={shared.help}>Preset consigliato: 16px / 22% / 60%. Su telefono la sfocatura effettiva è limitata a 12px.</p>
        <fieldset className={shared.comparison}><legend>Confronta la stessa superficie</legend>
          <label><input type="radio" name="materiale" checked={!opaque} onChange={() => setOpaque(false)} /> Vetro satinato</label>
          <label><input type="radio" name="materiale" checked={opaque} onChange={() => setOpaque(true)} /> Superficie opaca</label>
        </fieldset>
        <label className={shared.motion}><input type="checkbox" checked={simulated} onChange={event => setSimulated(event.target.checked)} /> Simula movimento ridotto</label>
        <p className={shared.help}>{systemReduced ? 'Movimento ridotto attivo nel sistema: ha sempre la precedenza.' : 'La simulazione si aggiunge alla preferenza del sistema.'} Il materiale resta disponibile; non ci sono movimenti automatici.</p>
      </Controls>
    </div>
    <div className={shared.sceneHead}><h2 id="glass-title">05 / Studio della luce</h2><p role="status">{!supported ? 'Backdrop-filter non disponibile: superficie piena alternativa.' : opaque ? 'Confronto opaco · stessa geometria e posizione.' : `Vetro satinato · blur effettivo ${effectiveBlur}px · nessuna rifrazione.`}</p></div>
    <section id="scena" className={styles.scene} aria-labelledby="glass-title" data-reduced={reduced} data-supported={supported} data-opaque={opaque}
      style={{ '--blur': `${effectiveBlur}px`, '--tint': tint / 100, '--edge': edge / 100 } as CSSProperties}>
      <div className={styles.instructions}>
        <p id="glass-instructions"><strong>Sposta dall’impugnatura.</strong> Oppure usa le frecce dopo averla selezionata: 8px, Maiusc + frecce: 32px. Home riporta al centro; Esc annulla il gesto in corso. Il resto della scena lascia scorrere la pagina.</p>
        <div className={styles.positions} role="group" aria-label="Posizioni del campione">
          <button type="button" onClick={() => preset(mobile ? 0 : .04, mobile ? .02 : .8)}>Zona scura</button>
          <button type="button" onClick={() => preset(mobile ? .9 : .95, mobile ? .98 : .8)}>Zona chiara</button>
          <button type="button" onClick={() => preset(mobile ? .2 : .14, mobile ? .23 : .2)}>Sul testo</button>
          <button type="button" onClick={() => preset(.5, .5)}>Al centro ↺</button>
        </div>
      </div>
      <div ref={stage} className={styles.stage} data-glass-stage>
        <div className={styles.art} aria-hidden="true">
          <div className={styles.dark} />
          <span className={styles.artLabel}>Materia / studi di luce — 001</span>
          <div className={styles.type}>La luce<br />cambia<br /><em>le cose.</em></div>
          <svg className={styles.sculpture} viewBox="0 0 600 600" fill="none">
            <defs><linearGradient id="glass-fold" x1="120" y1="60" x2="500" y2="520" gradientUnits="userSpaceOnUse"><stop stopColor="#e7ff9a" /><stop offset=".5" stopColor="#d5fa54" /><stop offset="1" stopColor="#9cae45" /></linearGradient></defs>
            <circle cx="300" cy="300" r="260" fill="url(#glass-fold)" />
            <path d="M170 75C415 75 135 525 430 525C255 490 550 85 170 75Z" fill="#35442b" />
            <path d="M170 75C415 75 135 525 430 525" stroke="#f5ffd2" strokeWidth="2" />
            <path d="M40 300H560M300 40V560" stroke="#33402c" strokeOpacity=".35" />
            <circle cx="300" cy="300" r="215" stroke="#33402c" strokeOpacity=".4" strokeDasharray="1 8" />
          </svg>
          <div className={styles.rules}><i /><i /><i /><i /><i /><span>01 — Superficie<br />02 — Trasparenza<br />03 — Luce</span></div>
          <div className={styles.artFooter}><span>Un campione, tre letture.</span><span>Repertorio / studio dimostrativo</span></div>
        </div>
        <div ref={panel} className={styles.panel} data-glass-panel>
          <div className={styles.surface} aria-hidden="true"><span>G / 01</span></div>
          <button ref={handle} type="button" className={styles.handle} aria-label="Sposta il vetro" aria-describedby="glass-instructions glass-position"
            onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
            onBlur={() => finish()} onKeyDown={keyboard}><span aria-hidden="true">⠿</span> Sposta il vetro</button>
        </div>
      </div>
      <div className={styles.caption}><p>Un volume piegato, lettere e filetti: una composizione SVG/CSS, non un prodotto reale. Osserva i dettagli che si perdono e il colore che rimane.</p><p id="glass-position" role="status" aria-live="polite">{announcement}</p></div>
    </section>
    <Notes nextHref="/nastro-orizzontale" nextTitle="Torna al nastro orizzontale">
      <p><strong>Un solo materiale.</strong> Sfocatura del fondale, saturazione 1,15, tinta salvia chiara e un bordo illuminato dall’alto. Una sola ombra separa il campione. È vetro satinato CSS, non un modello ottico e non una deformazione delle immagini.</p>
      <p><strong>Il gesto è locale.</strong> Si trascina soltanto dall’impugnatura, senza inerzia né inseguimento. La posizione rimane dopo il rilascio; ai bordi il campione si ferma. Resize e orientamento conservano una posizione proporzionale valida. Un gesto interrotto conserva l’ultima posizione; Esc torna al suo inizio.</p>
      <p><strong>Alternative equivalenti.</strong> Frecce e comandi di posizione permettono di esplorare senza trascinare. Nessun contenuto essenziale si trova dietro o dentro il vetro. Istruzioni e impugnatura hanno un fondo pieno; la composizione decorativa è esclusa dalla lettura assistiva.</p>
      <p><strong>Telefono e fallback.</strong> Composizione verticale, campione più piccolo, blur limitato a 12px. Il blocco touch riguarda solo l’impugnatura. Nessuno sticky o scroll interno. Se il filtro manca, il campione diventa una superficie piena dichiarata. Movimento ridotto conserva materiale e comandi diretti, senza transizioni decorative.</p>
      <p><strong>Limiti.</strong> Il blur è applicato solo al campione, non alla pagina. Compatibilità e fluidità vanno verificate sul dispositivo destinatario: l’emulazione desktop non dimostra le prestazioni di un telefono reale.</p>
    </Notes>
  </main>
}
