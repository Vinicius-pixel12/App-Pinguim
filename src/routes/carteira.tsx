import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Wallet as WalletIcon, DollarSign, Send, ShieldCheck } from "lucide-react";
import { wallet } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/carteira")({
  head: () => ({ meta: [{ title: "Carteira — Pinguim" }] }),
  component: Carteira,
});

function Carteira() {
  const canWithdraw = wallet.balance >= wallet.minWithdraw;

  return (
    <>
      <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/perfil" aria-label="Voltar" className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="truncate text-lg font-semibold">Carteira</h1>
        <span />
      </header>

      <div className="space-y-4 p-4">
        {/* Balance card */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">Saldo disponível</div>
              <div className="text-3xl font-bold text-success">
                R$ {wallet.balance.toFixed(2).replace(".", ",")}
              </div>
            </div>
            {wallet.verified && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                <ShieldCheck className="h-3 w-3" /> Conta verificada
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            <Metric
              icon={<ArrowDownCircle className="h-4 w-4 text-info" />}
              label="Recebido"
              value={`R$ ${wallet.received.toFixed(2).replace(".", ",")}`}
              hint="Total acumulado"
            />
            <Metric
              icon={<ArrowUpCircle className="h-4 w-4 text-warning" />}
              label="Retirado"
              value={`R$ ${wallet.withdrawn.toFixed(2).replace(".", ",")}`}
              hint="Saques realizados"
            />
          </div>
        </div>

        {/* Add balance */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10">
              <WalletIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground">Adicionar saldo</div>
              <div className="truncate text-xs text-muted-foreground">
                PIX ou Cartão de crédito
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => toast("Em breve: checkout Stripe")}>
            Adicionar
          </Button>
        </div>

        {/* Withdraw */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-success/10">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground">Saque disponível</div>
              <div className="truncate text-xs text-muted-foreground">
                Disponível acima de R$ 50,00
              </div>
            </div>
          </div>
          <Button
            disabled={!canWithdraw}
            onClick={() => toast.success("Pedido de saque criado")}
            className="gap-2 bg-success text-success-foreground hover:bg-success/90 disabled:bg-muted disabled:text-muted-foreground"
          >
            <Send className="h-4 w-4" /> Solicitar saque
          </Button>
        </div>

        {/* Split explanation */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm font-semibold text-foreground">Como é dividido</div>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Valor pago" value="R$ 4,97" bold />
            <Row label="Você recebe (70%)" value="R$ 3,48" accent="success" />
            <Row label="Plataforma Pinguim (30%)" value="R$ 1,49" muted />
            <div className="mt-2 border-t border-border pt-2">
              <Row label="Total" value="R$ 4,97" bold />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-bold text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  accent?: "success";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : "text-foreground"}>{label}</span>
      <span
        className={`${bold ? "font-bold" : "font-semibold"} ${
          accent === "success" ? "text-success" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
