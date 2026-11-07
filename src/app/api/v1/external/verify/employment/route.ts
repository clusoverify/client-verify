/**
 * External API: Employment Verification
 * POST /api/v1/external/verify/employment
 */

import { NextRequest } from "next/server";
import { processExternalApiRequest, generateVerificationId, orgPrefix, formatDateForVerification } from "src/lib/externalApiHelpers";
import { getCandidatePortalUrl } from "src/lib/apiAuth";

export async function POST(req: NextRequest) {
  return processExternalApiRequest(req, "employment", async (db, auth, body) => {
    const { candidateName, candidateEmail, candidateMobile, employments, skipCandidateLogin, requestingOrgName } = body;

    if (!candidateName?.trim()) {
      return { data: { error: "candidateName is required" }, statusCode: 400 };
    }

    const orgName = auth.org.name;
    const prefix = orgPrefix(orgName);
    const finalId = await generateVerificationId(db, prefix);
    const email = (candidateEmail || "").toLowerCase().trim();

    const doc: any = {
      id: finalId,
      name: candidateName.trim(),
      email,
      mobile: candidateMobile || "",
      orgName,
      requestingOrgName: requestingOrgName?.trim() || orgName,
      date: formatDateForVerification(),
      status: "Processing",
      verifier: null,
      notes: "Employment verification created via API.",
      type: "employment",
      skipCandidateLogin: skipCandidateLogin ?? true, // API defaults to skip candidate login
      source: "api",
      createdAt: new Date().toISOString(),
    };

    // If employments array provided, embed directly (skip candidate self-fill)
    if (employments && Array.isArray(employments) && employments.length > 0) {
      doc.employments = employments;
      doc.pastOrganisations = employments;
      doc.itemCount = employments.length;
      doc.employmentDataSubmitted = true;
      doc.employmentDataSubmittedAt = new Date().toISOString();
    }

    // Create candidate user if email provided and not skipping
    if (email && !skipCandidateLogin) {
      const { randomBytes } = await import("crypto");
      const bcrypt = await import("bcryptjs");
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let randStr = "";
      const rb = randomBytes(8);
      for (let i = 0; i < 8; i++) randStr += charset.charAt(rb[i] % charset.length);
      const tempPassword = `Cluso@${randStr}`;
      const hashed = bcrypt.hashSync(tempPassword, 10);

      const existing = await db.collection("users").findOne({ email });
      if (!existing) {
        await db.collection("users").insertOne({ email, password: hashed, fullName: candidateName.trim(), role: "candidate", orgName, createdAt: new Date() });
      } else {
        await db.collection("users").updateOne({ email }, { $set: { password: hashed, role: "candidate", fullName: candidateName.trim() } });
      }

      const candidatePortalUrl = getCandidatePortalUrl();
      doc.setupUrl = `${candidatePortalUrl}/?email=${encodeURIComponent(email)}&password=${encodeURIComponent(tempPassword)}`;
      doc.tempPassword = tempPassword;
    }

    await db.collection("verifications").insertOne(doc);

    return {
      data: {
        success: true,
        requestId: finalId,
        status: "processing",
        candidateSetupUrl: doc.setupUrl || undefined,
        message: "Employment verification created successfully.",
      },
    };
  });
}
