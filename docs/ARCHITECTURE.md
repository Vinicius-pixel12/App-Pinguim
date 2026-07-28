# Arquitetura — Pinguim

Objetivo: estrutura preparada para ~1M de usuários. Este documento descreve a
organização de pastas, os contratos de serviço e os pontos de integração.
**Nenhuma integração externa está implementada** — apenas o esqueleto.

## 1. Camadas

```text
UI (routes / components)
        │  só fala com hooks
Hooks (src/hooks)            → estado, TanStack Query, realtime
        │  só fala com features
Features (src/features)      → regra de negócio do domínio
        │  só fala com services/repositories
Services (src/services)      → contratos + providers externos
        │
Infra externa: Supabase · R2 · CDN · CAF · Firebase · FFmpeg worker
```

Regra dura: um componente nunca chama `supabase.from(...)` nem `fetch()` de
provedor externo. Sempre passa por um repositório ou serviço.

## 2. Pastas

```text
src/
├─ routes/                    rotas (TanStack Start, file-based)
│  └─ api/public/webhooks/    endpoints públicos assinados (pagarme, caf, media, fcm)
├─ components/                UI reutilizável (burra, sem I/O)
├─ features/                  domínio: feed, stories, profile, chat, wallet, kyc, admin
│  └─ <feature>/
│     ├─ components/          UI específica da feature
│     ├─ hooks/               queries/mutations da feature
│     ├─ *.functions.ts       server functions (thin wrappers)
│     └─ *.server.ts          helpers server-only
├─ hooks/                     hooks transversais (sessão, viewport)
├─ services/                  ← camada de integração (este scaffold)
│  ├─ core/                   errors, env server, env público
│  ├─ storage/                contrato + provider Cloudflare R2
│  ├─ cdn/                    contrato + provider Cloudflare CDN
│  ├─ kyc/                    contrato + provider CAF
│  ├─ notifications/          contrato + provider Firebase (FCM)
│  ├─ media/                  contrato + provider worker FFmpeg
│  ├─ database/               contratos de repositório (Supabase)
│  └─ index.ts                composition root (getServerServices)
├─ lib/                       utilitários puros
└─ integrations/supabase/     cliente gerado (não editar)
```

## 3. Contratos e providers

| Serviço | Contrato | Provider (stub) |
| --- | --- | --- |
| Armazenamento | `services/storage/types.ts` | `storage/r2.provider.server.ts` |
| CDN | `services/cdn/types.ts` | `cdn/cloudflare.provider.ts` |
| KYC / biometria | `services/kyc/types.ts` | `kyc/caf.provider.server.ts` |
| Push | `services/notifications/types.ts` | `notifications/firebase.provider.server.ts` |
| Mídia (FFmpeg) | `services/media/types.ts` | `media/ffmpeg.provider.server.ts` |
| Dados | `services/database/types.ts` | Supabase (repositórios a implementar) |

Todos os métodos lançam `NotImplementedError` hoje. Trocar de fornecedor =
escrever outro provider que satisfaça o mesmo contrato; nada mais muda.

## 4. Fronteiras de execução

- `*.server.ts` → nunca importado por componente/rota; bloqueado no bundle do cliente.
- `*.functions.ts` → apenas declarações de `createServerFn`; providers carregados
  com `await import(...)` dentro do handler.
- `getServerServices()` só pode ser chamado dentro de handlers de servidor.
- `cdn` é puro (monta URL) e pode ser usado no browser.
- FFmpeg **não roda** no runtime serverless (sem `child_process`, sem binário
  nativo): é sempre um job assíncrono em worker externo.

## 5. Fluxos de integração

### Upload de mídia
```text
cliente → server fn pede URL assinada (R2)
        → PUT direto no R2 (não passa pelo app)
        → server fn cria media_job (queued)
        → worker FFmpeg transcodifica e grava derivados no R2
        → webhook /api/public/webhooks/media atualiza o job
        → post/story publicado; leitura sempre via CDN
```

### KYC
```text
selfie + documento → R2 (bucket privado)
        → server fn chama CAF com URLs assinadas de TTL curto
        → webhook /api/public/webhooks/caf atualiza kyc_verifications
        → aprovação libera saque PIX
```

### Push
```text
token FCM registrado por device → tabela device_tokens
        → evento de domínio (pedido de conversa, mensagem, saque)
        → envio em lotes de 500 tokens
        → tokens UNREGISTERED removidos
```

## 6. Decisões para escalar

- Paginação por cursor (keyset) em todas as listas; nunca `offset`.
- Uploads e downloads nunca atravessam o servidor da aplicação.
- Leitura pública sempre pelo CDN, com transformação de imagem na borda.
- Regras financeiras (saldo, split 70/30, saque) em funções do banco, dentro de
  transação, com `SELECT ... FOR UPDATE`.
- Trabalho pesado é assíncrono e idempotente por `jobId` / `providerRequestId`.
- Webhooks públicos sempre verificam assinatura HMAC antes de processar.

## 7. Próximos passos (fora deste scaffold)

1. Mover features existentes de `src/routes`/`src/components` para `src/features/*`.
2. Implementar repositórios Supabase sobre `services/database/types.ts`.
3. Implementar R2 com `aws4fetch`.
4. Criar tabelas `media_jobs` e `device_tokens`.
5. Implementar CAF, FCM e o worker FFmpeg + seus webhooks.
