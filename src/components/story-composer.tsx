import { useEffect, useMemo, useRef, useState } from "react";
import { X, Camera, ImagePlus, ChevronLeft, ChevronRight, Trash2, Scissors } from "lucide-react";
import { users } from "@/lib/mock-data";
import type { StoryMedia } from "@/lib/mock-data";
import { addOwnStories } from "@/lib/own-stories";

const MAX_ITEMS = 10;
const MAX_VIDEO = 10; // seconds

type Draft = {
  id: string;
  kind: "image" | "video";
  url: string; // object URL
  poster?: string; // for video
  duration?: number; // full duration for videos
  startTime: number;
  caption: string;
  mentions: string[];
};

async function captureVideoPoster(url: string, at = 0): Promise<string> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.src = url;
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.playsInline = true;
    v.onloadeddata = () => {
      v.currentTime = Math.min(at, (v.duration || 0.1) - 0.05);
    };
    v.onseeked = () => {
      const c = document.createElement("canvas");
      c.width = v.videoWidth || 720;
      c.height = v.videoHeight || 1280;
      const ctx = c.getContext("2d");
      if (ctx) ctx.drawImage(v, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    v.onerror = () => resolve("");
  });
}

export function StoryComposer({
  open,
  onClose,
  onPublished,
}: {
  open: boolean;
  onClose: () => void;
  onPublished?: () => void;
}) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [idx, setIdx] = useState(0);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const captionRef = useRef<HTMLTextAreaElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) {
      // cleanup
      drafts.forEach((d) => URL.revokeObjectURL(d.url));
      setDrafts([]);
      setIdx(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const current = drafts[idx];

  // Mention autocomplete
  const mentionQuery = useMemo(() => {
    if (!current) return null;
    const el = captionRef.current;
    if (!el) return null;
    const pos = el.selectionStart ?? current.caption.length;
    const before = current.caption.slice(0, pos);
    const m = before.match(/@([\w.]*)$/);
    return m ? m[1] : null;
  }, [current?.caption, current?.id]);

  if (!open) return null;


  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, MAX_ITEMS - drafts.length);
    const added: Draft[] = [];
    for (const f of arr) {
      const isVideo = f.type.startsWith("video/");
      const url = URL.createObjectURL(f);
      let poster = "";
      let duration = 0;
      if (isVideo) {
        poster = await captureVideoPoster(url, 0);
        duration = await new Promise<number>((res) => {
          const v = document.createElement("video");
          v.src = url;
          v.onloadedmetadata = () => res(v.duration || 0);
          v.onerror = () => res(0);
        });
      }
      added.push({
        id: `d${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind: isVideo ? "video" : "image",
        url,
        poster: poster || undefined,
        duration: isVideo ? duration : undefined,
        startTime: 0,
        caption: "",
        mentions: [],
      });
    }
    setDrafts((prev) => [...prev, ...added]);
  };

  const removeCurrent = () => {
    setDrafts((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (prev[idx]) URL.revokeObjectURL(prev[idx].url);
      return next;
    });
    setIdx((i) => Math.max(0, i - 1));
  };

  const updateCurrent = (patch: Partial<Draft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const onCaptionChange = (val: string) => {
    const mentions = Array.from(val.matchAll(/@([\w.]+)/g))
      .map((m) => m[1])
      .filter((u) => users.some((usr) => usr.username === u));
    updateCurrent({ caption: val, mentions });
  };




  const suggestions =
    mentionQuery !== null
      ? users
          .filter((u) => u.username.toLowerCase().startsWith(mentionQuery.toLowerCase()))
          .slice(0, 5)
      : [];

  const insertMention = (username: string) => {
    if (!current) return;
    const el = captionRef.current;
    const pos = el?.selectionStart ?? current.caption.length;
    const before = current.caption.slice(0, pos).replace(/@([\w.]*)$/, `@${username} `);
    const after = current.caption.slice(pos);
    const next = before + after;
    onCaptionChange(next);
    setTimeout(() => el?.focus(), 0);
  };

  const publish = async () => {
    if (drafts.length === 0 || publishing) return;
    setPublishing(true);
    const now = Date.now();
    const items: StoryMedia[] = [];
    try {
      const { data: auth } = await supabase.auth.getUser();

      for (const d of drafts) {
        let url = d.url;
        if (d.file) {
          // Compressão automática antes do envio (vídeo cortado em 10s).
          url = await uploadMedia(d.file, "story", {
            maxSeconds: d.kind === "video" ? MAX_VIDEO : undefined,
            onCompressProgress: (r) => setProgress(Math.round(r * 100)),
          });
        }
        setProgress(0);

        if (auth.user) {
          // Expira e é apagado automaticamente 24h depois da publicação.
          await supabase.from("stories").insert({
            user_id: auth.user.id,
            media_url: url,
            media_type: d.kind === "video" ? "video" : "photo",
            caption: d.caption || null,
            mentions: d.mentions,
            expires_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        items.push({
          id: `own-${now}-${d.id}`,
          image: d.kind === "video" ? d.poster || "" : url,
          mediaUrl: d.kind === "video" ? url : undefined,
          kind: d.kind,
          startTime: d.startTime,
          duration:
            d.kind === "video"
              ? Math.min(MAX_VIDEO, Math.max(1, (d.duration ?? MAX_VIDEO) - d.startTime))
              : undefined,
          createdAt: now,
          caption: d.caption || undefined,
          mentions: d.mentions.length ? d.mentions : undefined,
        });
      }

      addOwnStories(items);
      toast.success("Momento publicado! Ele some em 24 horas.");
      onPublished?.();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível publicar o momento");
    } finally {
      setProgress(0);
      setPublishing(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-md flex-col bg-black text-white">
        <div className="flex items-center justify-between px-4 pt-4">
          <button onClick={onClose} aria-label="Fechar" className="p-2">
            <X className="h-6 w-6" />
          </button>
          <span className="text-sm font-semibold">
            Seu Momento {drafts.length > 0 && `(${idx + 1}/${drafts.length})`}
          </span>
          <button
            onClick={publish}
            disabled={drafts.length === 0}
            className="rounded-full bg-gradient-to-r from-[oklch(0.65_0.18_145)] via-[oklch(0.75_0.22_105)] to-[oklch(0.82_0.18_95)] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Publicar
          </button>
        </div>

        {drafts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm text-white/70">
              Adicione até {MAX_ITEMS} fotos ou vídeos. Vídeos são cortados em {MAX_VIDEO}s.
            </p>
            <div className="flex w-full flex-col gap-3">
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 font-medium"
              >
                <Camera className="h-5 w-5" /> Usar câmera
              </button>
              <button
                onClick={() => galleryRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 font-medium"
              >
                <ImagePlus className="h-5 w-5" /> Escolher da galeria
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mt-3 flex-1 overflow-hidden">
              {current?.kind === "video" ? (
                <video
                  ref={videoRef}
                  src={current.url}
                  className="h-full w-full object-contain"
                  playsInline
                  muted
                  autoPlay
                  loop
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    v.currentTime = current.startTime;
                  }}
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    const cap = current.startTime + MAX_VIDEO;
                    if (v.currentTime >= cap) v.currentTime = current.startTime;
                  }}
                />
              ) : (
                <img src={current?.url} alt="" className="h-full w-full object-contain" />
              )}

              {/* nav arrows */}
              {drafts.length > 1 && (
                <>
                  <button
                    onClick={() => setIdx((i) => Math.max(0, i - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setIdx((i) => Math.min(drafts.length - 1, i + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2"
                    aria-label="Próximo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Video trim slider */}
            {current?.kind === "video" && (current.duration ?? 0) > MAX_VIDEO && (
              <div className="px-4 py-2">
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <Scissors className="h-4 w-4" />
                  Cortar: {current.startTime.toFixed(1)}s –{" "}
                  {Math.min(
                    current.duration ?? MAX_VIDEO,
                    current.startTime + MAX_VIDEO,
                  ).toFixed(1)}s
                </label>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, (current.duration ?? MAX_VIDEO) - MAX_VIDEO)}
                  step={0.1}
                  value={current.startTime}
                  onChange={(e) => {
                    const s = parseFloat(e.target.value);
                    updateCurrent({ startTime: s });
                    if (videoRef.current) videoRef.current.currentTime = s;
                  }}
                  className="mt-1 w-full accent-white"
                />
              </div>
            )}

            {/* Caption + mentions */}
            <div className="relative px-4 py-2">
              {suggestions.length > 0 && (
                <div className="absolute bottom-full left-4 right-4 mb-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/90 shadow-lg">
                  {suggestions.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => insertMention(u.username)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-white/10"
                    >
                      <img src={u.avatar} className="h-7 w-7 rounded-full" alt="" />
                      <span className="text-sm">@{u.username}</span>
                    </button>
                  ))}
                </div>
              )}
              <textarea
                ref={captionRef}
                value={current?.caption ?? ""}
                onChange={(e) => onCaptionChange(e.target.value)}
                placeholder="Escreva uma frase... use @ para marcar alguém"
                rows={2}
                className="w-full resize-none rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-white focus:outline-none"
              />
            </div>

            {/* thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3">
              {drafts.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => setIdx(i)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === idx ? "border-white" : "border-white/20"
                  }`}
                >
                  <img
                    src={d.kind === "video" ? d.poster : d.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {d.kind === "video" && (
                    <span className="absolute bottom-0 right-0 rounded-tl bg-black/70 px-1 text-[10px]">
                      vídeo
                    </span>
                  )}
                </button>
              ))}
              {drafts.length < MAX_ITEMS && (
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-white/40 text-white/60"
                  aria-label="Adicionar mais"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={removeCurrent}
                className="ml-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80"
                aria-label="Remover"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </>
        )}

        <input
          ref={galleryRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
