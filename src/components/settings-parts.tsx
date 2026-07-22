import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function SettingsSubHeader({
  title,
  backTo = "/configuracoes",
}: {
  title: string;
  backTo?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <Link to={backTo} aria-label="Voltar" className="p-1">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}

export function SettingsHubList({
  items,
  basePath,
}: {
  items: { slug: string; title: string; desc?: string }[];
  basePath: string;
}) {
  return (
    <div className="space-y-2 px-4 py-4">
      {items.map((it) => (
        <Link
          key={it.slug}
          to={`${basePath}/${it.slug}` as string}
          className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:bg-muted/40"
        >
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">{it.title}</div>
            {it.desc ? (
              <div className="text-xs text-muted-foreground">{it.desc}</div>
            ) : null}
          </div>
          <span className="mt-1 text-muted-foreground">›</span>
        </Link>
      ))}
    </div>
  );
}

export function SettingsArticle({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: string[];
}) {
  return (
    <article className="space-y-4 px-4 py-5">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed text-muted-foreground">
          {p}
        </p>
      ))}
      <p className="pt-4 text-xs text-muted-foreground/70">
        Documento sujeito a atualizações. Última revisão: julho de 2026.
      </p>
    </article>
  );
}
