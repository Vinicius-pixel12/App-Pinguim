import { createFileRoute } from "@tanstack/react-router";
import { chats } from "@/lib/mock-data";

export const Route = createFileRoute("/conversas")({
  head: () => ({ meta: [{ title: "Conversas — Pinguim" }] }),
  component: Conversas,
});

function Conversas() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">Conversas</h1>
      </header>
      <ul className="divide-y divide-border">
        {chats.map((c) => (
          <li key={c.id}>
            <button className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 text-left">
              <img
                src={c.user.avatar}
                alt={c.user.username}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="truncate font-semibold text-foreground">{c.user.name}</div>
                <div className="truncate text-sm text-muted-foreground">{c.lastMessage}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] text-muted-foreground">{c.time}</span>
                {c.unread > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                    {c.unread}
                  </span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
