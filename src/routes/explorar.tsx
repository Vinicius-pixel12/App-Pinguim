import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Search, X, Lock } from "lucide-react";
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

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return users.filter((u) =>
      [u.username, u.name, u.city, u.bio]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q)),
    );
  }, [q]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pessoas, cidades, interesses"
              aria-label="Buscar perfis"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
                className="text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {q ? (
        results.length > 0 ? (
          <ul className="mx-auto max-w-md divide-y divide-border">
            {results.map((u) => (
              <li key={u.id}>
                <Link
                  to="/perfil/$username"
                  params={{ username: u.username }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted"
                >
                  <img
                    src={u.avatar}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
                      @{u.username}
                      {u.isPrivate && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {u.name} · {u.city}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            Não encontrado
          </div>
        )
      ) : (
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
      )}

      <PostViewer
        post={viewing}
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
      />
    </>
  );
}
