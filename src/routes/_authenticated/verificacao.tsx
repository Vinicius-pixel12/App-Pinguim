import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ShieldCheck, Camera, IdCard, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useKyc } from "@/hooks/use-account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/verificacao")({
  head: () => ({
    meta: [
      { title: "Verificação de conta — Pinguim" },
      {
        name: "description",
        content:
          "Envie CPF, documento e selfie para verificar sua conta e liberar saques PIX no Pinguim.",
      },
      { property: "og:title", content: "Verificação de conta — Pinguim" },
      { property: "og:description", content: "Verifique sua identidade e libere seus saques." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Verificacao,
});

async function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function Verificacao() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useSession();
  const { data: kyc } = useKyc();

  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("cpf");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [doc, setDoc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selfieRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!kyc) return;
    setFullName(kyc.full_name ?? "");
    setCpf(kyc.cpf ?? "");
    setPixKey(kyc.pix_key ?? "");
    setPixKeyType(kyc.pix_key_type ?? "cpf");
    setSelfie(kyc.selfie_url ?? null);
    setDoc(kyc.document_url ?? null);
  }, [kyc]);

  const approved = kyc?.status === "approved";
  const pending = kyc?.status === "pending";

  async function submit() {
    if (!fullName.trim() || cpf.replace(/\D/g, "").length !== 11) {
      toast.error("Informe nome completo e um CPF válido");
      return;
    }
    if (!selfie || !doc) {
      toast.error("Envie a selfie e o documento");
      return;
    }
    if (!pixKey.trim()) {
      toast.error("Informe sua chave PIX");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("kyc_verifications")
      .update({
        full_name: fullName.trim(),
        cpf: cpf.replace(/\D/g, ""),
        selfie_url: selfie,
        document_url: doc,
        pix_key: pixKey.trim(),
        pix_key_type: pixKeyType,
        status: "pending",
      })
      .eq("user_id", user!.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["kyc", user?.id] });
    toast.success("Documentos enviados para análise");
  }

  return (
    <>
      <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/carteira" aria-label="Voltar" className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="truncate text-lg font-semibold">Verificação</h1>
        <span />
      </header>

      <div className="space-y-4 p-4">
        {approved && (
          <div className="flex items-center gap-2 rounded-2xl bg-success/10 p-4 text-sm font-medium text-success">
            <CheckCircle2 className="h-5 w-5" /> Conta verificada — saques liberados.
          </div>
        )}
        {pending && (
          <div className="rounded-2xl bg-warning/10 p-4 text-sm font-medium text-warning">
            Documentos em análise. Avisamos você por notificação.
          </div>
        )}
        {kyc?.status === "rejected" && (
          <div className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            Recusado: {kyc.rejection_reason ?? "reenvie seus documentos."}
          </div>
        )}

        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" /> Dados do titular
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={approved}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              inputMode="numeric"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              disabled={approved}
            />
          </div>
          <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="pixtype">Tipo</Label>
              <select
                id="pixtype"
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value)}
                disabled={approved}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
                <option value="random">Aleatória</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pix">Chave PIX</Label>
              <Input
                id="pix"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                disabled={approved}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <UploadCard
            label="Selfie"
            icon={<Camera className="h-5 w-5" />}
            preview={selfie}
            disabled={approved}
            onClick={() => selfieRef.current?.click()}
          />
          <UploadCard
            label="Documento"
            icon={<IdCard className="h-5 w-5" />}
            preview={doc}
            disabled={approved}
            onClick={() => docRef.current?.click()}
          />
        </div>

        <input
          ref={selfieRef}
          type="file"
          accept="image/*"
          capture="user"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setSelfie(await toDataUrl(f));
          }}
        />
        <input
          ref={docRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setDoc(await toDataUrl(f));
          }}
        />

        {!approved && (
          <Button onClick={submit} disabled={busy} className="w-full rounded-2xl py-6 text-base">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar para análise"}
          </Button>
        )}

        <p className="text-center text-[11px] text-muted-foreground">
          Seus documentos são usados apenas para verificação de identidade e prevenção a fraudes.
        </p>
      </div>
    </>
  );
}

function UploadCard({
  label,
  icon,
  preview,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  preview: string | null;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className="aspect-[4/3] overflow-hidden rounded-2xl border border-dashed border-border bg-card"
    >
      {preview ? (
        <img src={preview} alt={label} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          {icon}
          {label}
        </span>
      )}
    </button>
  );
}
