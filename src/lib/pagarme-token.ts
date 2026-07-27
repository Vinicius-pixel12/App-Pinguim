/** Tokenização de cartão no navegador (a chave pública é publicável). */
export async function tokenizeCard(
  publicKey: string,
  card: {
    number: string;
    holder_name: string;
    exp_month: number;
    exp_year: number;
    cvv: string;
  },
): Promise<string> {
  const res = await fetch(
    `https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(publicKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "card", card }),
    },
  );
  const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok || !json.id) {
    throw new Error(json.message ?? "Não foi possível validar os dados do cartão");
  }
  return json.id;
}

export const onlyDigits = (v: string) => v.replace(/\D/g, "");
