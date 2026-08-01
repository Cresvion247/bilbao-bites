import { createFileRoute } from "@tanstack/react-router";

/**
 * Print webhook endpoint.
 * The kitchen app posts a receipt here when an order is accepted, so a print
 * bridge (Star Micronics CloudPRNT, Sunmi Cloud Print, or a local agent) can
 * pick the job up. Logging only for now — see src/lib/printing.ts TODOs.
 */
export const Route = createFileRoute("/api/public/print-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = (await request.json().catch(() => null)) as {
          text?: string;
        } | null;
        if (!payload?.text) {
          return new Response(JSON.stringify({ error: "invalid payload" }), { status: 400 });
        }
        console.log("[print-webhook] receipt queued\n", payload.text.slice(0, 2000));
        return Response.json({ ok: true });
      },
    },
  },
});
