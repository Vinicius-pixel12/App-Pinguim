# pinguim-worker

Worker de background do Pinguim. Consome a tabela `public.jobs` do Supabase e
executa tarefas pesadas que não podem rodar no runtime serverless do aplicativo
(FFmpeg, push, PIX, IA, KYC).

```
App (TanStack)  ──enqueue_job()──►  Supabase: public.jobs
                                          │
                        claim_jobs()  ◄───┘  (lock SKIP LOCKED)
                                          │
                                   pinguim-worker
                                          │
                     complete_job() / fail_job() ──► app reage
```

## Rodando localmente

```bash
cd pinguim-worker
cp .env.example .env   # preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

## Deploy no Render (Background Worker)

1. New → **Background Worker**, aponte para este repositório.
2. Root Directory: `pinguim-worker`
3. Build Command: `npm install` · Start Command: `npm start`
4. Environment: adicione `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
   (e as demais chaves conforme for ativando cada integração).

O arquivo `render.yaml` já traz esse blueprint pronto.

## Estrutura

```
src/
  index.js                  loop principal + shutdown + janitor
  config.js                 env validado
  logger.js                 logs JSON estruturados
  supabase.js               cliente service role
  queue.js                  claim / complete / fail / requeue
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

Suba N instâncias do worker: o `claim_jobs` usa `FOR UPDATE SKIP LOCKED`, então
nenhum job é processado duas vezes. Ajuste `WORKER_BATCH_SIZE` e
`WORKER_JOB_TYPES` para dedicar instâncias a tipos específicos (ex.: uma só de
`compress_video`, outra de `send_push`).
