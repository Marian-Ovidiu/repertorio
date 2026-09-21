# Una pagina di studio — 21 settembre 2026

Preview locale: <http://127.0.0.1:4173/composizione>.
Non è il portfolio definitivo. Non rappresenta clienti, incarichi, risultati
commerciali, premi o testimonianze reali. Nessun trasferimento a LUME.

## Direzione e ruoli

Uno studio indipendente che lavora su identità e siti web, raccontato attraverso
tre problemi concreti: orientarsi nel quartiere, capire un laboratorio,
consultare un archivio. Avorio, salvia, inchiostro e un solo accento cedro;
Arial già presente nel banco, gerarchie grandi ma testi brevi e operativi.
Niente nuovi font, fotografie esterne, asset generati o dipendenze.

- **Accensione:** accompagna una frase di 16 parole che dice subito cosa fa
  lo studio e per chi. Anche le parole in attesa sono leggibili. Il link ai
  progetti permette di saltare la corsa.
- **Card Composta:** presenta una piccola collezione, con arrivi da lati
  diversi, rotazioni controllate e una fase leggibile per ogni studio.
  Visual predominanti: atlante, proposta di sito del laboratorio, quaderno.
- **Liquido:** rende riconoscibile il cambio di servizio; descrizione e
  attività cambiano immediatamente, prima che la massa finisca il passaggio.
  Testo, focus e bersagli rimangono nitidi e fermi.

Sono tre famiglie, ciascuna in una sezione propria. Il liquido non sta dietro
il testo introduttivo e non compete con esso. I passaggi informativi fermi
separano i momenti forti. Per questa iterazione il brief prevale sul tetto
percentuale della regola storica: il costo viene misurato, non usato per
comprimere la lettura. Nessun Lenis, wheel handler o nuovo effetto.

## Tre preset coordinati

### Introduzione

Stessa progressione per parole della prova approvata, reversibile e senza
interpolazione temporale. Opacità in attesa **.714**: corrisponde all’enfasi
65% della prova isolata. Corpo massimo 74px, 73,44px a 1440px, **39px mobile**.
La scena misura l’ingombro del contenuto, non impone un’intera viewport vuota.
Corsa aggiuntiva **50% della finestra desktop / 32% mobile**, contro 120%
della prova isolata con tre frasi. Con il copy breve basta per far leggere
l’accensione senza attendere prima di sapere dove ci si trova.

Il blocco si ferma a 24px dal bordo, soltanto se entra in altezza con 48px
complessivi di margine. Se non entra, tutto torna in flusso e tutte le parole
sono attive. Nessuna frase viene accorciata per farla entrare.

### Progetti

Tre delle traiettorie deterministiche della Composta: prima base a sinistra,
seconda da destra, terza da sinistra. **Sfalsamento 70%, rotazione 60%**;
gli angoli si attenuano durante la lettura e aumentano quando la card arretra.
Profondità fino a .96 desktop / .985 mobile. Wrapper sticky non trasformato,
superficie interna trasformata; nessun easing temporale.

Gradino **28px desktop / 18px mobile**, aggancio **48px / 32px**,
ingressi **24% / 18% della finestra**, coda **10%**. Rispetto alla prova
isolata (32px / 48px / 35% / coda 16%) la serie è più breve, i contenuti
sono più compatti e l’ultima card non richiede una lunga permanenza.
Su mobile offset base 9px e angoli ×.35 come nella Composta approvata.

I fondi possono estendersi per coprire le precedenti; le tracce laterali
restano visibili. Se una card non entra con aggancio, gradini e margine di
sicurezza 52px, **tutta la pila torna in flusso**, senza tagli. Con il focus
la superficie si raddrizza e passa davanti; il link rimane raggiungibile.
I link portano tutti ai servizi, una destinazione reale, non a casi studio finti.

### Servizi

Preset invariato **48px / blur 12px / 900ms**, matrice alfa **24 −11**.
Mobile verticale, distanza `max(36, round(48 × .65))`, blur ≤12.
Riutilizzata direttamente la scena del liquido approvato: input immediati,
interruzione dalla forma corrente, nessuna coda, selezione nativa esclusiva,
assestamento al resize, fallback senza filtro. Tre attività concrete per
servizio oltre alla descrizione. La risposta riserva l’altezza del contenuto
più alto, evitando salti alla selezione. Nessun nuovo sticky.

## Passaggi

**Introduzione → prima card.** Il titolo della selezione e una breve
spiegazione sono in flusso, fra le due scene. Quando arriva la prima card,
il testo introduttivo è già uscito dal proprio contenitore sticky.

**Ultima card → servizi.** La pila termina nel proprio contenitore, con una
coda breve e padding di protezione per le rotazioni. Progetti e servizi
condividono il fondo salvia: nessun cambio arbitrario di campo. Il paragrafo
“Dal progetto al lavoro” è fermo e prepara la selezione, non prolunga la pila.

**Servizi → chiusura.** La descrizione e l’elenco delle attività restano in
flusso. Seguono nota dimostrativa e link alle prove, senza una nuova scena
o moduli finti. Il ritorno all’avorio riprende l’apertura.

L’header del banco è **in flusso**, non fisso: non occorre sottrarne l’altezza.
Una sola costante di inset, esposta come `--anchor-offset: 24px`, serve
l’aggancio introduttivo e lo scroll-margin delle ancore. Nessuno scroll-padding
globale sommato. Le ancore dirette vengono riallineate dopo le misure iniziali.
32/48px della pila sono margini per le rotazioni, non compensazioni aggiuntive
dell’header.

## Interfaccia e riuso circoscritto

“Opzioni della prova” è chiuso inizialmente, in una fascia secondaria prima
dell’introduzione. Confronto globale in flusso, simulazione e ripristino;
nessun cursore fra le sezioni. Il confronto rimuove sticky, trasformazioni
della pila e corsa del testo; i servizi restano selezionabili con massa
immediata. La preferenza di sistema prevale sempre. Il ripristino torna
ai preset e a Identità, senza annullare la preferenza di sistema.

- `src/composition/CompositionPage.tsx` e CSS Module: composizione e preset
  propri, adattamenti locali delle due logiche scroll approvate. Nessuna
  nuova libreria di meccanismi universali.
- `LiquidExperiment`: parametro facoltativo `embedded` per omettere il
  guscio del banco, aggiungere le attività e ricevere il movimento ridotto
  globale. Stessa logica, geometria e DOM interattivo; default isolati invariati.
- `RibbonExperiment`: soltanto esportazione del visual già esistente per
  riusare atlante e quaderno, nessuna modifica alla scena del nastro.
- Nuovo visual HTML/CSS di sito per Officina, senza azioni simulate dentro
  il mockup; il visual è un’immagine accessibile, non un’interfaccia finta.
- Sorgenti originali di testo e card non modificati. Nessun intervento su
  filo o vetro, né sui test e sulle dipendenze precedenti.

Checkpoint e confronto: 24 file precedenti di sorgenti/test/dipendenze
byte-identici. Le quattro differenze sono App (accessi/header della sola
composizione), CSS condiviso (un selettore circoscritto alla sua navigazione),
esportazione del visual e opzione embedded del liquido.

## Verifica

Misure per sezione, esiti, browser e limiti in [VERIFICA.md](VERIFICA.md).
Dati grezzi: `verification/composition-page-measurements.json`.
Test specifici: `tests/composition-page.spec.ts`. Registrazione riproducibile:
`PLAYWRIGHT_BROWSERS_PATH=0 node verification/capture-composition-page.mjs`.
