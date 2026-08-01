/**
 * Order Printing Service.
 *
 * Deliberately SDK-free. When an order becomes "accepted" the kitchen app
 * generates a printable receipt and posts it to a webhook endpoint.
 *
 * Future integration points:
 * - TODO(star-cloudprnt): expose GET /api/public/print/cloudprnt returning the
 *   job queue in Star Micronics CloudPRNT format, and POST for job confirmation.
 * - TODO(sunmi-cloud-print): push the receipt payload to Sunmi Cloud Print's
 *   REST API using the device SN + app key stored as server-side secrets.
 */

export type ReceiptLine = {
  quantity: number;
  name: string;
  modifiers: string[];
  instructions?: string | null;
  lineTotal: number;
};

export type Receipt = {
  orderNumber: number;
  placedAt: string;
  fulfilment: string;
  lines: ReceiptLine[];
  notes?: string | null;
  total: number;
};

export function buildReceiptText(receipt: Receipt): string {
  const rows = receipt.lines.map((line) => {
    const mods = line.modifiers.length ? `\n    + ${line.modifiers.join(", ")}` : "";
    const note = line.instructions ? `\n    * ${line.instructions}` : "";
    return `${line.quantity} x ${line.name}${mods}${note}   ${line.lineTotal.toFixed(2)} EUR`;
  });

  return [
    "================================",
    `ORDER #${receipt.orderNumber}`,
    receipt.placedAt,
    receipt.fulfilment.toUpperCase(),
    "--------------------------------",
    ...rows,
    "--------------------------------",
    receipt.notes ? `NOTES: ${receipt.notes}` : "",
    `TOTAL ${receipt.total.toFixed(2)} EUR`,
    "================================",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Opens the browser print dialog with a plain-text receipt. */
export function printReceipt(receipt: Receipt) {
  const text = buildReceiptText(receipt);
  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return;
  win.document.write(
    `<pre style="font:13px/1.4 monospace;white-space:pre-wrap">${text.replace(/</g, "&lt;")}</pre>`,
  );
  win.document.close();
  win.focus();
  win.print();
}

/** Fire-and-forget webhook so a print bridge can pick the job up. */
export async function dispatchPrintWebhook(receipt: Receipt) {
  try {
    await fetch("/api/public/print-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receipt, text: buildReceiptText(receipt) }),
    });
  } catch {
    // Printing must never block the kitchen flow.
  }
}
