/**
 * Shared Rate Limiting Module — MongoDB-backed (serverless-safe).
 *
 * Uses a `rateLimitBuckets` collection with TTL indexes for automatic cleanup.
 * Also manages account lockout via `failedAttempts` and `lockUntil` on user documents.
 */

// MongoDB/D1 Database interface
type Db = any;

// ─── Rate Limit Bucket ─────────────────────────────────────────

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

/**
 * Check and consume a rate limit token.
 *
 * @param db - MongoDB database instance
 * @param key - Compound key like "login:ip:email" or "mfa:ip:userId"
 * @param maxAttempts - Maximum attempts in the window
 * @param windowMs - Time window in milliseconds
 */
export async function checkRateLimit(
  db: Db,
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    // Ensure TTL index exists (idempotent — MongoDB ignores if already exists)
    await db.collection("rateLimitBuckets").createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );

    // Count recent attempts in the window
    const count = await db.collection("rateLimitBuckets").countDocuments({
      key,
      createdAt: { $gte: windowStart },
    });

    if (count >= maxAttempts) {
      // Find the oldest entry in the window to calculate retry-after
      const oldest = await db.collection("rateLimitBuckets").findOne(
        { key, createdAt: { $gte: windowStart } },
        { sort: { createdAt: 1 } }
      );

      const retryAfterMs = oldest
        ? windowMs - (now.getTime() - oldest.createdAt.getTime())
        : windowMs;

      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(retryAfterMs, 1000),
      };
    }

    // Record this attempt
    await db.collection("rateLimitBuckets").insertOne({
      key,
      createdAt: now,
      expiresAt: new Date(now.getTime() + windowMs),
    });

    return {
      allowed: true,
      remaining: maxAttempts - count - 1,
    };
  } catch (error: any) {
    // Rate limiting must never block legitimate requests on DB errors
    console.error("[RATE_LIMIT] Error checking rate limit:", error.message);
    return { allowed: true, remaining: maxAttempts };
  }
}

// ─── Account Lockout ───────────────────────────────────────────

const DEFAULT_MAX_FAILURES = 5;
const DEFAULT_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if an account is currently locked.
 */
export async function isAccountLocked(db: Db, email: string): Promise<boolean> {
  try {
    const user = await db.collection("users").findOne(
      { email: email.toLowerCase().trim() },
      { projection: { lockUntil: 1 } }
    );

    if (!user?.lockUntil) return false;
    return new Date(user.lockUntil) > new Date();
  } catch (error: any) {
    console.error("[RATE_LIMIT] Error checking account lock:", error.message);
    return false;
  }
}

/**
 * Record a failed login attempt. Locks the account after threshold.
 */
export async function recordFailedLogin(
  db: Db,
  email: string,
  maxFailures: number = DEFAULT_MAX_FAILURES,
  lockDurationMs: number = DEFAULT_LOCK_DURATION_MS
): Promise<{ locked: boolean; failedAttempts: number }> {
  try {
    const result = await db.collection("users").findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        $inc: { failedAttempts: 1 },
        $set: { lastFailedAt: new Date() },
      },
      { returnDocument: "after", projection: { failedAttempts: 1 } }
    );

    const failedAttempts = result?.failedAttempts || 1;

    if (failedAttempts >= maxFailures) {
      const lockUntil = new Date(Date.now() + lockDurationMs);
      await db.collection("users").updateOne(
        { email: email.toLowerCase().trim() },
        { $set: { lockUntil } }
      );
      return { locked: true, failedAttempts };
    }

    return { locked: false, failedAttempts };
  } catch (error: any) {
    console.error("[RATE_LIMIT] Error recording failed login:", error.message);
    return { locked: false, failedAttempts: 0 };
  }
}

/**
 * Reset failed login counters after successful login.
 */
export async function resetLoginFailures(db: Db, email: string): Promise<void> {
  try {
    await db.collection("users").updateOne(
      { email: email.toLowerCase().trim() },
      {
        $unset: { failedAttempts: "", lockUntil: "", lastFailedAt: "" },
      }
    );
  } catch (error: any) {
    console.error("[RATE_LIMIT] Error resetting login failures:", error.message);
  }
}

// ─── Preset Rate Limit Configs ─────────────────────────────────

export const RATE_LIMITS = {
  LOGIN: { maxAttempts: 10, windowMs: 15 * 60 * 1000 }, // 10 per 15 min per key
  MFA_VERIFY: { maxAttempts: 5, windowMs: 5 * 60 * 1000 }, // 5 per 5 min
  MFA_RECOVERY: { maxAttempts: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 min
  MFA_ENROLL: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  PASSWORD_CHANGE: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  DIGILOCKER_CALLBACK: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  SENSITIVE_MUTATION: { maxAttempts: 30, windowMs: 60 * 1000 }, // 30 per min
} as const;
