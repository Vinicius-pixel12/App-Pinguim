import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MockPost, MockUser } from "@/lib/mock-data";

type Row = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "photo" | "video";
  caption: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    city: string | null;
    state: string | null;
    bio: string | null;
    is_private: boolean;
  } | null;
};

const relativeDate = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "agora há pouco";
  if (h < 24) return `há ${h} hora${h > 1 ? "s" : ""}`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} dia${d > 1 ? "s" : ""}`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
};

function toMockUser(p: NonNullable<Row["profiles"]>): MockUser {
  return {
    id: p.id,
    username: p.username,
    name: p.display_name ?? p.username,
    age: 0,
    city: [p.city, p.state].filter(Boolean).join(", "),
    avatar: p.avatar_url ?? `https://i.pravatar.cc/240?u=${p.username}`,
    bio: p.bio ?? undefined,
    isPrivate: p.is_private,
  };
}

/** Posts reais (mídia servida pelo CDN do Cloudflare R2). */
export function useFeedPosts() {
  return useQuery({
    queryKey: ["feed-posts"],
    queryFn: async (): Promise<MockPost[]> => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id,user_id,media_url,media_type,caption,likes_count,comments_count,created_at,profiles(id,username,display_name,avatar_url,city,state,bio,is_private)",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      return ((data ?? []) as unknown as Row[])
        .filter((r) => r.profiles)
        .map((r) => ({
          id: r.id,
          user: toMockUser(r.profiles!),
          image: r.media_type === "video" ? "" : r.media_url,
          video: r.media_type === "video" ? r.media_url : undefined,
          kind: r.media_type,
          caption: r.caption ?? "",
          likes: r.likes_count,
          comments: r.comments_count,
          date: relativeDate(r.created_at),
        }));
    },
  });
}
