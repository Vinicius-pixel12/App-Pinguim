CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'web',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX device_tokens_user_id_idx ON public.device_tokens(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO authenticated;
GRANT ALL ON public.device_tokens TO service_role;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own device tokens select" ON public.device_tokens FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own device tokens insert" ON public.device_tokens FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own device tokens update" ON public.device_tokens FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own device tokens delete" ON public.device_tokens FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_device_tokens_updated_at BEFORE UPDATE ON public.device_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Notificações automáticas de curtida em publicação
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid; liker text;
BEGIN
  SELECT user_id INTO owner_id FROM public.posts WHERE id = NEW.post_id;
  IF owner_id IS NULL OR owner_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, username) INTO liker FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, body, reference_id)
  VALUES (owner_id, 'post_like', 'Nova reação', COALESCE(liker, 'Alguém') || ' reagiu à sua publicação', NEW.post_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_post_like_trg AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();

-- Notificações automáticas de comentário
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_id uuid; author text;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO target_id FROM public.comments WHERE id = NEW.parent_id;
  ELSE
    SELECT user_id INTO target_id FROM public.posts WHERE id = NEW.post_id;
  END IF;
  IF target_id IS NULL OR target_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, username) INTO author FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, body, reference_id)
  VALUES (target_id, 'comment', 'Nova anotação', COALESCE(author, 'Alguém') || ': ' || left(NEW.content, 80), NEW.post_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_new_comment_trg AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.notify_new_comment();

-- Notificações automáticas de curtida em comentário
CREATE OR REPLACE FUNCTION public.notify_comment_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid; post uuid; liker text;
BEGIN
  SELECT user_id, post_id INTO owner_id, post FROM public.comments WHERE id = NEW.comment_id;
  IF owner_id IS NULL OR owner_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, username) INTO liker FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, body, reference_id)
  VALUES (owner_id, 'comment_like', 'Nova reação', COALESCE(liker, 'Alguém') || ' reagiu à sua anotação', post);
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_comment_like_trg AFTER INSERT ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_comment_like();

-- Notificações automáticas de mensagem
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_id uuid; sender_name text;
BEGIN
  SELECT CASE WHEN requester_id = NEW.sender_id THEN target_id ELSE requester_id END
    INTO target_id FROM public.conversation_requests WHERE id = NEW.conversation_id;
  IF target_id IS NULL OR target_id = NEW.sender_id THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, username) INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, type, title, body, reference_id)
  VALUES (target_id, 'new_message', COALESCE(sender_name, 'Nova mensagem'), left(NEW.content, 120), NEW.conversation_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_new_message_trg AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- Despacho do push a cada nova notificação
CREATE OR REPLACE FUNCTION public.dispatch_push_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE endpoint text; secret text;
BEGIN
  SELECT value INTO endpoint FROM public.app_config WHERE key = 'push_webhook_url';
  SELECT value INTO secret FROM public.app_config WHERE key = 'push_webhook_secret';
  IF endpoint IS NULL OR secret IS NULL THEN RETURN NEW; END IF;
  PERFORM net.http_post(
    url := endpoint,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', secret),
    body := jsonb_build_object('notification_id', NEW.id)
  );
  RETURN NEW;
END; $$;
CREATE TRIGGER dispatch_push_notification_trg AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_notification();