import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Send, Bookmark, Repeat2, Hand } from "lucide-react";
import type { MockPost } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export function FeedPost({
  post,
  onRequestConverse,
}: {
  post: MockPost;
  onRequestConverse: (user: MockPost["user"]) => void;
}) {
  const [liked, setLiked] = useState(!!post.liked);
  const [saved, setSaved] = useState(!!post.saved);

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
        />

        {/* Vertical action rail */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-card/95 px-2 py-3 shadow-md backdrop-blur">
            <IconBtn aria-label="Compartilhar publicação">
              <Repeat2 className="h-6 w-6 text-foreground" strokeWidth={1.75} />
            </IconBtn>
            <IconBtn aria-label="Curtir" onClick={() => setLiked((v) => !v)}>
              <Heart
                className={`h-6 w-6 ${liked ? "text-destructive" : "text-foreground"}`}
                fill={liked ? "currentColor" : "none"}
                strokeWidth={1.75}
              />
            </IconBtn>
            <IconBtn aria-label="Comentar">
              <MessageCircle className="h-6 w-6 text-foreground" strokeWidth={1.75} />
            </IconBtn>
            <IconBtn aria-label="Enviar">
              <Send className="h-6 w-6 text-foreground" strokeWidth={1.75} />
            </IconBtn>
            <IconBtn aria-label="Salvar" onClick={() => setSaved((v) => !v)}>
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
          className="w-full gap-2 rounded-2xl bg-gradient-to-r from-primary to-[oklch(0.55_0.22_340)] py-6 text-base font-semibold text-primary-foreground hover:opacity-95"
        >
          <Hand className="h-5 w-5" />
          Iniciar Conversa (R$ 4,97)
        </Button>
      </div>

      {/* Counts + caption */}
      <div className="space-y-1 px-4 pb-4">
        <div className="text-sm font-semibold text-foreground">
          {post.likes.toLocaleString("pt-BR")} curtidas
        </div>
        <p className="text-sm text-foreground">
          <span className="font-semibold">{post.user.username}</span>{" "}
          <span>{post.caption}</span>
        </p>
        {post.comments > 0 && (
          <button className="text-sm text-muted-foreground">
            Ver todos os {post.comments} comentários
          </button>
        )}
        <div className="pt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          {post.date}
        </div>
      </div>
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
