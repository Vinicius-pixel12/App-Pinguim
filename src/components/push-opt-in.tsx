import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { enablePush, isPushSupported } from "@/lib/push-client";

/** Banner para ativar as notificações push (Firebase) neste aparelho. */
export function PushOptIn() {
  const [supported, setSupported] = useState(false);
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    if (typeof Notification !== "undefined") {
      setGranted(Notification.permission === "granted");
    }
  }, []);

  if (!supported || granted) return null;

  const activate = async () => {
    setLoading(true);
    const res = await enablePush().catch((e) => ({ ok: false, reason: String(e) }) as const);
    setLoading(false);
    if (res.ok) {
      setGranted(true);
      toast.success("Notificações ativadas neste aparelho");
    } else if (res.reason === "denied") {
      toast.error("Permissão negada pelo navegador");
    } else {
      toast.error("Não foi possível ativar as notificações");
    }
  };

  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
        {granted ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Ativar notificações</p>
        <p className="text-xs text-muted-foreground">
          Receba avisos de mensagens, reações, anotações e novos seguidores.
        </p>
      </div>
      <Button size="sm" onClick={activate} disabled={loading}>
        {loading ? "..." : "Ativar"}
      </Button>
    </div>
  );
}
