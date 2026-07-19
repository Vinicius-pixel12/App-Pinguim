import { useState } from "react";
import { Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import type { MockPost } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommentsSheet } from "@/components/comments-sheet";
import { GeminiIcon } from "@/components/gemini-icon";
import { openGeminiWithImage } from "@/lib/gemini";
import { toast } from "sonner";

export function PostViewer({
  post,
  open,
  onOpenChange,
  canDelete,
  canEditWithGemini,
  onDelete,
}: {
  post: MockPost | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canDelete?: boolean;
  canEditWithGemini?: boolean;
  onDelete?: (post: MockPost) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  if (!post) return null;
  const likeCount = post.likes + (liked ? 1 : 0);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `@${post.user.username}`,
          text: post.caption,
          url: post.image,
        });
      } else {
        await navigator.clipboard.writeText(post.image);
        toast.success("Link copiado");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="border-b border-border p-3">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <img
                src={post.user.avatar}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="font-semibold">{post.user.username}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="relative bg-muted">
            <img src={post.image} alt="" className="w-full object-cover" />
            {canEditWithGemini && (
              <button
                aria-label="Editar no Gemini"
                onClick={() => openGeminiWithImage(post.image)}
                className="absolute right-2 top-2 rounded-full bg-card/95 p-2 shadow-md backdrop-blur"
              >
                <GeminiIcon className="h-5 w-5" size={20} />
              </button>
            )}
          </div>

          {post.caption && (
            <p className="px-4 pt-3 text-sm">
              <span className="font-semibold">{post.user.username}</span>{" "}
              {post.caption}
            </p>
          )}

          <div className="flex items-center justify-around border-t border-border p-2">
            <ActionBtn
              label={`${likeCount.toLocaleString("pt-BR")}`}
              onClick={() => setLiked((v) => !v)}
            >
              <Heart
                className={`h-6 w-6 ${liked ? "text-destructive" : ""}`}
                fill={liked ? "currentColor" : "none"}
                strokeWidth={1.75}
              />
            </ActionBtn>
            <ActionBtn
              label={`${post.comments}`}
              onClick={() => setCommentsOpen(true)}
            >
              <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
            </ActionBtn>
            <ActionBtn label="Compartilhar" onClick={share}>
              <Share2 className="h-6 w-6" strokeWidth={1.75} />
            </ActionBtn>
            {canDelete && (
              <ActionBtn
                label="Excluir"
                onClick={() => {
                  if (confirm("Excluir esta publicação?")) {
                    onDelete?.(post);
                    onOpenChange(false);
                  }
                }}
              >
                <Trash2 className="h-6 w-6 text-destructive" strokeWidth={1.75} />
              </ActionBtn>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CommentsSheet post={post} open={commentsOpen} onOpenChange={setCommentsOpen} />
    </>
  );
}

function ActionBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[11px] text-muted-foreground transition active:scale-95 hover:bg-muted"
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
