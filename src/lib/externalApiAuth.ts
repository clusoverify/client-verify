/**
 * External API Authentication Middleware
 * 
 * Authenticates requests using API keys (Authorization: Bearer sk_live_xxx)
 * instead of session cookies. This is the gatekeeper for all /api/v1/external/* routes.
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "./mongodb";
import { hashApiKey, extractBearerToken, validateKeyFormat } from "shared/apiKeys";

// ─── Types ───────────────────────────────────────────────────────

export interface ApiAuthResult {
  org: {
    id: string;
    name: string;
    currency?: string;
    status?: string;
    // Per-service rates
    monthlyRate: number;
    identityRate?: number;
    courtRecordRate?: number;
    employmentRate?: number;
    educationRate?: number;
    interpolRate?: number;
    passportRate?: number;
    rednoticeWorldwideRate?: number;
    digitalAddressRate?: number;
    safliiCourtRate?: number;
    sapsWantedRate?: number;
    ukCourtRate?: number;
    malaysiaCourtRate?: number;
    singaporeCourtRate?: number;
    philippinesCourtRate?: number;
    // Per-service enabled flags
    identityEnabled?: boolean;
    courtRecordEnabled?: boolean;
    employmentEnabled?: boolean;
    educationEnabled?: boolean;
    interpolEnabled?: boolean;
    passportEnabled?: boolean;
    rednoticeWorldwideEnabled?: boolean;
    digitalAddressEnabled?: boolean;
    safliiCourtEnabled?: boolean;
    sapsWantedEnabled?: boolean;
    ukCourtEnabled?: boolean;
    malaysiaCourtEnabled?: boolean;
    singaporeCourtEnabled?: boolean;
    philippinesCourtEnabled?: boolean;
    apiEnabled?: boolean;
  };
  apiKey: {
    _id: string;
    keyPrefix: string;
    keySuffix: string;
    orgId: string;
    orgName: string;
    permissions: string[];
    rateLimit: number;
  };
}

// ─── Rate Mapping ────────────────────────────────────────────────

/** Map check type to the org field that holds its rate */
const CHECK_TYPE_RATE_MAP: Record<string, string> = {
  identity: "monthlyRate",
  court_record: "courtRecordRate",
  employment: "employmentRate",
  education: "educationRate",
  interpol: "interpolRate",
  passport: "passportRate",
  rednotice_worldwide: "rednoticeWorldwideRate",
  digital_address: "digitalAddressRate",
  saflii_court: "safliiCourtRate",
  saps_wanted: "sapsWantedRate",
  uk_court: "ukCourtRate",
  malaysia_court: "malaysiaCourtRate",
  singapore_court: "singaporeCourtRate",
  philippines_court: "philippinesCourtRate",
};

/** Map check type to the org field that holds its enabled flag */
const CHECK_TYPE_ENABLED_MAP: Record<string, string> = {
  identity: "identityEnabled",
  court_record: "courtRecordEnabled",
  employment: "employmentEnabled",
  education: "educationEnabled",
  interpol: "interpolEnabled",
  passport: "passportEnabled",
  rednotice_worldwide: "rednoticeWorldwideEnabled",
  digital_address: "digitalAddressEnabled",
  saflii_court: "safliiCourtEnabled",
  saps_wanted: "sapsWantedEnabled",
  uk_court: "ukCourtEnabled",
  malaysia_court: "malaysiaCourtEnabled",
  singapore_court: "singaporeCourtEnabled",
  philippines_court: "philippinesCourtEnabled",
};

// ─── Auth Functions ──────────────────────────────────────────────

/**
 * Authenticate an API request using the Authorization header.
 * Returns the org and API key details, or an error NextResponse.
 */
export async function authenticateApiKey(
  req: NextRequest
): Promise<ApiAuthResult | NextResponse> {
  // 1. Extract bearer token
  const authHeader = req.headers.get("authorization");
  const token = extractBearerToken(authHeader);

  if (!token) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header. Use: Authorization: Bearer sk_live_xxx" },
      { status: 401 }
    );
  }

  // 2. Validate format
  if (!validateKeyFormat(token)) {
    return NextResponse.json(
      { error: "Invalid API key format. Keys must start with 'sk_live_' followed by 32 hex characters." },
      { status: 401 }
    );
  }

  // 3. Hash and look up
  const keyHash = hashApiKey(token);
  const { db } = await connectToDatabase();

  const apiKey = await db.collection("api_keys").findOne({
    keyHash,
    status: "active",
  });

  if (!apiKey) {
    return NextResponse.json(
      { error: "Invalid or revoked API key." },
      { status: 401 }
    );
  }

  // 4. Load the organisation
  const org = await db.collection("organisations").findOne({
    $or: [{ id: apiKey.orgId }, { name: apiKey.orgName }],
    isDeleted: { $ne: true },
  });

  if (!org) {
    return NextResponse.json(
      { error: "Organisation associated with this API key no longer exists." },
      { status: 403 }
    );
  }

  // 5. Check org is active and API access is enabled
  if (org.status === "Deactivated") {
    return NextResponse.json(
      { error: "Organisation is deactivated. Contact your administrator." },
      { status: 403 }
    );
  }

  if (org.apiEnabled === false) {
    return NextResponse.json(
      { error: "API access is disabled for this organisation. Contact your administrator." },
      { status: 403 }
    );
  }

  // 6. Update lastUsedAt (fire-and-forget — don't block the response)
  db.collection("api_keys").updateOne(
    { _id: apiKey._id },
    { $set: { lastUsedAt: new Date() } }
  ).catch(() => {});

  return {
    org: {
      id: org.id || org._id.toString(),
      name: org.name,
      currency: org.currency,
      status: org.status,
      monthlyRate: org.monthlyRate || 0,
      identityRate: org.identityRate,
      courtRecordRate: org.courtRecordRate,
      employmentRate: org.employmentRate,
      educationRate: org.educationRate,
      interpolRate: org.interpolRate,
      passportRate: org.passportRate,
      rednoticeWorldwideRate: org.rednoticeWorldwideRate,
      digitalAddressRate: org.digitalAddressRate,
      safliiCourtRate: org.safliiCourtRate,
      sapsWantedRate: org.sapsWantedRate,
      ukCourtRate: org.ukCourtRate,
      malaysiaCourtRate: org.malaysiaCourtRate,
      singaporeCourtRate: org.singaporeCourtRate,
      philippinesCourtRate: org.philippinesCourtRate,
      identityEnabled: org.identityEnabled,
      courtRecordEnabled: org.courtRecordEnabled,
      employmentEnabled: org.employmentEnabled,
      educationEnabled: org.educationEnabled,
      interpolEnabled: org.interpolEnabled,
      passportEnabled: org.passportEnabled,
      rednoticeWorldwideEnabled: org.rednoticeWorldwideEnabled,
      digitalAddressEnabled: org.digitalAddressEnabled,
      safliiCourtEnabled: org.safliiCourtEnabled,
      sapsWantedEnabled: org.sapsWantedEnabled,
      ukCourtEnabled: org.ukCourtEnabled,
      malaysiaCourtEnabled: org.malaysiaCourtEnabled,
      singaporeCourtEnabled: org.singaporeCourtEnabled,
      philippinesCourtEnabled: org.philippinesCourtEnabled,
      apiEnabled: org.apiEnabled !== false,
    },
    apiKey: {
      _id: apiKey._id.toString(),
      keyPrefix: apiKey.keyPrefix || "sk_live_",
      keySuffix: apiKey.keySuffix || "????",
      orgId: apiKey.orgId,
      orgName: apiKey.orgName,
      permissions: apiKey.permissions || [],
      rateLimit: apiKey.rateLimit || 100,
    },
  };
}

/**
 * Check if the API key has permission for a specific check type.
 * An empty permissions array means "all permitted".
 */
export function requireApiPermission(
  apiKey: ApiAuthResult["apiKey"],
  org: ApiAuthResult["org"],
  checkType: string
): NextResponse | null {
  // Check if permissions array restricts access (unless it contains "*" or is empty)
  if (
    apiKey.permissions.length > 0 &&
    !apiKey.permissions.includes("*") &&
    !apiKey.permissions.includes(checkType)
  ) {
    return NextResponse.json(
      { error: `API key does not have permission for '${checkType}' checks. Allowed: [${apiKey.permissions.join(", ")}]` },
      { status: 403 }
    );
  }

  // Check if service is enabled for the org
  const enabledField = CHECK_TYPE_ENABLED_MAP[checkType];
  if (enabledField && (org as any)[enabledField] === false) {
    return NextResponse.json(
      { error: `Service '${checkType}' is not enabled for your organisation. Contact your administrator.` },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Get the per-verification rate for a check type from the org's configuration.
 */
export function getCheckTypeRate(org: ApiAuthResult["org"], checkType: string): number {
  const rateField = CHECK_TYPE_RATE_MAP[checkType];
  if (!rateField) return org.monthlyRate || 0;
  const specificRate = (org as any)[rateField];
  return specificRate !== undefined ? specificRate : (org.monthlyRate || 0);
}

/**
 * Helper to check if an authenticateApiKey result is an error response.
 */
export function isApiAuthError(result: ApiAuthResult | NextResponse): result is NextResponse {
  if (!result) return true;
  return !("org" in result) || !("apiKey" in result);
}
