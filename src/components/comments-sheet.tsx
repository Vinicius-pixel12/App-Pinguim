import { useMemo, useState } from "react";
import { Heart, Send, CornerDownRight, X } from "lucide-react";
import type { MockPost } from "@/lib/mock-data";
import { users, currentUser } from "@/lib/mock-data";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Reply = {
  id: string;
  author: (typeof users)[number];
  text: string;
  time: string;
  likes: number;
  liked?: boolean;
};

type Comment = Reply & { replies: Reply[] };

function seedComments(postId: string): Comment[] {
  // deterministic mock based on post id
  const pick = (i: number) => users[(postId.charCodeAt(1) + i) % users.length];
  return [
    {
      id: `${postId}-c1`,
      author: pick(0),
      text: "Que foto incrível! 😍",
      time: "há 2h",
      likes: 24,
      replies: [
        {
          id: `${postId}-c1-r1`,
          author: pick(2),
          text: "Concordo demais!",
          time: "há 1h",
          likes: 3,
        },
        {
          id: `${postId}-c1-r2`,
          author: pick(3),
          text: "Também curti muito ✨",
          time: "há 40min",
          likes: 1,
        },
      ],
    },
    {
      id: `${postId}-c2`,
      author: pick(1),
      text: "Onde foi essa? Quero conhecer 🙌",
      time: "há 5h",
      likes: 12,
      replies: [
        {
          id: `${postId}-c2-r1`,
          author: pick(4),
          text: "Parece o mesmo lugar que fui semana passada!",
          time: "há 3h",
          likes: 2,
        },
      ],
    },
    {
      id: `${postId}-c3`,
      author: pick(2),
      text: "Top demais 🔥🔥",
      time: "há 1 dia",
      likes: 7,
      replies: [],
    },
  ];
}

export function CommentsSheet({
  post,
  open,
  onOpenChange,
}: {
  post: MockPost | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const initial = useMemo(() => (post ? seedComments(post.id) : []), [post]);
  const [comments, setComments] = useState<Comment[]>(initial);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ commentId: string; username: string } | null>(null);

  // reset when post changes
  useMemo(() => {
    setComments(initial);
    setText("");
    setReplyTo(null);
  }, [initial]);

  if (!post) return null;

  const total =
    comments.length + comments.reduce((s, c) => s + c.replies.length, 0);

  const toggleLikeComment = (id: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) }
          : c,
      ),
    );
  };

  const toggleLikeReply = (commentId: string, replyId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id !== commentId
          ? c
          : {
              ...c,
              replies: c.replies.map((r) =>
                r.id !== replyId
                  ? r
                  : { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) },
              ),
            },
      ),
    );
  };

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    if (replyTo) {
      setComments((prev) =>
        prev.map((c) =>
          c.id !== replyTo.commentId
            ? c
            : {
                ...c,
                replies: [
                  ...c.replies,
                  {
                    id: `${c.id}-r${c.replies.length + 1}-${Date.now()}`,
                    author: currentUser as unknown as (typeof users)[number],
                    text: value,
                    time: "agora",
                    likes: 0,
                  },
                ],
              },
        ),
      );
    } else {
      setComments((prev) => [
        ...prev,
        {
          id: `${post.id}-c${prev.length + 1}-${Date.now()}`,
          author: currentUser as unknown as (typeof users)[number],
          text: value,
          time: "agora",
          likes: 0,
          replies: [],
        },
      ]);
    }
    setText("");
    setReplyTo(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] gap-0 rounded-t-3xl p-0"
      >
        <SheetHeader className="border-b border-border p-4 text-center">
          <SheetTitle className="text-base font-semibold">
            {total} comentário{total === 1 ? "" : "s"}
          </SheetTitle>
        </SheetHeader>

        <div className="h-[calc(85vh-140px)] overflow-y-auto px-4 py-3">
          {comments.map((c) => (
            <div key={c.id} className="mb-4">
              <CommentRow
                author={c.author}
                text={c.text}
                time={c.time}
                likes={c.likes}
                liked={c.liked}
                onLike={() => toggleLikeComment(c.id)}
                onReply={() =>
                  setReplyTo({ commentId: c.id, username: c.author.username })
                }
              />
              {c.replies.length > 0 && (
                <div className="mt-3 space-y-3 pl-11">
                  {c.replies.map((r) => (
                    <CommentRow
                      key={r.id}
                      author={r.author}
                      text={r.text}
                      time={r.time}
                      likes={r.likes}
                      liked={r.liked}
                      small
                      onLike={() => toggleLikeReply(c.id, r.id)}
                      onReply={() =>
                        setReplyTo({
                          commentId: c.id,
                          username: r.author.username,
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border bg-card p-3">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CornerDownRight className="h-3 w-3" />
                Respondendo a <span className="font-semibold">@{replyTo.username}</span>
              </span>
              <button onClick={() => setReplyTo(null)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <img
              src={currentUser.avatar}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder={
                replyTo ? `Responder a @${replyTo.username}...` : "Adicione um comentário..."
              }
              className="flex-1 rounded-full"
            />
            <Button
              size="icon"
              onClick={submit}
              disabled={!text.trim()}
              className="rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CommentRow({
  author,
  text,
  time,
  likes,
  liked,
  small,
  onLike,
  onReply,
}: {
  author: (typeof users)[number];
  text: string;
  time: string;
  likes: number;
  liked?: boolean;
  small?: boolean;
  onLike: () => void;
  onReply: () => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <img
        src={author.avatar}
        alt={author.username}
        className={`${small ? "h-7 w-7" : "h-9 w-9"} shrink-0 rounded-full object-cover`}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-foreground">
          <span className="font-semibold">{author.username}</span>{" "}
          <span>{text}</span>
        </div>
        <div className="mt-1 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>{time}</span>
          {likes > 0 && (
            <span>
              {likes} curtida{likes === 1 ? "" : "s"}
            </span>
          )}
          <button onClick={onReply} className="font-semibold">
            Responder
          </button>
        </div>
      </div>
      <button onClick={onLike} className="mt-1 shrink-0 p-1">
        <Heart
          className={`h-4 w-4 ${liked ? "text-destructive" : "text-muted-foreground"}`}
          fill={liked ? "currentColor" : "none"}
          strokeWidth={1.75}
        />
      </button>
    </div>
  );
}
