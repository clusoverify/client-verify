/**
 * External API: Check Verification Status
 * GET /api/v1/external/status/[requestId]
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, isApiAuthError } from "src/lib/externalApiAuth";
import { applyRateLimit, rateLimitHeaders } from "src/lib/apiRateLimit";
import { connectToDatabase } from "src/lib/mongodb";
import { logApiUsage } from "src/lib/apiUsageLog";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const startTime = Date.now();
  const authResult = await authenticateApiKey(req);
  if (isApiAuthError(authResult)) return authResult;

  const rateLimitError = applyRateLimit(authResult.apiKey._id, authResult.apiKey.rateLimit);
  if (rateLimitError) return rateLimitError;

  const { requestId } = await params;
  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }

  const { db } = await connectToDatabase();
  const orgNameRegex = new RegExp(`^${authResult.org.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i");

  const verification = await db.collection("verifications").findOne({
    id: requestId,
    orgName: { $regex: orgNameRegex },
    isDeleted: { $ne: true },
  });

  if (!verification) {
    return NextResponse.json(
      { error: "Verification record not found or does not belong to your organisation" },
      { status: 404, headers: rateLimitHeaders(authResult.apiKey._id, authResult.apiKey.rateLimit) }
    );
  }

  // Determine completedAt date if applicable
  const completedAt =
    verification.completedAt ||
    verification.courtRecordCompletedAt ||
    verification.safliiCourtCompletedAt ||
    verification.ukCourtCompletedAt ||
    verification.malaysiaCourtCompletedAt ||
    verification.philippinesCourtCompletedAt ||
    verification.singaporeCourtCompletedAt ||
    verification.passportCompletedAt ||
    verification.sapsWantedCompletedAt ||
    verification.interpolCompletedAt ||
    verification.rednoticeWorldwideCompletedAt ||
    (verification.status === "Completed" || verification.status === "Verified" ? (verification.completedAt || verification.date) : null);

  const responseData = {
    success: true,
    requestId: verification.id,
    candidateName: verification.name,
    type: verification.type || "identity",
    status: verification.status,
    notes: verification.notes || "",
    createdAt: verification.createdAt || verification.date,
    completedAt,
    progress: {
      subStatus:
        verification.courtRecordStatus ||
        verification.safliiCourtStatus ||
        verification.ukCourtStatus ||
        verification.malaysiaCourtStatus ||
        verification.philippinesCourtStatus ||
        verification.singaporeCourtStatus ||
        verification.sapsWantedStatus ||
        verification.passportStatus ||
        verification.status,
      onboardingStatus: verification.onboardingStatus,
      candidateSetupUrl: verification.setupUrl,
    },
  };

  // Log status check usage (cost = 0 for read/poll)
  logApiUsage(db, {
    orgId: authResult.org.id,
    orgName: authResult.org.name,
    apiKeyId: authResult.apiKey._id,
    keySuffix: authResult.apiKey.keySuffix,
    endpoint: req.nextUrl.pathname,
    checkType: verification.type || "status_check",
    method: "GET",
    statusCode: 200,
    cost: 0,
    currency: authResult.org.currency || "USD",
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown",
    requestId,
    timestamp: new Date(),
    responseTimeMs: Date.now() - startTime,
  }).catch(() => {});

  return NextResponse.json(responseData, {
    status: 200,
    headers: rateLimitHeaders(authResult.apiKey._id, authResult.apiKey.rateLimit),
  });
}
