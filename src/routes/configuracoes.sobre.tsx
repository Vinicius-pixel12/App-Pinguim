import { createFileRoute } from "@tanstack/react-router";
import { SettingsSubHeader } from "@/components/settings-parts";

export const Route = createFileRoute("/configuracoes/sobre")({
  head: () => ({ meta: [{ title: "Sobre o Aplicativo — Pinguim" }] }),
  component: Sobre,
});

const info: { label: string; value: string }[] = [
  { label: "Nome do aplicativo", value: "Pinguim" },
  { label: "Versão instalada", value: "1.0.0" },
  { label: "Última atualização", value: "22 de julho de 2026" },
  { label: "Desenvolvedor", value: "Pinguim Tecnologia Ltda." },
  { label: "Site oficial", value: "Site em breve" },
  { label: "Contato", value: "contato@pinguim.app" },
  { label: "Licença do software", value: "Uso proprietário • Bibliotecas MIT/Apache 2.0" },
];

function Sobre() {
  return (
    <>
      <SettingsSubHeader title="Sobre o Aplicativo" backTo="/configuracoes" />
      <section className="px-4 py-4">
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {info.map((it) => (
            <div key={it.label} className="flex items-start justify-between gap-4 px-4 py-3">
              <span className="text-sm text-muted-foreground">{it.label}</span>
              <span className="text-right text-sm font-medium text-foreground">{it.value}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          © 2026 Pinguim. Todos os direitos reservados.
        </p>
      </section>
    </>
  );
}
