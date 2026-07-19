import { toast } from "sonner";

const GEMINI_WEB_URL = "https://gemini.google.com/app";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.google.android.apps.bard";
const APP_STORE_URL = "https://apps.apple.com/app/google-gemini/id6477489729";

function detectPlatform(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "other";
}

async function fetchImageAsFile(imageUrl: string): Promise<File | null> {
  try {
    const res = await fetch(imageUrl, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const ext = (blob.type.split("/")[1] || "jpg").split("+")[0];
    return new File([blob], `pinguim-foto.${ext}`, { type: blob.type });
  } catch {
    return null;
  }
}

export async function openGeminiWithImage(imageUrl: string) {
  const platform = detectPlatform();

  // Try native share sheet first — user picks Gemini and the image is attached.
  const file = await fetchImageAsFile(imageUrl);
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; text?: string; title?: string }) => Promise<void>;
  };

  if (file && nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: "Editar no Gemini",
        text: "Editar esta imagem no Gemini",
      });
      return;
    } catch {
      // user cancelled or share failed — fall through
    }
  }

  // Fallback: try to open the Gemini app / web.
  const storeUrl = platform === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
  const opened = window.open(GEMINI_WEB_URL, "_blank");
  if (!opened) {
    window.location.href = GEMINI_WEB_URL;
  }

  if (platform !== "other") {
    toast.info("Abrindo Gemini…", {
      description: "Não tem o app? Baixe na loja.",
      action: {
        label: "Baixar",
        onClick: () => window.open(storeUrl, "_blank"),
      },
    });
  }
}
