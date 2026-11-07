/**
 * Shared helpers for External API routes
 * 
 * Contains verification ID generation, common response builders,
 * and the standard request processing pipeline used by all external endpoints.
 */

import { NextRequest, NextResponse } from "next/server";
type Db = any;
import { authenticateApiKey, isApiAuthError, requireApiPermission, getCheckTypeRate, ApiAuthResult } from "./externalApiAuth";
import { applyRateLimit, rateLimitHeaders } from "./apiRateLimit";
import { logApiUsage } from "./apiUsageLog";
import { connectToDatabase } from "./mongodb";

/**
 * Generate a verification ID following the existing pattern.
 * Format: <PREFIX><DDMMYY>-<NNNN>
 */
export async function generateVerificationId(
  db: Db,
  prefix: string
): Promise<string> {
  const nowTime = new Date();
  const dd = String(nowTime.getDate()).padStart(2, "0");
  const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
  const yy = String(nowTime.getFullYear()).slice(-2);
  const dateStr = `${dd}${mm}${yy}`;
  const fullPrefix = `${prefix}${dateStr}-`;

  const count = await db.collection("verifications").countDocuments({
    id: { $regex: `^${fullPrefix}` },
  });
  return `${fullPrefix}${String(count + 1).padStart(4, "0")}`;
}

/**
 * Derive 3-letter org prefix for identity verification IDs.
 */
export function orgPrefix(orgName: string): string {
  return (orgName || "XXX")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .padEnd(3, "X")
    .toUpperCase();
}

/**
 * Standard external API request processing pipeline.
 * Handles auth, rate limiting, permission check, and usage logging.
 * 
 * Usage:
 * ```
 * export async function POST(req: NextRequest) {
 *   return processExternalApiRequest(req, "identity", async (db, auth, body) => {
 *     // ... create verification ...
 *     return { requestId: "...", status: "processing" };
 *   });
 * }
 * ```
 */
export async function processExternalApiRequest(
  req: NextRequest,
  checkType: string,
  handler: (db: Db, auth: ApiAuthResult, body: any) => Promise<{ data: any; statusCode?: number; skipUsageLog?: boolean }>
): Promise<NextResponse> {
  const startTime = Date.now();

  // 1. Authenticate
  const authResult = await authenticateApiKey(req);
  if (isApiAuthError(authResult)) return authResult;

  // 2. Rate limit
  const rateLimitError = applyRateLimit(authResult.apiKey._id, authResult.apiKey.rateLimit);
  if (rateLimitError) return rateLimitError;

  // 3. Permission check
  const permError = requireApiPermission(authResult.apiKey, authResult.org, checkType);
  if (permError) return permError;

  const { db } = await connectToDatabase();

  let statusCode = 200;
  let responseData: any;
  let errorMessage: string | undefined;

  try {
    // 4. Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      statusCode = 400;
      responseData = { error: "Invalid JSON body" };
      errorMessage = "Invalid JSON body";
    }

    if (!errorMessage) {
      // 5. Run handler
      const result = await handler(db, authResult, body);
      statusCode = result.statusCode || 200;
      responseData = result.data;

      if (result.skipUsageLog) return NextResponse.json(responseData, {
        status: statusCode,
        headers: rateLimitHeaders(authResult.apiKey._id, authResult.apiKey.rateLimit),
      });
    }

  } catch (err: any) {
    statusCode = 500;
    responseData = { error: "Internal server error" };
    errorMessage = err?.message || String(err);
    console.error(`[EXTERNAL_API] Error in ${checkType}:`, errorMessage);
  }

  // 6. Log usage (fire-and-forget)
  const responseTimeMs = Date.now() - startTime;
  const cost = statusCode < 400 ? getCheckTypeRate(authResult.org, checkType) : 0;

  logApiUsage(db, {
    orgId: authResult.org.id,
    orgName: authResult.org.name,
    apiKeyId: authResult.apiKey._id,
    keySuffix: authResult.apiKey.keySuffix,
    endpoint: req.nextUrl.pathname,
    checkType,
    method: req.method,
    statusCode,
    cost,
    currency: authResult.org.currency || "USD",
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown",
    requestId: responseData?.requestId || "",
    timestamp: new Date(),
    responseTimeMs,
    errorMessage,
  }).catch(() => {});

  return NextResponse.json(responseData, {
    status: statusCode,
    headers: rateLimitHeaders(authResult.apiKey._id, authResult.apiKey.rateLimit),
  });
}

/**
 * Get the current date formatted as "Sep 04, 2026" (matches portal format).
 */
export function formatDateForVerification(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
