import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Lock,
  Globe,
  LifeBuoy,
  FileText,
  Info,
  ChevronRight,
  LogOut,
  ImageIcon,
  Trash2,
  ShieldCheck,
  Shield,

} from "lucide-react";
import { useMyPrivacy } from "@/lib/privacy";
import { useAppBackground } from "@/lib/app-background";
import { useIsAdmin } from "@/hooks/use-account";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/configuracoes/")({
  head: () => ({ meta: [{ title: "Configurações — Pinguim" }] }),
  component: Configuracoes,
});

function Configuracoes() {
  const { data: isAdmin } = useIsAdmin();
  const [privacy, setPrivacy] = useMyPrivacy();

  const [bg, setBg] = useAppBackground();
  const [pendingBg, setPendingBg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();

  const handlePickFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPendingBg(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const saveBg = () => {
    if (!pendingBg) return;
    setBg(pendingBg);
    setPendingBg(null);
    toast.success("Plano de fundo salvo");
  };

  const clearBg = () => {
    setBg(null);
    setPendingBg(null);
    toast.success("Plano de fundo removido");
  };

  const handleLogout = () => {
    setLogoutOpen(false);
    navigate({ to: "/" });
  };

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

      <section className="px-4 py-2">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Plano de fundo do app
        </h2>
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="relative aspect-[9/16] max-h-64 w-full overflow-hidden rounded-xl bg-muted">
            {(pendingBg || bg) ? (
              <>
                <img
                  src={pendingBg || bg || ""}
                  alt="Prévia do fundo"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ filter: "blur(20px) saturate(120%)", transform: "scale(1.1)" }}
                />
                <div className="absolute inset-0 bg-background/60" />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground/70">
                  Prévia (desfocado)
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                Nenhum fundo — branco padrão
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold"
            >
              <ImageIcon className="h-4 w-4" />
              Escolher imagem
            </button>
            {pendingBg && (
              <button
                onClick={saveBg}
                className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                Salvar fundo
              </button>
            )}
            {(bg || pendingBg) && (
              <button
                onClick={clearBg}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            A imagem escolhida fica desfocada atrás do app. Fica salva no seu dispositivo.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePickFile(e.target.files?.[0])}
          />
        </div>
      </section>



      <section className="px-4 py-2">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Mais
        </h2>
        <div className="space-y-2">
          <NavRow
            to="/verificacao"
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Verificação de conta"
            desc="Documento, selfie e chave PIX para saques"
          />
          {isAdmin && (
            <NavRow
              to="/admin"
              icon={<Shield className="h-5 w-5" />}
              title="Painel administrativo"
              desc="Aprovar verificações e saques"
            />
          )}
          <NavRow
            to="/configuracoes/suporte"
            icon={<LifeBuoy className="h-5 w-5" />}
            title="Suporte"
            desc="Central de ajuda, contato e denúncias"
          />

          <NavRow
            to="/configuracoes/legal"
            icon={<FileText className="h-5 w-5" />}
            title="Documentos legais"
            desc="Termos, políticas e consentimentos"
          />
          <NavRow
            to="/configuracoes/sobre"
            icon={<Info className="h-5 w-5" />}
            title="Sobre o Aplicativo"
            desc="Versão, desenvolvedor e licenças"
          />
        </div>
      </section>

      <section className="px-4 py-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Encerrar sessão
        </h2>
        <button
          onClick={() => setLogoutOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground shadow-sm transition hover:opacity-90"
        >
          <LogOut className="h-4 w-4" />
          Sair da Conta
        </button>
      </section>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja sair?</AlertDialogTitle>
            <AlertDialogDescription>
              Você precisará entrar novamente para acessar sua conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function NavRow({
  to,
  icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:bg-muted/40"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}
