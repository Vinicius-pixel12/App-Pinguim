import { getOrder } from "./pagarme.server";

export type CreditResult = { status: string; credited: boolean; amount: number };

/**
 * Verifica o pagamento diretamente na Pagar.me (fonte da verdade) e,
 * se estiver pago e ainda não creditado, credita a carteira do usuário.
 */
export async function syncPaymentAndCredit(paymentId: string): Promise<CreditResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: payment, error } = await supabaseAdmin
    .from("payment_history")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) throw error;
  if (!payment) throw new Error("Pagamento não encontrado");

  if (payment.status === "paid") {
    return { status: "paid", credited: false, amount: Number(payment.amount) };
  }
  if (!payment.provider_order_id) {
    return { status: payment.status, credited: false, amount: Number(payment.amount) };
  }

  const { raw, parsed } = await getOrder(payment.provider_order_id);
  const paid = parsed.status === "paid" || parsed.status === "captured";

  await supabaseAdmin
    .from("payment_history")
    .update({
      status: paid ? "paid" : parsed.status,
      raw: raw as never,
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq("id", paymentId);

  if (!paid) return { status: parsed.status, credited: false, amount: Number(payment.amount) };

  const amount = Number(payment.amount);

  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("user_id", payment.user_id)
    .maybeSingle();

  await supabaseAdmin
    .from("wallets")
    .update({ balance: Number(wallet?.balance ?? 0) + amount })
    .eq("user_id", payment.user_id);

  await supabaseAdmin.from("transactions").insert({
    user_id: payment.user_id,
    type: "deposit",
    status: "completed",
    amount,
    description: `Depósito via ${payment.method === "pix" ? "PIX" : "cartão"}`,
    reference_id: payment.id,
  });

  await supabaseAdmin.from("notifications").insert({
    user_id: payment.user_id,
    type: "deposit",
    title: "Saldo adicionado",
    body: `R$ ${amount.toFixed(2).replace(".", ",")} creditado na sua carteira`,
    reference_id: payment.id,
  });

  return { status: "paid", credited: true, amount };
}

export async function findPaymentByOrderId(orderId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("payment_history")
    .select("id")
    .eq("provider_order_id", orderId)
    .maybeSingle();
  return data?.id ?? null;
}
