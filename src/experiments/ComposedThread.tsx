import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import styles from './ComposedThread.module.css'

type Point = { x: number; y: number }
type Geometry = { width: number; height: number; points: Point[]; bottoms: number[] }
const clamp = (n: number) => Math.max(0, Math.min(1, n))

function route(a: Point, b: Point, bottom: number, curvature: number, mobile: boolean) {
  if (mobile) {
    const bend = curvature * .12
    return `M ${a.x} ${a.y} C ${a.x - bend} ${a.y + (b.y - a.y) / 3}, ${b.x + bend} ${b.y - (b.y - a.y) / 3}, ${b.x} ${b.y}`
  }
  // Only cross horizontally below the previous content and above the next.
  const y = (bottom + b.y - 64) / 2
  const r = Math.min((y - bottom) * .75, (b.y - y) * .75, Math.abs(b.x - a.x) / 3) * curvature / 100
  const sign = Math.sign(b.x - a.x)
  return `M ${a.x} ${a.y} L ${a.x} ${y - r} Q ${a.x} ${y} ${a.x + sign * r} ${y} L ${b.x - sign * r} ${y} Q ${b.x} ${y} ${b.x} ${y + r} L ${b.x} ${b.y}`
}

export function ComposedThread({ phases, distance, thickness, curvature, staticMode, mobile, height }: {
  phases: { title: string; description: string }[]; distance: number; thickness: number; curvature: number;
  staticMode: boolean; mobile: boolean; height: number
}) {
  const diagram = useRef<HTMLDivElement>(null)
  const [geometry, setGeometry] = useState<Geometry>({ width: 0, height: 0, points: [], bottoms: [] })
  const [readingY, setReadingY] = useState(0)
  const gap = Math.max(96, height * (mobile ? Math.min(distance, 32) : distance) / 100)
  useLayoutEffect(() => {
    const element = diagram.current!
    const measure = () => {
      const box = element.getBoundingClientRect()
      const points = Array.from(element.querySelectorAll('[data-thread-point]')).map(node => {
        const r = node.getBoundingClientRect()
        return { x: r.x - box.x + r.width / 2, y: r.y - box.y + r.height / 2 }
      })
      const bottoms = Array.from(element.querySelectorAll('[data-phase-copy]')).map(node => node.getBoundingClientRect().bottom - box.top)
      setGeometry({ width: box.width, height: box.height, points, bottoms })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    element.querySelectorAll('li, [data-phase-copy], [data-thread-point]').forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    let frame = 0
    const update = () => { frame = 0; setReadingY(height * .62 - diagram.current!.getBoundingClientRect().top) }
    const queue = () => { if (!frame) frame = requestAnimationFrame(update) }
    queue()
    window.addEventListener('scroll', queue, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', queue) }
  }, [height, geometry, staticMode])
  const progress = staticMode ? 1 : geometry.points.length ? clamp((readingY - geometry.points[0].y) / (geometry.points[2].y - geometry.points[0].y)) : 0

  return <section id="scena" className={styles.scene} aria-labelledby="scene-title" data-composed="true" data-animated={!staticMode} data-progress={progress} style={{ '--block-gap': `${gap}px` } as CSSProperties}>
    <div className={styles.overline}>Un laboratorio, un percorso <span>01 — 03</span></div>
    <div ref={diagram} className={styles.diagram} data-thread-diagram>
      {geometry.width > 0 && <svg className={styles.thread} viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true" focusable="false" fill="none">
        {geometry.points.slice(0, -1).map((point, index) => {
          const next = geometry.points[index + 1]
          const d = route(point, next, geometry.bottoms[index], curvature, mobile)
          const part = staticMode ? 1 : clamp((readingY - point.y) / (next.y - point.y))
          return <g key={index}>
            <path d={d} className={styles.guide} strokeWidth={thickness} />
            <path d={d} className={styles.ink} data-thread-segment={index} strokeWidth={thickness} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - part} />
          </g>
        })}
      </svg>}
      <ol className={styles.phases} role="list" aria-label="Fasi del progetto">
        {phases.map((phase, index) => {
          const reached = staticMode || readingY >= (geometry.points[index]?.y ?? Infinity)
          return <li key={index}>
            <span className={styles.point} data-thread-point={index} data-reached={reached} aria-hidden="true">{reached ? '✓' : `0${index + 1}`}</span>
            <div className={styles.block} data-phase-copy>
              <div className={styles.label}>0{index + 1} / {['La domanda', 'Il prototipo', 'La prova sul campo'][index]}</div>
              <h3>{phase.title.trim() || `Fase ${index + 1}`}</h3>
              {index === 1 ? <figure className={styles.example}>
                <div className={styles.sheet}>
                  <div className={styles.sheetHead}><span>Laboratorio / Foglio di lavoro</span><span>Ordine 024</span></div>
                  <h4>Un tavolo, dal primo<br />schizzo alla consegna.</h4>
                  <dl><div><dt>Cliente</dt><dd>Officina del quartiere</dd></div><div><dt>Materiale</dt><dd>Rovere recuperato</dd></div><div><dt>Misure</dt><dd>180 × 80 × 74 cm</dd></div></dl>
                  <div className={styles.orderSteps}><span>01<br /><strong>Conferma</strong><small>Misure approvate</small></span><span>02<br /><strong>Produzione</strong><small>In lavorazione</small></span><span>03<br /><strong>Consegna</strong><small>Da concordare</small></span></div>
                  <p className={styles.sheetNote}>Da verificare → passaggio della porta e accesso al laboratorio.</p>
                </div>
                <figcaption>{phase.description}</figcaption>
              </figure> : <p className={styles.description}>{phase.description}</p>}
              {index === 2 && <div className={styles.closing}>Capire → progettare → verificare.<br />Poi tornare a osservare.</div>}
            </div>
          </li>
        })}
      </ol>
    </div>
    <div className={styles.end}>Fine del percorso <span>Il progetto continua nell’uso. ↗</span></div>
  </section>
}
