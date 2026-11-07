/**
 * External API: Digital Address Verification
 * POST /api/v1/external/verify/digital-address
 */

import { NextRequest } from "next/server";
import { processExternalApiRequest, generateVerificationId, orgPrefix, formatDateForVerification } from "src/lib/externalApiHelpers";

export async function POST(req: NextRequest) {
  return processExternalApiRequest(req, "digital_address", async (db, auth, body) => {
    const { candidateName, candidateEmail, candidateAddress, requestingOrgName } = body;

    if (!candidateName?.trim() || !candidateEmail?.trim() || !candidateAddress?.trim()) {
      return { data: { error: "candidateName, candidateEmail, and candidateAddress are required" }, statusCode: 400 };
    }

    const orgName = auth.org.name;
    const finalId = await generateVerificationId(db, "DAV");
    const emailLower = candidateEmail.toLowerCase().trim();

    // Generate temporary password and candidate user
    const { randomBytes } = await import("crypto");
    const bcrypt = await import("bcryptjs");
    const { getCandidatePortalUrl } = await import("src/lib/apiAuth");

    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randStr = "";
    const randomBytesArr = randomBytes(8);
    for (let i = 0; i < 8; i++) {
      randStr += charset.charAt(randomBytesArr[i] % charset.length);
    }
    const tempPassword = `Cluso@${randStr}`;
    const hashedTempPassword = bcrypt.hashSync(tempPassword, 10);

    const existingUser = await db.collection("users").findOne({ email: emailLower });
    if (!existingUser) {
      await db.collection("users").insertOne({
        email: emailLower,
        password: hashedTempPassword,
        fullName: candidateName.trim(),
        role: "candidate",
        orgName,
        createdAt: new Date(),
      });
    } else {
      await db.collection("users").updateOne(
        { email: emailLower },
        { $set: { password: hashedTempPassword, role: "candidate", fullName: candidateName.trim() } }
      );
    }

    const candidatePortalUrl = getCandidatePortalUrl();
    const setupUrl = `${candidatePortalUrl}/?email=${encodeURIComponent(emailLower)}&password=${encodeURIComponent(tempPassword)}`;

    const initialAttempt = {
      date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase(),
      verifier: "API",
      status: "Processing",
      notes: "Digital address verification request created via API. Awaiting candidate photo submission.",
    };

    await db.collection("verifications").insertOne({
      id: finalId,
      name: candidateName.trim(),
      email: emailLower,
      orgName,
      requestingOrgName: requestingOrgName?.trim() || orgName,
      candidateAddress: candidateAddress.trim(),
      date: formatDateForVerification(),
      status: "Processing",
      verifier: null,
      notes: "Digital address verification request created via API. Awaiting candidate submission.",
      type: "digital_address",
      onboardingStatus: "active",
      tempPassword,
      attempts: [initialAttempt],
      setupUrl,
      digitalAddressSubmitted: false,
      source: "api",
      createdAt: new Date().toISOString(),
    });

    return {
      data: {
        success: true,
        requestId: finalId,
        status: "processing",
        candidateSetupUrl: setupUrl,
        message: "Digital address verification created successfully. Share the candidateSetupUrl with the candidate to complete verification.",
      },
    };
  });
}
