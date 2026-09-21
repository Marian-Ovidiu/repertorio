# Banco di prova del Repertorio

Laboratorio locale con sei prove indipendenti e una pagina di composizione, realizzato con React, Vite,
TypeScript e CSS Modules. Scroll nativo, nessuna libreria di animazione,
nessun servizio esterno. Tutto il codice è in questa cartella.

## Avvio

Da `banco`, con Node compatibile con Vite 8 (20.19+ o 22.12+):

```sh
npm ci
npm run dev
```

Per vedere la build di produzione in locale:

```sh
npm run build
npm run preview
```

La preview ascolta solo su `127.0.0.1:4173`. Non viene pubblicato nulla.

- Indice: <http://127.0.0.1:4173/>
- Testo: <http://127.0.0.1:4173/accensione-del-testo>
- Card: <http://127.0.0.1:4173/card-impilate>
- Filo: <http://127.0.0.1:4173/filo-che-si-disegna>
- Nastro: <http://127.0.0.1:4173/nastro-orizzontale>
- Vetro: <http://127.0.0.1:4173/vetro>
- Liquido: <http://127.0.0.1:4173/liquido>
- Composizione: <http://127.0.0.1:4173/composizione>

Vite gestisce anche l’apertura diretta e il ricaricamento degli URL.
Le impostazioni sono temporanee: ricaricando la pagina tornano quelle iniziali.

Su Vercel, `vercel.json` nella stessa cartella di `package.json` inoltra gli
URL interni a `index.html`, così React può selezionare la prova richiesta.
Senza questa regola la home funziona, ma i link diretti e i ricaricamenti delle
prove restituiscono 404. La modifica richiede un nuovo deployment per diventare
attiva in produzione. Riferimento: [Vite SPA su Vercel](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas).

La [composizione](COMPOSIZIONE.md) si osserva come una pagina di studio:
introduzione, tre progetti dimostrativi, servizi e chiusura. “Opzioni della
prova” contiene soltanto confronto globale, movimento ridotto e ripristino;
i cursori rimangono nelle prove singole. Ancore: `#progetti`, `#servizi`,
`#chiusura`. Dettagli e misure in [COMPOSIZIONE.md](COMPOSIZIONE.md).
Per rigenerare video, immagini e misure:
`PLAYWRIGHT_BROWSERS_PATH=0 node verification/capture-composition-page.mjs`.

## Come provarlo

Entra nella scena, scorri lentamente, fermati e torna indietro. Modifica una
regolazione per volta e confronta con “Flusso normale”. Su telefono apri
“Regolazioni”, inizialmente chiuso. Nell’accensione puoi modificare tutte e
tre le frasi. Nella pila prova Tab e Maiusc+Tab: il link attivo porta davanti
la propria card. Tutti i link delle card raggiungono le note della prova.
Nel filo puoi modificare titoli e descrizioni delle tre fasi: il percorso
segue i punti anche dopo un cambio di impaginazione.

Card e filo hanno ora la scelta **Essenziale / Composta**, nel pannello delle
regolazioni. Si apre Essenziale per conservare il punto di confronto originale.
I testi modificati restano gli stessi passando da una variante all’altra;
il ripristino azzera testi e cursori ma mantiene la variante scelta.
Nelle card sono modificabili anche i quattro titoli e le descrizioni.
Composta aggiunge sfalsamento e rotazione deterministici; nel filo sostituisce
la corsa della scena con la distanza fra tre sezioni editoriali nel flusso.

Il nastro parte direttamente dalla composizione curata: tre studi dichiaratamente
dimostrativi, un titolo fermo, tre visual HTML/CSS diversi. Modifica titoli e
descrizioni, poi confronta corsa **100%**, ampiezza **84%**, distanza **48px**.
Tab porta in vista ciascun progetto alla posizione verticale corrispondente;
i link raggiungono note reali sotto la scena. Su telefono il meccanismo resta
attivo se entra tutto in altezza, altrimenti diventa una sequenza verticale.
Lo stato e l’altezza richiesta sono indicati prima della scena. Il confronto
statico e il movimento ridotto usano gli stessi elementi, senza duplicazioni.

Il vetro è una scena statica con campione satinato spostabile dall’impugnatura.
Frecce: 8px; Maiusc + frecce: 32px; Home: centro; Esc: annulla il trascinamento
in corso. Quattro pulsanti portano sopra zone significative o al centro.
Preset: **blur 16px / tinta 22% / bordo 60%**, blur effettivo mobile ≤12px.
“Superficie opaca” conserva posizione e geometria. Il materiale resta disponibile
con movimento ridotto; non ci sono animazioni autonome. Senza `backdrop-filter`
si usa una superficie piena e il banco dichiara il fallback.

Il liquido è una scelta esclusiva: **Identità / Siti / Interazioni**. Radio
nativi e descrizione cambiano subito; solo lo sfondo forma un ponte durante
il passaggio. Frecce da tastiera, clic e tap sono equivalenti. Il nuovo input
interrompe il percorso dalla posizione visibile, senza coda. Tre descrizioni
modificabili; spazio riservato alla più lunga per evitare salti di layout.
Preset **48px / 12px / 900ms**. “Senza fusione” toglie soltanto il filtro,
non geometria, movimento o scelta. Su mobile percorso verticale e distanza
effettiva ×0,65 con minimo 36px. Reduced motion assesta subito il materiale.

“Simula movimento ridotto” spegne i meccanismi guidati dallo scroll; nel vetro
conserva il materiale statico e i comandi diretti. La preferenza di sistema
prevale sempre, anche dopo il ripristino.

## Struttura

- `src/experiments/TextExperiment.*`: misurazione del testo e progresso di scroll.
- `src/experiments/CardsExperiment.*`: sticky CSS e misurazione delle card.
- `src/experiments/ThreadExperiment.*`: geometria SVG misurata e disegno progressivo.
- `src/experiments/ComposedThread.*`: percorso attraverso tre sezioni, senza sticky.
- `src/experiments/RibbonExperiment.*`: selezione orizzontale, misure reali, focus e fallback per altezza.
- `src/experiments/GlassExperiment.*`: materiale CSS, pointer capture locale, posizioni e alternative al trascinamento.
- `src/experiments/LiquidExperiment.*`: radio nativi, strato SVG separato, fusione e traiettoria interrompibile.
- `src/Workbench.*`: involucro e controlli condivisi.
- `src/useEnvironment.ts`: viewport e preferenze del sistema.
- `tests/banco.spec.ts`: scenari browser di scroll, tastiera, contenuti lunghi e accessibilità.
- `tests/thread.spec.ts`: agganci del filo, collisioni con i testi, scroll, resize e fallback.
- `tests/composition.spec.ts`: coreografia, contenuti condivisi, focus, geometria e fallback delle varianti composte.
- `tests/ribbon.spec.ts`: primo/ultimo studio, rilascio, combinazioni dei cursori, resize, testi lunghi e tastiera.
- `tests/glass.spec.ts`: precisione del gesto, interruzioni, limiti, tastiera, filtro calcolato, confronto e touch emulato.
- `tests/liquid.spec.ts`: scelta/contenuto, input rapido, ponte rasterizzato, separazione, geometria e fallback.
- `VERIFICA.md`: risultati, osservazioni visive e limiti della verifica.
- `verification/`: schermate salvate dalle verifiche.

L’accensione usa un aggiornamento per frame solo quando la scena è in vista.
Il colore dipende direttamente dalla posizione: nessuna animazione temporale
continua dopo la fermata. Il testo assistivo è una frase intera per paragrafo;
la copia visiva mantiene gli spazi tra le parole.

La pila Essenziale non ha listener di scroll. JavaScript misura soltanto gli ingombri e
legge le preferenze. Se una card supera l’altezza utile, tutta la sequenza
torna in flusso normale. Una coda di layout mantiene la pila completa prima
dell’uscita; un semplice padding non estende a sufficienza il contenitore sticky.
La Composta mantiene gli agganci CSS e trasforma solo la superficie interna,
con un aggiornamento rAF per evento di scroll e misure non trasformate. Nessuna
interpolazione temporale. Focus e resize hanno precedenza sulla coreografia.

Il filo Essenziale misura i centri dei punti rispetto al diagramma con `ResizeObserver`.
Due segmenti SVG contigui, ciascuno con `pathLength="1"`, ricevono metà della
corsa: il secondo punto è raggiunto a metà, il terzo alla fine. La guida
tenue mantiene leggibile il collegamento anche prima del disegno.
Su telefono il percorso è verticale, nel margine dei testi; oltre l’altezza
utile si mostra completo in flusso. Titoli e descrizioni restano un elenco
ordinato HTML, mentre l’SVG e gli indicatori duplicati sono `aria-hidden`.
Nella Composta si misurano anche i limiti dei blocchi: il percorso cambia lato
nei soli intervalli liberi. Le distanze verticali reali determinano il progresso;
su mobile una corsia dedicata evita i testi. Anche contenuti lunghi e finestre
basse mantengono il disegno progressivo, perché nulla viene trattenuto.

Il nastro misura larghezze dei tre progetti, spazi e margini: la traslazione
massima è la larghezza totale meno la finestra visibile. La corsa verticale
è questa misura moltiplicata per il cursore Corsa. `ResizeObserver` e gli eventi
dei font aggiornano le misure; nessun listener intercetta wheel o touch.
L’altezza di titolo, progetto più alto e indicazioni decide se usare lo sticky.
Non ci sono scroller interni, code dopo l’ultimo studio o librerie aggiuntive.

## Verifiche ripetibili

```sh
npm run check
npm run build
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium
npm test
```

Il browser di test viene installato dentro `banco/node_modules`, non in una
cartella di progetto esterna. I test avviano la preview se non è già attiva.
Il report completo è in `playwright-report/index.html`; le schermate persistenti
sono in `verification/`. Playwright usa Chromium: non equivale a verificare
Safari iOS, dispositivi fisici o lettori di schermo reali.

Per rigenerare fotogrammi e brevi video delle due varianti sulla preview attiva:
`PLAYWRIGHT_BROWSERS_PATH=0 node verification/capture-compositions.mjs`.
Per il nastro: `PLAYWRIGHT_BROWSERS_PATH=0 node verification/capture-ribbon.mjs`.
Per il vetro: `PLAYWRIGHT_BROWSERS_PATH=0 node verification/capture-glass.mjs`.
Per il liquido: `PLAYWRIGHT_BROWSERS_PATH=0 node verification/capture-liquid.mjs`.
I file `verification/*-sequenza.webm` contengono ingresso, avanzamento,
sosta, ritorno e confronto statico. Sono verifiche locali, non demo pubblicate.

Riferimenti tecnici: [Vite](https://vite.dev/guide/),
[React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore),
[CSS position](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position).
Per il filo: [SVG pathLength](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/pathLength)
e [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver).
I principi progettuali restano nelle rispettive schede del Repertorio.

Al momento della v.04 la cartella non era un repository Git. Il checkpoint
locale del lavoro approvato è descritto in [`.checkpoints/README.md`](../.checkpoints/README.md);
non è stato inizializzato Git né effettuato alcun push.
