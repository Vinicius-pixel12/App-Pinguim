/**
 * Registro de handlers por tipo de job.
 *
 * Cada handler: async ({ job, payload, log }) => resultado (serializável em JSON).
 * Lance `PermanentError` quando não fizer sentido tentar de novo.
 *
 * Para adicionar um tipo novo:
 *   1. declare o payload em `src/services/jobs/types.ts` (app)
 *   2. crie o arquivo do handler aqui
 *   3. registre no mapa abaixo
 */

import { compressVideo } from "./media.compress-video.js";
import { generateThumbnail } from "./media.generate-thumbnail.js";
import { optimizeImage } from "./media.optimize-image.js";
import { purgeMedia } from "./media.purge.js";
import { sendPush } from "./notifications.send-push.js";
import { sendEmail } from "./notifications.send-email.js";
import { pixPayment } from "./payments.pix.js";
import { reconcilePayment } from "./payments.reconcile.js";
import { faceMatch } from "./kyc.face-match.js";
import { moderateContent } from "./ai.moderate-content.js";
import { aiImageEdit } from "./ai.image-edit.js";

export const handlers = {
  compress_video: compressVideo,
  generate_thumbnail: generateThumbnail,
  optimize_image: optimizeImage,
  purge_media: purgeMedia,
  send_push: sendPush,
  send_email: sendEmail,
  pix_payment: pixPayment,
  reconcile_payment: reconcilePayment,
  face_match: faceMatch,
  moderate_content: moderateContent,
  ai_image_edit: aiImageEdit,
};

export const supportedTypes = Object.keys(handlers);
