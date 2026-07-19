import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Heart, MessageCircle, User } from "lucide-react";

const tabs = [
  { to: "/", icon: Home, label: "Casa" },
  { to: "/explorar", icon: Search, label: "Explorar" },
  { to: "/notificacoes", icon: Heart, label: "Notificações" },
  { to: "/conversas", icon: MessageCircle, label: "Conversas" },
  { to: "/perfil", icon: User, label: "Perfil" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={active ? 2.5 : 1.75}
                  fill={active ? "currentColor" : "none"}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
