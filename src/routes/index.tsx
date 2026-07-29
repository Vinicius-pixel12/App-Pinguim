import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { StoriesBar } from "@/components/stories-bar";
import { FeedPost } from "@/components/feed-post";
import { ConverseModal } from "@/components/converse-modal";
import { useFeedPosts } from "@/lib/feed";
import { posts as mockPosts, type MockUser } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pinguim — Feed" },
      { name: "description", content: "Feed do Pinguim: descubra pessoas e comece conversas." },
      { property: "og:title", content: "Pinguim — Feed" },
      {
        property: "og:description",
        content: "Feed do Pinguim: descubra pessoas e comece conversas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feed,
});

function Feed() {
  const [target, setTarget] = useState<MockUser | null>(null);
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useFeedPosts();

  const handleRequest = (user: MockUser) => {
    setTarget(user);
    setOpen(true);
  };

  const list = data && data.length > 0 ? data : mockPosts;

  return (
    <>
      <TopBar />
      <StoriesBar />
      <div>
        {isLoading ? (
          <div className="space-y-4 px-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-3xl bg-card" />
            ))}
          </div>
        ) : (
          list.map((p) => (
            <FeedPost key={p.id} post={p} onRequestConverse={handleRequest} />
          ))
        )}
      </div>
      <ConverseModal user={target} open={open} onOpenChange={setOpen} />
    </>
  );
}
