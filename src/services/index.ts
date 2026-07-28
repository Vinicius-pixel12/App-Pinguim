/**
 * Registro central de serviços (composition root).
 *
 * Uso:
 *   // dentro de um handler de server function / server route
 *   const { storage } = await getServerServices();
 *
 * Os providers são carregados sob demanda (dynamic import) para que nenhum
 * módulo *.server.ts entre no bundle do cliente.
 *
 * Client-safe: este arquivo exporta apenas tipos e o CDN (que é puro).
 */

export * from "./core/errors";
export type { StorageService, StorageBucket, UploadIntent } from "./storage/types";
export { storageKeys } from "./storage/types";
export type { CdnService, ImageTransform, VideoVariant } from "./cdn/types";
export { imagePresets } from "./cdn/types";
export type { KycService, KycStatus, StartVerificationInput } from "./kyc/types";
export type { PushService, PushMessage, PushTemplate } from "./notifications/types";
export type { MediaService, MediaJob, MediaJobInput } from "./media/types";
export { mediaLimits } from "./media/types";
export type { Page, PageParams } from "./database/types";
export { pagination } from "./database/types";

import { createCloudflareCdnService } from "./cdn/cloudflare.provider";
import type { CdnService } from "./cdn/types";
import type { KycService } from "./kyc/types";
import type { MediaService } from "./media/types";
import type { PushService } from "./notifications/types";
import type { StorageService } from "./storage/types";

/** CDN é puro (só monta URL), então pode ser usado no cliente. */
export const cdn: CdnService = createCloudflareCdnService();

export type ServerServices = {
  storage: StorageService;
  kyc: KycService;
  push: PushService;
  media: MediaService;
  cdn: CdnService;
};

let cached: ServerServices | undefined;

/** Chame apenas DENTRO de handlers de servidor. */
export async function getServerServices(): Promise<ServerServices> {
  if (cached) return cached;

  const [{ createR2StorageService }, { createCafKycService }, { createFirebasePushService }, { createFfmpegMediaService }] =
    await Promise.all([
      import("./storage/r2.provider.server"),
      import("./kyc/caf.provider.server"),
      import("./notifications/firebase.provider.server"),
      import("./media/ffmpeg.provider.server"),
    ]);

  cached = {
    storage: createR2StorageService(),
    kyc: createCafKycService(),
    push: createFirebasePushService(),
    media: createFfmpegMediaService(),
    cdn,
  };
  return cached;
}
