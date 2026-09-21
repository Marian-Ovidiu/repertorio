# Verifica — 21 settembre 2026

## Pagina di composizione — Testo, card Composta, liquido

Preview: **[apri la composizione](http://127.0.0.1:4173/composizione)**.
Home e navigazione aggiornate. Una pagina dimostrativa di studio, non un
portfolio definitivo: nessun cliente o risultato inventato, nessun nuovo
meccanismo, dipendenza, pubblicazione o intervento su LUME.
Direzione, preset e riuso descritti in [COMPOSIZIONE.md](COMPOSIZIONE.md).
Preview lasciata attiva: risposta HTTP 200 e corrispondenza byte per byte
di HTML, JavaScript e CSS serviti con l’ultima build in `dist`, verificati
anche dopo la correzione della navigazione mobile. Accesso dalla home e
ancora Progetti nuovamente provati a 390×844.

Checkpoint selettivo prima delle modifiche:
`.checkpoints/approvato-prima-della-composizione-2026-09-21.tar.gz`, elenco
controllato e SHA-256 in [`.checkpoints/README.md`](../.checkpoints/README.md).
Git ancora assente; non inizializzato. **24 file** precedenti di sorgenti,
test e dipendenze risultano byte-identici al checkpoint. Nei sorgenti delle
prove, soltanto due interventi circoscritti: esportazione del visual già
esistente nel nastro e modalità embedded della scena liquida. Preset e logica
delle prove isolate invariati; tutti i relativi test restano invariati.

### Direzione, preset e passaggi osservati

Avorio e salvia continui, inchiostro per il testo, cedro come unico accento.
Introduzione concreta di 16 parole; tre studi con visual predominanti e
contenuti differenti; servizi con descrizione e tre attività; chiusura breve
con nota dimostrativa e collegamento all’indice.

- **Testo:** enfasi 65% della prova originale (opacità in attesa .714), corpo
  73,44px a 1440px / 39px mobile, corsa 50% / 32% finestra. Scena commisurata
  al contenuto; la prima schermata dice già cosa fa lo studio e per chi.
- **Card:** sfalsamento 70%, rotazioni 60%; gradino 28/18px, aggancio 48/32px,
  ingressi 24/18% finestra, coda 10%. Tre traiettorie deterministiche della
  Composta. Minore corsa rispetto alla demo isolata, senza sacrificare la
  fase di lettura. Tutta la pila torna in flusso se una card non entra.
- **Liquido:** preset approvato 48px / 12px / 900ms, mobile verticale.
  Medesimo selettore, senza guscio tecnico; contenuto e scelta immediati,
  interruzioni corrette e nessuna corsa sticky. Il confronto globale e
  reduced motion rendono immediato anche il posizionamento della massa.

**Introduzione → progetti:** titolo e paragrafo fermi separano le scene.
Nelle immagini e nel percorso registrato il testo si ritira prima dell’arrivo
della prima card. **Pila → servizi:** breve coda, ultimo progetto in uscita,
paragrafo informativo sullo stesso fondo salvia; le card non continuano
sopra il selettore. **Servizi → chiusura:** flusso continuo, risposta completa
e ritorno all’avorio, senza nuovo aggancio. Osservati anche ritorno verso l’alto
e soste ai confini; non rilevate collisioni nei campioni esaminati.

L’header resta in flusso. Inset unico 24px per ancore e scena introduttiva,
senza scroll-padding globale cumulato; ancore dirette riallineate dopo le
misure iniziali. I margini diversi della pila proteggono le rotazioni,
non sommano un’altra altezza header.

### Altezza misurata

Pixel CSS, preset iniziali, pannello delle opzioni chiuso, Chromium.
Valori delle sezioni arrotondati; totale comprensivo di header, fascia opzioni
e footer. File grezzo: `verification/composition-page-measurements.json`.
La sezione servizi è sempre in flusso, senza altezza aggiuntiva di animazione.

| Profilo | Introduzione animata / flusso | Progetti animati / flusso | Servizi | Chiusura | Totale animato / flusso | Extra |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1440×900 | 911 / 461 | 2461 / 2003 | 767 | 277 | 4659 / 3751 | 908 |
| 390×844 | 715 / 445 | 2150 / 1826 | 1104 | 362 | 4591 / 3997 | 594 |
| 1440×500 | 461 / 461 | 2003 / 2003 | 767 | 277 | 3751 / 3751 | 0 |

A 1440×500 testo e card non entrano con i margini previsti: fallback completo
in flusso, ma selettore liquido ancora interattivo. Non si comprimono le card
per farle entrare. A 390×844 le tre card, circa 470px di contenuto ciascuna,
mantengono la pila; testi lunghi la disattivano. Nessuno scroll interno.
Il costo equivale qui a circa +24,2% desktop / +14,9% mobile: è un risultato
misurato, non un tetto applicato alla progettazione.

### Controlli automatici

**Check, build e 105/105 test passati:** 90 regressioni delle sei prove
originali e 15 verifiche specifiche (cinque casi × tre profili).
Ambiente: macOS 26.6.2 arm64, Node 26, React 19.3, Vite 8.3,
Playwright 1.63 / Chromium 153.0.8010.12.

I test specifici coprono:

- Prima schermata, ancore dirette `#progetti`, `#servizi`, `#chiusura`,
  nessun overflow orizzontale e assenza di residui delle scene precedenti.
- Scroll lento, sosta, ritorno deterministico, salto rapido e attraversamento
  dei tre confini. Titoli/link di ciascuna card raggiungibili e non coperti;
  nel formato basso si leggono scorrendo, non tutti nello stesso fotogramma.
- Tab/Maiusc+Tab fra card e servizi; card focalizzata davanti e diritta,
  link verificato con hit-test, frecce native del selettore e link di uscita.
- Cambi rapidi nei servizi (tap emulato sul profilo mobile), contenuto
  immediato, assestamento senza coda, confronto dell’intera pagina, reset,
  simulazione e preferenza di sistema prioritaria. Axe A/AA senza violazioni
  nel controllo eseguito, non certificazione accessibile.
- Resize a metà pila nei tre formati. Stress test inserendo copy molto più
  lungo nel DOM: introduzione e progetti tornano in flusso, fine della card
  e chiusura raggiungibili, risposta servizi non sovrapposta alla chiusura.
  Non sono nuovi editor nella pagina: i controlli dettagliati restano nelle demo.

Due aspettative del primo test sono state corrette: a 500px il link sotto
l’introduzione e l’intera card non devono stare forzatamente nella prima
viewport. È stato verificato l’accesso completo tramite scroll normale,
coerente con il fallback, anziché comprimere il progetto per soddisfare il test.

### Browser e verifica visiva

**Chromium:** pagina percorsa dall’inizio alla fine a 1440×900, 390×844 e
1440×500, con scroll progressivo, ritorno, salti, soste, scelte rapide e
confronto. Salvate immagini di inizio, tre passaggi, card leggibili, ponte,
servizi, chiusura e pagine intere. Immagini aperte e osservate, oltre alle
asserzioni automatiche. Nei passaggi campionati nessun testo dei servizi
coperto dalla pila, nessun visual fuori sezione e nessun vuoto prolungato
dopo l’ultima card. Console senza errori nei tre percorsi registrati.

**Safari 26.6.2 (21624.5.1.11.3), applicazione nativa disponibile:** verifica
manuale tramite UI nella finestra desktop esistente. Osservati introduzione,
ingresso della prima card, pila a metà, ritorno, link ai servizi, ponte liquido,
selezioni 1→3→1→2, freccia verso Interazioni, stato finale e chiusura.
Provato anche confronto in flusso e navigazione all’ancora progetti.
Il WebDriver non era abilitato: nessuna impostazione del browser modificata.
Questa verifica parziale non equivale alla matrice automatica dei tre formati.

**Firefox:** non installato, non verificato. Non installati browser aggiuntivi.

Artefatti in `verification/`:

- `final-{desktop,mobile,desktop-basso}-pagina-*.png`: percorso e passaggi.
- `{desktop,mobile,desktop-basso}-pagina-card-{1,2,3}.png`: lettura delle card.
- `{desktop,mobile,desktop-basso}-pagina-intera.webm`: intero percorso,
  ritorno, selezioni e confronto, circa 18–20 secondi per profilo.
- `*-pagina-filmstrip.png`: dodici fotogrammi temporali estratti dai video
  e osservati per valutare ordine, ritmo e continuità.
- `capture-composition-page.mjs`: acquisizione riproducibile. Le schermate
  full-page vengono acquisite fuori dal contesto registrato, per non
  introdurre nel video il resize temporaneo usato dalla cattura Chromium.

### Limiti

Nessuna verifica su telefoni fisici, barre dinamiche iOS/Android, hardware
lento, lettori di schermo reali o zoom browser elevato. I testi lunghi sono
uno stress test di layout, non una verifica editoriale di ogni copy possibile.
Safari non verificato ai tre viewport esatti, con reduced motion di sistema
o in tutte le condizioni di fallback. Nessuna promessa di compatibilità
universale o prestazioni su dispositivi reali.

La pila è una collezione sequenziale: per rileggere una card coperta occorre
risalire o usare il confronto. La priorità del focus può interrompere
intenzionalmente la coreografia. Cambiare modalità o superare la soglia del
fallback al resize modifica l’altezza e può cambiare il punto di lettura.
La descrizione di servizio più lunga riserva spazio anche per quelle brevi.

---

## Aggiornamento v.06 — Liquido

Preview: **[apri il liquido](http://127.0.0.1:4173/liquido)**. Sesta e ultima
prova della raccolta; home e navigazione aggiornate. Nessuna pagina che combina
i meccanismi, nessun intervento su LUME, nessuna pubblicazione o nuova dipendenza.
Le cinque prove approvate conservano il comportamento: **22 file** precedenti
di sorgenti, test e dipendenze sono byte-identici al checkpoint iniziale.
Le sole modifiche al codice condiviso sono accessi e miniatura della nuova prova.
Preview lasciata attiva: HTML e asset JS/CSS serviti coincidono byte per byte
con l’ultima build in `dist`. Nell’ultimo passaggio home → prova → selezione,
nei tre formati, nessun errore JavaScript e nessun overflow orizzontale.
Git assente anche nelle directory superiori; checkpoint selettivo
`.checkpoints/approvato-prima-del-liquido-2026-09-21.tar.gz`, hash e contenuto
in [`.checkpoints/README.md`](../.checkpoints/README.md). Nessun repository
inizializzato o push. La documentazione delle iterazioni precedenti resta sotto.

### Riferimento osservato e scelta del banco

[Calendly](https://calendly.com/) accessibile in Chromium: osservati hero e
sezione seguente, poi versione 390×844. Nella sezione attuale quattro scelte
Scheduling / Callie / Notetaker / Payments: un raccordo morbido sotto l’icona
attiva la collega al pannello bianco. Provati Callie, Payments e ritorno a
Scheduling; fotogrammi iniziali mostrano il passaggio fra i raccordi, quelli
assestati il raccordo sotto la nuova scelta e il nuovo contenuto.
Su mobile osservata la disposizione compatta delle icone sopra il pannello,
non provati i cambi di scelta del riferimento su telefono.

Nel DOM attuale trovati filtri `daisy-goo-*`: blur con `stdDeviation="1"`,
matrice alfa `18 -8`, regione `-20% / -50% / 140% / 300%`. Il valore 1 è
riportato nell’unità del filtro, non equiparato a pixel CSS. Non ritrovata né
riconfermata qui la scena storica liquido sotto vetro; nessuna nuova verifica
del canvas/WebGL annotato nella scheda. Questa ispezione SVG integra, senza
contraddirla, la precedente ricerca di backdrop-filter per il vetro.

**Proposta originale:** tre superfici salvia e una massa cedro, senza vetro,
che attraversa la scelta. Non è una replica della coreografia di Calendly.
Il contenuto cambia subito; il materiale segnala il passaggio, non lo ritarda.
Immagini del riferimento: `verification/liquid-reference-calendly-*.png` e
`liquid-reference-choice-*-{early,settled}.png`, aperte e osservate.

### Costruzione, preset e geometria

SVG decorativo separato dai radio HTML: tre rettangoli arrotondati fermi e
un’ellisse mobile. Solo questo strato riceve blur + soglia alfa `24 -11`.
Testi, radio, focus e bersagli non sono filtrati né spostati. La deformazione
si restringe durante il passaggio, crea il ponte e poi si assesta. È fusione
grafica, non simulazione dell’acqua né conservazione fisica del volume.

Preset consigliato: **distanza 48 px, morbidezza 12, durata 900 ms**.
Intervalli: 36–96 px / 6–18 / 400–1400 ms. Gli estremi restano utilizzabili;
una distanza maggiore o una fusione minore rende il ponte meno pronunciato.
La durata modificata si applica alla prossima transizione. Il confronto
**Senza fusione** rimuove solo il filtro: stessa geometria, posizione,
selezione e movimento, nessun contenuto duplicato.

Misure dai bersagli effettivi; ResizeObserver, resize e caricamento font
aggiornano la geometria. Un cambio di layout conclude la transizione sulla
scelta confermata invece di continuare lungo coordinate obsolete. Un nuovo
input riparte dalla forma visibile corrente, senza coda; ripetere la scelta
già attiva non riavvia nulla. La pagina nascosta conclude il movimento.
Il passaggio diretto 1→3 attraversa graficamente 2 senza selezionarla.

Su mobile percorso verticale, bersagli alti almeno 78 px, distanza effettiva
`max(36, round(distanza × .65))`, morbidezza limitata a 12 per evitare ponti
permanenti. Nessun blocco touch o scroll interno. Al preset la scena misura
circa **597 px** su desktop e **941 px** a 390 px; la sola area filtrata
è rispettivamente 1140×208 e 351×378 px. Nessuna corsa sticky aggiunta.
Con finestre basse si legge scorrendo normalmente. Le descrizioni occupano
lo spazio della più alta: evita salti durante la selezione, ma una descrizione
molto lunga aumenta lo spazio anche quando è attiva una descrizione breve.

### Verifiche automatiche passate

`npm run check`, `npm run build`, `npm test`: **90/90 test passati**,
18 nuovi sul liquido e 72 regressioni delle cinque prove precedenti.
Eseguiti il 21 settembre 2026, macOS 26.6.2 arm64, Node 26,
Playwright 1.63, Chromium 153.0.8010.12; viewport 1440×900,
390×844 con touch emulato e 1440×500.

- Selezione e descrizione immediate, tutte le scelte, 1→3, ritorno,
  ripetizione, hover senza selezione, sei input durante la transizione,
  assestamento finale senza coda e stabilità del layout.
- Rasterizzazione dello SVG nel browser: al preset tre componenti alfa
  separate a riposo, due durante il ponte, di nuovo tre alla separazione.
  Nessun pixel significativo sui margini della regione filtrata. Confronto
  a metà movimento senza variazione di coordinate o progresso.
- Otto combinazioni degli estremi, testo di circa 336 parole, misure
  tipografiche aumentate, resize durante il movimento anche in orientamento
  orizzontale. Nessun overflow orizzontale o descrizione tagliata.
- Radio nativi con frecce, Tab in uscita, stato checked, focus non filtrato,
  controlli separatamente colpibili nel ponte. Axe WCAG A/AA senza violazioni
  rilevate nel controllo eseguito; non equivale a certificazione accessibile.
- Tap e swipe touch emulato sul bersaglio: la pagina scorre, la scelta non
  cambia incidentalmente. Wheel desktop. Movimento ridotto simulato e di
  sistema prioritario, selezione immediata senza ponte; reset non lo annulla.
- Fallback simulato rendendo negativo il rilevamento CSS del filtro: nessun
  filtro applicato, tutte le scelte e i contenuti utilizzabili. Il confronto
  senza fusione verifica separatamente anche il movimento senza materiale.

### Osservazioni visive e registrazioni

Preview di produzione aperta nei tre formati, transizioni registrate con
tempo reale oltre ai fotogrammi a tempo controllato dei test. Osservate
partenza, ponte, separazione e arrivo: raccordo riconoscibile, testo nitido,
separazione pulita, nessun residuo o bordo tagliato nei campioni esaminati.
La massa cambia volume intenzionalmente durante il passaggio; non sono
stati osservati salti di posizione negli input ravvicinati campionati.
Nel formato basso il contenuto prosegue sotto la viewport, non viene tagliato
dalla scena. Home e accesso diretto controllati nei tre formati.

Immagini: `verification/final-{desktop,mobile,desktop-basso}-liquido-`
`{partenza,ponte,separazione,finale,diretto,interruzioni,senza-fusione}.png`.
Video: `verification/{desktop,mobile,desktop-basso}-liquido-sequenza.webm`
(circa 7 secondi ciascuno); estratti e osservati otto fotogrammi temporali
per video nei corrispondenti `*-liquido-filmstrip.png`.
Riproducibili con `verification/capture-liquid.mjs`.
Fallback simulato osservato anche in
`verification/final-desktop-liquido-fallback.png`.

### Accessibilità, fallback e limiti

Fieldset e radio nativi, segno e dicitura della scelta attiva oltre al colore,
contenuto associato con annuncio live discreto; strato grafico escluso
dall’albero accessibile. Le descrizioni inattive sono nascoste anche alle
tecnologie assistive. Identificatore SVG univoco, nessun filtro su tutta
la pagina. Il rilevamento API/sintassi non garantisce il rendering del filtro
in ogni browser: il confronto senza fusione rimane una via esplicita.

Non verificati Safari/Firefox, dispositivi fisici, lettori di schermo reali,
zoom browser nativo, font remoto caricato lentamente, hardware lento o
prestazioni energetiche. Il test tipografico modifica le metriche nel browser,
non sostituisce un test completo di zoom. Fallback verificato per simulazione,
non in un browser realmente privo di SVG filter. Nessuna promessa di fluidità
su telefoni reali o compatibilità universale.

---

## Aggiornamento v.05 — Vetro satinato

Preview: **[apri il vetro](http://127.0.0.1:4173/vetro)**. Una sola nuova prova,
home e navigazione aggiornate; nessun intervento su LUME, nessuna pubblicazione,
nessuna dipendenza nuova. Le quattro prove approvate non sono state rifattorizzate.
Preview lasciata attiva; dopo l’ultima build verificati HTTP 200 sul link
diretto e corrispondenza byte per byte di HTML e asset serviti rispetto a `dist`.
**19 file** di sorgenti, test e dipendenze precedenti risultano byte-identici
al checkpoint salvato prima del lavoro. Le sole modifiche condivise sono gli
accessi alla nuova prova, la miniatura e la possibilità di mandare a capo
la navigazione per ospitare la quinta voce.

Git ancora assente. Checkpoint locale `approvato-prima-del-vetro-2026-09-21.tar.gz`,
con elenco controllato e SHA-256 in [`.checkpoints/README.md`](../.checkpoints/README.md).
Nessun repository inizializzato o push. Documentazione precedente conservata sotto.

### Riferimenti e scelte

- [Onefin](https://onefin.framer.website/) riaperto in Chromium: desktop
  y=0 → 650 → 1500 → 650, poi 390×844. Osservata la barra traslucida sopra
  fondi diversi, compatta su mobile. Misurati menu `blur(24px)` / raggio 20px
  e pannelli 20px / 28px, coerenti con parte della scheda storica. Il grande
  pannello decorativo ora misurato a blur 2px ha raggio 100px, non il 24px
  storico: non sono stati trattati come lo stesso elemento immutato.
- [Calendly](https://calendly.com/), richiamato dalla scheda, accessibile:
  hero e porzione successiva attuali mostrano pannelli pieni su fondi colorati.
  Nessun backdrop-filter fra gli elementi DOM ispezionati; non ritrovato
  qui l’accostamento storico vetro/liquido. Il banner cookie è presente nel
  primo fotogramma. Non si deduce nulla sulle altre pagine o su tutto il sito.
- **Scelta del banco:** un campione spostabile sopra uno studio di luce,
  non una replica dei menu dei riferimenti. Nessun altro meccanismo aggiunto.

Immagini dei riferimenti aperte e osservate:
`verification/glass-reference-onefin-{0,650,1500,mobile}.png` e
`glass-reference-calendly-{0,650}.png`. Valori storici conservati nella scheda,
distinti dalle misure attuali e dalle impostazioni del banco.

### Materiale, preset e spazio

Composizione CSS/SVG: grande volume circolare piegato verde acido, tipografia
su campo scuro, zona avorio e filetti sottili. Il gradiente appartiene al volume,
non è una somma di bagliori del pannello. Nessun asset esterno o progetto reale.

Vetro: blur del fondale + saturazione **1,15**, tinta salvia, bordo chiaro e luce
interna superiore, una sola ombra di separazione. Non è rifrazione. Preset
**16px / 22% / 60%**; intervalli 0–28px, 8–65%, 0–100%. Su mobile blur effettivo
≤12px, dichiarato nel pannello e nello stato della scena. Opaco: tinta piena,
identiche dimensioni, posizione e bordi, nessun filtro.

| Finestra | Area della composizione | Pannello | Corsa aggiunta |
| --- | --- | --- | --- |
| 1440×900 | 1310×630px | 390×306px | 0 |
| 390×844 | 351×560px | 205×224px | 0 |
| 1440×500 | 1310×360px | 390×240px | 0 |

Nessuno sticky. Istruzioni e comandi stanno prima della composizione, didascalia
dopo: nelle finestre basse si leggono con lo scroll normale, senza scroller
interni. Su mobile cambia la composizione: campo scuro sopra, volume sotto,
pulsanti in due colonne. Ogni pulsante è alto almeno 44px (46px mobile).

Solo l’impugnatura cattura il puntatore e blocca il gesto touch. Il resto della
scena, incluso il corpo del campione, permette di scorrere. Il drag aggiorna
direttamente il transform, senza render React continui, inerzia o inseguimento.
La posizione resta dopo il rilascio. Limiti interni di 12px e coordinate
proporzionali consentono di rimapparla dopo resize e cambio orientamento.

Alternative: quattro pulsanti, frecce 8px, Maiusc + frecce 32px, Home al centro.
Esc annulla il gesto corrente; pointercancel, capture persa, focus perso e resize
lo terminano conservando l’ultima posizione valida. Il testo assistivo della
posizione si aggiorna alla fine del drag, non a ogni movimento.

### Controlli automatici passati

- `npm run check` e `npm run build`: passati, TypeScript ed ESLint puliti.
- `npm test`: **72/72 passati, circa 2 minuti**. I 18 nuovi test coprono il vetro
  ai tre formati; tutti i 54 precedenti passano, comprese le varianti approvate.
- Drag lento: corrispondenza fra delta del puntatore e pannello; rapido oltre
  i bordi: contenimento. Rilascio e sosta di 650ms: nessuna deriva o inseguimento.
- Interruzioni: pointercancel sintetico, rilascio nativo della capture,
  Esc con ritorno all’origine del gesto, blur della finestra simulato e Tab
  fuori dall’impugnatura. Resize durante il drag termina il gesto.
- Resize vicino ai bordi: 390×844, 844×390, 1440×500, 1440×900. Posizione
  proporzionale conservata, pannello contenuto, nessun overflow orizzontale.
- Otto combinazioni min/max dei tre cursori, lettura del filtro, del colore
  e del bordo **calcolati dal browser**, non solo dei valori dei controlli.
- Confronto opaco senza variazioni geometriche; ripristino dei tre valori,
  del materiale e della posizione centrale.
- Frecce con passi esatti e senza scroll involontario, Home, limiti da tastiera,
  focus visibile, Tab/Maiusc+Tab senza trappole; comandi alternativi funzionanti.
- Touch emulato tramite input Chromium: drag dall’impugnatura senza scroll,
  cancellazione con `touchCancel`; swipe sul corpo del pannello fa scorrere
  la pagina senza spostare il campione. Altrove `touch-action` resta `auto`.
- Reduced motion simulato e di sistema, priorità del sistema anche dopo reset.
  Il vetro e i comandi rimangono disponibili, senza transizioni o animazioni.
- Assenza del filtro simulata prima dell’avvio: avviso, fondo pieno, filtro
  disattivato, drag ancora utilizzabile. Non è una prova su un vecchio browser.
- axe WCAG A/AA senza violazioni rilevate negli scenari coperti. Composizione
  decorativa assente dallo snapshot assistivo; nessun errore JS nei percorsi
  di drag monitorati. Istruzioni e impugnatura hanno fondo pieno.

### Osservazioni visive e materiali

macOS 26.6.2 arm64, Chromium 153.0.8010.12 headless / Playwright 1.63.0,
preview di produzione Vite 8.3.0. Immagini aperte e osservate nei tre formati,
su chiaro, scuro, testo e confronto opaco. Tre registrazioni di circa 7 secondi;
esaminati otto estratti temporali di ciascuna come provini.

Le lettere sotto il campione perdono nitidezza mentre il loro colore rimane;
il filetto sottile quasi scompare, il grande volume resta riconoscibile.
Su scuro si leggono bordo e tinta, su chiaro la separazione dipende anche
dall’ombra. L’opaco interrompe completamente la continuità del fondo.
Sul telefono i campi chiaro e scuro sono raggiungibili e l’impugnatura non
si perde ai bordi. Nessun movimento decorativo serve a rendere leggibile il materiale.

Due correzioni reali dalla prima osservazione: il CSS minificato conservava
solo la dichiarazione prefissata perché era scritta dopo quella standard;
in Chromium il blur risultava `none`. Invertito l’ordine e aggiunto il controllo
sullo stile calcolato. La tipografia decorativa era tagliata a 1440×500:
ora la sua dimensione tiene conto anche dell’altezza della finestra.

Materiali rappresentativi:

- Desktop: [centro](verification/final-desktop-vetro-centro.png),
  [scuro](verification/final-desktop-vetro-scuro.png),
  [chiaro](verification/final-desktop-vetro-chiaro.png),
  [testo](verification/final-desktop-vetro-testo.png),
  [opaco](verification/final-desktop-vetro-opaco.png).
- Mobile: [testo](verification/final-mobile-vetro-testo.png),
  [chiaro](verification/final-mobile-vetro-chiaro.png),
  [opaco](verification/final-mobile-vetro-opaco.png).
- [Finestra bassa](verification/final-desktop-basso-vetro-centro.png),
  [fallback simulato](verification/desktop-vetro-fallback.png).
- Video [desktop](verification/desktop-vetro-sequenza.webm),
  [mobile](verification/mobile-vetro-sequenza.webm),
  [basso](verification/desktop-basso-vetro-sequenza.webm);
  provini `verification/*-vetro-filmstrip.png`.
  Ripetibile con `PLAYWRIGHT_BROWSERS_PATH=0 node verification/capture-glass.mjs`.

### Limiti / non verificato

Safari, Firefox, telefoni fisici, penna, multi-touch, zoom elevato,
ascolto VoiceOver/NVDA, GPU lente, consumo energetico e frame rate reale.
Il prefisso CSS non costituisce una prova di compatibilità Safari. Il fallback
è simulato, non osservato in un motore privo del filtro. L’annullamento touch
è un input emulato e il blur della finestra un evento simulato, non una chiamata
telefonica o un cambio app su dispositivo. I provini non sono una misura di
fluidità. Il campione opaco copre parte della grafica intenzionalmente, ma nessuna
informazione essenziale. La composizione è un esempio fisso, non un editor di asset.

---

## Aggiornamento v.04 — Nastro orizzontale

Preview locale: **[apri il nastro](http://127.0.0.1:4173/nastro-orizzontale)**.
Home e navigazione aggiornate; nessuna pubblicazione, nessun intervento su LUME.
Preview lasciata attiva: URL diretto HTTP 200, HTML e asset confrontati con
`dist` dopo l’ultima build e risultati identici, non una versione precedente.
Nessuna dipendenza nuova. Le tre prove approvate conservano il comportamento:
14 file di sorgenti e test precedenti confrontati byte per byte col checkpoint,
identici. Le modifiche condivise sono la quarta voce, la griglia della home
e la relativa miniatura, non la logica dei meccanismi precedenti.

Git non è inizializzato nella cartella né negli antenati. Prima delle modifiche
è stato salvato un checkpoint locale dei file pertinenti, senza `node_modules`,
build o registrazioni: [istruzioni e SHA-256](../.checkpoints/README.md).
Non è stato creato un repository né fatto push. Lo storico di questa verifica
e i documenti preesistenti sono conservati sotto questo aggiornamento.

### Riferimenti: osservato ora / storico / progetto

Il 21/09/2026, Chromium a 1440×900 e 390×844:

- [Alia](https://usealia.com/), accessibile. Desktop: ingresso della scena
  centrale a y≈9650, avanzamento a 11100 e 12800, uscita a 14800, ritorno
  a 11100. Campo di linee viola in una scena alta 900px, sticky a top 0;
  testi ancorati in basso con stati narrativi diversi, uscita verso il team.
  A metà transizione un fotogramma contiene testi sovrapposti. Sul formato
  stretto (y≈9253 → 10083 → 10883 → 10083) permane la scena trattenuta.
  Non è una selezione di progetti identica al banco. Le vecchie misure di
  traslazione della scheda non sono state riconfermate.
- [Calendly](https://calendly.com/), accessibile ma cambiato rispetto alla
  descrizione storica. Sezione Scheduling, y≈4950 → 5500 → 6200 → 7050
  → 5500: testo verticale e visual laterale sticky misurato a top 204px,
  non il vecchio nastro a top 196px. Sul formato stretto, porzione osservata
  y≈3400 → 4200 → 5000 → 6900 → 4200, blocchi verticali con illustrazioni.
  Cookie rifiutati prima dei fotogrammi finali, senza pannello sovrapposto.

Fotogrammi aperti e ispezionati: `verification/ribbon-ref-alia-desktop-*.png`,
`ribbon-ref-alia-mobile-*.png`, `ribbon-ref-calendly-clear-1440-*.png` e
`ribbon-ref-calendly-clear-390-*.png`. Scala ampia e permanenza della scena
informano il banco; il titolo unico fermo, i tre studi e le loro impaginazioni
sono scelte nostre, non misure copiate dai riferimenti.

### Risultato e impostazioni consigliate

Tre studi dichiarati dimostrativi: **atlante**, **manifesto con invito**,
**dettaglio di pubblicazione**. Visual HTML/CSS predominanti, palette del banco,
impaginazioni diverse, nessuna immagine esterna o risultato commerciale inventato.
Titoli e descrizioni modificabili, tre link reali alle note dopo la scena.
Breve contesto prima e dopo; un solo elenco nel DOM anche nel confronto statico.

Default: **corsa 100% dello spostamento / ampiezza 84% / distanza 48px**.
Provati i limiti 60–160%, 68–100%, 16–96px in tutte le otto combinazioni.
La distanza mobile è limitata a 48px, esplicitato nel pannello. Le larghezze
desktop variano fra i tre studi; su mobile diventano uguali ma i visual vengono
ricomposti, non schiacciati. Nessuna variante Essenziale aggiunta.

La traslazione massima deriva da larghezze effettive + distanze + margini
meno la finestra visibile. La corsa è questa misura × percentuale. Font, copy,
resize e regolazioni aggiornano insieme geometria e durata. Scroll nativo,
nessuna intercettazione wheel/touch, nessuna interpolazione dopo la fermata.
Non c’è una coda aggiunta dopo l’ultimo progetto.

| Formato | Stato iniziale | Corsa verticale | Altezza scena | Confronto statico | Extra |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | Nastro | 1826px | 2726px | 1929px | +797px |
| 390×844 | Nastro | 628px | 1472px | 1699px | −227px |
| 1440×500 | Flusso | 0 | 1929px | 1929px | 0 |

Misure arrotondate, contenuti iniziali, controlli fuori dalla scena. A desktop
circa +41% sulla sola scena statica: il budget +25% va valutato sull’intera
pagina destinataria. Non si deduce l’efficacia del meccanismo dalla sola altezza.

### Controlli automatici passati

- `npm run check`: TypeScript ed ESLint passati. `npm run build`: passata.
- `npm test`: **54/54 passati in circa 1,7 minuti**, 15 del nastro e tutti
  i 39 preesistenti, incluse Card e Filo Essenziale/Composta e Accensione.
- Accesso dalla home, URL diretto e reload; controlli etichettati e reset.
- Scroll lento a incrementi, veloce, inverso; sosta di 650ms senza variazione
  della matrice. Titolo fermo; primo e ultimo progetto interamente in vista.
- Rilascio: altri 100px di scroll dopo la fine spostano verticalmente la
  scena di 100px, senza coda vuota. Nessun overflow orizzontale della pagina.
- Otto combinazioni min/max dei cursori: misura reale uguale alla geometria
  usata, corsa coerente, ultimo progetto raggiungibile, nessun pannello con
  contenuto che richiede uno scroll interno.
- Titolo lungo e descrizione di circa 392 parole: fallback completo, link
  raggiungibile. Resize a metà tra i tre formati, anche con link focalizzato.
  Variazione delle metriche del testo (80px) ricalcola altezza e fallback.
- Tab/Maiusc+Tab sui tre link: progetto rivelato, focus visibile con hit-test;
  Invio raggiunge la nota corretta e la navigazione continua fuori dalla scena.
- Statico e movimento ridotto: stessi tre contenuti, nessuna duplicazione,
  nessuna traslazione o corsa aggiuntiva. Preferenza di sistema prioritaria
  anche togliendo la simulazione o ripristinando. axe A/AA senza violazioni
  rilevate negli scenari coperti; nessun errore JavaScript nei percorsi testati.

### Osservazioni visive nel browser

Ambiente: macOS 26.6.2 arm64, Node 26, React 19.3, Vite 8.3.0,
Playwright 1.63.0 / Chromium 153.0.8010.12 headless, build di produzione.
Fotogrammi di ingresso, metà, fine, ritorno e uscita aperti e guardati.
Registrate tre sequenze; esaminati anche otto estratti temporali di ciascuna
come provino. Non si tratta di una prova manuale su un telefono fisico.

A desktop il titolo resta fermo e la scala dei visual rende evidente il cambio
di composizione: mappa larga, manifesto verticale con invito più piccolo,
doppia pagina ravvicinata. I frammenti laterali anticipano ciò che segue;
ogni studio ha una posizione completamente leggibile. L’ultimo arriva intero
entro il margine, poi la pagina riprende senza una schermata vuota.

A 390×844 titolo compatto e didascalie in colonna lasciano leggibili visual,
titolo, descrizione e link. Nella prima revisione mappa e tipografia mobile
si toccavano: la mappa è stata portata nel quadrante basso, separata dal titolo.
A 1440×500 si osserva la sequenza verticale completa. Il criterio non è
il breakpoint: occorrono contenuto misurato + 16px di sicurezza, circa 781px
a desktop o 708px mobile ai default. Copy più lungo attiva lo stesso fallback.
Non sono presenti scroller interni. Il motivo è spiegato sopra la scena.

Questa prova segue la richiesta corrente, diversa dalle raccomandazioni
storiche della scheda: tre composizioni anziché almeno quattro elementi,
progressione verticale anche su mobile quando entra, flusso verticale per
reduced motion anziché scroller orizzontale. Non è una conclusione universale
sulla preferenza degli utenti touch.

Materiali salvati:

- Desktop: [ingresso](verification/final-desktop-nastro-0.png),
  [metà](verification/final-desktop-nastro-20.png),
  [ultimo studio](verification/final-desktop-nastro-40.png),
  [uscita](verification/final-desktop-nastro-uscita.png).
- Mobile: [ingresso](verification/final-mobile-nastro-0.png),
  [metà](verification/final-mobile-nastro-20.png),
  [ultimo studio](verification/final-mobile-nastro-40.png),
  [uscita](verification/final-mobile-nastro-uscita.png).
- Finestra bassa: [inizio](verification/final-desktop-basso-nastro-0.png),
  [centro](verification/final-desktop-basso-nastro-20.png),
  [fine](verification/final-desktop-basso-nastro-40.png).
- Video: [desktop](verification/desktop-nastro-sequenza.webm),
  [mobile](verification/mobile-nastro-sequenza.webm),
  [basso](verification/desktop-basso-nastro-sequenza.webm).
  Provini `verification/*-nastro-filmstrip.png`; rigenerazione con
  `PLAYWRIGHT_BROWSERS_PATH=0 node verification/capture-ribbon.mjs`.

### Non verificato / limiti

Safari, Firefox, dispositivi fisici, inerzia touch reale, barre mobili,
zoom elevato, ascolto VoiceOver/NVDA e prestazioni su hardware lento.
La prova delle metriche non equivale a un test di download tardivo di un webfont.
Il resize ricalcola sulla nuova geometria e non conserva necessariamente la
percentuale precedente; il link focalizzato ha precedenza e resta in vista
nei casi provati. I microtesti dei visual sono dettagli dimostrativi descritti
anche dall’alternativa accessibile, non le didascalie principali. Copy arbitrario
può richiedere lavoro editoriale anche quando il fallback evita il taglio.
I test axe non sostituiscono una verifica assistiva umana. Nessuna nuova
approvazione visiva dell’utente è implicita in questi controlli.

---

## Aggiornamento v.03 — Essenziale / Composta

Preview locale attiva, nessuna pubblicazione:
[Card](http://127.0.0.1:4173/card-impilate) ·
[Filo](http://127.0.0.1:4173/filo-che-si-disegna) ·
[Indice](http://127.0.0.1:4173/).
Aprire **Regolazioni → Composta**; Essenziale resta la selezione iniziale.
Titoli e descrizioni sono condivisi fra le varianti, anche nelle quattro card.
Ripristino di testi e valori senza cambiare la variante selezionata.
Accensione del testo invariata: SHA-1 di TSX e CSS identici a prima del lavoro.
Git non inizializzato; documenti precedenti conservati qui sotto. Nessuna dipendenza nuova.

### Riferimenti osservati, non dedotti

Entrambi accessibili nel browser Chromium a 1440×900 il 21/09/2026:

- [Onefin](https://onefin.framer.website/): ingresso con grande scritta e
  primo foglio, centro con schede effettivamente inclinate in versi diversi,
  sovrapposizione e permanenza di bordi; uscita verso la sezione successiva.
  Percorsi circa y=5050 → 5650 → 6100 → 6600 → 6100 → 5650. Risalendo le
  schede si separano. Sticky calcolati anche a 50 e 100px. Le quattro fasi,
  i valori degli offset, la fase di lettura e la chiusura breve del banco
  sono scelte nostre, non una copia misurata della coreografia Framer.
- [Alia](https://usealia.com/): fasci che convergono, linea centrale fra
  esempi d’interfaccia e blocchi distinti; nello spazio intermedio il tratto
  si biforca. Osservati ingresso, blocchi 01/02/03, uscita e ritorno
  (y≈6700, 7350, 8100, 8850, 9550, poi 8100 e 7350). Risalendo cambia il
  tratto visibile. Non misurati easing o identità pixel-per-pixel del ritorno.
  Nel banco scegliamo invece **una sola linea** e un’alternanza sinistra/destra,
  senza diramazioni né Lenis; l’esempio di ordine è HTML reale e non un’immagine.

Fotogrammi dei riferimenti: `verification/reference-onefin-0…5.png` e
`verification/reference-alia-0…6.png`, aperti e ispezionati.

### Scelte e costo in altezza

**Card:** Essenziale conserva il gradino regolare; Composta ha quattro
traiettorie determinate (base sinistra, ingresso destra, controcampo sinistra,
chiusura quasi centrale), inclinazioni attenuate per leggere e arretramento
massimo del 4%. Sticky esterno, trasformazione del foglio interno: le misure
non inseguono la rotazione. Iniziali **32px / 48px / 35%, sfalsamento 70%,
rotazioni 60%**; provati anche massimi dei cinque cursori. La coda passa dal
35% al **16%** della finestra, così la pila chiusa lascia presto il posto alle note.

**Filo:** Essenziale conserva la scena raccolta e sticky. Composta alterna
titolo grande, foglio d’ordine con didascalia, conclusione sul lato opposto.
Iniziali **distanza blocchi 32% finestra, spessore 3px, curvatura 60%**.
Provati distanza 16/64%, spessore 8px, curva 0/100%. Le svolte avvengono
solo fra il fondo di un blocco e l’inizio del seguente; punti e ingombri
sono misurati. Il disegno segue la linea di lettura al 62% della finestra.
Nessuna scena trattenuta, nessuna corsa aggiunta dopo l’ultimo contenuto.

Altezze effettive di `#scena`, contenuti iniziali; extra rispetto al **proprio**
confronto statico, non rispetto a una pagina cliente:

| Formato | Card Essenziale / Composta | Extra card E / C | Filo Essenziale / Composta | Extra filo E / C |
| --- | --- | --- | --- | --- |
| 1440×900 | 2896 / 2767px | 1300 / 1146px | 1980 / 2410px | 1390 / 0px |
| 390×844 | 2831 / 2751px | 1104 / 981px | 1604 / 2239px | 936 / 0px |
| 1440×500 | 1596 / 1621px | 0 / 0px | 590 / 2154px | 0 / 0px |

Il filo composto costa circa **2,68 viewport desktop** come composizione,
ma il movimento non ne aumenta l’altezza. La pila rimane costosa: +71% circa
sulla sola scena statica desktop. Il budget +25% va verificato sulla pagina
cliente; questi numeri non ne costituiscono un’approvazione.

### Controlli automatici passati

- `npm run check` e `npm run build`: passati, TypeScript ed ESLint puliti.
- `npm test`: **39/39 passati** (circa 1,2 minuti), comprendenti i 27 controlli
  precedenti e 12 nuovi ai tre formati richiesti.
- Card: intervallo di lettura senza copertura per ciascuna card ai default;
  fermata, ritorno esatto delle trasformazioni, salto veloce, Tab/Maiusc+Tab,
  hit-test sul link, Invio verso le note, testi condivisi, ripristino e resize.
- Filo: progresso monotono/reversibile, sosta di 650ms, salto oltre scena;
  estremi SVG entro 1px dai punti e 201 campioni per segmento fuori dai
  riquadri del contenuto, anche a spessore massimo, dopo testi lunghi e resize.
- Descrizioni portate a 32 ripetizioni nelle card e 24 nel filo; titoli
  estesi. Passaggi 390×844 → 1440×500 → 1440×900. Fallback leggibile nelle
  card, disegno ancora attivo nel filo composto.
- Statico senza sovrapposizioni, simulazione e preferenza di sistema
  prioritaria anche dopo reset. axe WCAG A/AA senza violazioni rilevate
  negli scenari coperti; ordine e titolo non duplicato nello snapshot del filo.
- Controllo aggiuntivo card a 640/768/1024/1440px, finestra alta 1000px,
  sfalsamenti/rotazioni massimi e aggancio minimo: nessun overflow orizzontale.

### Osservazioni visive nel browser

Ambiente: macOS 26.6.2 arm64, Chromium 153.0.8010.12 headless, Playwright
1.63.0, build Vite 8.3.0. Fotogrammi iniziali, intermedi, finali e di ritorno
aperti e ispezionati; registrate sei sequenze delle due varianti ai tre formati.
Estratti temporali dei video desktop esaminati anche come provini.

La pila composta è distinguibile già all’ingresso della seconda card, non
solo a pila chiusa. La terza lunga si legge prima della quarta; i bordi
laterali irregolari restano riconoscibili. La quarta conserva un fondo
esteso per coprire il testo precedente: più aria nel foglio, ma non una
lunga corsa vuota in uscita. Sul telefono gli offset sono piccoli e le
rotazioni ridotte al 35% di quelle desktop; a 1440×500 o con copy fuori
misura la serie è tutta in flusso, dichiarato nell’interfaccia.

Il filo attraversa sezioni diverse senza attraversare testi o il prototipo.
Sul telefono i punti e il percorso restano nella corsia laterale di 42px,
separata dal contenuto; la distanza è limitata al 32% della finestra.
Nelle finestre basse si legge scorrendo: non si tenta di far entrare tutto
in una schermata. Curve e agganci rimangono associati ai blocchi osservati.

Correzione emersa dalla verifica: un link già focalizzato poteva uscire
dallo schermo al resize. Ora viene riportato nella zona visibile con un
margine di 12px; il focus raddrizza e porta davanti il foglio. I grandi
salti con rotella richiedono nei test di attendere la fine dell’input
nativo prima di saltare indietro; nessun ritardo è aggiunto al meccanismo.

Materiali: [pila a metà](verification/desktop-composta-card-meta.png),
[pila finale mobile](verification/final-mobile-card-impilate-Composta-36.png),
[filo centrale](verification/compose-desktop-filo-che-si-disegna-1.png),
[filo finale](verification/final-desktop-filo-che-si-disegna-Composta-36.png),
[video card desktop](verification/desktop-card-impilate-sequenza.webm),
[video filo desktop](verification/desktop-filo-che-si-disegna-sequenza.webm),
[provino card](verification/desktop-card-impilate-filmstrip.png),
[provino filo](verification/desktop-filo-che-si-disegna-filmstrip.png).
Altri fotogrammi `final-*`, video `*-sequenza.webm` e script di rigenerazione
in `verification/`; report automatico in `playwright-report/index.html`.

### Limiti e aspetti non verificati

Nessuna prova su Safari/Firefox, telefoni fisici, inerzia touch reale,
barre mobili, zoom elevato, hardware lento o ascolto VoiceOver/NVDA.
I video headless e i campioni geometrici non certificano fluidità su ogni
dispositivo né tutte le combinazioni possibili di contenuto e cursori.
La velocità del filo non è uniforme in pixel lungo le svolte: il progresso
è proporzionale alla distanza verticale fra punti. Cambi di variante,
testo o fallback possono spostare la posizione di lettura; valori non persistenti.
Il foglio d’ordine è un esempio statico, non un gestionale. Il focus modifica
intenzionalmente la pila; col tocco si rilegge risalendo o usando il flusso.
Lenis, altri meccanismi e rilevatore automatico restano esclusi.

---

## Resoconti precedenti, conservati

## Aggiornamento: terza prova, il filo che si disegna

Preview aggiornata: **<http://127.0.0.1:4173/filo-che-si-disegna>**.
Home e navigazione includono la prova 03; la scheda di riferimento rimane la 04.
Le implementazioni e le regolazioni delle prime due prove non sono state modificate.
Nessuna pubblicazione, nessuna nuova dipendenza. Git resta assente nella cartella.

### Controlli automatici passati

- `npm run check` e `npm run build`: nessun errore.
- `npm test`: **27/27 passati in 36,7 secondi** sulla build aggiornata:
  18 controlli esistenti e 9 nuovi (tre scenari ai tre formati).
- Il filo è stato verificato con scroll lento, ritorno, sosta di 650ms,
  salto veloce, cursori e ripristino, testi lunghi, resize, tastiera e confronto.
- Gli estremi SVG, convertiti in coordinate dello schermo, coincidono con
  i centri dei punti entro **1px** anche dopo modifiche e ridimensionamenti.
  Campionati 101 punti per segmento: nessuna intersezione con i riquadri dei
  testi nei casi verificati, incluso lo spessore massimo.
- Movimento ridotto di sistema emulato prioritario rispetto a simulazione e
  reset; elenco di tre fasi in ordine, SVG nascosto e nessun titolo duplicato
  nello snapshot accessibile. axe A/AA: nessuna violazione rilevata nella
  nuova prova con movimento ridotto ai tre formati.
- Nessun errore JavaScript nel percorso di ingresso/scroll della nuova prova
  e nessun overflow orizzontale nei casi controllati.

### Osservato nel browser e nelle schermate

Ambiente del 21 settembre 2026: macOS 26.6.2 arm64, Chromium 153.0.8010.12
headless tramite Playwright 1.63.0, preview della build Vite 8.3.0. Le schermate
sono state aperte e ispezionate visivamente oltre alle asserzioni automatiche.

| Formato | Comportamento iniziale |
| --- | --- |
| 1440×900 | Percorso orizzontale progressivo; corsa extra 1080px |
| 390×844 | Percorso laterale verticale progressivo; corsa extra 759,6px |
| 1440×500 | Percorso completo in flusso: manca altezza per fermare tutta la scena |

Iniziali: **120% finestra, linea 3px, curvatura 60%**. Su mobile la corsa è
limitata al 90%. Provati anche 130%, 8px, curvatura 100% e 0%. Il secondo punto
diventa una spunta a metà percorso, il terzo alla fine; il ritorno ripristina
gli stati precedenti. Fermandosi, offset e punti restano invariati. Dopo un
salto rapido il percorso è completo e il ritorno all’inizio lo azzera.

La guida tenue rende leggibile la relazione anche in un fotogramma incompleto.
Su mobile la curva resta nel margine sinistro. Modificando il secondo titolo
e portando la descrizione a **256 parole**, si attiva il flusso completo:
nessuna fase è tagliata. Verificati cambi 390×844 → 1440×500 → 1440×900 sia
con testo lungo sia tornando ai contenuti iniziali, anche a scena già percorsa.
I testi rimangono leggibili durante tutte le fasi del disegno.

Un dettaglio della verifica: dopo una rotella con grande spostamento, il test
deve attendere l’esaurimento dell’input nativo prima di premere l’ancora di
ritorno; a fondo pagina la coordinata può essere ferma mentre l’input è ancora
in corso. Non è stato aggiunto smooth scroll o un ritardo al meccanismo.

Schermate: [desktop a metà](verification/desktop-filo-meta.png),
[mobile a metà](verification/mobile-filo-meta.png),
[ritorno](verification/mobile-filo-ritorno.png),
[spessore e curvatura massimi](verification/mobile-filo-regolato.png),
[contenuto lungo](verification/mobile-filo-lungo.png),
[finestra bassa](verification/desktop-basso-filo-flusso.png),
[movimento ridotto](verification/mobile-filo-ridotto.png),
[home aggiornata](verification/desktop-indice.png).

### Limiti e non verificato

Le curve sono vincolate a fasce sicure; ogni segmento usa metà della corsa,
anche se ha lunghezza diversa. Testi troppo lunghi rinunciano al disegno
progressivo e su desktop possono lasciare aria nelle altre colonne. Resize
e cambio del fallback possono spostare la posizione di lettura. Le regolazioni
si azzerano al reload. Il costo in altezza va rivalutato rispetto al +25%
della pagina cliente: questa scena di laboratorio non è una composizione pronta.

Non verificati Safari/Firefox, telefoni fisici, gesture e inerzia touch reali,
barre mobili dinamiche, zoom 200–400%, hardware lento e ascolto VoiceOver/NVDA.
L’accessibilità automatica non sostituisce quest’ultimo controllo. Lenis e
rilevatore automatico restano fuori dall’iterazione.

---

## Resoconto della prima iterazione, conservato

Preview: **<http://127.0.0.1:4173/>** ·
[Testo](http://127.0.0.1:4173/accensione-del-testo) ·
[Card](http://127.0.0.1:4173/card-impilate).
Riavvio da `banco`: `npm run build` e `npm run preview`.
Nessuna pubblicazione. Lavoro confinato al Repertorio; LUME non coinvolto.
La cartella non era un repository Git. Documenti conservati, con aggiunte al
README e alle due schede.

## Controlli automatici passati

- `npm run check`: TypeScript strict ed ESLint senza errori o warning.
- `npm run build`: build di produzione riuscita.
- `npm test`: **18/18 scenari passati**, 23,6 secondi sulla build finale.
  Scroll lento/rapido, ritorno, sosta, modifiche, ripristino, confronto normale,
  testo lungo, card fuori misura, tastiera, link e movimento ridotto.
- Preferenza di sistema emulata: prevale anche togliendo la simulazione e
  ripristinando. Contenuti e controlli rimangono disponibili.
- axe WCAG 2 A/AA e 2.1 AA: nessuna violazione rilevata nelle due prove con
  movimento ridotto alle tre dimensioni. Non è una certificazione completa.
- Nessun overflow orizzontale nei casi testati; nessun errore JavaScript
  rilevato aprendo entrambe le prove ai tre formati.

Ambiente: macOS 26.6.2 arm64, Node 26.0.0, React 19.3.0, Vite 8.3.0,
TypeScript 6.0.3, Playwright 1.63.0, **Chromium 153.0.8010.12**.
Browser headless controllato da Playwright: ha caricato la preview e usato
scroll, tastiera, controlli e link. Le schermate sono state anche aperte e
ispezionate visivamente. Il browser collegato all’app non era disponibile.

## Comportamenti osservati nel browser

| Finestra | Accensione | Card |
| --- | --- | --- |
| 1440×900 | Attiva, 48px, corsa extra 1080px | Attive, gradino 32px, aggancio 48px |
| 390×844 | Attiva, 31px, corsa extra 844px | Attive, gradino 20px, aggancio 32px |
| 1440×500 | Flusso normale: testo troppo alto | Flusso normale: terza card fuori misura |

**Testo:** 47 parole iniziali, avanzamento e ritorno coerenti, stato stabile
durante la sosta a metà. Provati corsa 120→130%, corpo 48→46px, enfasi
65→100%. Il mobile mantiene tutte le frasi senza controlli sovrapposti.
Con 234 parole nella terza frase si passa al flusso: raggiunta l’ultima parola.
Struttura accessibile a frasi intere e spazi conservati nella copia visiva.

**Card:** provati gradino 32→36px, aggancio 48→40px, ingressi 35→70%; su
telefono prevalgono i limiti dichiarati. Pila riconoscibile, ritorno e soste
stabili. Tab/Maiusc+Tab portano davanti la card con il link attivo; Invio
raggiunge le note. Nella finestra alta 360px la card lunga si legge fino al
link finale, in flusso normale.

**Imparato dalla verifica visiva:** il padding finale non bastava a trattenere
la card lunga. Sostituito con una coda reale di layout. Le card brevi
lasciavano sporgere testo precedente: ora estendono il fondo. Etichette alzate
per restare nei gradini di 32/20px. Il costo è più aria nelle card brevi.
La corsa iniziale del testo è contenuta; nella pila ingressi al 70% allungano
sensibilmente le pause. Il confronto normale è più rapido da leggere.

Il banco isola i meccanismi e **supera il budget +25% di una pagina cliente**:
non è una composizione da copiare. Il limite è richiamato nelle note di
entrambe le prove; l’idoneità editoriale va valutata nel progetto destinatario.

Schermate: [testo desktop](verification/desktop-testo-meta.png),
[testo mobile](verification/mobile-testo-meta.png),
[pila desktop](verification/desktop-card-pila.png),
[pila mobile](verification/mobile-card-pila.png),
[focus](verification/mobile-card-focus.png),
[testo lungo](verification/mobile-testo-lungo-fine.png),
[card alta](verification/mobile-card-alta-fine.png),
[finestra bassa](verification/desktop-basso-testo-flusso.png),
[movimento ridotto](verification/desktop-accensione-del-testo-ridotto.png).
Altre schermate sono in `verification/`; report in `playwright-report/index.html`.

## Non verificato e limiti aperti

- Safari/Firefox, telefoni fisici, gesto touch e inerzia reali, barre mobili
  dinamiche, zoom 200–400%, prestazioni su hardware lento.
- Ascolto con VoiceOver/NVDA: snapshot e axe non sostituiscono questa prova.
- Tutte le combinazioni dei cursori e dei testi arbitrari.
- La pagina React richiede JavaScript. Il fallback senza animazione è completo,
  ma non equivale a una versione senza JavaScript.
- Modifiche e resize possono cambiare la posizione di lettura entrando o
  uscendo dal fallback. Le regolazioni non persistono dopo un reload.
- Per rileggere col tocco una card coperta bisogna risalire o usare il flusso
  normale. I fondi estesi nelle card brevi sono un compromesso esplicito.

Prossima verifica utile: Safari iOS e VoiceOver con contenuti del progetto
destinatario. Lenis, altri effetti e rilevatore automatico restano rinviati.
