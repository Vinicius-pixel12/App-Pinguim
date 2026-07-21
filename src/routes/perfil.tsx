import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Grid3x3, Bookmark, UserSquare2, Wallet, BadgeCheck } from "lucide-react";
import { posts, wallet, currentUser, type MockPost } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { PostViewer } from "@/components/post-viewer";
import { ShareProfileDialog } from "@/components/share-profile-dialog";
import { UsersListDialog } from "@/components/users-list-dialog";
import { ProfileMediaGrid } from "@/components/profile-media-grid";
import { useProfile } from "@/lib/profile";
import { useSavedPosts, togglePostSaved } from "@/lib/saved-posts";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Pinguim" }] }),
  component: Perfil,
});

const OWN_FOLLOWERS = 248;
const OWN_FOLLOWING = 180;

function Perfil() {
  const gridPosts: MockPost[] = posts
    .concat(posts)
    .slice(0, 12)
    .map((p, i) => ({
      ...p,
      id: `${p.id}-${i}`,
      kind: i % 4 === 3 ? "video" : "photo",
    }));
  const [viewing, setViewing] = useState<MockPost | null>(null);
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen] = useState(false);
  const [listOpen, setListOpen] = useState<null | "followers" | "following">(null);
  const [tab, setTab] = useState<"grid" | "saved" | "tagged">("grid");
  const visiblePosts = gridPosts.filter((p) => !deleted.has(p.id));
  const savedPosts = useSavedPosts();
  const [profile] = useProfile();
  const verified = profile.selfieVerified && profile.documentVerified;

  return (
    <>
      <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="truncate text-lg font-semibold flex items-center gap-1">
          {profile.username}
          {verified && <BadgeCheck className="h-4 w-4 text-primary" />}
        </h1>
        <Link to="/configuracoes" aria-label="Configurações" className="p-1">
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      <section className="px-4 py-4">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full story-ring">
            <div className="rounded-full bg-background p-[2px]">
              <img
                src={profile.avatar}
                alt=""
                className="h-24 w-24 rounded-full object-cover"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1 text-base font-semibold text-foreground">
            {profile.displayName}{profile.age ? `, ${profile.age}` : ""}
            {verified && <BadgeCheck className="h-4 w-4 text-primary" />}
          </div>
          <div className="text-xs text-muted-foreground">@{profile.username}</div>
          {[profile.city, profile.state].filter(Boolean).length > 0 && (
            <div className="mt-0.5 text-sm text-muted-foreground">
              {[profile.city, profile.state].filter(Boolean).join(", ")}
            </div>
          )}
          {profile.bio && <p className="mt-1 max-w-xs text-sm">{profile.bio}</p>}

          <div className="mt-4 grid w-full max-w-xs grid-cols-3 gap-2 text-center">
            <Stat label="Publicações" value={String(visiblePosts.length)} />
            <Stat
              label="Seguidores"
              value={String(OWN_FOLLOWERS)}
              onClick={() => setListOpen("followers")}
            />
            <Stat
              label="Seguindo"
              value={String(OWN_FOLLOWING)}
              onClick={() => setListOpen("following")}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link to="/editar-perfil" className="flex-1">
            <Button variant="secondary" className="w-full">
              Editar perfil
            </Button>
          </Link>
          <Button variant="secondary" className="flex-1" onClick={() => setShareOpen(true)}>
            Compartilhar
          </Button>
        </div>
      </section>

      <ShareProfileDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        username={profile.username}
        displayName={profile.displayName}
      />

      <UsersListDialog
        open={listOpen === "followers"}
        onOpenChange={(v) => !v && setListOpen(null)}
        title="Seguidores"
        seed={`${currentUser.id}-followers`}
        count={OWN_FOLLOWERS}
      />
      <UsersListDialog
        open={listOpen === "following"}
        onOpenChange={(v) => !v && setListOpen(null)}
        title="Seguindo"
        seed={`${currentUser.id}-following`}
        count={OWN_FOLLOWING}
      />

      {/* Preview como visitante */}
      <section className="mx-4 mb-4 rounded-xl border border-dashed border-border bg-card p-3">
        <div className="mb-2 text-xs font-medium text-muted-foreground">
          Pré-visualizar como visitante
        </div>
        <div className="flex gap-2">
          <Link to="/perfil/$username" params={{ username: "maria.oliveira" }} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full justify-start gap-2">
              <img src="https://i.pravatar.cc/60?u=maria" alt="" className="h-5 w-5 rounded-full" />
              <span className="truncate">Perfil público</span>
            </Button>
          </Link>
          <Link to="/perfil/$username" params={{ username: "lil_lapisla" }} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full justify-start gap-2">
              <img src="https://i.pravatar.cc/60?u=luiza" alt="" className="h-5 w-5 rounded-full" />
              <span className="truncate">Perfil privado</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Wallet quick card */}
      <section className="mx-4 mb-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Saldo disponível</div>
            <div className="text-2xl font-bold text-success">
              R$ {wallet.balance.toFixed(2).replace(".", ",")}
            </div>
          </div>
          <Link to="/carteira">
            <Button size="sm" className="gap-2">
              <Wallet className="h-4 w-4" /> Carteira
            </Button>
          </Link>
        </div>
      </section>

      {/* Tabs */}
      <div className="grid grid-cols-3 border-y border-border">
        <TabBtn active={tab === "grid"} onClick={() => setTab("grid")} icon={<Grid3x3 className="h-5 w-5" />} />
        <TabBtn active={tab === "saved"} onClick={() => setTab("saved")} icon={<Bookmark className="h-5 w-5" />} />
        <TabBtn active={tab === "tagged"} onClick={() => setTab("tagged")} icon={<UserSquare2 className="h-5 w-5" />} />
      </div>

      {tab === "grid" && (
        <ProfileMediaGrid posts={visiblePosts} onOpen={setViewing} />
      )}
      {tab === "saved" && (
        savedPosts.length > 0 ? (
          <ProfileMediaGrid posts={savedPosts} onOpen={setViewing} />
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-foreground">
              <Bookmark className="h-6 w-6" />
            </div>
            <div className="text-base font-semibold">Nada salvo ainda</div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Toque no ícone de salvar em qualquer publicação para guardá-la aqui.
            </p>
          </div>
        )
      )}
      {tab === "tagged" && (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-foreground">
            <UserSquare2 className="h-6 w-6" />
          </div>
          <div className="text-base font-semibold">Sem marcações</div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Publicações em que você for marcado aparecerão aqui.
          </p>
        </div>
      )}

      <PostViewer
        post={viewing}
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        canDelete={tab === "grid"}
        canEditWithGemini={tab === "grid" && viewing?.user.username === currentUser.username}
        onDelete={(p) => {
          if (tab === "saved") togglePostSaved(p);
          else setDeleted((s) => new Set(s).add(p.id));
        }}
      />
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
