/**
 * Shared Audit Logging Module.
 *
 * Writes privacy-safe audit events to the `auditLogs` collection.
 * Never stores raw PII, passwords, tokens, or secrets.
 */

// MongoDB/D1 Database interface
type Db = any;

// ─── Types ─────────────────────────────────────────────────────

export interface AuditEvent {
  timestamp: Date;
  actorUserId: string;
  actorEmail: string;
  actorRole: string;
  actorOrgId?: string;
  portal: "admin" | "client" | "candidate";
  action: string;
  targetType?: string;
  targetId?: string;
  ip: string;
  userAgent: string;
  outcome: "success" | "failure";
  reason?: string;
  metadata?: Record<string, string | number | boolean>;
}

export type AuditAction =
  | "login_success"
  | "login_failure"
  | "login_lockout"
  | "logout"
  | "mfa_enroll_start"
  | "mfa_enroll_complete"
  | "mfa_verify_success"
  | "mfa_verify_failure"
  | "mfa_disable"
  | "mfa_recovery_used"
  | "password_change_success"
  | "password_change_failure"
  | "password_setup_initiated"
  | "password_setup_completed"
  | "verification_created"
  | "verification_status_changed"
  | "verification_detail_viewed"
  | "verifier_assigned"
  | "verifier_invited"
  | "verifier_deleted"
  | "verifier_status_changed"
  | "organisation_created"
  | "organisation_updated"
  | "organisation_deleted"
  | "invoice_created"
  | "invoice_updated"
  | "invoice_deleted"
  | "payment_proof_submitted"
  | "settings_updated"
  | "rate_limit_hit"
  | "kyc_data_accessed"
  | "purge_executed"
  | "soft_delete";

// ─── Helpers ───────────────────────────────────────────────────

/**
 * Extract client IP from request headers.
 * Handles x-forwarded-for, x-real-ip, and direct connection.
 */
export function getClientIp(req: Request | { headers: Headers }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be "client, proxy1, proxy2"
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * Extract user-agent from request headers.
 */
export function getUserAgent(req: Request | { headers: Headers }): string {
  return req.headers.get("user-agent") || "unknown";
}

// ─── Core Logger ───────────────────────────────────────────────

/**
 * Log an audit event to MongoDB.
 *
 * Usage:
 *   await logAuditEvent(db, {
 *     actorUserId: user.id,
 *     actorEmail: user.email,
 *     actorRole: user.role,
 *     portal: "admin",
 *     action: "login_success",
 *     ip: getClientIp(req),
 *     userAgent: getUserAgent(req),
 *     outcome: "success",
 *   });
 */
export async function logAuditEvent(
  db: Db,
  event: Omit<AuditEvent, "timestamp">
): Promise<void> {
  if (process.env.AUDIT_LOG_ENABLED === "false") return;

  try {
    const auditDoc: AuditEvent = {
      timestamp: new Date(),
      ...event,
    };

    await db.collection("auditLogs").insertOne(auditDoc);
  } catch (error: any) {
    // Audit logging must never crash the application
    console.error("[AUDIT] Failed to write audit log:", error.message);
  }
}

/**
 * Convenience: log from auth context where we don't have a full session user yet.
 */
export async function logAuthEvent(
  db: Db,
  params: {
    email: string;
    portal: "admin" | "client" | "candidate";
    action: AuditAction;
    outcome: "success" | "failure";
    reason?: string;
    ip?: string;
    userAgent?: string;
    userId?: string;
    role?: string;
  }
): Promise<void> {
  await logAuditEvent(db, {
    actorUserId: params.userId || "",
    actorEmail: params.email,
    actorRole: params.role || "",
    portal: params.portal,
    action: params.action,
    outcome: params.outcome,
    reason: params.reason,
    ip: params.ip || "unknown",
    userAgent: params.userAgent || "unknown",
  });
}
