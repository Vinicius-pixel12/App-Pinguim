import { useAppBackground } from "@/lib/app-background";

export function AppBackground() {
  const [bg] = useAppBackground();
  if (!bg) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center"
      style={{
        backgroundImage: `url(${bg})`,
        filter: "blur(24px) saturate(120%)",
        transform: "scale(1.1)",
      }}
    />
  );
}
