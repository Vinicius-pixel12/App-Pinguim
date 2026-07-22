import { createFileRoute, notFound } from "@tanstack/react-router";
import { SettingsSubHeader, SettingsArticle } from "@/components/settings-parts";
import { legalArticles } from "@/lib/settings-content";

export const Route = createFileRoute("/configuracoes/legal/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${legalArticles[params.slug]?.title ?? "Documento"} — Pinguim` }],
  }),
  component: LegalArticle,
  notFoundComponent: () => (
    <>
      <SettingsSubHeader title="Não encontrado" backTo="/configuracoes/legal" />
      <p className="px-4 py-6 text-sm text-muted-foreground">Conteúdo indisponível.</p>
    </>
  ),
  errorComponent: () => (
    <>
      <SettingsSubHeader title="Erro" backTo="/configuracoes/legal" />
      <p className="px-4 py-6 text-sm text-muted-foreground">Não foi possível carregar.</p>
    </>
  ),
});

function LegalArticle() {
  const { slug } = Route.useParams();
  const article = legalArticles[slug];
  if (!article) throw notFound();
  return (
    <>
      <SettingsSubHeader title={article.title} backTo="/configuracoes/legal" />
      <SettingsArticle title={article.title} paragraphs={article.paragraphs} />
    </>
  );
}
