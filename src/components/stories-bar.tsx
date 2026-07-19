import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { stories } from "@/lib/mock-data";
import { StoryViewer } from "@/components/story-viewer";

export function StoriesBar() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  // Only stories with media are shown in viewer
  const viewable = stories.filter((s) => !s.isOwn && s.media.length > 0);

  const openStory = (username: string) => {
    const idx = viewable.findIndex((s) => s.user.username === username);
    if (idx >= 0) setOpenIdx(idx);
  };

  return (
    <div className="bg-transparent">
      <div className="no-scrollbar mx-auto flex max-w-md gap-3 overflow-x-auto px-4 py-4">
        {stories.map((s) => {
          const hasUnseen = !s.isOwn && s.media.length > 0 && !s.seen;
          const ringClass = s.isOwn
            ? "rounded-[22px] bg-card p-1.5 shadow-sm"
            : hasUnseen
              ? "rounded-[22px] p-[2px] shadow-sm story-ring-pulse"
              : "rounded-[22px] p-[2px] shadow-sm bg-border";

          const inner = (
            <div className={ringClass}>
              <div className="relative rounded-[20px] bg-card p-1">
                <img
                  src={s.user.avatar}
                  alt={s.user.username}
                  className="h-[58px] w-[58px] rounded-[14px] object-cover"
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
          );

          if (s.isOwn) {
            return (
              <Link
                key={s.id}
                to="/perfil"
                className="flex w-[74px] shrink-0 flex-col items-center"
              >
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={s.id}
              onClick={() => openStory(s.user.username)}
              className="flex w-[74px] shrink-0 flex-col items-center"
            >
              {inner}
            </button>
          );
        })}
      </div>

      {openIdx !== null && (
        <StoryViewer
          stories={viewable}
          startIndex={openIdx}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </div>
  );
}
