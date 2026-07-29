import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadMediaWithThumbnail, validateMediaFile, ALLOWED_VIDEO_TYPES } from "@/lib/upload-image";

export function PostComposer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setFile(null);
      setIsVideo(false);
      setCaption("");
      setBusy(false);
      setProgress(0);
    }
  }, [open]);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    const invalid = validateMediaFile(f);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setFile(f);
    setIsVideo(ALLOWED_VIDEO_TYPES.includes(f.type));
    setPreview(URL.createObjectURL(f));
  };

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Faça login para publicar.");

      const media = await uploadMediaWithThumbnail(file, "post", {
        onCompressProgress: (r) => setProgress(Math.round(r * 100)),
      });
      const { error } = await supabase.from("posts").insert({
        user_id: auth.user.id,
        media_url: media.url,
        media_type: isVideo ? "video" : "photo",
        thumbnail_url: media.thumbnailUrl,
        duration_seconds: media.durationSeconds,
        width: media.width,
        height: media.height,
        caption: caption.trim() || null,
      });
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success("Publicação enviada!");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível publicar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (busy ? null : onOpenChange(v))}>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="text-base">Nova publicação</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-2 p-4">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:bg-muted/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Tirar foto ou gravar vídeo</div>
                <div className="text-xs text-muted-foreground">Usar a câmera do dispositivo</div>
              </div>
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:bg-muted/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Escolher da galeria</div>
                <div className="text-xs text-muted-foreground">
                  Foto (até 10 MB) ou vídeo (até 200 MB)
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              {isVideo ? (
                <video
                  src={preview}
                  className="aspect-square w-full object-cover"
                  controls
                  playsInline
                />
              ) : (
                <img src={preview} alt="Prévia" className="aspect-square w-full object-cover" />
              )}
              <button
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
                aria-label="Trocar"
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva uma legenda…"
              className="mt-3 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
            <button
              onClick={publish}
              disabled={busy}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy
                ? isVideo && progress > 0 && progress < 100
                  ? `Otimizando ${progress}%`
                  : "Enviando…"
                : "Publicar"}

            </button>
          </div>
        )}

        <input
          ref={cameraRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </DialogContent>
    </Dialog>
  );
}
