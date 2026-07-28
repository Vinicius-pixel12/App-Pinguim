import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet as WalletIcon,
  DollarSign,
  Send,
  ShieldCheck,
  Copy,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useWallet, useTransactions, useKyc } from "@/hooks/use-account";
import { createDeposit, checkDeposit, getPagarmePublicKey } from "@/lib/payments.functions";
import { tokenizeCard, onlyDigits } from "@/lib/pagarme-token";

export const Route = createFileRoute("/_authenticated/carteira")({
  head: () => ({
    meta: [
      { title: "Carteira Pinguim — saldo, ganhos e saque PIX" },
      {
        name: "description",
        content:
          "Adicione saldo por PIX ou cartão, acompanhe seus ganhos por conversa e solicite saque a partir de R$ 50.",
      },
      { property: "og:title", content: "Carteira Pinguim" },
      { property: "og:description", content: "Saldo, ganhos, histórico e saque via PIX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Carteira,
});

const MIN_WITHDRAW = 50;
const brl = (v: number) => `R$ ${Number(v ?? 0).toFixed(2).replace(".", ",")}`;
const maskCpf = (v: string) =>
  v.length === 11 ? `${v.slice(0, 3)}.***.***-${v.slice(9)}` : v;


function Carteira() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useSession();
  const { data: wallet } = useWallet();
  const { data: transactions } = useTransactions(30);
  const { data: kyc } = useKyc();

  const [addOpen, setAddOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const balance = Number(wallet?.balance ?? 0);
  const verified = kyc?.status === "approved";
  const canWithdraw = balance >= MIN_WITHDRAW && verified;

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
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">Saldo disponível</div>
              <div className="text-3xl font-bold text-success">{brl(balance)}</div>
            </div>
            {verified ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                <ShieldCheck className="h-3 w-3" /> Conta verificada
              </span>
            ) : (
              <Link
                to="/verificacao"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning"
              >
                <ShieldCheck className="h-3 w-3" /> Verificar conta
              </Link>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            <Metric
              icon={<ArrowDownCircle className="h-4 w-4 text-info" />}
              label="Ganhos"
              value={brl(Number(wallet?.earnings ?? 0))}
              hint="Conversas aceitas"
            />
            <Metric
              icon={<ArrowUpCircle className="h-4 w-4 text-warning" />}
              label="Retirado"
              value={brl(Number(wallet?.withdrawn ?? 0))}
              hint="Saques realizados"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10">
              <WalletIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground">Adicionar saldo</div>
              <div className="truncate text-xs text-muted-foreground">PIX ou cartão de crédito</div>
            </div>
          </div>
          <Button variant="outline" onClick={() => setAddOpen(true)}>
            Adicionar
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-success/10">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground">Saque disponível</div>
              <div className="truncate text-xs text-muted-foreground">
                {verified ? "Disponível acima de R$ 50,00" : "Verifique sua conta para sacar"}
              </div>
            </div>
          </div>
          <Button
            disabled={!canWithdraw}
            onClick={() => setWithdrawOpen(true)}
            className="gap-2 bg-success text-success-foreground hover:bg-success/90 disabled:bg-muted disabled:text-muted-foreground"
          >
            <Send className="h-4 w-4" /> Solicitar
          </Button>
        </div>

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

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm font-semibold text-foreground">Histórico</div>
          <div className="mt-3 space-y-2">
            {(transactions ?? []).length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma movimentação ainda.
              </p>
            )}
            {(transactions ?? []).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-foreground">{t.description ?? t.type}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleString("pt-BR")}
                    {t.status === "pending" && " · pendente"}
                  </div>
                </div>
                <span
                  className={`shrink-0 font-semibold ${
                    Number(t.amount) >= 0 ? "text-success" : "text-foreground"
                  }`}
                >
                  {Number(t.amount) >= 0 ? "+" : "-"} {brl(Math.abs(Number(t.amount)))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AddBalanceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCredited={() => {
          qc.invalidateQueries({ queryKey: ["wallet", user?.id] });
          qc.invalidateQueries({ queryKey: ["transactions", user?.id] });
        }}
      />

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        balance={balance}
        onDone={() => {
          qc.invalidateQueries({ queryKey: ["wallet", user?.id] });
          qc.invalidateQueries({ queryKey: ["transactions", user?.id] });
        }}
      />
    </>
  );
}

function AddBalanceDialog({
  open,
  onOpenChange,
  onCredited,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCredited: () => void;
}) {
  const { data: kyc } = useKyc();
  const [amount, setAmount] = useState("50");
  const [cpf, setCpf] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"choose" | "card">("choose");
  const [card, setCard] = useState({ number: "", holder: "", exp: "", cvv: "" });
  const [pix, setPix] = useState<{ paymentId: string; qrCode: string | null } | null>(null);

  const kycCpf = onlyDigits(kyc?.cpf ?? "");

  useEffect(() => {
    if (kycCpf) setCpf(kycCpf);
  }, [kycCpf]);

  function parsedAmount() {
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value < 5) {
      toast.error("Valor mínimo de R$ 5,00");
      return null;
    }
    if (kycCpf.length !== 11) {
      toast.error("Cadastre sua verificação de identidade antes de pagar");
      return null;
    }
    if (onlyDigits(cpf) !== kycCpf) {
      toast.error("O CPF do pagamento precisa ser o mesmo da sua verificação");
      return null;
    }

    return value;
  }

  async function startPix() {
    const value = parsedAmount();
    if (value === null) return;
    setBusy(true);
    try {
      const res = await createDeposit({ data: { amount: value, method: "pix", cpf } });
      setPix({ paymentId: res.paymentId, qrCode: res.qrCode });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível gerar o PIX");
    } finally {
      setBusy(false);
    }
  }

  async function payCard() {
    const value = parsedAmount();
    if (value === null) return;
    const [mm, yy] = card.exp.split("/").map((s) => onlyDigits(s));
    if (!mm || !yy || Number(mm) < 1 || Number(mm) > 12) {
      toast.error("Validade inválida (MM/AA)");
      return;
    }
    if (onlyDigits(card.number).length < 13 || card.holder.trim().length < 3 || card.cvv.length < 3) {
      toast.error("Confira os dados do cartão");
      return;
    }
    setBusy(true);
    try {
      const { publicKey } = await getPagarmePublicKey();
      if (!publicKey) throw new Error("Pagamento por cartão indisponível no momento");
      const token = await tokenizeCard(publicKey, {
        number: onlyDigits(card.number),
        holder_name: card.holder.trim(),
        exp_month: Number(mm),
        exp_year: Number(yy.length === 2 ? `20${yy}` : yy),
        cvv: onlyDigits(card.cvv),
      });
      const res = await createDeposit({
        data: {
          amount: value,
          method: "credit_card",
          cardToken: token,
          cpf,
          holderName: card.holder.trim(),
        },
      });
      const check = await checkDeposit({ data: { paymentId: res.paymentId } });
      if (check.status === "paid") {
        toast.success("Pagamento aprovado! Saldo adicionado.");
        onCredited();
        reset();
        onOpenChange(false);
      } else {
        toast.error("Pagamento não aprovado pelo banco emissor");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no pagamento com cartão");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!pix) return;
    setBusy(true);
    try {
      const res = await checkDeposit({ data: { paymentId: pix.paymentId } });
      if (res.status === "paid") {
        toast.success("Saldo adicionado!");
        onCredited();
        reset();
        onOpenChange(false);
      } else {
        toast("Pagamento ainda não identificado", { description: "Tente novamente em instantes." });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao verificar");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPix(null);
    setMode("choose");
    setCard({ number: "", holder: "", exp: "", cvv: "" });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (onOpenChange(v), v || reset())}>
      <DialogContent className="max-h-[85dvh] max-w-sm overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar saldo</DialogTitle>
          <DialogDescription>Escolha o valor e a forma de pagamento.</DialogDescription>
        </DialogHeader>

        {pix ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copie o código PIX abaixo e pague no seu banco. O saldo entra automaticamente.
            </p>
            <div className="max-h-32 overflow-auto break-all rounded-xl bg-muted p-3 text-[11px]">
              {pix.qrCode ?? "Código indisponível"}
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 rounded-2xl"
              onClick={() => {
                navigator.clipboard.writeText(pix.qrCode ?? "");
                toast.success("Código PIX copiado");
              }}
            >
              <Copy className="h-4 w-4" /> Copiar código
            </Button>
            <Button disabled={busy} onClick={confirm} className="w-full rounded-2xl py-6">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Já paguei, verificar"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="flex gap-2 pt-1">
                {[20, 50, 100].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                  >
                    R$ {v}
                  </button>
                ))}
              </div>
            </div>

            {kycCpf ? (
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF do pagador (verificado)</Label>
                <Input id="cpf" value={maskCpf(kycCpf)} readOnly disabled />
                <p className="text-[11px] text-muted-foreground">
                  O pagamento só é aceito no CPF cadastrado na sua verificação de identidade.
                </p>
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl bg-warning/10 p-4">
                <p className="text-sm font-medium text-warning">
                  Cadastre sua verificação de identidade antes de pagar
                </p>
                <p className="text-xs text-muted-foreground">
                  Precisamos confirmar que o CPF do pagamento é o mesmo da sua conta.
                </p>
                <Button asChild variant="outline" className="w-full rounded-2xl">
                  <Link to="/verificacao" onClick={() => onOpenChange(false)}>
                    Fazer verificação
                  </Link>
                </Button>
              </div>
            )}
            {mode === "choose" ? (
              <>
                <Button
                  disabled={busy || !kycCpf}
                  onClick={startPix}
                  className="w-full rounded-2xl py-6"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pagar com PIX"}
                </Button>
                <Button
                  variant="outline"
                  disabled={busy || !kycCpf}

                  onClick={() => setMode("card")}
                  className="w-full rounded-2xl py-6"
                >
                  Cartão de crédito
                </Button>
              </>
            ) : (
              <div className="space-y-3 border-t border-border pt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-number">Número do cartão</Label>
                  <Input
                    id="c-number"
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-holder">Nome impresso no cartão</Label>
                  <Input
                    id="c-holder"
                    value={card.holder}
                    onChange={(e) => setCard({ ...card, holder: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-exp">Validade</Label>
                    <Input
                      id="c-exp"
                      placeholder="MM/AA"
                      value={card.exp}
                      onChange={(e) => setCard({ ...card, exp: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-cvv">CVV</Label>
                    <Input
                      id="c-cvv"
                      inputMode="numeric"
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                    />
                  </div>
                </div>
                <Button disabled={busy} onClick={payCard} className="w-full rounded-2xl py-6">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pagar com cartão"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setMode("choose")}
                  className="w-full rounded-2xl"
                >
                  Voltar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WithdrawDialog({
  open,
  onOpenChange,
  balance,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  balance: number;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(String(Math.floor(balance)));
  const [busy, setBusy] = useState(false);

  async function submit() {
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value < MIN_WITHDRAW) {
      toast.error("Valor mínimo de saque é R$ 50,00");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("request_withdraw", { _amount: value });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saque solicitado! O PIX é enviado após aprovação.");
    onDone();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Solicitar saque</DialogTitle>
          <DialogDescription>
            Saldo disponível: {brl(balance)}. Enviamos via PIX para a chave cadastrada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="w-amount">Valor (R$)</Label>
            <Input
              id="w-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button disabled={busy} onClick={submit} className="w-full rounded-2xl py-6">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar saque"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
