import { useEffect, useState } from "react";

const KEY = "pinguim:app-background:v1";
const EVENT = "pinguim:app-background:change";

export function getStoredBackground(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setStoredBackground(dataUrl: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (dataUrl) window.localStorage.setItem(KEY, dataUrl);
    else window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore quota */
  }
}

export function useAppBackground(): [string | null, (v: string | null) => void] {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    setValue(getStoredBackground());
    const onChange = () => setValue(getStoredBackground());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return [value, (v) => { setStoredBackground(v); setValue(v); }];
}
