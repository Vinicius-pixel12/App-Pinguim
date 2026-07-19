import type { StoryMedia } from "./mock-data";

const KEY = "pinguim:own-stories";
const TTL = 24 * 60 * 60 * 1000; // 24h

export function loadOwnStories(): StoryMedia[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as StoryMedia[];
    const now = Date.now();
    const fresh = arr.filter((m) => now - m.createdAt < TTL);
    if (fresh.length !== arr.length) saveOwnStories(fresh);
    return fresh;
  } catch {
    return [];
  }
}

export function saveOwnStories(items: StoryMedia[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("pinguim:own-stories-changed"));
  } catch {
    /* ignore */
  }
}

export function addOwnStories(items: StoryMedia[]) {
  const current = loadOwnStories();
  saveOwnStories([...current, ...items]);
}
