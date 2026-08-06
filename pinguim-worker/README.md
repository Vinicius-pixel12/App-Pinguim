# pinguim-worker

Worker de background do Pinguim. Consome a tabela `public.jobs` indiretamente
através da API HTTP do aplicativo principal, pois o Lovable Cloud não expõe o
`SUPABASE_SERVICE_ROLE_KEY`.

```
App (TanStack)  ──enqueue_job()──►  Lovable Cloud / Supabase: public.jobs
                                          │
        POST /api/public/jobs/claim  ◄────┘  (lock SKIP LOCKED no banco)
                                          │
                                   pinguim-worker
                                          │
        POST /api/public/jobs/complete    │
        POST /api/public/jobs/fail   ─────┘
```

## Por que não acessa o Supabase diretamente?

No Lovable Cloud o `SUPABASE_SERVICE_ROLE_KEY` é inacessível. Para manter o
worker fora do runtime serverless (onde não existem `child_process`, FFmpeg etc.),
o app principal expõe endpoints autenticados por `JOBS_WORKER_SECRET`:

- `POST /api/public/jobs/claim`
- `POST /api/public/jobs/requeue`
- `POST /api/public/jobs/complete`
- `POST /api/public/jobs/fail`

O worker armazena esses segredos em variáveis de ambiente (`APP_BASE_URL` e
`JOBS_WORKER_SECRET`) e nunca toca o Supabase diretamente.

## Rodando localmente

```bash
cd pinguim-worker
cp .env.example .env   # preencha APP_BASE_URL e JOBS_WORKER_SECRET
npm install
npm run dev
```

## Deploy no Render (Background Worker)

1. New → **Background Worker**, aponte para este repositório.
2. Build Command: `npm install` · Start Command: `npm start`
3. Environment:
   - `APP_BASE_URL` — URL publicada do app principal.
   - `JOBS_WORKER_SECRET` — mesmo valor configurado no app principal.

O arquivo `render.yaml` já traz esse blueprint pronto.

## Estrutura

```
src/
  index.js                  loop principal + shutdown + janitor
  config.js                 env validado
  logger.js                 logs JSON estruturados
  queue.js                  claim / complete / fail / requeue via HTTP API
  processor.js              execução de um job (timeout + erros)
  errors.js                 PermanentError / TransientError
  handlers/                 um arquivo por tipo de job
  integrations/             r2.js · ffmpeg.js · firebase.js · pagarme.js
```

## Adicionando um tipo de job

1. Declare o payload em `src/services/jobs/types.ts` (aplicativo).
2. Crie `src/handlers/<area>.<acao>.js` exportando uma função
   `async ({ job, payload, log }) => resultado`.
3. Registre no mapa de `src/handlers/index.js`.

## Erros e tentativas

- Lance `PermanentError` quando repetir não resolve → job vai direto para `failed`.
- Qualquer outro erro é considerado temporário → `fail_job` devolve à fila com
  backoff exponencial até `max_attempts` (definido por tipo no aplicativo).
- Jobs presos em `processing` por mais de 10 min são recuperados pelo janitor.

## Escala

Suba N instâncias do worker: o `claim` usa `FOR UPDATE SKIP LOCKED` no banco, então
nenhum job é processado duas vez. Ajuste `WORKER_BATCH_SIZE` e `WORKER_JOB_TYPES`
para dedicar instâncias a tipos específicos (ex.: uma só de `compress_video`, outra de `send_push`).
