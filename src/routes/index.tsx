import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { StoriesBar } from "@/components/stories-bar";
import { FeedPost } from "@/components/feed-post";
import { ConverseModal } from "@/components/converse-modal";
import { posts, type MockUser } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pinguim — Feed" },
      { name: "description", content: "Feed do Pinguim: descubra pessoas e comece conversas." },
    ],
  }),
  component: Feed,
});

function Feed() {
  const [target, setTarget] = useState<MockUser | null>(null);
  const [open, setOpen] = useState(false);

  const handleRequest = (user: MockUser) => {
    setTarget(user);
    setOpen(true);
  };

  return (
    <>
      <TopBar />
      <StoriesBar />
      <div>
        {posts.map((p) => (
          <FeedPost key={p.id} post={p} onRequestConverse={handleRequest} />
        ))}
      </div>
      <ConverseModal user={target} open={open} onOpenChange={setOpen} />
    </>
  );
}
