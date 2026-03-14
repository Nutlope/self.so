<a href="https://www.self.so">
  <img alt="Self" src="./public/og.png">
  <h1 align="center">Self</h1>
</a>

<p align="center">
  Un generatore di siti personali open source. Alimentato da Together.ai.
</p>

## Stack tecnologico

- Together.ai per l'LLM
- Vercel's AI SDK come framework per l'LLM
- Clerk per l'autenticazione
- Next.js app router
- Helicone per l'osservabilità
- S3 per lo storage di oggetti (PDF)
- Upstash redis per il DB
- Vercel per l'hosting

## Come funziona

1. Crea un account sul sito con Clerk
2. Carica un PDF che viene caricato su S3 e sottoposto a un controllo di sicurezza con Llama Guard
3. Invia il PDF come contesto a Qwen Next per estrarre informazioni rilevanti con output strutturati (modalità JSON)
4. Ottieni tutte le informazioni e inseriscile in una route dinamica per permettere all'utente di visualizzare e pubblicare il proprio sito

## Clonazione ed esecuzione

1. Fai il fork o clona la repository
2. Crea un account su [Together AI](https://togetherai.link/?utm_source=selfso&utm_medium=referral&utm_campaign=example-app) per l'LLM
3. Crea un account su [Upstash](https://upstash.com/) per il DB Redis
4. Crea un account su [AWS](https://aws.amazon.com/) per il bucket S3
5. Crea un file `.env` (usa `.example.env` come riferimento) e sostituisci le API keys
6. Esegui `pnpm install` e `pnpm run dev` per installare le dipendenze ed eseguire localmente


### Esecuzione dei test in locale

```bash
# Esegui tutti i test
pnpm test:run

# Esegui i test con UI
pnpm test:ui

# Esegui i test in modalità watch
pnpm test
```

## Task futuri

- [ ] aggiungere il logging degli errori per assicurarsi di correggere eventuali bug
- [ ] aggiungere la possibilità di raggiungere la pagina "anteprima" se hai già un sito
- [ ] possibilità di modificare i link nel sito
- [ ] possibilità di modificare qualsiasi sezione nel sito
- [ ] aggiungere temi che puoi attivare (inizia con ghibli)
- [ ] Eliminare il curriculum caricato in precedenza quando ne carichiamo uno nuovo
