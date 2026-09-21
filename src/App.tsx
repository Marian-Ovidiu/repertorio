import { TextExperiment } from './experiments/TextExperiment'
import { CardsExperiment } from './experiments/CardsExperiment'
import { ThreadExperiment } from './experiments/ThreadExperiment'
import { RibbonExperiment } from './experiments/RibbonExperiment'
import { GlassExperiment } from './experiments/GlassExperiment'
import { LiquidExperiment } from './experiments/LiquidExperiment'
import { CompositionPage } from './composition/CompositionPage'
import styles from './Workbench.module.css'

function Home() {
  return <main id="contenuto" className={styles.home}>
    <div className={styles.eyebrow}>Repertorio / Laboratorio locale / v.06</div>
    <h1 className={styles.homeTitle}>Prima di usarlo,<br />provalo.</h1>
    <p className={styles.homeLead}>Sei meccanismi, messi alla prova.<br />Esplora, cambia i valori, confronta.<br />Osserva cosa aiuta a leggere e cosa intralcia.</p>
    <div className={`${styles.indexHead} ${styles.eyebrow}`}>Le prove <span>01 — 06</span></div>
    <div className={styles.experiments}>
      <a className={styles.experiment} href="/accensione-del-testo">
        <div className={styles.miniature} aria-hidden="true"><p className={styles.textMini}>Una parola.<br />Poi un’altra.<br /><span>Il tempo di leggere.</span></p></div>
        <div className={styles.experimentLabel}><h2>01. Accensione del testo</h2><p>Editoriale · dare un ritmo alla lettura</p><span aria-hidden="true">↗</span></div>
      </a>
      <a className={styles.experiment} href="/card-impilate">
        <div className={styles.miniature} aria-hidden="true"><div className={styles.stackMini}><i /><i /><i /></div></div>
        <div className={styles.experimentLabel}><h2>02. Card impilate</h2><p>Essenziale / Composta · dal gradino alla pila sfalsata</p><span aria-hidden="true">↗</span></div>
      </a>
      <a className={styles.experiment} href="/filo-che-si-disegna">
        <div className={styles.miniature} aria-hidden="true">
          <svg className={styles.threadMini} viewBox="0 0 320 160" fill="none">
            <path d="M30 40 C75 40 85 120 160 120 S245 40 290 40" stroke="#3f570d" strokeWidth="3" />
            <circle cx="30" cy="40" r="13" /><circle cx="160" cy="120" r="13" /><circle cx="290" cy="40" r="13" />
          </svg>
        </div>
        <div className={styles.experimentLabel}><h2>03. Il filo che si disegna</h2><p>Essenziale / Composta · dalla scena alla pagina</p><span aria-hidden="true">↗</span></div>
      </a>
      <a className={styles.experiment} href="/nastro-orizzontale">
        <div className={styles.miniature} aria-hidden="true"><div className={styles.ribbonMini}><span>Vicino.<br />A piedi.</span><span>Officina<br />aperta. ↗</span><span>03</span></div></div>
        <div className={styles.experimentLabel}><h2>04. Nastro orizzontale</h2><p>Strutturale · attraversare una selezione di progetti</p><span aria-hidden="true">↗</span></div>
      </a>
    </div>
    <a className={`${styles.experiment} ${styles.glassEntry}`} href="/vetro">
      <div className={styles.miniature} aria-hidden="true"><div className={styles.glassMini}><span>La luce<br />cambia.</span><i /></div></div>
      <div className={styles.experimentLabel}><h2>05. Vetro satinato</h2><p>Materico · osservare una superficie sopra luce, colore e lettere</p><span aria-hidden="true">↗</span></div>
    </a>
    <a className={`${styles.experiment} ${styles.glassEntry}`} href="/liquido">
      <div className={styles.miniature} aria-hidden="true"><svg className={styles.liquidMini} viewBox="0 0 640 160"><rect x="20" y="40" width="180" height="80" rx="40" fill="#cdd4bb" /><rect x="235" y="40" width="180" height="80" rx="40" fill="#cdd4bb" /><rect x="440" y="40" width="180" height="80" rx="40" fill="#cdd4bb" /><path d="M120 32C163 20 182 58 215 57S270 20 311 34C358 50 355 112 310 128C270 142 250 104 215 104S167 139 121 128C70 115 69 45 120 32Z" fill="#d5fa54" /></svg></div>
      <div className={styles.experimentLabel}><h2>06. Liquido</h2><p>Materico · una selezione che si unisce e si separa</p><span aria-hidden="true">↗</span></div>
    </a>
    <a className={`${styles.experiment} ${styles.glassEntry}`} href="/composizione">
      <div className={styles.experimentLabel}><h2>Insieme / Una pagina di studio</h2><p>Testo, card Composta e selettore liquido · osservare i passaggi fra le sezioni</p><span aria-hidden="true">↗</span></div>
    </a>
    <p className={styles.homeNote}>Scroll nativo. Contenuti completi anche senza movimento. Nessun dato viene inviato o salvato.</p>
  </main>
}

export function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  const composition = path === '/composizione'
  const title = path === '/accensione-del-testo' ? 'Accensione del testo' : path === '/card-impilate' ? 'Card impilate' : path === '/filo-che-si-disegna' ? 'Il filo che si disegna' : path === '/nastro-orizzontale' ? 'Nastro orizzontale' : path === '/vetro' ? 'Vetro satinato' : path === '/liquido' ? 'Liquido' : 'Banco di prova'
  return <>
    <title>{`${composition ? 'Composizione' : title} — Repertorio`}</title>
    <a className={styles.skip} href="#contenuto">Salta al contenuto</a>
    <header className={styles.header}>
      <a className={styles.brand} href="/">repertorio<span> / banco di prova</span></a>
      {composition ? <nav className={`${styles.navigation} ${styles.compositionNavigation}`} aria-label="Pagina dimostrativa"><a href="#progetti">Progetti</a><a href="#servizi">Servizi</a><a href="/">Le sei prove ↗</a></nav> : <nav className={styles.navigation} aria-label="Prove">
        <a href="/" aria-current={path === '/' ? 'page' : undefined}>Indice</a>
        <a href="/accensione-del-testo" aria-current={path === '/accensione-del-testo' ? 'page' : undefined}>01 — Testo</a>
        <a href="/card-impilate" aria-current={path === '/card-impilate' ? 'page' : undefined}>02 — Card</a>
        <a href="/filo-che-si-disegna" aria-current={path === '/filo-che-si-disegna' ? 'page' : undefined}>03 — Filo</a>
        <a href="/nastro-orizzontale" aria-current={path === '/nastro-orizzontale' ? 'page' : undefined}>04 — Nastro</a>
        <a href="/vetro" aria-current={path === '/vetro' ? 'page' : undefined}>05 — Vetro</a>
        <a href="/liquido" aria-current={path === '/liquido' ? 'page' : undefined}>06 — Liquido</a>
        <a href="/composizione">Insieme</a>
      </nav>}
    </header>
    {composition ? <CompositionPage /> : path === '/' ? <Home /> : path === '/accensione-del-testo' ? <TextExperiment /> : path === '/card-impilate' ? <CardsExperiment /> : path === '/filo-che-si-disegna' ? <ThreadExperiment /> : path === '/nastro-orizzontale' ? <RibbonExperiment /> : path === '/vetro' ? <GlassExperiment /> : path === '/liquido' ? <LiquidExperiment /> :
      <main id="contenuto" className={styles.notFound}><h1>Questa prova non esiste.</h1><a href="/">Torna all’indice</a></main>}
    <footer className={styles.footer}><span>REPERTORIO · BANCO DI PROVA</span><span>Osservare → capire → scegliere</span></footer>
  </>
}
