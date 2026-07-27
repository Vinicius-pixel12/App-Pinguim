const BASE = "https://api.pagar.me/core/v5";

function authHeader() {
  const key = process.env.PAGARME_SECRET_KEY;
  if (!key) throw new Error("PAGARME_SECRET_KEY não configurada");
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

async function call(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("pagarme error", res.status, JSON.stringify(json));
    const msg =
      (json as { errors?: Record<string, string[]>; message?: string })?.message ??
      "Falha na comunicação com o provedor de pagamento";
    throw new Error(msg);
  }
  return json as Record<string, unknown>;
}

export type CreatedOrder = {
  orderId: string;
  chargeId: string | null;
  status: string;
  qrCode: string | null;
  qrCodeUrl: string | null;
};

function parseOrder(order: Record<string, unknown>): CreatedOrder {
  const charges = (order.charges as Array<Record<string, any>>) ?? [];
  const charge = charges[0];
  const tx = charge?.last_transaction ?? {};
  return {
    orderId: String(order.id),
    chargeId: charge?.id ? String(charge.id) : null,
    status: String(charge?.status ?? order.status ?? "pending"),
    qrCode: tx?.qr_code ?? null,
    qrCodeUrl: tx?.qr_code_url ?? null,
  };
}

type Customer = {
  customerName: string;
  customerEmail: string;
  customerDocument: string;
};

function buildCustomer(input: Customer) {
  return {
    name: input.customerName,
    email: input.customerEmail,
    type: "individual",
    document: input.customerDocument,
    document_type: "CPF",
  };
}

function buildItems(amountCents: number) {
  return [{ amount: amountCents, description: "Adicionar saldo Pinguim", quantity: 1 }];
}

export async function createPixOrder(
  input: Customer & { amountCents: number; metadata: Record<string, string> },
): Promise<CreatedOrder> {
  const order = await call("/orders", {
    method: "POST",
    body: JSON.stringify({
      closed: true,
      items: buildItems(input.amountCents),
      customer: buildCustomer(input),
      payments: [{ payment_method: "pix", pix: { expires_in: 3600 } }],
      metadata: input.metadata,
    }),
  });
  return parseOrder(order);
}

export async function createCardOrder(
  input: Customer & {
    amountCents: number;
    cardToken: string;
    metadata: Record<string, string>;
  },
): Promise<CreatedOrder> {
  const order = await call("/orders", {
    method: "POST",
    body: JSON.stringify({
      closed: true,
      items: buildItems(input.amountCents),
      customer: buildCustomer(input),
      payments: [
        {
          payment_method: "credit_card",
          credit_card: {
            installments: 1,
            statement_descriptor: "PINGUIM",
            card_token: input.cardToken,
          },
        },
      ],
      metadata: input.metadata,
    }),
  });
  return parseOrder(order);
}

export async function getOrder(orderId: string) {
  const order = await call(`/orders/${orderId}`);
  return { raw: order, parsed: parseOrder(order) };
}

export async function createPixTransfer(input: {
  amountCents: number;
  pixKey: string;
  holderName: string;
  holderDocument: string;
}) {
  // Pagar.me payout (transferência PIX) para a chave do usuário.
  return call("/transfers", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amountCents,
      pix: { key: input.pixKey },
      recipient: { name: input.holderName, document: input.holderDocument },
    }),
  });
}
