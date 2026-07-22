import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setCaption("");
    }
  }, [open]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const publish = () => {
    toast.success("Publicação enviada!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                <div className="text-sm font-semibold">Tirar foto</div>
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
                <div className="text-xs text-muted-foreground">Selecionar foto ou vídeo</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <img src={preview} alt="Prévia" className="aspect-square w-full object-cover" />
              <button
                onClick={() => setPreview(null)}
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
              className="mt-3 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Publicar
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
