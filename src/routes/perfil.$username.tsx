import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Grid3x3, Bookmark, UserSquare2, Lock, MoreHorizontal, Hand } from "lucide-react";
import { useState } from "react";
import { users, posts, currentUser } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ConverseModal } from "@/components/converse-modal";

export const Route = createFileRoute("/perfil/$username")({
  head: ({ params }) => ({ meta: [{ title: `@${params.username} — Pinguim` }] }),
  loader: ({ params }) => {
    const user = users.find((u) => u.username === params.username);
    if (!user) throw notFound();
    return { user };
  },
  notFoundComponent: () => (
    <div className="p-6 text-center">
      <p className="text-sm text-muted-foreground">Perfil não encontrado.</p>
      <Link to="/" className="mt-3 inline-block text-primary underline">
        Voltar
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Erro: {error.message}</div>
  ),
  component: PerfilUsuario,
});

function PerfilUsuario() {
  const { user } = Route.useLoaderData();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [converse, setConverse] = useState<null | typeof user>(null);
  const isPrivate = !!user.isPrivate;
  const canSeePosts = !isPrivate || following;

  const userPosts = posts.filter((p) => p.user.id === user.id).concat(posts).slice(0, 9);

  return (
    <>
      <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate({ to: "/" })} aria-label="Voltar" className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="truncate text-lg font-semibold">{user.username}</h1>
        <button aria-label="Mais" className="p-1">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      <section className="px-4 py-4">
        <div className="flex items-center gap-5">
          <div className="rounded-full story-ring">
            <div className="rounded-full bg-background p-[2px]">
              <img
                src={user.avatar}
                alt=""
                className="h-20 w-20 rounded-full object-cover"
              />
            </div>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            <Stat label="Publicações" value={String(user.posts ?? 0)} />
            <Stat label="Seguidores" value={String(user.followers ?? 0)} />
            <Stat label="Seguindo" value={String(user.following ?? 0)} />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            {user.name}, {user.age}
            {isPrivate && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <div className="text-sm text-muted-foreground">{user.city}</div>
          {user.bio && <p className="mt-1 text-sm">{user.bio}</p>}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant={following ? "secondary" : "default"}
            className="flex-1"
            onClick={() => setFollowing((v) => !v)}
          >
            {following ? (isPrivate ? "Seguindo" : "Seguindo") : isPrivate ? "Solicitar" : "Seguir"}
          </Button>
          <Button
            variant="secondary"
            className="flex-1 gap-2"
            onClick={() => setConverse(user)}
          >
            <Hand className="h-4 w-4" />
            Conversar
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-3 border-y border-border">
        <TabBtn active icon={<Grid3x3 className="h-5 w-5" />} />
        <TabBtn icon={<Bookmark className="h-5 w-5" />} />
        <TabBtn icon={<UserSquare2 className="h-5 w-5" />} />
      </div>

      {canSeePosts ? (
        <div className="grid grid-cols-3 gap-[2px]">
          {userPosts.map((p, i) => (
            <div key={`${p.id}-${i}`} className="aspect-square overflow-hidden bg-muted">
              <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <div className="text-base font-semibold">Esta conta é privada</div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Siga {user.username} para ver as publicações e stories dele(a).
          </p>
        </div>
      )}

      <ConverseModal
        open={!!converse}
        user={converse}
        onClose={() => setConverse(null)}
        onConfirm={() => setConverse(null)}
        currentBalance={0}
      />

      <div className="mx-4 mt-6 mb-4 rounded-xl border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
        Visualizando como <span className="font-medium">@{currentUser.username}</span>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function TabBtn({ active, icon }: { active?: boolean; icon: React.ReactNode }) {
  return (
    <button
      className={`flex items-center justify-center py-3 ${
        active ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"
      }`}
    >
      {icon}
    </button>
  );
}
