# Camada de serviços

Contratos (`types.ts`) + providers (`*.provider*.ts`) para cada integração externa.
Tudo em modo **scaffold**: os métodos lançam `NotImplementedError`.

Leia `docs/ARCHITECTURE.md` para o desenho completo e `docs/ENVIRONMENT.md`
para as variáveis de cada serviço.

## Como usar

```ts
// dentro de um handler de server function
import { getServerServices } from "@/services";

const { storage } = await getServerServices();
const upload = await storage.createUploadUrl({ ... });
```

```ts
// no browser (puro, sem segredo)
import { cdn, imagePresets } from "@/services";

const src = cdn.imageUrl(key, imagePresets.gridThumb);
```

## Como implementar um provider

1. Não altere o `types.ts` — ele é o contrato.
2. Substitua os `throw new NotImplementedError(...)` pela chamada real.
3. Leia segredos com `requireEnv()` **dentro** do método, nunca no topo do módulo.
4. Se precisar de outro fornecedor, crie `outro.provider.server.ts` implementando
   a mesma interface e troque o wiring em `src/services/index.ts`.
