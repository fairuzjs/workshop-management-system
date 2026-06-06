import prisma from "@/lib/prisma";

export interface AuditLogParams {
  userId?: string | null;
  action: string; // CREATE, UPDATE, DELETE, CLOSE, REOPEN, STOCK_IN, STOCK_OUT
  entity: string; // WorkOrder, Transaction, Expense, MonthlyClosing, Employee, Inventory, etc.
  entityId: string;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
}

/**
 * Log an audit entry for sensitive operations.
 * Fire-and-forget — does not block the main response.
 *
 * Retention policy: minimum 12 months. No auto-purge.
 * Structure supports future cleanup/archive via:
 *   DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '12 months'
 *
 * @example
 * ```ts
 * logAudit({
 *   userId: session.user.id,
 *   action: "CREATE",
 *   entity: "Transaction",
 *   entityId: transaction.id,
 *   details: { amount: 100000, workOrderId: "..." },
 * });
 * ```
 */
export function logAudit(params: AuditLogParams): void {
  const { userId, action, entity, entityId, details, ipAddress } = params;

  // Fire-and-forget — don't await, don't block the response
  prisma.auditLog
    .create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId,
        details: details
          ? typeof details === "string"
            ? details
            : JSON.stringify(details)
          : null,
        ipAddress: ipAddress || null,
      },
    })
    .catch((err) => {
      // Silently log — audit failure should never crash the main operation
      console.error("[AuditLog] Failed to write audit log:", err);
    });
}

/**
 * Helper to extract client IP from a NextRequest.
 */
export function getClientIp(req: { headers: Headers }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
