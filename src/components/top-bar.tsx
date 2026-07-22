import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, PlusSquare, Heart, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostComposer } from "@/components/post-composer";

export function TopBar() {
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
        <Link to="/" className="font-brand text-3xl leading-none text-foreground">
          Pinguim
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Menu"
            className="rounded-full p-1 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown className="h-6 w-6" strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setComposerOpen(true); }}>
              <PlusSquare className="mr-2 h-4 w-4" />
              Nova publicação
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/notificacoes" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Notificações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/conversas" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Mensagens
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <PostComposer open={composerOpen} onOpenChange={setComposerOpen} />
    </header>
  );
}
