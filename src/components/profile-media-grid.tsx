import { Play } from "lucide-react";
import type { MockPost } from "@/lib/mock-data";

export function ProfileMediaGrid({
  posts,
  onOpen,
}: {
  posts: MockPost[];
  onOpen: (p: MockPost) => void;
}) {
  const photos = posts.filter((p) => p.kind !== "video");
  const videos = posts.filter((p) => p.kind === "video");

  return (
    <div className="pb-4">
      {photos.length > 0 && (
        <>
          <div className="px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Fotos
          </div>
          <div className="grid grid-cols-3 gap-[2px]">
            {photos.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpen(p)}
                className="relative aspect-square overflow-hidden bg-muted"
              >
                <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}

      {videos.length > 0 && (
        <>
          <div className="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Vídeos
          </div>
          <div className="grid grid-cols-3 gap-[2px]">
            {videos.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpen(p)}
                className="relative aspect-square overflow-hidden bg-muted"
              >
                <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                <span className="absolute inset-0 grid place-items-center bg-black/20">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white">
                    <Play className="h-5 w-5 fill-white" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {posts.length === 0 && (
        <div className="p-10 text-center text-sm text-muted-foreground">
          Nenhuma publicação ainda.
        </div>
      )}
    </div>
  );
}
