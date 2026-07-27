import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, ShieldCheck, Banknote, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useIsAdmin } from "@/hooks/use-account";
import { Button } from "@/components/ui/button";
import { reviewKyc, payoutWithdraw } from "@/lib/payments.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — Pinguim" },
      {
        name: "description",
        content: "Aprove verificações de identidade e processe saques PIX dos criadores do Pinguim.",
      },
      { property: "og:title", content: "Painel administrativo — Pinguim" },
      { property: "og:description", content: "Gestão de KYC e saques da plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

const brl = (v: number) => `R$ ${Number(v ?? 0).toFixed(2).replace(".", ",")}`;

function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useSession();
  const { data: isAdmin, isLoading: loadingRole } = useIsAdmin();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const kycs = useQuery({
    queryKey: ["admin-kyc"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kyc_verifications")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const withdraws = useQuery({
    queryKey: ["admin-withdraws"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdraw_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (loading || loadingRole) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-[60vh] place-items-center p-6 text-center">
        <div>
          <h1 className="text-lg font-semibold">Acesso restrito</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta área é exclusiva para administradores.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/perfil" aria-label="Voltar" className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="truncate text-lg font-semibold">Painel administrativo</h1>
        <span />
      </header>

      <div className="space-y-4 p-4">
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" /> Verificações pendentes (
            {kycs.data?.length ?? 0})
          </div>
          <div className="mt-3 space-y-3">
            {(kycs.data ?? []).length === 0 && (
              <p className="py-3 text-center text-sm text-muted-foreground">Nada pendente.</p>
            )}
            {(kycs.data ?? []).map((k) => (
              <div key={k.id} className="rounded-xl border border-border p-3">
                <div className="text-sm font-medium">{k.full_name ?? "Sem nome"}</div>
                <div className="text-xs text-muted-foreground">CPF {k.cpf ?? "—"}</div>
                <div className="mt-2 flex gap-2">
                  {k.selfie_url && (
                    <img src={k.selfie_url} alt="Selfie" className="h-16 w-16 rounded-lg object-cover" />
                  )}
                  {k.document_url && (
                    <img
                      src={k.document_url}
                      alt="Documento"
                      className="h-16 w-24 rounded-lg object-cover"
                    />
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                    onClick={async () => {
                      try {
                        await reviewKyc({ data: { kycId: k.id, approve: true } });
                        toast.success("Verificação aprovada");
                        qc.invalidateQueries({ queryKey: ["admin-kyc"] });
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Falha ao aprovar");
                      }
                    }}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      const reason = window.prompt("Motivo da recusa:") ?? "";
                      if (!reason) return;
                      try {
                        await reviewKyc({ data: { kycId: k.id, approve: false, reason } });
                        toast.success("Verificação recusada");
                        qc.invalidateQueries({ queryKey: ["admin-kyc"] });
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Falha ao recusar");
                      }
                    }}
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Banknote className="h-4 w-4 text-success" /> Saques pendentes (
            {withdraws.data?.length ?? 0})
          </div>
          <div className="mt-3 space-y-3">
            {(withdraws.data ?? []).length === 0 && (
              <p className="py-3 text-center text-sm text-muted-foreground">Nada pendente.</p>
            )}
            {(withdraws.data ?? []).map((w) => (
              <div key={w.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-success">{brl(Number(w.amount))}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(w.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="mt-1 break-all text-xs text-muted-foreground">
                  PIX ({w.pix_key_type ?? "—"}): {w.pix_key}
                </div>
                <Button
                  size="sm"
                  className="mt-3 w-full bg-success text-success-foreground hover:bg-success/90"
                  onClick={async () => {
                    try {
                      await payoutWithdraw({ data: { withdrawId: w.id } });
                      toast.success("Transferência PIX enviada");
                      qc.invalidateQueries({ queryKey: ["admin-withdraws"] });
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Falha ao transferir");
                    }
                  }}
                >
                  Pagar via PIX
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
