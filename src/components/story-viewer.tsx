import { useEffect, useRef, useState } from "react";
import { X, Heart, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { MockStory } from "@/lib/mock-data";

const STORY_DURATION = 5000; // 5s per media

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const h = Math.floor(diff / (1000 * 60 * 60));
  if (h < 1) {
    const m = Math.max(1, Math.floor(diff / (1000 * 60)));
    return `há ${m}m`;
  }
  return `há ${h}h`;
}

export function StoryViewer({
  stories,
  startIndex,
  onClose,
}: {
  stories: MockStory[];
  startIndex: number;
  onClose: () => void;
}) {
  const [userIdx, setUserIdx] = useState(startIndex);
  const [mediaIdx, setMediaIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [progress, setProgress] = useState(0);
  const startTs = useRef<number>(Date.now());
  const rafRef = useRef<number | null>(null);

  const story = stories[userIdx];
  const media = story?.media[mediaIdx];

  const next = () => {
    setLiked(false);
    setComment("");
    if (!story) return;
    if (mediaIdx + 1 < story.media.length) {
      setMediaIdx((i) => i + 1);
    } else if (userIdx + 1 < stories.length) {
      setUserIdx((i) => i + 1);
      setMediaIdx(0);
    } else {
      onClose();
    }
  };

  const prev = () => {
    setLiked(false);
    setComment("");
    if (mediaIdx > 0) setMediaIdx((i) => i - 1);
    else if (userIdx > 0) {
      const prevStory = stories[userIdx - 1];
      setUserIdx((i) => i - 1);
      setMediaIdx(Math.max(0, prevStory.media.length - 1));
    }
  };

  // Progress ticker
  useEffect(() => {
    startTs.current = Date.now();
    setProgress(0);
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      if (!paused) {
        const delta = now - last;
        setProgress((p) => {
          const np = p + (delta / STORY_DURATION) * 100;
          if (np >= 100) {
            next();
            return 0;
          }
          return np;
        });
      }
      last = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdx, mediaIdx, paused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdx, mediaIdx]);

  if (!story || !media) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative flex h-full max-h-[900px] w-full max-w-md flex-col overflow-hidden bg-black">
        {/* Progress bars */}
        <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 px-3 pt-3">
          {story.media.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={{
                  width:
                    i < mediaIdx ? "100%" : i === mediaIdx ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute left-0 right-0 top-6 z-20 flex items-center gap-3 px-4 pt-2">
          <Link
            to="/perfil/$username"
            params={{ username: story.user.username }}
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <img
              src={story.user.avatar}
              alt=""
              className="h-8 w-8 rounded-full border border-white/50 object-cover"
            />
            <span className="text-sm font-semibold text-white drop-shadow">
              {story.user.username}
            </span>
            <span className="text-xs text-white/80 drop-shadow">
              {timeAgo(media.createdAt)}
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="ml-auto rounded-full p-1 text-white/90 hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Media */}
        <div
          className="relative flex-1"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
        >
          <img
            src={media.image}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
          {media.caption && (
            <div className="absolute bottom-24 left-4 right-4 rounded-xl bg-black/40 px-3 py-2 text-center text-sm text-white backdrop-blur-sm">
              {media.caption}
            </div>
          )}

          {/* Tap zones */}
          <button
            aria-label="Anterior"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-0 top-0 hidden h-full w-1/3 items-center justify-start pl-2 text-white/60 hover:text-white md:flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            aria-label="Próximo"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-0 top-0 hidden h-full w-1/3 items-center justify-end pr-2 text-white/60 hover:text-white md:flex"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Mobile tap areas (invisible) */}
          <button
            aria-label="Anterior"
            onClick={prev}
            className="absolute left-0 top-0 h-full w-1/3 md:hidden"
          />
          <button
            aria-label="Próximo"
            onClick={next}
            className="absolute right-0 top-0 h-full w-1/3 md:hidden"
          />
        </div>

        {/* Footer: comment + like */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-4 pb-5 pt-6">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            placeholder={`Responder a ${story.user.username}...`}
            className="flex-1 rounded-full border border-white/40 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/70 focus:border-white focus:outline-none"
          />
          <button
            aria-label="Curtir"
            onClick={() => setLiked((v) => !v)}
            className="p-2 text-white transition-transform active:scale-90"
          >
            <Heart
              className={`h-6 w-6 ${liked ? "text-destructive" : ""}`}
              fill={liked ? "currentColor" : "none"}
            />
          </button>
          {comment.trim() && (
            <button
              aria-label="Enviar"
              onClick={() => setComment("")}
              className="p-2 text-white transition-transform active:scale-90"
            >
              <Send className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
