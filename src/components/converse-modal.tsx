import { useState } from "react";
import { MessageCircle, Phone, ChevronRight, X, CheckCircle2, Gift, Hand, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { MockUser } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useWallet } from "@/hooks/use-account";

const PRICE = 4.97;

export function ConverseModal({
  user,
  open,
  onOpenChange,
}: {
  user: MockUser | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [method, setMethod] = useState<"chat" | "whatsapp" | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user: me } = useSession();
  const { data: wallet } = useWallet();

  if (!user) return null;

  const handlePay = async () => {
    if (!method) {
      toast.error("Escolha como deseja iniciar a conversa");
      return;
    }
    if (!me) {
      onOpenChange(false);
      navigate({ to: "/auth" });
      return;
    }
    if (Number(wallet?.balance ?? 0) < PRICE) {
      toast.error("Saldo insuficiente", { description: "Adicione saldo na sua carteira." });
      onOpenChange(false);
      navigate({ to: "/carteira" });
      return;
    }

    setBusy(true);
    const { data: target } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", user.username)
      .maybeSingle();

    if (!target) {
      setBusy(false);
      toast.error("Este perfil ainda não está disponível para conversas.");
      return;
    }

    const { error } = await supabase.rpc("create_conversation_request", {
      _target_id: target.id,
      _channel: method,
    });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    qc.invalidateQueries({ queryKey: ["wallet", me.id] });
    qc.invalidateQueries({ queryKey: ["transactions", me.id] });
    toast.success(`Pedido enviado a ${user.name}!`, {
      description: "Aguarde a resposta em até 30 dias na aba Notificações.",
    });
    setMethod(null);
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 sm:rounded-2xl">
        <DialogHeader className="space-y-1 border-b border-border p-5 pr-12 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                <Hand className="h-5 w-5 text-info" />
                <span className="truncate">Conversar com {user.name}</span>
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Escolha como deseja iniciar a conversa
              </DialogDescription>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-xs text-info">
                <Gift className="h-3 w-3" /> Promoção
              </span>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-sm font-semibold text-success">
                R$ {PRICE.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 p-5">
          <MethodCard
            selected={method === "chat"}
            onClick={() => setMethod("chat")}
            icon={<MessageCircle className="h-5 w-5 text-info" />}
            iconBg="bg-info/10"
            title="Conversar pelo Chat"
            subtitle="Dentro da plataforma Pinguim"
          />
          <MethodCard
            selected={method === "whatsapp"}
            onClick={() => setMethod("whatsapp")}
            icon={<Phone className="h-5 w-5 text-success" />}
            iconBg="bg-success/10"
            title="Solicitar WhatsApp"
            subtitle="Receber o número após aprovação"
          />

          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor da solicitação</span>
              <span className="font-semibold text-foreground">R$ {PRICE.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prazo para resposta</span>
              <span className="font-semibold text-foreground">Até 30 dias</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border p-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            <X className="mr-1 h-4 w-4" /> Cancelar
          </Button>
          <Button
            onClick={handlePay}
            disabled={busy}
            className="flex-1 bg-success text-success-foreground hover:bg-success/90"
          >
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}

            Pagar R$ {PRICE.toFixed(2).replace(".", ",")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MethodCard({
  selected,
  onClick,
  icon,
  iconBg,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted"
      }`}
    >
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-foreground">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}
