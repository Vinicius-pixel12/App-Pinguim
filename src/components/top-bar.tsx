import { Link } from "@tanstack/react-router";
import { PlusSquare, Heart, Send } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link to="/" className="font-brand text-3xl leading-none text-foreground">
          Pinguim
        </Link>
        <div className="flex items-center gap-4 text-foreground">
          <button aria-label="Nova publicação" className="p-1">
            <PlusSquare className="h-6 w-6" strokeWidth={1.75} />
          </button>
          <Link to="/notificacoes" aria-label="Notificações" className="p-1">
            <Heart className="h-6 w-6" strokeWidth={1.75} />
          </Link>
          <Link to="/conversas" aria-label="Mensagens" className="p-1">
            <Send className="h-6 w-6" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </header>
  );
}
