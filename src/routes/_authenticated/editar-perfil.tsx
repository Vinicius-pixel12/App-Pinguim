import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, Check, ShieldCheck, Lock, X, Plus, Image as ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useProfile, type ProfileData } from "@/lib/profile";
import { users as mockUsers } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/editar-perfil")({
  head: () => ({ meta: [{ title: "Editar perfil — Pinguim" }] }),
  component: EditarPerfil,
});

function EditarPerfil() {
  const [saved, setProfile] = useProfile();
  const [form, setForm] = useState<ProfileData>(saved);
  const [newBlock, setNewBlock] = useState("");
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const set = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onAvatar = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => set("avatar", String(reader.result));
    reader.readAsDataURL(f);
  };

  const onSelfie = () => {
    set("selfieVerified", true);
    toast.success("Selfie enviada para análise");
  };
  const onDoc = () => {
    set("documentVerified", true);
    toast.success("Documento enviado para análise");
  };

  const removeBlocked = (u: string) =>
    set("blockedUsers", form.blockedUsers.filter((x) => x !== u));
  const addBlocked = () => {
    const u = newBlock.trim().replace(/^@/, "");
    if (!u) return;
    if (form.blockedUsers.includes(u)) return;
    set("blockedUsers", [...form.blockedUsers, u]);
    setNewBlock("");
  };

  const usernameNormalized = form.username.trim().toLowerCase().replace(/^@/, "");
  const usernameTaken =
    usernameNormalized.length > 0 &&
    usernameNormalized !== saved.username.toLowerCase() &&
    mockUsers.some((u) => u.username.toLowerCase() === usernameNormalized);
  const usernameValid = /^[a-z0-9._]{3,20}$/.test(usernameNormalized);

  const save = () => {
    if (!usernameNormalized) {
      toast.error("Informe um nome de usuário");
      return;
    }
    if (!usernameValid) {
      toast.error("Use 3–20 caracteres: letras minúsculas, números, . ou _");
      return;
    }
    if (usernameTaken) {
      toast.error("Este nome de usuário já está em uso");
      return;
    }
    setProfile({ ...form, username: usernameNormalized });
    toast.success("Perfil atualizado");
    navigate({ to: "/perfil" });
  };


  const verified = form.selfieVerified && form.documentVerified;

  return (
    <>
      <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/perfil" aria-label="Voltar" className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="truncate text-lg font-semibold">Editar perfil</h1>
        <button onClick={save} className="text-sm font-semibold text-primary">Salvar</button>
      </header>

      <div className="space-y-6 px-4 py-5 pb-24">
        {/* Foto */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
          <button
            type="button"
            onClick={() => setAvatarPickerOpen(true)}
            className="relative block"
            aria-label="Trocar foto de perfil"
          >
            <img src={form.avatar} alt="" className="h-24 w-24 rounded-full object-cover" />
            <span
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
              aria-hidden
            >
              <Camera className="h-4 w-4" />
            </span>
          </button>
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onAvatar(f); e.target.value = ""; }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onAvatar(f); e.target.value = ""; }}
          />
          </div>
          <button onClick={() => setAvatarPickerOpen(true)} className="text-sm font-medium text-primary">
            Alterar foto de perfil
          </button>
        </div>

        <Dialog open={avatarPickerOpen} onOpenChange={setAvatarPickerOpen}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Foto de perfil</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => { setAvatarPickerOpen(false); cameraRef.current?.click(); }}
              >
                <Camera className="mr-2 h-4 w-4" /> Tirar foto
              </Button>
              <Button
                variant="secondary"
                className="justify-start"
                onClick={() => { setAvatarPickerOpen(false); galleryRef.current?.click(); }}
              >
                <ImageIcon className="mr-2 h-4 w-4" /> Escolher da galeria
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Section title="Informações básicas">
          <Field label="Nome de exibição">
            <Input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} />
          </Field>
          <Field label="Nome de usuário">
            <div
              className={`flex items-center rounded-md border bg-background ${
                usernameNormalized && (usernameTaken || !usernameValid)
                  ? "border-destructive"
                  : "border-input"
              }`}
            >
              <span className="pl-3 text-muted-foreground">@</span>
              <Input
                className="border-0 focus-visible:ring-0"
                value={form.username}
                onChange={(e) => set("username", e.target.value.replace(/^@/, "").toLowerCase())}
              />
            </div>
            {usernameNormalized && !usernameValid && (
              <p className="text-[11px] text-destructive">
                Use 3–20 caracteres: letras minúsculas, números, ponto ou _
              </p>
            )}
            {usernameNormalized && usernameValid && usernameTaken && (
              <p className="text-[11px] text-destructive">Este nome de usuário já está em uso</p>
            )}
            {usernameNormalized && usernameValid && !usernameTaken && (
              <p className="text-[11px] text-success">Disponível</p>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Idade">
              <Input
                type="number"
                min={18}
                value={form.age}
                onChange={(e) => set("age", e.target.value ? Number(e.target.value) : "")}
              />
            </Field>
            <Field label="Gênero (opcional)">
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="nao-binario">Não-binário</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                  <SelectItem value="prefiro-nao-dizer">Prefiro não dizer</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="Cidade">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Estado">
              <Input className="w-20 uppercase" maxLength={2} value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} />
            </Field>
          </div>
          <Field label="Data de nascimento" hint="Não pública">
            <Input type="date" value={form.birthdate} onChange={(e) => set("birthdate", e.target.value)} />
          </Field>
        </Section>

        <Section title="Sobre mim">
          <Field label={`Biografia (${form.bio.length}/250)`}>
            <Textarea
              maxLength={250}
              rows={3}
              placeholder="Apaixonada por viagens, café e conhecer novas pessoas."
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
            />
          </Field>
          <Field label="Profissão">
            <Input value={form.profession} onChange={(e) => set("profession", e.target.value)} />
          </Field>
          <Field label="Escolaridade (opcional)">
            <Input value={form.education} onChange={(e) => set("education", e.target.value)} />
          </Field>
          <Field label="Interesses" hint="Separe por vírgula">
            <Input placeholder="Música, cinema, viagens" value={form.interests} onChange={(e) => set("interests", e.target.value)} />
          </Field>
          <Field label="Hobbies" hint="Separe por vírgula">
            <Input placeholder="Fotografia, culinária" value={form.hobbies} onChange={(e) => set("hobbies", e.target.value)} />
          </Field>
        </Section>

        <Section title="Preferências">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <Label>Faixa etária desejada</Label>
              <span className="text-muted-foreground">{form.ageRangeMin} – {form.ageRangeMax} anos</span>
            </div>
            <Slider
              min={18} max={80} step={1}
              value={[form.ageRangeMin, form.ageRangeMax]}
              onValueChange={(v) => { set("ageRangeMin", v[0]); set("ageRangeMax", v[1]); }}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <Label>Distância máxima</Label>
              <span className="text-muted-foreground">{form.maxDistance} km</span>
            </div>
            <Slider min={1} max={500} step={1} value={[form.maxDistance]} onValueChange={(v) => set("maxDistance", v[0])} />
          </div>
          <Field label="Gênero de interesse">
            <Select value={form.interestGender} onValueChange={(v) => set("interestGender", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="mulheres">Mulheres</SelectItem>
                <SelectItem value="homens">Homens</SelectItem>
                <SelectItem value="nao-binario">Não-binário</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Idiomas" hint="Separe por vírgula">
            <Input value={form.languages} onChange={(e) => set("languages", e.target.value)} />
          </Field>
        </Section>

        <Section title="Conta">
          <Field label="E-mail">
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Telefone">
            <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Button variant="secondary" className="w-full justify-start" onClick={() => toast.info("Enviaremos um link por e-mail")}>
            <Lock className="mr-2 h-4 w-4" /> Alterar senha
          </Button>
          <ToggleRow
            label="Autenticação em duas etapas (2FA)"
            desc="Proteja sua conta com um código extra ao entrar."
            checked={form.twoFactor}
            onChange={(v) => set("twoFactor", v)}
          />
        </Section>

        <Section title="Privacidade">
          <ToggleRow label='Mostrar status "Online"' checked={form.showOnline} onChange={(v) => set("showOnline", v)} />
          <ToggleRow label="Permitir mensagens" checked={form.allowMessages} onChange={(v) => set("allowMessages", v)} />
          <ToggleRow label="Permitir pedidos de conversa" checked={form.allowRequests} onChange={(v) => set("allowRequests", v)} />
          <div>
            <Label className="mb-2 block text-sm">Bloquear usuário</Label>
            <div className="flex gap-2">
              <Input placeholder="@usuario" value={newBlock} onChange={(e) => setNewBlock(e.target.value)} />
              <Button type="button" size="icon" onClick={addBlocked}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          {form.blockedUsers.length > 0 && (
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Usuários bloqueados</div>
              <ul className="space-y-1">
                {form.blockedUsers.map((u) => (
                  <li key={u} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm">
                    <span>@{u}</span>
                    <button aria-label="Desbloquear" onClick={() => removeBlocked(u)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        <Section title="Verificação">
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className={`h-4 w-4 ${verified ? "text-success" : "text-muted-foreground"}`} />
              {verified ? "Conta verificada" : "Conta não verificada"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Após aprovação você recebe o selo azul de verificação no seu perfil.
            </p>
          </div>

          <VerifyRow
            label="Selfie para reconhecimento facial"
            done={form.selfieVerified}
            onClick={() => selfieRef.current?.click()}
          />
          <input ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onSelfie} />

          <VerifyRow
            label="Documento de identidade"
            done={form.documentVerified}
            onClick={() => docRef.current?.click()}
          />
          <input ref={docRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onDoc} />
        </Section>

        <Button className="w-full" size="lg" onClick={save}>Salvar alterações</Button>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
      <Separator />
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function VerifyRow({ label, done, onClick }: { label: string; done: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left"
    >
      <span className="text-sm font-medium">{label}</span>
      {done ? (
        <span className="flex items-center gap-1 text-xs font-medium text-success">
          <Check className="h-4 w-4" /> Enviado
        </span>
      ) : (
        <span className="text-xs text-primary">Enviar</span>
      )}
    </button>
  );
}
