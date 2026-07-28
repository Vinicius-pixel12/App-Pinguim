import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Phone, Check, X } from "lucide-react";
import { conversationRequests as initial } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Pinguim" }] }),
  component: Notificacoes,
});

function Notificacoes() {
  const [requests, setRequests] = useState(initial);

  const handleAccept = (id: string, amount: number) => {
    setRequests((r) => r.filter((x) => x.id !== id));
    toast.success(`+ R$ ${(amount * 0.7).toFixed(2).replace(".", ",")} creditados`, {
      description: "Sua parte (70%) foi adicionada à carteira.",
    });
  };

  const handleReject = (id: string) => {
    setRequests((r) => r.filter((x) => x.id !== id));
    toast("Pedido recusado");
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">Notificações</h1>
        <p className="text-xs text-muted-foreground">Pedidos de conversa recebidos</p>
      </header>

      {requests.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhum pedido pendente.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {requests.map((r) => (
            <li key={r.id} className="p-4">
              <div className="flex items-start gap-3">
                <img
                  src={r.fromUser.avatar}
                  alt={r.fromUser.username}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold text-foreground">{r.fromUser.name}</span>
                    <span className="text-xs text-muted-foreground">{r.createdAt}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    {r.method === "chat" ? (
                      <>
                        <MessageCircle className="h-4 w-4 text-info" />
                        Quer conversar pelo Chat
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4 text-success" />
                        Solicitou seu WhatsApp
                      </>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Você recebe{" "}
                    <span className="font-semibold text-success">
                      R$ {(r.amount * 0.7).toFixed(2).replace(".", ",")}
                    </span>{" "}
                    · Expira em {r.daysLeft} dias
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(r.id, r.amount)}
                      className="bg-success text-success-foreground hover:bg-success/90"
                    >
                      <Check className="mr-1 h-4 w-4" /> Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(r.id)}
                    >
                      <X className="mr-1 h-4 w-4" /> Recusar
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
