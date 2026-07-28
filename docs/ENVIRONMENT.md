# Variáveis de ambiente

Duas categorias:

- **Públicas** (`VITE_*`) — vão para o bundle do browser. Nunca coloque segredo aqui.
- **Servidor** — só existem em handlers de servidor, lidas via
  `requireEnv()` em `src/services/core/env.server.ts`. Guardadas como secrets do
  projeto, nunca em arquivo versionado.

Nenhuma delas precisa existir agora: os providers estão em modo scaffold.

## Públicas (browser)

| Variável | Uso | Status |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | cliente Supabase | configurado |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | cliente Supabase | configurado |
| `VITE_SUPABASE_PROJECT_ID` | cliente Supabase | configurado |
| `VITE_CDN_BASE_URL` | base para montar URLs de mídia | pendente |
| `VITE_FIREBASE_API_KEY` | SDK web do FCM | pendente |
| `VITE_FIREBASE_PROJECT_ID` | SDK web do FCM | pendente |
| `VITE_FIREBASE_APP_ID` | SDK web do FCM | pendente |
| `VITE_FIREBASE_SENDER_ID` | SDK web do FCM | pendente |
| `VITE_FIREBASE_VAPID_KEY` | push web | pendente |

## Servidor (secrets)

### Supabase — configurado
`SUPABASE_URL` · `SUPABASE_PUBLISHABLE_KEY` · `SUPABASE_SERVICE_ROLE_KEY`

### Cloudflare R2 — pendente
| Variável | Descrição |
| --- | --- |
| `R2_ACCOUNT_ID` | ID da conta Cloudflare |
| `R2_ACCESS_KEY_ID` | credencial S3 do R2 |
| `R2_SECRET_ACCESS_KEY` | credencial S3 do R2 |
| `R2_BUCKET_MEDIA` | bucket público de posts/stories/avatares |
| `R2_BUCKET_KYC` | bucket privado de selfies e documentos |
| `R2_PUBLIC_BASE_URL` | domínio público do bucket de mídia |

### Cloudflare CDN — pendente
| Variável | Descrição |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | purge de cache |
| `CLOUDFLARE_ZONE_ID` | zona do domínio |
| `CDN_BASE_URL` | base do CDN (server-side) |
| `CDN_SIGNING_KEY` | HMAC de URLs assinadas |

### CAF (KYC) — pendente
| Variável | Descrição |
| --- | --- |
| `CAF_API_URL` | base da API |
| `CAF_API_KEY` | credencial da conta |
| `CAF_TEMPLATE_ID` | template de verificação (liveness + face match) |
| `CAF_WEBHOOK_SECRET` | validação HMAC do webhook |

### Firebase (FCM) — pendente
| Variável | Descrição |
| --- | --- |
| `FIREBASE_PROJECT_ID` | projeto do FCM |
| `FIREBASE_CLIENT_EMAIL` | service account |
| `FIREBASE_PRIVATE_KEY` | chave privada da service account (PEM, `\n` escapado) |

### Worker de mídia (FFmpeg) — pendente
| Variável | Descrição |
| --- | --- |
| `MEDIA_WORKER_URL` | endpoint do serviço de transcodificação |
| `MEDIA_WORKER_SECRET` | autenticação mútua + HMAC do webhook |

### Pagamentos — configurado
`PAGARME_PUBLIC_KEY` · `PAGARME_SECRET_KEY`

## Como conferir o que está ativo

`integrationStatus()` em `src/services/core/env.server.ts` retorna um booleano
por integração; útil para um endpoint de health check.
