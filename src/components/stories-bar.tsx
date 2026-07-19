import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { stories, currentUser, type MockStory } from "@/lib/mock-data";
import { StoryViewer } from "@/components/story-viewer";
import { StoryComposer } from "@/components/story-composer";
import { loadOwnStories } from "@/lib/own-stories";

export function StoriesBar() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [ownMedia, setOwnMedia] = useState(() => loadOwnStories());
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("pinguim:seen-stories");
      if (raw) setSeenIds(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
    const reload = () => setOwnMedia(loadOwnStories());
    window.addEventListener("pinguim:own-stories-changed", reload);
    return () => window.removeEventListener("pinguim:own-stories-changed", reload);
  }, []);

  // Merge own media into the own story entry
  const merged: MockStory[] = stories.map((s) =>
    s.isOwn ? { ...s, media: ownMedia } : s,
  );

  // Viewable: own (if has media) + others with media
  const viewable = merged.filter((s) => s.media.length > 0);

  const openStory = (username: string) => {
    const idx = viewable.findIndex((s) => s.user.username === username);
    if (idx < 0) return;
    setOpenIdx(idx);
    const story = viewable[idx];
    if (story.isOwn) return;
    setSeenIds((prev) => {
      if (prev.has(story.id)) return prev;
      const next = new Set(prev);
      next.add(story.id);
      try {
        window.localStorage.setItem(
          "pinguim:seen-stories",
          JSON.stringify(Array.from(next)),
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleOwnClick = () => {
    if (ownMedia.length > 0) {
      openStory(currentUser.username);
    } else {
      setComposerOpen(true);
    }
  };

  return (
    <div className="bg-transparent">
      <div className="no-scrollbar mx-auto flex max-w-md gap-3 overflow-x-auto px-4 py-4">
        {merged.map((s) => {
          const hasUnseen =
            !s.isOwn && s.media.length > 0 && !s.seen && !seenIds.has(s.id);
          const ownHas = s.isOwn && s.media.length > 0;

          const ringClass = s.isOwn
            ? ownHas
              ? "rounded-[22px] p-[2px] shadow-sm story-ring-pulse"
              : "rounded-[22px] bg-card p-1.5 shadow-sm"
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
                  <button
                    aria-label="Adicionar momento"
                    onClick={(e) => {
                      e.stopPropagation();
                      setComposerOpen(true);
                    }}
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-info text-info-foreground"
                  >
                    <Plus className="h-3 w-3" strokeWidth={3} />
                  </button>
                )}
              </div>
              <span className="mt-1 block w-full truncate text-center text-[11px] font-medium text-foreground">
                {s.isOwn ? "Seu Momento" : s.user.username}
              </span>
            </div>
          );

          return (
            <button
              key={s.id}
              onClick={() => (s.isOwn ? handleOwnClick() : openStory(s.user.username))}
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

      <StoryComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
      />
    </div>
  );
}
