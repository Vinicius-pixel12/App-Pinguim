import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPixOrder, createCardOrder, createPixTransfer } from "./pagarme.server";
import { syncPaymentAndCredit } from "./wallet.server";

export const createDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        amount: z.number().min(5).max(10000),
        method: z.enum(["pix", "credit_card"]),
        cardToken: z.string().optional(),
        cpf: z.string().optional(),
        holderName: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", userId)
      .maybeSingle();
    const { data: kyc } = await supabase
      .from("kyc_verifications")
      .select("cpf, full_name, status")
      .eq("user_id", userId)
      .maybeSingle();

    const kycCpf = (kyc?.cpf ?? "").replace(/\D/g, "");
    if (kycCpf.length !== 11) {
      throw new Error(
        "Cadastre sua verificação de identidade (CPF) antes de realizar o pagamento",
      );
    }
    const informed = (data.cpf ?? kycCpf).replace(/\D/g, "");
    if (informed !== kycCpf) {
      throw new Error("O CPF do pagamento não corresponde ao CPF verificado da sua conta");
    }
    const document = kycCpf;

    // Garante que este CPF não pertence a outra conta do sistema.
    {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: owners } = await supabaseAdmin
        .from("kyc_verifications")
        .select("user_id")
        .eq("cpf", document);
      if ((owners ?? []).some((o) => o.user_id !== userId)) {
        throw new Error("Este CPF já está vinculado a outra conta");
      }
    }




    const name =
      data.holderName || kyc?.full_name || profile?.display_name || profile?.username || "Usuário Pinguim";
    const email = (claims as { email?: string })?.email ?? `${userId}@pinguim.app`;
    const amountCents = Math.round(data.amount * 100);

    const order =
      data.method === "pix"
        ? await createPixOrder({
            amountCents,
            customerName: name,
            customerEmail: email,
            customerDocument: document,
            metadata: { user_id: userId },
          })
        : await createCardOrder({
            amountCents,
            customerName: name,
            customerEmail: email,
            customerDocument: document,
            cardToken: z.string().min(1).parse(data.cardToken),
            metadata: { user_id: userId },
          });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("payment_history")
      .insert({
        user_id: userId,
        provider: "pagarme",
        provider_order_id: order.orderId,
        provider_charge_id: order.chargeId,
        method: data.method === "pix" ? "pix" : "card",
        amount: data.amount,
        status: order.status,
        qr_code: order.qrCode,
        qr_code_url: order.qrCodeUrl,
      })
      .select("id")
      .single();
    if (error) throw error;

    return {
      paymentId: row.id as string,
      status: order.status,
      qrCode: order.qrCode,
      qrCodeUrl: order.qrCodeUrl,
    };
  });

export const checkDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ paymentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: owned } = await context.supabase
      .from("payment_history")
      .select("id")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (!owned) throw new Error("Pagamento não encontrado");
    return syncPaymentAndCredit(data.paymentId);
  });

export const payoutWithdraw = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ withdrawId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso negado");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: wr } = await supabaseAdmin
      .from("withdraw_requests")
      .select("*")
      .eq("id", data.withdrawId)
      .maybeSingle();
    if (!wr) throw new Error("Saque não encontrado");
    if (wr.status !== "pending") throw new Error("Saque já processado");

    const { data: kyc } = await supabaseAdmin
      .from("kyc_verifications")
      .select("status, full_name, cpf")
      .eq("user_id", wr.user_id)
      .maybeSingle();
    if (kyc?.status !== "approved") throw new Error("Conta não verificada");

    const transfer = await createPixTransfer({
      amountCents: Math.round(Number(wr.amount) * 100),
      pixKey: wr.pix_key,
      holderName: kyc.full_name ?? "",
      holderDocument: (kyc.cpf ?? "").replace(/\D/g, ""),
    });

    await supabaseAdmin
      .from("withdraw_requests")
      .update({
        status: "paid",
        provider_transfer_id: String((transfer as { id?: string }).id ?? ""),
        processed_at: new Date().toISOString(),
      })
      .eq("id", wr.id);

    await supabaseAdmin
      .from("transactions")
      .update({ status: "completed" })
      .eq("reference_id", wr.id)
      .eq("type", "withdraw");

    await supabaseAdmin.from("notifications").insert({
      user_id: wr.user_id,
      type: "withdraw_paid",
      title: "Saque enviado",
      body: `PIX de R$ ${Number(wr.amount).toFixed(2).replace(".", ",")} enviado`,
      reference_id: wr.id,
    });

    return { ok: true };
  });

export const reviewKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        approve: z.boolean(),
        reason: z.string().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso negado");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("kyc_verifications")
      .update({
        status: data.approve ? "approved" : "rejected",
        rejection_reason: data.approve ? null : (data.reason ?? "Documentos inválidos"),
        reviewed_at: new Date().toISOString(),
      })
      .eq("user_id", data.userId);

    if (data.approve) {
      await supabaseAdmin.from("profiles").update({ is_verified: true }).eq("id", data.userId);
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: data.userId,
      type: "kyc",
      title: data.approve ? "Conta verificada" : "Verificação recusada",
      body: data.approve ? "Você já pode solicitar saques" : (data.reason ?? "Reenvie seus documentos"),
    });

    return { ok: true };
  });

export const getPagarmePublicKey = createServerFn({ method: "GET" }).handler(async () => ({
  publicKey: process.env.PAGARME_PUBLIC_KEY ?? "",
}));
