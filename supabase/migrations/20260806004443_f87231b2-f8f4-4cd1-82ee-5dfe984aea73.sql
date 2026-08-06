-- 1. app_config: explicit admin-only policies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read app config" ON public.app_config FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert app config" ON public.app_config FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update app config" ON public.app_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete app config" ON public.app_config FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. comment_likes: enforce same privacy as comments/post_likes
DROP POLICY IF EXISTS "comment likes readable" ON public.comment_likes;
CREATE POLICY "comment likes readable" ON public.comment_likes FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.comments c
  JOIN public.posts p ON p.id = c.post_id
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE c.id = comment_likes.comment_id
    AND (pr.is_private = false OR pr.id = auth.uid() OR public.is_following(auth.uid(), pr.id))
));

-- 3. kyc_verifications: users may only change submission fields, never review fields
CREATE OR REPLACE FUNCTION public.guard_kyc_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.face_match_score := OLD.face_match_score;
  NEW.rejection_reason := OLD.rejection_reason;
  NEW.reviewed_at := OLD.reviewed_at;
  NEW.user_id := OLD.user_id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_kyc_user_update_trg ON public.kyc_verifications;
CREATE TRIGGER guard_kyc_user_update_trg
BEFORE UPDATE ON public.kyc_verifications
FOR EACH ROW EXECUTE FUNCTION public.guard_kyc_user_update();

-- 4. Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (
        p.prorettype = 'trigger'::regtype
        OR p.proname IN (
          'claim_jobs','complete_job','fail_job','enqueue_job',
          'requeue_stalled_jobs','purge_expired_stories'
        )
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
  END LOOP;
END $$;
