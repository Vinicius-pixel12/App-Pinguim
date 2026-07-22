import { createFileRoute, notFound } from "@tanstack/react-router";
import { SettingsSubHeader, SettingsArticle } from "@/components/settings-parts";
import { supportArticles } from "@/lib/settings-content";

export const Route = createFileRoute("/configuracoes/suporte/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${supportArticles[params.slug]?.title ?? "Suporte"} — Pinguim` }],
  }),
  component: SuporteArticle,
  notFoundComponent: () => (
    <>
      <SettingsSubHeader title="Não encontrado" backTo="/configuracoes/suporte" />
      <p className="px-4 py-6 text-sm text-muted-foreground">Conteúdo indisponível.</p>
    </>
  ),
  errorComponent: () => (
    <>
      <SettingsSubHeader title="Erro" backTo="/configuracoes/suporte" />
      <p className="px-4 py-6 text-sm text-muted-foreground">Não foi possível carregar.</p>
    </>
  ),
});

function SuporteArticle() {
  const { slug } = Route.useParams();
  const article = supportArticles[slug];
  if (!article) throw notFound();
  return (
    <>
      <SettingsSubHeader title={article.title} backTo="/configuracoes/suporte" />
      <SettingsArticle title={article.title} paragraphs={article.paragraphs} />
    </>
  );
}
