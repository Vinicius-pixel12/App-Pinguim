import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/pagarme")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: { data?: { id?: string; order?: { id?: string } } } = {};
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return new Response("Payload inválido", { status: 400 });
        }

        const orderId = payload?.data?.order?.id ?? payload?.data?.id;
        if (!orderId || !String(orderId).startsWith("or_")) {
          return new Response("ok", { status: 200 });
        }

        // Nunca confiamos no corpo do webhook: revalidamos o pedido na API da Pagar.me.
        const { findPaymentByOrderId, syncPaymentAndCredit } = await import("@/lib/wallet.server");
        const paymentId = await findPaymentByOrderId(String(orderId));
        if (!paymentId) return new Response("ok", { status: 200 });

        try {
          await syncPaymentAndCredit(paymentId);
        } catch (e) {
          console.error("webhook pagarme", e);
          return new Response("erro", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
