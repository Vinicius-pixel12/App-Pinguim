import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Share2, MessageCircle, Send, Facebook, Twitter, Linkedin, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MockPost } from "@/lib/mock-data";

type Props = {
  post: MockPost;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function SharePostDialog({ post, open, onOpenChange }: Props) {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/perfil/${post.user.username}?post=${post.id}`;
  }, [post]);

  const text = `Confira essa publicação de ${post.user.username} no Pinguim`;
  const enc = encodeURIComponent;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Pinguim", text, url });
      } catch {
        /* usuário cancelou */
      }
    } else {
      copy();
    }
  };

  const targets = [
    { name: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${enc(`${text} ${url}`)}`, color: "text-[#25D366]" },
    { name: "Telegram", icon: Send, href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`, color: "text-[#229ED9]" },
    { name: "X / Twitter", icon: Twitter, href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, color: "text-foreground" },
    { name: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, color: "text-[#1877F2]" },
    { name: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, color: "text-[#0A66C2]" },
    { name: "E-mail", icon: Mail, href: `mailto:?subject=${enc("Publicação no Pinguim")}&body=${enc(`${text}\n\n${url}`)}`, color: "text-muted-foreground" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Compartilhar publicação</DialogTitle>
          <DialogDescription>Envie essa publicação para onde quiser.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="text-xs" />
          <Button size="sm" variant="secondary" onClick={copy} className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {targets.map((t) => (
            <a
              key={t.name}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 text-center hover:bg-accent"
            >
              <t.icon className={`h-6 w-6 ${t.color}`} />
              <span className="text-[11px] font-medium">{t.name}</span>
            </a>
          ))}
        </div>

        <Button variant="secondary" className="w-full gap-2" onClick={nativeShare}>
          <Share2 className="h-4 w-4" /> Mais opções…
        </Button>
      </DialogContent>
    </Dialog>
  );
}
