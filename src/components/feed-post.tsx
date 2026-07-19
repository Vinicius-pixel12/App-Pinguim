import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Hand } from "lucide-react";
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
    <article className="border-b border-border bg-background">
      {/* Header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-full story-ring">
            <div className="rounded-full bg-background p-[2px]">
              <img
                src={post.user.avatar}
                alt={post.user.username}
                className="h-9 w-9 rounded-full object-cover"
              />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
              <span className="truncate">{post.user.username}</span>
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {post.user.city} · Público
            </div>
          </div>
        </div>
        <button aria-label="Mais opções" className="p-1 text-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      {/* Image */}
      <div className="relative aspect-square w-full bg-muted">
        <img
          src={post.image}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onDoubleClick={() => setLiked(true)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1">
          <IconBtn
            aria-label="Curtir"
            onClick={() => setLiked((v) => !v)}
            active={liked}
          >
            <Heart
              className={`h-6 w-6 ${liked ? "text-destructive" : "text-foreground"}`}
              fill={liked ? "currentColor" : "none"}
              strokeWidth={1.75}
            />
          </IconBtn>
          <IconBtn aria-label="Comentar">
            <MessageCircle className="h-6 w-6 text-foreground" strokeWidth={1.75} />
          </IconBtn>
          <IconBtn aria-label="Compartilhar">
            <Send className="h-6 w-6 text-foreground" strokeWidth={1.75} />
          </IconBtn>
        </div>
        <IconBtn aria-label="Salvar" onClick={() => setSaved((v) => !v)}>
          <Bookmark
            className="h-6 w-6 text-foreground"
            fill={saved ? "currentColor" : "none"}
            strokeWidth={1.75}
          />
        </IconBtn>
      </div>

      {/* Converse button */}
      <div className="px-4 pb-2">
        <Button
          onClick={() => onRequestConverse(post.user)}
          className="w-full gap-2 bg-gradient-to-r from-primary to-[oklch(0.55_0.22_340)] text-primary-foreground hover:opacity-95"
        >
          <Hand className="h-4 w-4" />
          Conversar com {post.user.name} · R$ 4,97
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
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={`p-2 transition-transform active:scale-90 ${active ? "" : ""}`}
    >
      {children}
    </button>
  );
}
