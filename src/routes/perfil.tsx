import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Grid3x3, Bookmark, UserSquare2, Wallet, BadgeCheck } from "lucide-react";
import { posts, wallet, type MockPost } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { PostViewer } from "@/components/post-viewer";
import { useProfile } from "@/lib/profile";


export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Pinguim" }] }),
  component: Perfil,
});

function Perfil() {
  const gridPosts = posts.concat(posts).slice(0, 12).map((p, i) => ({ ...p, id: `${p.id}-${i}` }));
  const [viewing, setViewing] = useState<MockPost | null>(null);
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const visiblePosts = gridPosts.filter((p) => !deleted.has(p.id));
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
        <div className="flex items-center gap-5">
          <div className="rounded-full story-ring">
            <div className="rounded-full bg-background p-[2px]">
              <img
                src={profile.avatar}
                alt=""
                className="h-20 w-20 rounded-full object-cover"
              />
            </div>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            <Stat label="Publicações" value="12" />
            <Stat label="Seguidores" value="248" />
            <Stat label="Seguindo" value="180" />
          </div>
        </div>

        <div className="mt-3">
          <div className="font-semibold text-foreground flex items-center gap-1">
            {profile.displayName}{profile.age ? `, ${profile.age}` : ""}
            {verified && <BadgeCheck className="h-4 w-4 text-primary" />}
          </div>
          <div className="text-sm text-muted-foreground">
            {[profile.city, profile.state].filter(Boolean).join(", ")}
          </div>
          {profile.bio && <p className="mt-1 text-sm">{profile.bio}</p>}
        </div>

        <div className="mt-4 flex gap-2">
          <Link to="/editar-perfil" className="flex-1">
            <Button variant="secondary" className="w-full">
              Editar perfil
            </Button>
          </Link>
          <Button variant="secondary" className="flex-1">
            Compartilhar
          </Button>
        </div>
      </section>


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
        <TabBtn active icon={<Grid3x3 className="h-5 w-5" />} />
        <TabBtn icon={<Bookmark className="h-5 w-5" />} />
        <TabBtn icon={<UserSquare2 className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-3 gap-[2px]">
        {visiblePosts.map((p) => (
          <button
            key={p.id}
            onClick={() => setViewing(p)}
            className="aspect-square overflow-hidden bg-muted"
          >
            <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>

      <PostViewer
        post={viewing}
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        canDelete
        canEditWithGemini
        onDelete={(p) => setDeleted((s) => new Set(s).add(p.id))}
      />
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
