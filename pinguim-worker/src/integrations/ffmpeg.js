/**
 * FFmpeg — scaffold. Aqui (container Render) child_process é permitido.
 * Instale ffmpeg no build ou use `ffmpeg-static` como dependência.
 */

import { spawn } from "node:child_process";

const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH ?? "ffprobe";

export function run(bin, args, { timeoutMs = 10 * 60 * 1000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${bin} excedeu o tempo limite`));
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${bin} saiu com código ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

export const ffmpeg = (args, opts) => run(FFMPEG, args, opts);
export const ffprobe = (args, opts) => run(FFPROBE, args, opts);

export async function probe(filePath) {
  const { stdout } = await ffprobe([
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);
  return JSON.parse(stdout);
}
