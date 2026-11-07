/**
 * External API: Philippines Court of Appeals Records Check
 * POST /api/v1/external/verify/philippines-court
 */

import { NextRequest } from "next/server";
import { processExternalApiRequest, generateVerificationId, formatDateForVerification } from "src/lib/externalApiHelpers";

export async function POST(req: NextRequest) {
  return processExternalApiRequest(req, "philippines_court", async (db, auth, body) => {
    const {
      candidateName,
      candidateDob,
      caseNo,
      station,
      requestingOrgName,
      candidateFatherName,
      candidateMotherName,
      candidateIsMarried,
      candidateHusbandName,
      gender,
      idProofType,
      idProofNumber,
      addresses
    } = body;

    if (!candidateName?.trim()) {
      return { data: { error: "candidateName is required" }, statusCode: 400 };
    }

    const orgName = auth.org.name;
    const finalId = await generateVerificationId(db, "PHC");

    await db.collection("verifications").insertOne({
      id: finalId,
      name: candidateName.trim(),
      email: "",
      orgName,
      requestingOrgName: requestingOrgName?.trim() || orgName,
      date: formatDateForVerification(),
      status: "Processing",
      verifier: "System",
      notes: "Philippines Court of Appeals Check initiated via API. Searching CA Manila, CA Visayas, and CA Mindanao...",
      type: "philippines_court",
      candidateDob: candidateDob || "",
      caseNo: caseNo?.trim() || "",
      station: station || "all",
      candidateFatherName: candidateFatherName?.trim() || "",
      candidateMotherName: candidateMotherName?.trim() || "",
      candidateIsMarried: !!candidateIsMarried,
      candidateHusbandName: candidateIsMarried ? (candidateHusbandName?.trim() || "") : "",
      gender: gender || "",
      idProofType: idProofType || "",
      idProofNumber: idProofNumber?.trim() || "",
      addresses: addresses || [],
      philippinesCourtStatus: "searching",
      philippinesCourtHasRecords: false,
      philippinesCourtResults: [],
      philippinesCourtTotalResults: 0,
      philippinesCourtCompletedAt: null,
      source: "api",
      createdAt: new Date().toISOString(),
    });

    // Fire-and-forget: trigger Philippines Court search
    const baseUrl = req.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
    fetch(`${baseUrl}/api/philippines-court-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": process.env.NEXTAUTH_SECRET || "",
      },
      body: JSON.stringify({
        verificationId: finalId,
        candidateName: candidateName.trim(),
        caseNo: caseNo?.trim() || "",
        station: station || "all",
      }),
    }).catch((err) => {
      console.error(`[PHILIPPINES_COURT_API] Failed to trigger search for ${finalId}:`, err.message);
    });

    return {
      data: {
        success: true,
        requestId: finalId,
        status: "processing",
        message: "Philippines Court of Appeals check initiated. Results will be available via the status endpoint.",
      },
    };
  });
}
