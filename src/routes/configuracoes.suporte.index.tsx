import { createFileRoute } from "@tanstack/react-router";
import { SettingsSubHeader, SettingsHubList } from "@/components/settings-parts";
import { supportList } from "@/lib/settings-content";

export const Route = createFileRoute("/configuracoes/suporte/")({
  head: () => ({ meta: [{ title: "Suporte — Pinguim" }] }),
  component: SuporteHub,
});

function SuporteHub() {
  return (
    <>
      <SettingsSubHeader title="Suporte" backTo="/configuracoes" />
      <SettingsHubList items={supportList} basePath="/configuracoes/suporte" />
    </>
  );
}
