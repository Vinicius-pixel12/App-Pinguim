import { Plus } from "lucide-react";
import { stories } from "@/lib/mock-data";

export function StoriesBar() {
  return (
    <div className="bg-transparent">
      <div className="no-scrollbar mx-auto flex max-w-md gap-3 overflow-x-auto px-4 py-4">
        {stories.map((s) => (
          <button key={s.id} className="flex w-[74px] shrink-0 flex-col items-center">
            <div className="relative rounded-[22px] bg-card p-1.5 shadow-sm">
              <div className="relative">
                <img
                  src={s.user.avatar}
                  alt={s.user.username}
                  className="h-[62px] w-[62px] rounded-[16px] object-cover"
                  loading="lazy"
                />
                {s.isOwn && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-info text-info-foreground">
                    <Plus className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </div>
              <span className="mt-1 block w-full truncate text-center text-[11px] font-medium text-foreground">
                {s.isOwn ? "Seu Momento" : s.user.username}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
