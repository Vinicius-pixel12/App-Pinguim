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

export type VideoCompressResult = CompressResult & {
  /** Miniatura (JPEG) extraída automaticamente do vídeo comprimido. */
  thumbnail?: File;
  durationSeconds?: number;
  width?: number;
  height?: number;
};

/** Lê duração/dimensões do vídeo usando o elemento <video> (barato e confiável). */
export function readVideoMetadata(
  file: File,
): Promise<{ durationSeconds?: number; width?: number; height?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.muted = true;
    const done = (v: { durationSeconds?: number; width?: number; height?: number }) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    el.onloadedmetadata = () =>
      done({
        durationSeconds: Number.isFinite(el.duration) ? el.duration : undefined,
        width: el.videoWidth || undefined,
        height: el.videoHeight || undefined,
      });
    el.onerror = () => done({});
    el.src = url;
  });
}

export async function compressVideo(
  file: File,
  options: VideoCompressOptions = {},
): Promise<VideoCompressResult> {
  const original: VideoCompressResult = {
    compressed: false,
    originalBytes: file.size,
    bytes: file.size,
    file,
  };
  try {
    const ffmpeg = await getFfmpeg();
    const { fetchFile } = await import("@ffmpeg/util");

    const handler = ({ progress }: { progress: number }) =>
      options.onProgress?.(Math.max(0, Math.min(1, progress)));
    if (options.onProgress) ffmpeg.on("progress", handler);

    const stamp = Date.now();
    const input = `in-${stamp}`;
    const output = `out-${stamp}.mp4`;
    const thumbName = `thumb-${stamp}.jpg`;
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

    // Miniatura: primeiro frame representativo do vídeo já comprimido.
    let thumbnail: File | undefined;
    try {
      await ffmpeg.exec([
        "-i",
        output,
        "-ss",
        "00:00:01",
        "-frames:v",
        "1",
        "-vf",
        `scale='min(720,iw)':-2`,
        "-q:v",
        "4",
        thumbName,
      ]);
      const thumbData = (await ffmpeg.readFile(thumbName)) as Uint8Array;
      if (thumbData && thumbData.length > 0) {
        thumbnail = new File(
          [new Uint8Array(thumbData)],
          file.name.replace(/\.[^.]+$/, "") + "-thumb.jpg",
          { type: "image/jpeg" },
        );
      }
    } catch {
      thumbnail = undefined;
    }

    // Limpa os arquivos temporários do sistema de arquivos virtual do FFmpeg,
    // inclusive o original recebido — só a versão comprimida segue adiante.
    await ffmpeg.deleteFile(input).catch(() => {});
    await ffmpeg.deleteFile(output).catch(() => {});
    await ffmpeg.deleteFile(thumbName).catch(() => {});
    if (options.onProgress) ffmpeg.off("progress", handler);

    const bytes = data as Uint8Array;
    if (!bytes || bytes.length === 0) return { ...original, thumbnail };

    const name = file.name.replace(/\.[^.]+$/, "") + ".mp4";
    const out = new File([new Uint8Array(bytes)], name, { type: "video/mp4" });
    const keepOriginal = out.size >= file.size && !options.maxSeconds;
    const finalFile = keepOriginal ? file : out;
    const meta = await readVideoMetadata(finalFile);

    return {
      file: finalFile,
      compressed: !keepOriginal,
      originalBytes: file.size,
      bytes: finalFile.size,
      thumbnail,
      ...meta,
    };
  } catch {
    return original;
  }
}


/* ------------------------------- dispatcher ------------------------------ */

export async function compressMedia(
  file: File,
  options: VideoCompressOptions = {},
): Promise<VideoCompressResult> {

  if (file.type.startsWith("video/")) return compressVideo(file, options);
  if (file.type.startsWith("image/")) return compressImage(file);
  return { file, compressed: false, originalBytes: file.size, bytes: file.size };
}
