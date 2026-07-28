/**
 * Camada de dados (implementação atual: Supabase / Lovable Cloud).
 *
 * Os repositórios abaixo descrevem COMO o app deve falar com o banco.
 * Regras para escalar:
 * - Nenhum componente faz `supabase.from(...)` direto: sempre via repositório.
 * - Toda listagem é paginada por cursor (keyset), nunca offset.
 * - Escrita com regra de negócio (saldo, split, saque) mora em função do banco.
 */

export type Cursor = string | null;

export type Page<T> = {
  items: T[];
  nextCursor: Cursor;
};

export type PageParams = {
  cursor?: Cursor;
  limit?: number; // default 20, máx 50
};

export interface FeedRepository {
  listHomeFeed(userId: string, params: PageParams): Promise<Page<unknown>>;
  listExploreFeed(params: PageParams): Promise<Page<unknown>>;
  listUserPosts(username: string, params: PageParams): Promise<Page<unknown>>;
}

export interface ProfileRepository {
  getByUsername(username: string): Promise<unknown | null>;
  isUsernameAvailable(username: string): Promise<boolean>;
  search(term: string, params: PageParams): Promise<Page<unknown>>;
}

export interface WalletRepository {
  getBalance(userId: string): Promise<number>;
  listTransactions(userId: string, params: PageParams): Promise<Page<unknown>>;
}

export interface ConversationRepository {
  listRequests(userId: string, params: PageParams): Promise<Page<unknown>>;
  listMessages(conversationId: string, params: PageParams): Promise<Page<unknown>>;
}

export const pagination = {
  defaultLimit: 20,
  maxLimit: 50,
} as const;
