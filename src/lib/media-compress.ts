/**
 * Compressão automática de mídia no cliente.
 *
 * - Imagens: reamostragem em <canvas> (redimensiona + recomprime).
 * - Vídeos: FFmpeg (WebAssembly) rodando no navegador — o runtime serverless
 *   do app não suporta binários nativos, então a transcodificação acontece
 *   antes do upload direto para o Cloudflare R2.
 *
 * Toda falha é tolerada: se a compressão não for possível, o arquivo original
 * é enviado sem alteração.
 */

import type { FFmpeg } from "@ffmpeg/ffmpeg";

export type CompressResult = {
  file: File;
  compressed: boolean;
  originalBytes: number;
  bytes: number;
};

const IMAGE_MAX_DIMENSION = 1920;
const IMAGE_QUALITY = 0.82;
const VIDEO_MAX_WIDTH = 720;
const VIDEO_CRF = "28";

/* ------------------------------- imagens -------------------------------- */

function loadBitmap(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem"));
    };
    img.src = url;
  });
}

export async function compressImage(file: File): Promise<CompressResult> {
  const original = { compressed: false, originalBytes: file.size, bytes: file.size, file };
  // GIF animado perde a animação no canvas — mantém original.
  if (file.type === "image/gif") return original;

  try {
    const img = await loadBitmap(file);
    const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, width, height);

    const type = file.type === "image/png" ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, IMAGE_QUALITY),
    );
    if (!blob || blob.size >= file.size) return original;

    const ext = type === "image/webp" ? "webp" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
    return {
      file: new File([blob], name, { type }),
      compressed: true,
      originalBytes: file.size,
      bytes: blob.size,
    };
  } catch {
    return original;
  }
}

/* -------------------------------- vídeos -------------------------------- */

const FFMPEG_CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFfmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg: Ctor }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);
      const ffmpeg = new Ctor();
      await ffmpeg.load({
        coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })().catch((err) => {
      ffmpegPromise = null;
      throw err;
    });
  }
  return ffmpegPromise;
}

export type VideoCompressOptions = {
  /** Corta o vídeo neste limite (stories: 10s). */
  maxSeconds?: number;
  /** Progresso 0..1 durante a transcodificação. */
  onProgress?: (ratio: number) => void;
};

export async function compressVideo(
  file: File,
  options: VideoCompressOptions = {},
): Promise<CompressResult> {
  const original = { compressed: false, originalBytes: file.size, bytes: file.size, file };
  try {
    const ffmpeg = await getFfmpeg();
    const { fetchFile } = await import("@ffmpeg/util");

    const handler = ({ progress }: { progress: number }) =>
      options.onProgress?.(Math.max(0, Math.min(1, progress)));
    if (options.onProgress) ffmpeg.on("progress", handler);

    const input = `in-${Date.now()}`;
    const output = `out-${Date.now()}.mp4`;
    await ffmpeg.writeFile(input, await fetchFile(file));

    const args = ["-i", input];
    if (options.maxSeconds) args.push("-t", String(options.maxSeconds));
    args.push(
      "-vf",
      `scale='min(${VIDEO_MAX_WIDTH},iw)':-2`,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      VIDEO_CRF,
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      output,
    );
    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(output);
    await ffmpeg.deleteFile(input).catch(() => {});
    await ffmpeg.deleteFile(output).catch(() => {});
    if (options.onProgress) ffmpeg.off("progress", handler);

    const bytes = data as Uint8Array;
    if (!bytes || bytes.length === 0) return original;
    // Mantém o original quando a transcodificação não trouxe ganho e não houve corte.
    if (bytes.length >= file.size && !options.maxSeconds) return original;

    const name = file.name.replace(/\.[^.]+$/, "") + ".mp4";
    const out = new File([new Uint8Array(bytes)], name, { type: "video/mp4" });
    return { file: out, compressed: true, originalBytes: file.size, bytes: out.size };
  } catch {
    return original;
  }
}

/* ------------------------------- dispatcher ------------------------------ */

export async function compressMedia(
  file: File,
  options: VideoCompressOptions = {},
): Promise<CompressResult> {
  if (file.type.startsWith("video/")) return compressVideo(file, options);
  if (file.type.startsWith("image/")) return compressImage(file);
  return { file, compressed: false, originalBytes: file.size, bytes: file.size };
}
