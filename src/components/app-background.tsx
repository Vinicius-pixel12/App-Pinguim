import { useEffect } from "react";
import { useAppBackground } from "@/lib/app-background";

export function AppBackground() {
  const [bg] = useAppBackground();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    const html = document.documentElement;
    if (bg) {
      body.style.backgroundColor = "transparent";
      html.style.backgroundColor = "transparent";
    } else {
      body.style.backgroundColor = "";
      html.style.backgroundColor = "";
    }
  }, [bg]);

  if (!bg) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
      style={{
        backgroundImage: `url(${bg})`,
        filter: "blur(24px) saturate(120%)",
        transform: "scale(1.1)",
      }}
    />
  );
}
