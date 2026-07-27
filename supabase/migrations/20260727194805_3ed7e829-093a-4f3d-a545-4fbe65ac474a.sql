-- ============ ENUMS ============
create type public.app_role as enum ('admin','moderator','user');
create type public.tx_type as enum ('deposit','conversation_payment','conversation_earning','platform_fee','withdraw','refund');
create type public.tx_status as enum ('pending','completed','failed','reversed');
create type public.request_status as enum ('pending','accepted','rejected','expired','refunded');
create type public.withdraw_status as enum ('pending','approved','paid','rejected');
create type public.kyc_status as enum ('none','pending','approved','rejected');
create type public.media_type as enum ('photo','video');

-- ============ UTIL ============
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  bio text,
  city text,
  state text,
  birth_date date,
  gender text,
  is_private boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create trigger profiles_updated before update on public.profiles for each row execute function public.update_updated_at_column();

-- ============ ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ============ WALLETS ============
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance numeric(12,2) not null default 0,
  earnings numeric(12,2) not null default 0,
  withdrawn numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;
create policy "own wallet" on public.wallets for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create trigger wallets_updated before update on public.wallets for each row execute function public.update_updated_at_column();

-- ============ TRANSACTIONS ============
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.tx_type not null,
  status public.tx_status not null default 'completed',
  amount numeric(12,2) not null,
  description text,
  reference_id uuid,
  created_at timestamptz not null default now()
);
create index transactions_user_idx on public.transactions(user_id, created_at desc);
grant select on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "own transactions" on public.transactions for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ============ CONVERSATION REQUESTS ============
create table public.conversation_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  channel text not null default 'chat',
  amount numeric(12,2) not null default 4.97,
  creator_share numeric(12,2) not null default 3.48,
  platform_share numeric(12,2) not null default 1.49,
  status public.request_status not null default 'pending',
  message text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index conv_req_target_idx on public.conversation_requests(target_id, created_at desc);
grant select on public.conversation_requests to authenticated;
grant all on public.conversation_requests to service_role;
alter table public.conversation_requests enable row level security;
create policy "own conversation requests" on public.conversation_requests for select to authenticated
  using (requester_id = auth.uid() or target_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create trigger conv_req_updated before update on public.conversation_requests for each row execute function public.update_updated_at_column();

-- ============ KYC ============
create table public.kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  cpf text,
  document_url text,
  selfie_url text,
  face_match_score numeric(5,2),
  pix_key text,
  pix_key_type text,
  status public.kyc_status not null default 'none',
  rejection_reason text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.kyc_verifications to authenticated;
grant all on public.kyc_verifications to service_role;
alter table public.kyc_verifications enable row level security;
create policy "own kyc select" on public.kyc_verifications for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own kyc insert" on public.kyc_verifications for insert to authenticated with check (user_id = auth.uid());
create policy "own kyc update" on public.kyc_verifications for update to authenticated using (user_id = auth.uid() and status <> 'approved') with check (user_id = auth.uid());
create trigger kyc_updated before update on public.kyc_verifications for each row execute function public.update_updated_at_column();

-- ============ WITHDRAW REQUESTS ============
create table public.withdraw_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 50),
  pix_key text not null,
  pix_key_type text,
  status public.withdraw_status not null default 'pending',
  provider_transfer_id text,
  rejection_reason text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.withdraw_requests to authenticated;
grant all on public.withdraw_requests to service_role;
alter table public.withdraw_requests enable row level security;
create policy "own withdraws" on public.withdraw_requests for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create trigger withdraw_updated before update on public.withdraw_requests for each row execute function public.update_updated_at_column();

-- ============ PAYMENT HISTORY ============
create table public.payment_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'pagarme',
  provider_order_id text,
  provider_charge_id text,
  method text,
  amount numeric(12,2) not null,
  status text not null default 'pending',
  qr_code text,
  qr_code_url text,
  raw jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payment_history_user_idx on public.payment_history(user_id, created_at desc);
grant select on public.payment_history to authenticated;
grant all on public.payment_history to service_role;
alter table public.payment_history enable row level security;
create policy "own payments" on public.payment_history for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create trigger payment_updated before update on public.payment_history for each row execute function public.update_updated_at_column();

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  reference_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications select" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own notifications update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ MESSAGES ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversation_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_conv_idx on public.messages(conversation_id, created_at);
grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "messages of my accepted conversations" on public.messages for select to authenticated
  using (exists (select 1 from public.conversation_requests c where c.id = conversation_id
    and c.status = 'accepted' and (c.requester_id = auth.uid() or c.target_id = auth.uid())));
create policy "send message in my conversation" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and exists (select 1 from public.conversation_requests c where c.id = conversation_id
    and c.status = 'accepted' and (c.requester_id = auth.uid() or c.target_id = auth.uid())));

-- ============ POSTS ============
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_url text not null,
  media_type public.media_type not null default 'photo',
  caption text,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_user_idx on public.posts(user_id, created_at desc);
grant select, insert, update, delete on public.posts to authenticated;
grant select on public.posts to anon;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "public posts readable" on public.posts for select
  using (exists (select 1 from public.profiles p where p.id = user_id and p.is_private = false));
create policy "own posts readable" on public.posts for select to authenticated using (user_id = auth.uid());
create policy "own posts insert" on public.posts for insert to authenticated with check (user_id = auth.uid());
create policy "own posts update" on public.posts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own posts delete" on public.posts for delete to authenticated using (user_id = auth.uid());
create trigger posts_updated before update on public.posts for each row execute function public.update_updated_at_column();

-- ============ STORIES ============
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_url text not null,
  media_type public.media_type not null default 'photo',
  caption text,
  mentions text[] not null default '{}',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);
create index stories_user_idx on public.stories(user_id, created_at desc);
grant select, insert, delete on public.stories to authenticated;
grant select on public.stories to anon;
grant all on public.stories to service_role;
alter table public.stories enable row level security;
create policy "public stories readable" on public.stories for select
  using (expires_at > now() and exists (select 1 from public.profiles p where p.id = user_id and p.is_private = false));
create policy "own stories readable" on public.stories for select to authenticated using (user_id = auth.uid());
create policy "own stories insert" on public.stories for insert to authenticated with check (user_id = auth.uid());
create policy "own stories delete" on public.stories for delete to authenticated using (user_id = auth.uid());

-- ============ REPORTS ============
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete cascade,
  target_post_id uuid references public.posts(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
grant select, insert on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "own reports select" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "create report" on public.reports for insert to authenticated with check (reporter_id = auth.uid());

-- ============ AUTO PROFILE + WALLET ON SIGNUP ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare base_username text; final_username text; n int := 0;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1), 'user'), '[^a-z0-9._]', '', 'g'));
  if base_username = '' then base_username := 'user'; end if;
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    n := n + 1; final_username := base_username || n::text;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (new.id, final_username, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name'), new.raw_user_meta_data->>'avatar_url');

  insert into public.wallets (user_id) values (new.id);
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  insert into public.kyc_verifications (user_id) values (new.id) on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ FINANCIAL RPCs ============
-- Cria pedido de conversa debitando o saldo do solicitante
create or replace function public.create_conversation_request(_target_id uuid, _channel text default 'chat', _message text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _amount numeric := 4.97; _req_id uuid; _bal numeric;
begin
  if _uid is null then raise exception 'Não autenticado'; end if;
  if _uid = _target_id then raise exception 'Não é possível iniciar conversa consigo mesmo'; end if;

  select balance into _bal from public.wallets where user_id = _uid for update;
  if _bal is null then raise exception 'Carteira não encontrada'; end if;
  if _bal < _amount then raise exception 'Saldo insuficiente'; end if;

  update public.wallets set balance = balance - _amount where user_id = _uid;

  insert into public.conversation_requests (requester_id, target_id, channel, amount, message)
  values (_uid, _target_id, coalesce(_channel,'chat'), _amount, _message)
  returning id into _req_id;

  insert into public.transactions (user_id, type, amount, description, reference_id)
  values (_uid, 'conversation_payment', -_amount, 'Pedido de conversa', _req_id);

  insert into public.notifications (user_id, type, title, body, reference_id)
  values (_target_id, 'conversation_request', 'Novo pedido de conversa', 'Alguém quer conversar com você', _req_id);

  return _req_id;
end; $$;

-- Aceita conversa e faz o split 70/30
create or replace function public.respond_conversation_request(_request_id uuid, _accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); r public.conversation_requests%rowtype;
begin
  if _uid is null then raise exception 'Não autenticado'; end if;
  select * into r from public.conversation_requests where id = _request_id for update;
  if r.id is null then raise exception 'Pedido não encontrado'; end if;
  if r.target_id <> _uid then raise exception 'Sem permissão'; end if;
  if r.status <> 'pending' then raise exception 'Pedido já respondido'; end if;

  if _accept then
    update public.conversation_requests set status = 'accepted', responded_at = now() where id = r.id;
    update public.wallets set balance = balance + r.creator_share, earnings = earnings + r.creator_share where user_id = r.target_id;
    insert into public.transactions (user_id, type, amount, description, reference_id)
      values (r.target_id, 'conversation_earning', r.creator_share, 'Ganho por conversa aceita', r.id);
    insert into public.transactions (user_id, type, amount, description, reference_id)
      values (r.requester_id, 'platform_fee', -r.platform_share, 'Taxa da plataforma (30%)', r.id);
    insert into public.notifications (user_id, type, title, body, reference_id)
      values (r.requester_id, 'conversation_accepted', 'Conversa aceita', 'Seu pedido de conversa foi aceito', r.id);
  else
    update public.conversation_requests set status = 'refunded', responded_at = now() where id = r.id;
    update public.wallets set balance = balance + r.amount where user_id = r.requester_id;
    insert into public.transactions (user_id, type, amount, description, reference_id)
      values (r.requester_id, 'refund', r.amount, 'Estorno de pedido recusado', r.id);
    insert into public.notifications (user_id, type, title, body, reference_id)
      values (r.requester_id, 'conversation_rejected', 'Pedido recusado', 'Valor estornado para sua carteira', r.id);
  end if;
end; $$;

-- Solicita saque (mínimo R$ 50 + conta verificada)
create or replace function public.request_withdraw(_amount numeric)
returns uuid language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _bal numeric; _kyc public.kyc_verifications%rowtype; _id uuid;
begin
  if _uid is null then raise exception 'Não autenticado'; end if;
  if _amount < 50 then raise exception 'Valor mínimo de saque é R$ 50,00'; end if;

  select * into _kyc from public.kyc_verifications where user_id = _uid;
  if _kyc.status is distinct from 'approved' then raise exception 'Conta não verificada'; end if;
  if _kyc.pix_key is null then raise exception 'Cadastre uma chave PIX'; end if;

  select balance into _bal from public.wallets where user_id = _uid for update;
  if _bal < _amount then raise exception 'Saldo insuficiente'; end if;

  update public.wallets set balance = balance - _amount, withdrawn = withdrawn + _amount where user_id = _uid;

  insert into public.withdraw_requests (user_id, amount, pix_key, pix_key_type)
  values (_uid, _amount, _kyc.pix_key, _kyc.pix_key_type) returning id into _id;

  insert into public.transactions (user_id, type, status, amount, description, reference_id)
  values (_uid, 'withdraw', 'pending', -_amount, 'Solicitação de saque PIX', _id);

  return _id;
end; $$;

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.conversation_requests;
alter publication supabase_realtime add table public.wallets;