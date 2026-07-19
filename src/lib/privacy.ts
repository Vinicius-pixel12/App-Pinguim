import { useEffect, useState } from "react";

const KEY = "pinguim:privacy";

export type Privacy = "public" | "private";

export function getMyPrivacy(): Privacy {
  if (typeof window === "undefined") return "public";
  return (localStorage.getItem(KEY) as Privacy) || "public";
}

export function setMyPrivacy(p: Privacy) {
  localStorage.setItem(KEY, p);
  window.dispatchEvent(new Event("pinguim:privacy-changed"));
}

export function useMyPrivacy(): [Privacy, (p: Privacy) => void] {
  const [privacy, setPrivacy] = useState<Privacy>("public");
  useEffect(() => {
    setPrivacy(getMyPrivacy());
    const on = () => setPrivacy(getMyPrivacy());
    window.addEventListener("pinguim:privacy-changed", on);
    return () => window.removeEventListener("pinguim:privacy-changed", on);
  }, []);
  return [privacy, (p) => setMyPrivacy(p)];
}
