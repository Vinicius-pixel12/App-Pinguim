import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Send, Bookmark, Hand } from "lucide-react";
import type { MockPost } from "@/lib/mock-data";
import { users, currentUser } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { CommentsSheet } from "@/components/comments-sheet";
import { SharePostDialog } from "@/components/share-post-dialog";
import { GeminiIcon } from "@/components/gemini-icon";
import { openGeminiWithImage } from "@/lib/gemini";
import { isPostSaved, togglePostSaved } from "@/lib/saved-posts";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function likersFor(seedId: string, count: number) {
  if (count <= 0) return [];
  const base = seedId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const pool = users.filter((u) => u.username !== currentUser.username);
  const n = Math.min(count, pool.length);
  const picked: typeof pool = [];
  const used = new Set<number>();
  for (let i = 0; i < n; i++) {
    let idx = (base + i * 7) % pool.length;
    while (used.has(idx)) idx = (idx + 1) % pool.length;
    used.add(idx);
    picked.push(pool[idx]);
  }
  return picked;
}

export function FeedPost({
  post,
  onRequestConverse,
}: {
  post: MockPost;
  onRequestConverse: (user: MockPost["user"]) => void;
}) {
  const [liked, setLiked] = useState(!!post.liked);
  const [saved, setSaved] = useState<boolean>(!!post.saved);
  useEffect(() => setSaved(isPostSaved(post.id)), [post.id]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const likeCount = post.likes + (liked && !post.liked ? 1 : 0) + (!liked && post.liked ? -1 : 0);
  const isOwn = post.user.username === currentUser.username;



  return (
    <article className="mx-3 mb-4 overflow-hidden rounded-3xl bg-card shadow-sm">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link to="/perfil/$username" params={{ username: post.user.username }}>
          <img
            src={post.user.avatar}
            alt={post.user.username}
            className="h-10 w-10 rounded-full object-cover"
          />
        </Link>
        <Link
          to="/perfil/$username"
          params={{ username: post.user.username }}
          className="min-w-0"
        >
          <div className="truncate text-sm font-semibold text-foreground">
            {post.user.username}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {post.user.city} · {post.user.isPrivate ? "Privado" : "Público"}
          </div>
        </Link>
      </header>

      {/* Image + right-side actions */}
      <div className="relative mx-3 aspect-square overflow-hidden rounded-2xl bg-muted">
        <img
          src={post.image}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onDoubleClick={() => setLiked(true)}
          onClick={isOwn ? () => openGeminiWithImage(post.image) : undefined}
          style={isOwn ? { cursor: "pointer" } : undefined}
        />

        {/* Vertical action rail */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-card/95 px-2 py-3 shadow-md backdrop-blur">
            {isOwn && (
              <IconBtn
                aria-label="Editar no Gemini"
                onClick={() => openGeminiWithImage(post.image)}
              >
                <GeminiIcon className="h-6 w-6" size={24} />
              </IconBtn>
            )}
            <IconBtn aria-label="Curtir" onClick={() => setLiked((v) => !v)}>
              <Heart
                className={`h-6 w-6 ${liked ? "text-destructive" : "text-foreground"}`}
                fill={liked ? "currentColor" : "none"}
                strokeWidth={1.75}
              />
            </IconBtn>
            <IconBtn aria-label="Comentar" onClick={() => setCommentsOpen(true)}>
              <MessageCircle className="h-6 w-6 text-foreground" strokeWidth={1.75} />
            </IconBtn>
            <IconBtn aria-label="Enviar" onClick={() => setShareOpen(true)}>
              <Send className="h-6 w-6 text-foreground" strokeWidth={1.75} />
            </IconBtn>
            <IconBtn
              aria-label="Salvar"
              onClick={() => {
                const now = togglePostSaved(post);
                setSaved(now);
                toast.success(now ? "Salvo na sua galeria" : "Removido da galeria");
              }}
            >
              <Bookmark
                className="h-6 w-6 text-foreground"
                fill={saved ? "currentColor" : "none"}
                strokeWidth={1.75}
              />
            </IconBtn>
          </div>
        </div>

        {/* Overlay author name (bottom-left) */}
        <div className="pointer-events-none absolute bottom-3 left-3 right-24 text-white drop-shadow">
          <div className="text-base font-semibold">{post.user.username}</div>
          <div className="text-[11px] opacity-90">{post.user.city} · Público</div>
        </div>
      </div>

      {/* Converse button */}
      <div className="px-3 pt-3 pb-3">
        <Button
          onClick={() => onRequestConverse(post.user)}
          className="w-full gap-2 rounded-2xl bg-gradient-to-r from-[oklch(0.65_0.18_145)] via-[oklch(0.75_0.22_105)] to-[oklch(0.82_0.18_95)] py-6 text-base font-semibold text-white hover:opacity-95"
        >
          <Hand className="h-5 w-5" />
          Iniciar Conversa
        </Button>
      </div>

      {/* Counts + caption */}
      <div className="space-y-1 px-4 pb-4">
        <button
          onClick={() => setLikesOpen(true)}
          className="text-sm font-semibold text-foreground hover:underline"
        >
          {likeCount.toLocaleString("pt-BR")} curtidas
        </button>

        <p className="text-sm text-foreground">
          <span className="font-semibold">{post.user.username}</span>{" "}
          <span>{post.caption}</span>
        </p>
        {post.comments > 0 && (
          <button
            onClick={() => setCommentsOpen(true)}
            className="text-sm text-muted-foreground"
          >
            Ver todos os {post.comments} comentários
          </button>
        )}
        <div className="pt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          {post.date}
        </div>
      </div>

      <CommentsSheet
        post={post}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />

      <Dialog open={likesOpen} onOpenChange={setLikesOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="text-center text-base font-semibold">
              Curtidas
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {likersFor(post.id, likeCount).map((u) => (
              <Link
                key={u.username}
                to="/perfil/$username"
                params={{ username: u.username }}
                onClick={() => setLikesOpen(false)}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted"
              >
                <img
                  src={u.avatar}
                  alt={u.username}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {u.username}
                  </div>
                  {u.name && (
                    <div className="truncate text-xs text-muted-foreground">
                      {u.name}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <SharePostDialog
        post={post}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

    </article>
  );
}

function IconBtn({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className="transition-transform active:scale-90">
      {children}
    </button>
  );
}
