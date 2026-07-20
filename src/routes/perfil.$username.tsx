import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Grid3x3, Bookmark, UserSquare2, Lock, MoreHorizontal, Hand, UserPlus, UserCheck } from "lucide-react";
import { useState } from "react";
import { users, posts, currentUser, type MockPost } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ConverseModal } from "@/components/converse-modal";
import { PostViewer } from "@/components/post-viewer";
import { UsersListDialog } from "@/components/users-list-dialog";
import { ProfileMediaGrid } from "@/components/profile-media-grid";

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
  const [viewing, setViewing] = useState<MockPost | null>(null);
  const [listOpen, setListOpen] = useState<null | "followers" | "following">(null);
  const isPrivate = !!user.isPrivate;

  const canSeePosts = !isPrivate || following;

  const totalPosts = user.posts ?? 0;
  const userPosts: MockPost[] = Array.from({ length: totalPosts }).map((_, i) => {
    const base = posts[i % posts.length];
    return {
      ...base,
      id: `${user.id}-grid-${i}`,
      user,
      image: `https://picsum.photos/seed/${user.id}-grid-${i}/900/900`,
      kind: i % 5 === 4 ? "video" : "photo",
    };
  });

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
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full story-ring">
            <div className="rounded-full bg-background p-[2px]">
              <img
                src={user.avatar}
                alt=""
                className="h-24 w-24 rounded-full object-cover"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-base font-semibold text-foreground">
            {user.name}, {user.age}
            {isPrivate && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <div className="text-xs text-muted-foreground">@{user.username}</div>
          {user.city && <div className="mt-0.5 text-sm text-muted-foreground">{user.city}</div>}
          {user.bio && <p className="mt-1 max-w-xs text-sm">{user.bio}</p>}

          <div className="mt-4 grid w-full max-w-xs grid-cols-3 gap-2 text-center">
            <Stat label="Publicações" value={String(totalPosts)} />
            <Stat
              label="Seguidores"
              value={String(user.followers ?? 0)}
              onClick={() => setListOpen("followers")}
            />
            <Stat
              label="Seguindo"
              value={String(user.following ?? 0)}
              onClick={() => setListOpen("following")}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1 gap-2"
            onClick={() => setConverse(user)}
          >
            <Hand className="h-4 w-4" />
            Conversar
          </Button>
          <Button
            variant={following ? "secondary" : "default"}
            className="flex-1 gap-2"
            onClick={() => setFollowing((v) => !v)}
          >
            {following ? (
              <>
                <UserCheck className="h-4 w-4" />
                {isPrivate ? "Solicitado" : "Adicionado"}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Adicionar
              </>
            )}
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-3 border-y border-border">
        <TabBtn active icon={<Grid3x3 className="h-5 w-5" />} />
        <TabBtn icon={<Bookmark className="h-5 w-5" />} />
        <TabBtn icon={<UserSquare2 className="h-5 w-5" />} />
      </div>

      {canSeePosts ? (
        <ProfileMediaGrid posts={userPosts} onOpen={setViewing} />
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
        onOpenChange={(v) => !v && setConverse(null)}
      />

      <PostViewer
        post={viewing}
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
      />

      <UsersListDialog
        open={listOpen === "followers"}
        onOpenChange={(v) => !v && setListOpen(null)}
        title="Seguidores"
        seed={`${user.id}-followers`}
        count={user.followers ?? 0}
      />
      <UsersListDialog
        open={listOpen === "following"}
        onOpenChange={(v) => !v && setListOpen(null)}
        title="Seguindo"
        seed={`${user.id}-following`}
        count={user.following ?? 0}
      />

      <div className="mx-4 mt-6 mb-4 rounded-xl border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
        Visualizando como <span className="font-medium">@{currentUser.username}</span>
      </div>
    </>
  );
}

function Stat({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  const inner = (
    <>
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="text-center hover:opacity-80">
        {inner}
      </button>
    );
  }
  return <div>{inner}</div>;
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
