import { Plus } from "lucide-react";
import { stories } from "@/lib/mock-data";

export function StoriesBar() {
  return (
    <div className="border-b border-border bg-background">
      <div className="no-scrollbar mx-auto flex max-w-md gap-4 overflow-x-auto px-4 py-3">
        {stories.map((s) => (
          <button key={s.id} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <div className="relative">
              <div className={s.isOwn ? "rounded-full p-[2px] bg-muted" : "rounded-full story-ring"}>
                <div className="rounded-full bg-background p-[2px]">
                  <img
                    src={s.user.avatar}
                    alt={s.user.username}
                    className="h-14 w-14 rounded-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              {s.isOwn && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-info text-info-foreground">
                  <Plus className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </div>
            <span className="w-full truncate text-center text-[11px] text-foreground">
              {s.isOwn ? "Seu story" : s.user.username}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
