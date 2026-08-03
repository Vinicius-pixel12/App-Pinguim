/**
 * API do worker externo (Node.js) — fila de tarefas.
 *
 * Fluxo do worker:
 *   POST /api/public/jobs/claim     → reserva lote de jobs
 *   POST /api/public/jobs/complete  → marca sucesso
 *   POST /api/public/jobs/fail      → registra erro (retry com backoff)
 *
 * Autenticação: header `x-worker-secret: $JOBS_WORKER_SECRET`.
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const claimSchema = z.object({
  worker: z.string().min(1).max(120),
  limit: z.number().int().min(1).max(50).optional(),
  types: z.array(z.string().min(1)).optional(),
});

const completeSchema = z.object({ jobId: z.string().uuid(), result: z.unknown().optional() });
const failSchema = z.object({
  jobId: z.string().uuid(),
  error: z.string().min(1).max(5000),
  retry: z.boolean().optional(),
});

export const Route = createFileRoute("/api/public/jobs/$action")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const queue = await import("@/services/jobs/queue.server");
        if (!queue.isAuthorizedWorker(request)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const body = await request.json().catch(() => null);

        try {
          if (params.action === "claim") {
            const parsed = claimSchema.safeParse(body);
            if (!parsed.success) return new Response("Invalid body", { status: 400 });
            const jobs = await queue.claimJobs(
              parsed.data.worker,
              parsed.data.limit ?? 1,
              parsed.data.types as never,
            );
            return Response.json({ jobs });
          }

          if (params.action === "complete") {
            const parsed = completeSchema.safeParse(body);
            if (!parsed.success) return new Response("Invalid body", { status: 400 });
            await queue.completeJob(parsed.data.jobId, parsed.data.result);
            return Response.json({ ok: true });
          }

          if (params.action === "fail") {
            const parsed = failSchema.safeParse(body);
            if (!parsed.success) return new Response("Invalid body", { status: 400 });
            await queue.failJob(parsed.data.jobId, parsed.data.error, parsed.data.retry ?? true);
            return Response.json({ ok: true });
          }

          return new Response("Not found", { status: 404 });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Erro inesperado";
          console.error(`[jobs/${params.action}]`, message);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
