import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { explorePosts } from "@/lib/mock-data";

export const Route = createFileRoute("/explorar")({
  head: () => ({ meta: [{ title: "Explorar — Pinguim" }] }),
  component: Explorar,
});

function Explorar() {
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
        {explorePosts.map((p) => (
          <button key={p.id} className="aspect-square overflow-hidden bg-muted">
            <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </>
  );
}
