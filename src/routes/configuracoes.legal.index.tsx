import { createFileRoute } from "@tanstack/react-router";
import { SettingsSubHeader, SettingsHubList } from "@/components/settings-parts";
import { legalList } from "@/lib/settings-content";

export const Route = createFileRoute("/configuracoes/legal/")({
  head: () => ({ meta: [{ title: "Documentos legais — Pinguim" }] }),
  component: LegalHub,
});

function LegalHub() {
  return (
    <>
      <SettingsSubHeader title="Documentos legais" backTo="/configuracoes" />
      <SettingsHubList items={legalList} basePath="/configuracoes/legal" />
    </>
  );
}
