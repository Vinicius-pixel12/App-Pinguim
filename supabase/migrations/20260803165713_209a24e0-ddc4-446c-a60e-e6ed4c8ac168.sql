-- Fila de tarefas assíncronas (worker externo Node.js)
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  priority integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  error text,
  result jsonb,
  run_after timestamptz NOT NULL DEFAULT now(),
  locked_by text,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  CONSTRAINT jobs_status_check CHECK (status IN ('pending','processing','done','failed','canceled'))
);

CREATE INDEX jobs_status_idx ON public.jobs(status);
CREATE INDEX jobs_priority_idx ON public.jobs(priority DESC);
CREATE INDEX jobs_created_idx ON public.jobs(created_at);
CREATE INDEX jobs_type_idx ON public.jobs(type);
CREATE INDEX jobs_claim_idx ON public.jobs(status, priority DESC, run_after, created_at);

GRANT ALL ON public.jobs TO service_role;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view jobs"
ON public.jobs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.jobs TO authenticated;

CREATE TRIGGER jobs_updated
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enfileirar uma tarefa (usado por triggers/funções internas)
CREATE OR REPLACE FUNCTION public.enqueue_job(
  _type text,
  _payload jsonb DEFAULT '{}'::jsonb,
  _priority integer DEFAULT 0,
  _run_after timestamptz DEFAULT now(),
  _max_attempts integer DEFAULT 5
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.jobs (type, payload, priority, run_after, max_attempts)
  VALUES (_type, coalesce(_payload,'{}'::jsonb), coalesce(_priority,0), coalesce(_run_after, now()), coalesce(_max_attempts,5))
  RETURNING id INTO _id;
  RETURN _id;
END; $$;

REVOKE ALL ON FUNCTION public.enqueue_job(text, jsonb, integer, timestamptz, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_job(text, jsonb, integer, timestamptz, integer) TO service_role;

-- Worker pega o próximo lote da fila (lock atômico)
CREATE OR REPLACE FUNCTION public.claim_jobs(
  _worker text,
  _limit integer DEFAULT 1,
  _types text[] DEFAULT NULL
) RETURNS SETOF public.jobs
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.jobs j
  SET status = 'processing',
      attempts = j.attempts + 1,
      started_at = coalesce(j.started_at, now()),
      locked_by = _worker,
      locked_at = now()
  WHERE j.id IN (
    SELECT id FROM public.jobs
    WHERE status = 'pending'
      AND run_after <= now()
      AND (_types IS NULL OR type = ANY(_types))
    ORDER BY priority DESC, run_after, created_at
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(coalesce(_limit,1), 1)
  )
  RETURNING j.*;
$$;

REVOKE ALL ON FUNCTION public.claim_jobs(text, integer, text[]) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_jobs(text, integer, text[]) TO service_role;

-- Conclusão com sucesso
CREATE OR REPLACE FUNCTION public.complete_job(_job_id uuid, _result jsonb DEFAULT NULL)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.jobs
  SET status = 'done', result = _result, error = NULL,
      completed_at = now(), locked_by = NULL, locked_at = NULL
  WHERE id = _job_id;
$$;

REVOKE ALL ON FUNCTION public.complete_job(uuid, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_job(uuid, jsonb) TO service_role;

-- Falha: reagenda com backoff exponencial ou marca como failed
CREATE OR REPLACE FUNCTION public.fail_job(_job_id uuid, _error text, _retry boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE j public.jobs%rowtype;
BEGIN
  SELECT * INTO j FROM public.jobs WHERE id = _job_id FOR UPDATE;
  IF j.id IS NULL THEN RETURN; END IF;

  IF _retry AND j.attempts < j.max_attempts THEN
    UPDATE public.jobs
    SET status = 'pending', error = _error, locked_by = NULL, locked_at = NULL,
        run_after = now() + (interval '30 seconds' * power(2, greatest(j.attempts - 1, 0)))
    WHERE id = _job_id;
  ELSE
    UPDATE public.jobs
    SET status = 'failed', error = _error, completed_at = now(),
        locked_by = NULL, locked_at = NULL
    WHERE id = _job_id;
  END IF;
END; $$;

REVOKE ALL ON FUNCTION public.fail_job(uuid, text, boolean) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_job(uuid, text, boolean) TO service_role;

-- Destrava tarefas presas (worker morreu no meio do processamento)
CREATE OR REPLACE FUNCTION public.requeue_stalled_jobs(_older_than interval DEFAULT interval '10 minutes')
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE public.jobs
  SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
      locked_by = NULL, locked_at = NULL,
      error = coalesce(error, 'worker timeout')
  WHERE status = 'processing' AND locked_at < now() - _older_than;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;

REVOKE ALL ON FUNCTION public.requeue_stalled_jobs(interval) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.requeue_stalled_jobs(interval) TO service_role;