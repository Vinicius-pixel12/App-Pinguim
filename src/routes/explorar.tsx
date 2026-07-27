import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { users, posts, type MockPost } from "@/lib/mock-data";
import { PostViewer } from "@/components/post-viewer";

export const Route = createFileRoute("/explorar")({
  head: () => ({
    meta: [
      { title: "Explorar — Pinguim" },
      {
        name: "description",
        content:
          "Descubra publicações de perfis públicos no Pinguim e conheça novas pessoas.",
      },
      { property: "og:title", content: "Explorar — Pinguim" },
      {
        property: "og:description",
        content: "Descubra publicações de perfis públicos no Pinguim.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explorar,
});

function Explorar() {
  const [viewing, setViewing] = useState<MockPost | null>(null);

  // Apenas perfis públicos aparecem no Explorar
  const publicUsers = useMemo(() => users.filter((u) => !u.isPrivate), []);

  const publicPosts = useMemo<MockPost[]>(
    () =>
      Array.from({ length: 18 }).map((_, i) => {
        const user = publicUsers[i % publicUsers.length];
        const base = posts[i % posts.length];
        return {
          ...base,
          id: `explore-${i}`,
          user,
          image: `https://picsum.photos/seed/explore-${i}/900/900`,
          caption: base.caption,
          likes: 100 + i * 37,
          comments: 5 + i,
          kind: i % 6 === 5 ? "video" : "photo",
        };
      }),
    [publicUsers],
  );

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>Buscar pessoas, cidades, interesses</span>
          </div>
        </div>
      </header>
      <div className="grid grid-cols-3 gap-[2px]">
        {publicPosts.map((p) => (
          <button
            key={p.id}
            onClick={() => setViewing(p)}
            aria-label={`Abrir publicação de @${p.user.username}`}
            className="aspect-square overflow-hidden bg-muted transition active:scale-[0.98]"
          >
            <img
              src={p.image}
              alt={`Publicação de @${p.user.username}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <PostViewer
        post={viewing}
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
      />
    </>
  );
}
