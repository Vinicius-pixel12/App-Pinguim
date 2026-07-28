import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Pinguim" },
      {
        name: "description",
        content: "Defina uma nova senha para voltar a acessar sua conta no Pinguim.",
      },
      { property: "og:title", content: "Redefinir senha — Pinguim" },
      { property: "og:description", content: "Crie uma nova senha de acesso ao Pinguim." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const isRecovery = hash.includes("type=recovery");
    supabase.auth.getSession().then(({ data }) => {
      setReady(isRecovery || !!data.session);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso");
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar a senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-brand text-center text-5xl text-primary">Pinguim</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Defina sua nova senha</p>

        {!ready ? (
          <p className="mt-8 rounded-3xl bg-card p-5 text-center text-sm text-muted-foreground shadow-sm">
            Abra esta página pelo link enviado no seu e-mail de recuperação.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl bg-card p-5 shadow-sm">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-2xl py-6 text-base">
              {loading ? "Aguarde…" : "Salvar nova senha"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
