import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { decryptOrPassthrough, maskAadhaar, maskPan, maskDl } from "shared/encryption";
import { connectToDatabase } from "./mongodb";

// ─── Types ───────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  role: "client" | "admin" | "candidate";
  orgName: string;
  fullName: string;
}

interface AuthResult {
  session: any;
  user: SessionUser;
}

// ─── Guards ──────────────────────────────────────────────────────

/**
 * Require an authenticated session. Returns 401 if not authenticated.
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    console.warn("[AUTH] Unauthenticated request to protected API route");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await connectToDatabase();
  const email = (session.user.email || "").toLowerCase().trim();
  const dbUser = await db.collection("users").findOne({
    email,
    isDeleted: { $ne: true }
  });

  if (!dbUser) {
    console.warn(`[AUTH] Authenticated user ${email} not found or is soft-deleted`);
    return NextResponse.json({ error: "Unauthorized: User account has been deactivated or deleted." }, { status: 401 });
  }

  if (dbUser.role === "client") {
    const org = await db.collection("organisations").findOne({
      name: dbUser.orgName,
      isDeleted: { $ne: true }
    });
    if (!org) {
      console.warn(`[AUTH] Client user ${email}'s organisation "${dbUser.orgName}" is deleted`);
      return NextResponse.json({ error: "Unauthorized: Your organisation has been deleted." }, { status: 401 });
    }
    if (org.status === "Deactivated") {
      console.warn(`[AUTH] Client user ${email}'s organisation "${dbUser.orgName}" is deactivated`);
      return NextResponse.json({ error: "Unauthorized: Your organisation has been deactivated." }, { status: 401 });
    }
  }

  const user: SessionUser = {
    id: dbUser._id.toString(),
    email: dbUser.email,
    role: dbUser.role,
    orgName: dbUser.orgName || "",
    fullName: dbUser.fullName || "",
  };
  return { session, user };
}

/**
 * Require that the authenticated user has one of the allowed roles.
 * Returns 403 if the role does not match.
 */
export function requireRole(
  user: SessionUser,
  allowedRoles: string[]
): NextResponse | null {
  if (!allowedRoles.includes(user.role)) {
    console.warn(
      `[AUTH] Forbidden: user ${user.email} with role "${user.role}" attempted access requiring roles [${allowedRoles.join(", ")}]`
    );
    return NextResponse.json(
      { error: "Forbidden: insufficient permissions" },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Extract the orgName from the authenticated session user.
 * Used for tenant-scoped MongoDB queries in the client portal.
 */
export function getOrgName(user: SessionUser): string {
  return user.orgName || "";
}

// ─── Response Sanitization ───────────────────────────────────────

/** Fields to strip from verification records before returning to the client */
const VERIFICATION_SENSITIVE_FIELDS = [
  "tempPassword",
  "password",
] as const;

/** Fields to strip from invoice records */
const INVOICE_SENSITIVE_FIELDS = [
  "password",
] as const;

/**
 * Strip sensitive fields from a verification document.
 * Always removes tempPassword, password, and MongoDB _id internals.
 */
export function sanitizeVerification(doc: any): any {
  if (!doc) return doc;
  const clean = { ...doc };

  // Generate setupUrl on-the-fly if missing but email and tempPassword exist
  if (!clean.setupUrl && clean.tempPassword && clean.email) {
    const candidatePortalUrl = process.env.CANDIDATE_PORTAL_URL || "https://candidate.verify.cluso.in";
    clean.setupUrl = `${candidatePortalUrl}/?email=${encodeURIComponent(clean.email.toLowerCase().trim())}&password=${encodeURIComponent(clean.tempPassword)}`;
  }

  for (const field of VERIFICATION_SENSITIVE_FIELDS) {
    delete clean[field];
  }

  // Strip large blobs from list responses
  if (clean.digilockerPhoto) {
    clean.hasPhoto = true;
    delete clean.digilockerPhoto;
  }
  if (clean.digilockerDocuments && Array.isArray(clean.digilockerDocuments)) {
    clean.documentCount = clean.digilockerDocuments.length;
    delete clean.digilockerDocuments;
  }

  // Mask sensitive fields for safe list view
  if (clean.digilockerAadhaarMasked) {
    clean.digilockerAadhaar = clean.digilockerAadhaarMasked;
  } else if (clean.digilockerAadhaar) {
    clean.digilockerAadhaar = maskAadhaar(decryptOrPassthrough(clean.digilockerAadhaar));
  }

  if (clean.digilockerPanMasked) {
    clean.digilockerPan = clean.digilockerPanMasked;
  } else if (clean.digilockerPan) {
    clean.digilockerPan = maskPan(decryptOrPassthrough(clean.digilockerPan));
  }

  if (clean.digilockerDrivingLicenceMasked) {
    clean.digilockerDrivingLicence = clean.digilockerDrivingLicenceMasked;
  } else if (clean.digilockerDrivingLicence) {
    clean.digilockerDrivingLicence = maskDl(decryptOrPassthrough(clean.digilockerDrivingLicence));
  }

  if (clean.digilockerDob) {
    clean.digilockerDob = "Matched & Secured";
  }
  if (clean.digilockerId) {
    clean.digilockerId = "[Secured]";
  }
  if (clean.digilockerReferenceKey) {
    clean.digilockerReferenceKey = "[Secured]";
  }

  // Manual candidate inputs
  if (clean.aadhaarNumberMasked) {
    clean.aadhaarNumber = clean.aadhaarNumberMasked;
  } else if (clean.aadhaarNumber) {
    clean.aadhaarNumber = maskAadhaar(decryptOrPassthrough(clean.aadhaarNumber));
  }
  if (clean.dob) {
    clean.dob = "Secured";
  }

  // Convert _id to string if present
  if (clean._id) {
    clean._id = clean._id.toString ? clean._id.toString() : String(clean._id);
  }
  return clean;
}

/**
 * Strip sensitive fields from an invoice document.
 * Also strips large paymentProof base64 from list responses.
 */
export function sanitizeInvoice(doc: any): any {
  if (!doc) return doc;
  const clean = { ...doc };
  for (const field of INVOICE_SENSITIVE_FIELDS) {
    delete clean[field];
  }
  // Strip large base64 paymentProof from list responses
  if (clean.paymentProof) {
    clean.hasPaymentProof = true;
    delete clean.paymentProof;
  }
  if (clean._id) {
    clean._id = clean._id.toString ? clean._id.toString() : String(clean._id);
  }
  return clean;
}

/**
 * Strip sensitive fields from a verifier document.
 */
export function sanitizeVerifier(doc: any): any {
  if (!doc) return doc;
  const clean = { ...doc };
  delete clean.password;
  if (clean._id) {
    clean._id = clean._id.toString ? clean._id.toString() : String(clean._id);
  }
  return clean;
}

/**
 * Helper to check if a requireAuth/requireRole result is an error response.
 */
export function isErrorResponse(result: any): result is NextResponse {
  return result instanceof NextResponse;
}
