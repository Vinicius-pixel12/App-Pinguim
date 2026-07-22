import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, Globe } from "lucide-react";
import { useMyPrivacy } from "@/lib/privacy";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Pinguim" }] }),
  component: Configuracoes,
});

function Configuracoes() {
  const [privacy, setPrivacy] = useMyPrivacy();
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/perfil" aria-label="Voltar" className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Configurações</h1>
      </header>

      <section className="px-4 py-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Privacidade da conta
        </h2>

        <div className="space-y-2">
          <PrivacyOption
            active={privacy === "public"}
            onClick={() => setPrivacy("public")}
            icon={<Globe className="h-5 w-5" />}
            title="Conta pública"
            desc="Qualquer pessoa pode ver suas publicações e seu perfil."
          />
          <PrivacyOption
            active={privacy === "private"}
            onClick={() => setPrivacy("private")}
            icon={<Lock className="h-5 w-5" />}
            title="Conta privada"
            desc="Só quem você aprovar poderá ver suas publicações."
          />
        </div>
      </section>
    </>
  );
}

function PrivacyOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
        active ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div
        className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${
          active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <span
        className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
          active ? "border-primary bg-primary" : "border-muted-foreground/40"
        }`}
      />
    </button>
  );
}
