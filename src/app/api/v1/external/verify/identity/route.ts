/**
 * External API: Identity Verification
 * POST /api/v1/external/verify/identity
 * 
 * Creates an identity verification request via API key authentication.
 * Reuses the same logic as the portal's addVerification handler.
 */

import { NextRequest } from "next/server";
import { processExternalApiRequest, generateVerificationId, orgPrefix, formatDateForVerification } from "src/lib/externalApiHelpers";
import { getCandidatePortalUrl } from "src/lib/apiAuth";

export async function POST(req: NextRequest) {
  return processExternalApiRequest(req, "identity", async (db, auth, body) => {
    const { candidateName, candidateEmail, requestingOrgName } = body;

    // Validate required fields
    if (!candidateName?.trim()) {
      return { data: { error: "candidateName is required" }, statusCode: 400 };
    }
    if (!candidateEmail?.trim()) {
      return { data: { error: "candidateEmail is required" }, statusCode: 400 };
    }

    const orgName = auth.org.name;
    const prefix = orgPrefix(orgName);
    const finalId = await generateVerificationId(db, prefix);
    const email = candidateEmail.toLowerCase().trim();

    // Generate temporary password for candidate portal
    const { randomBytes } = await import("crypto");
    const bcrypt = await import("bcryptjs");

    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randStr = "";
    const randomBytesArr = randomBytes(8);
    for (let i = 0; i < 8; i++) {
      randStr += charset.charAt(randomBytesArr[i] % charset.length);
    }
    const tempPassword = `Cluso@${randStr}`;
    const hashedTempPassword = bcrypt.hashSync(tempPassword, 10);

    // Create or update candidate user
    const existingUser = await db.collection("users").findOne({ email });
    if (!existingUser) {
      await db.collection("users").insertOne({
        email,
        password: hashedTempPassword,
        fullName: candidateName.trim(),
        role: "candidate",
        orgName,
        createdAt: new Date(),
      });
    } else {
      await db.collection("users").updateOne(
        { email },
        { $set: { password: hashedTempPassword, role: "candidate", fullName: candidateName.trim() } }
      );
    }

    const candidatePortalUrl = getCandidatePortalUrl();
    const setupUrl = `${candidatePortalUrl}/?email=${encodeURIComponent(email)}&password=${encodeURIComponent(tempPassword)}`;

    const initialAttempt = {
      date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase(),
      verifier: "API",
      status: "Processing",
      notes: "Verification request created via External API.",
    };

    await db.collection("verifications").insertOne({
      id: finalId,
      name: candidateName.trim(),
      email,
      orgName,
      requestingOrgName: requestingOrgName?.trim() || orgName,
      date: formatDateForVerification(),
      status: "Processing",
      verifier: null,
      notes: "Created via External API",
      onboardingStatus: "active",
      tempPassword,
      attempts: [initialAttempt],
      setupUrl,
      source: "api",
      createdAt: new Date().toISOString(),
    });

    // Track requesting org name
    if (requestingOrgName?.trim()) {
      await db.collection("settings").updateOne(
        { companyName: orgName },
        { $addToSet: { recentRequestingOrgs: requestingOrgName.trim() } },
        { upsert: true }
      );
    }

    return {
      data: {
        success: true,
        requestId: finalId,
        status: "processing",
        candidateSetupUrl: setupUrl,
        message: "Identity verification request created successfully.",
      },
    };
  });
}
