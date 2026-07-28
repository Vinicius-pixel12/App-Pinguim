-- =========================================================
-- 1. RELACIONAMENTOS (FKs para profiles / auth.users)
-- =========================================================
alter table public.profiles
  drop constraint if exists profiles_id_fkey,
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

alter table public.posts
  drop constraint if exists posts_user_id_fkey,
  add constraint posts_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.stories
  drop constraint if exists stories_user_id_fkey,
  add constraint stories_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.wallets
  drop constraint if exists wallets_user_id_fkey,
  add constraint wallets_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.kyc_verifications
  drop constraint if exists kyc_verifications_user_id_fkey,
  add constraint kyc_verifications_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.transactions
  drop constraint if exists transactions_user_id_fkey,
  add constraint transactions_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.notifications
  drop constraint if exists notifications_user_id_fkey,
  add constraint notifications_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.withdraw_requests
  drop constraint if exists withdraw_requests_user_id_fkey,
  add constraint withdraw_requests_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.payment_history
  drop constraint if exists payment_history_user_id_fkey,
  add constraint payment_history_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.user_roles
  drop constraint if exists user_roles_user_id_fkey,
  add constraint user_roles_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.conversation_requests
  drop constraint if exists conversation_requests_requester_id_fkey,
  add constraint conversation_requests_requester_id_fkey foreign key (requester_id) references public.profiles(id) on delete cascade,
  drop constraint if exists conversation_requests_target_id_fkey,
  add constraint conversation_requests_target_id_fkey foreign key (target_id) references public.profiles(id) on delete cascade;

alter table public.messages
  drop constraint if exists messages_sender_id_fkey,
  add constraint messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete cascade;

alter table public.reports
  drop constraint if exists reports_reporter_id_fkey,
  add constraint reports_reporter_id_fkey foreign key (reporter_id) references public.profiles(id) on delete cascade,
  drop constraint if exists reports_target_user_id_fkey,
  add constraint reports_target_user_id_fkey foreign key (target_user_id) references public.profiles(id) on delete cascade;

-- =========================================================
-- 2. NOVAS TABELAS
-- =========================================================
create type public.follow_status as enum ('pending','accepted');

create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  status public.follow_status not null default 'accepted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);
grant select, insert, update, delete on public.follows to authenticated;
grant select on public.follows to anon;
grant all on public.follows to service_role;
alter table public.follows enable row level security;

create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
grant select, insert, delete on public.post_likes to authenticated;
grant select on public.post_likes to anon;
grant all on public.post_likes to service_role;
alter table public.post_likes enable row level security;

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2200),
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.comments to authenticated;
grant select on public.comments to anon;
grant all on public.comments to service_role;
alter table public.comments enable row level security;

create table public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);
grant select, insert, delete on public.comment_likes to authenticated;
grant select on public.comment_likes to anon;
grant all on public.comment_likes to service_role;
alter table public.comment_likes enable row level security;

create table public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
grant select, insert, delete on public.saved_posts to authenticated;
grant all on public.saved_posts to service_role;
alter table public.saved_posts enable row level security;

create table public.story_views (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (story_id, viewer_id)
);
grant select, insert on public.story_views to authenticated;
grant all on public.story_views to service_role;
alter table public.story_views enable row level security;

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
grant select, insert, delete on public.blocks to authenticated;
grant all on public.blocks to service_role;
alter table public.blocks enable row level security;

-- =========================================================
-- 3. FUNÇÕES AUXILIARES
-- =========================================================
create or replace function public.is_following(_follower uuid, _following uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.follows
    where follower_id = _follower and following_id = _following and status = 'accepted');
$$;

create or replace function public.can_view_profile(_profile_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = _profile_id
      and (p.is_private = false
        or p.id = auth.uid()
        or public.is_following(auth.uid(), p.id))
  );
$$;

create or replace function public.follower_counts(_profile_id uuid)
returns table (followers bigint, following bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.follows where following_id = _profile_id and status = 'accepted'),
    (select count(*) from public.follows where follower_id = _profile_id and status = 'accepted');
$$;

-- =========================================================
-- 4. RLS DAS NOVAS TABELAS
-- =========================================================
create policy "follows readable" on public.follows for select to anon, authenticated
  using (status = 'accepted' or follower_id = auth.uid() or following_id = auth.uid());
create policy "follow as self" on public.follows for insert to authenticated
  with check (follower_id = auth.uid()
    and not exists (select 1 from public.blocks b where b.blocker_id = following_id and b.blocked_id = auth.uid()));
create policy "target responds follow" on public.follows for update to authenticated
  using (following_id = auth.uid()) with check (following_id = auth.uid());
create policy "unfollow or remove" on public.follows for delete to authenticated
  using (follower_id = auth.uid() or following_id = auth.uid());

create policy "post likes readable" on public.post_likes for select to anon, authenticated
  using (exists (select 1 from public.posts p join public.profiles pr on pr.id = p.user_id
    where p.id = post_id and (pr.is_private = false or pr.id = auth.uid() or public.is_following(auth.uid(), pr.id))));
create policy "like as self" on public.post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "unlike own" on public.post_likes for delete to authenticated using (user_id = auth.uid());

create policy "comments readable" on public.comments for select to anon, authenticated
  using (exists (select 1 from public.posts p join public.profiles pr on pr.id = p.user_id
    where p.id = post_id and (pr.is_private = false or pr.id = auth.uid() or public.is_following(auth.uid(), pr.id))));
create policy "comment as self" on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy "edit own comment" on public.comments for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own comment or own post" on public.comments for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));

create policy "comment likes readable" on public.comment_likes for select to anon, authenticated using (true);
create policy "comment like as self" on public.comment_likes for insert to authenticated with check (user_id = auth.uid());
create policy "comment unlike own" on public.comment_likes for delete to authenticated using (user_id = auth.uid());

create policy "own saved posts" on public.saved_posts for select to authenticated using (user_id = auth.uid());
create policy "save as self" on public.saved_posts for insert to authenticated with check (user_id = auth.uid());
create policy "unsave own" on public.saved_posts for delete to authenticated using (user_id = auth.uid());

create policy "story views readable" on public.story_views for select to authenticated
  using (viewer_id = auth.uid()
    or exists (select 1 from public.stories s where s.id = story_id and s.user_id = auth.uid()));
create policy "view as self" on public.story_views for insert to authenticated with check (viewer_id = auth.uid());

create policy "own blocks" on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy "block as self" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "unblock own" on public.blocks for delete to authenticated using (blocker_id = auth.uid());

-- Perfis privados: seguidores aceitos podem ver posts e stories
create policy "follower posts readable" on public.posts for select to authenticated
  using (public.is_following(auth.uid(), user_id));
create policy "follower stories readable" on public.stories for select to authenticated
  using (expires_at > now() and public.is_following(auth.uid(), user_id));

-- =========================================================
-- 5. TRIGGERS
-- =========================================================
create trigger comments_updated before update on public.comments
  for each row execute function public.update_updated_at_column();
create trigger follows_updated before update on public.follows
  for each row execute function public.update_updated_at_column();

create or replace function public.sync_post_likes_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    insert into public.notifications (user_id, type, title, body, reference_id)
      select p.user_id, 'post_like', 'Nova reação', 'Alguém reagiu à sua publicação', new.post_id
      from public.posts p where p.id = new.post_id and p.user_id <> new.user_id;
    return new;
  else
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
    return old;
  end if;
end; $$;
create trigger post_likes_count after insert or delete on public.post_likes
  for each row execute function public.sync_post_likes_count();

create or replace function public.sync_comments_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    insert into public.notifications (user_id, type, title, body, reference_id)
      select p.user_id, 'post_comment', 'Nova anotação', 'Alguém anotou na sua publicação', new.post_id
      from public.posts p where p.id = new.post_id and p.user_id <> new.user_id;
    return new;
  else
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
    return old;
  end if;
end; $$;
create trigger comments_count after insert or delete on public.comments
  for each row execute function public.sync_comments_count();

create or replace function public.sync_comment_likes_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set likes_count = likes_count + 1 where id = new.comment_id;
    return new;
  else
    update public.comments set likes_count = greatest(likes_count - 1, 0) where id = old.comment_id;
    return old;
  end if;
end; $$;
create trigger comment_likes_count after insert or delete on public.comment_likes
  for each row execute function public.sync_comment_likes_count();

-- Perfil privado => pedido pendente; público => aceito na hora + notificação
create or replace function public.handle_new_follow()
returns trigger language plpgsql security definer set search_path = public as $$
declare _private boolean;
begin
  select is_private into _private from public.profiles where id = new.following_id;
  new.status := case when coalesce(_private,false) then 'pending'::public.follow_status else 'accepted'::public.follow_status end;
  return new;
end; $$;
create trigger follows_set_status before insert on public.follows
  for each row execute function public.handle_new_follow();

create or replace function public.notify_new_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, reference_id)
  values (new.following_id,
    case when new.status = 'pending' then 'follow_request' else 'follow' end,
    case when new.status = 'pending' then 'Novo pedido para seguir' else 'Novo seguidor' end,
    'Alguém quer acompanhar seu perfil', new.follower_id);
  return new;
end; $$;
create trigger follows_notify after insert on public.follows
  for each row execute function public.notify_new_follow();

-- =========================================================
-- 6. ÍNDICES
-- =========================================================
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_user_created_idx on public.posts (user_id, created_at desc);
create index if not exists stories_active_idx on public.stories (expires_at desc) where expires_at > '2020-01-01';
create index if not exists stories_user_created_idx on public.stories (user_id, created_at desc);
create index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists profiles_display_name_idx on public.profiles (lower(display_name));
create index if not exists profiles_public_idx on public.profiles (is_private) where is_private = false;
create index if not exists follows_follower_idx on public.follows (follower_id, status);
create index if not exists follows_following_idx on public.follows (following_id, status);
create index if not exists post_likes_post_idx on public.post_likes (post_id, created_at desc);
create index if not exists post_likes_user_idx on public.post_likes (user_id, created_at desc);
create index if not exists comments_post_idx on public.comments (post_id, created_at desc);
create index if not exists comments_parent_idx on public.comments (parent_id, created_at);
create index if not exists comment_likes_comment_idx on public.comment_likes (comment_id);
create index if not exists saved_posts_user_idx on public.saved_posts (user_id, created_at desc);
create index if not exists story_views_story_idx on public.story_views (story_id);
create index if not exists blocks_blocker_idx on public.blocks (blocker_id);
create index if not exists notifications_unread_idx on public.notifications (user_id, created_at desc) where read = false;
create index if not exists messages_conv_created_idx on public.messages (conversation_id, created_at desc);
create index if not exists conv_req_requester_idx on public.conversation_requests (requester_id, created_at desc);
create index if not exists conv_req_status_idx on public.conversation_requests (status, created_at desc);
create index if not exists transactions_user_created_idx on public.transactions (user_id, created_at desc);
create index if not exists withdraw_status_idx on public.withdraw_requests (status, created_at desc);
create index if not exists payment_status_idx on public.payment_history (status, created_at desc);
create index if not exists payment_order_idx on public.payment_history (provider_order_id);
create index if not exists kyc_status_idx on public.kyc_verifications (status, created_at desc);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

-- =========================================================
-- 7. LIMPEZA DE STORIES EXPIRADOS
-- =========================================================
create or replace function public.purge_expired_stories()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.stories where expires_at < now();
  get diagnostics n = row_count;
  return n;
end; $$;
revoke all on function public.purge_expired_stories() from public, anon, authenticated;