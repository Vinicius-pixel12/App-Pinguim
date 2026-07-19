import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Grid3x3, Bookmark, UserSquare2, Wallet } from "lucide-react";
import { currentUser, posts, wallet } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Pinguim" }] }),
  component: Perfil,
});

function Perfil() {
  return (
    <>
      <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="truncate text-lg font-semibold">{currentUser.username}</h1>
        <button aria-label="Configurações" className="p-1">
          <Settings className="h-5 w-5" />
        </button>
      </header>

      <section className="px-4 py-4">
        <div className="flex items-center gap-5">
          <div className="rounded-full story-ring">
            <div className="rounded-full bg-background p-[2px]">
              <img
                src={currentUser.avatar}
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
          <div className="font-semibold text-foreground">
            {currentUser.name}, {currentUser.age}
          </div>
          <div className="text-sm text-muted-foreground">{currentUser.city}</div>
          {currentUser.bio && <p className="mt-1 text-sm">{currentUser.bio}</p>}
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1">
            Editar perfil
          </Button>
          <Button variant="secondary" className="flex-1">
            Compartilhar
          </Button>
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
        {posts.concat(posts).slice(0, 12).map((p, i) => (
          <div key={`${p.id}-${i}`} className="aspect-square overflow-hidden bg-muted">
            <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        ))}
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
