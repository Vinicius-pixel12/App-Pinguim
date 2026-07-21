import { useEffect, useState } from "react";
import type { MockPost } from "@/lib/mock-data";

const KEY = "pinguim.saved-posts";

type Stored = MockPost & { savedAt: number };

function read(): Stored[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list: Stored[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("pinguim:saved-posts"));
}

export function useSavedPosts() {
  const [list, setList] = useState<Stored[]>([]);
  useEffect(() => {
    setList(read());
    const on = () => setList(read());
    window.addEventListener("pinguim:saved-posts", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("pinguim:saved-posts", on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return list;
}

export function isPostSaved(id: string) {
  return read().some((p) => p.id === id);
}

export function togglePostSaved(post: MockPost): boolean {
  const list = read();
  const idx = list.findIndex((p) => p.id === post.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    write(list);
    return false;
  }
  list.unshift({ ...post, savedAt: Date.now() });
  write(list);
  return true;
}
