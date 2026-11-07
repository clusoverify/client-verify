/**
 * External API: Singapore Court Records Check
 * POST /api/v1/external/verify/singapore-court
 */

import { NextRequest } from "next/server";
import { processExternalApiRequest, generateVerificationId, formatDateForVerification } from "src/lib/externalApiHelpers";

export async function POST(req: NextRequest) {
  return processExternalApiRequest(req, "singapore_court", async (db, auth, body) => {
    const {
      candidateName,
      candidateDob,
      court,
      hearingType,
      startDate,
      endDate,
      judgeName,
      lawFirm,
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
    const finalId = await generateVerificationId(db, "SGC");

    await db.collection("verifications").insertOne({
      id: finalId,
      name: candidateName.trim(),
      email: "",
      orgName,
      requestingOrgName: requestingOrgName?.trim() || orgName,
      date: formatDateForVerification(),
      status: "Processing",
      verifier: "System",
      notes: "Singapore Court Check initiated via API. Searching Supreme Court, State Courts & Family Justice Courts...",
      type: "singapore_court",
      candidateDob: candidateDob || "",
      court: court?.trim() || "",
      hearingType: hearingType?.trim() || "",
      startDate: startDate || "",
      endDate: endDate || "",
      judgeName: judgeName?.trim() || "",
      lawFirm: lawFirm?.trim() || "",
      candidateFatherName: candidateFatherName?.trim() || "",
      candidateMotherName: candidateMotherName?.trim() || "",
      candidateIsMarried: !!candidateIsMarried,
      candidateHusbandName: candidateIsMarried ? (candidateHusbandName?.trim() || "") : "",
      gender: gender || "",
      idProofType: idProofType || "",
      idProofNumber: idProofNumber?.trim() || "",
      addresses: addresses || [],
      singaporeCourtStatus: "searching",
      singaporeCourtHasRecords: false,
      singaporeCourtResults: [],
      singaporeCourtTotalResults: 0,
      singaporeCourtTotalAvailable: 0,
      singaporeCourtCompletedAt: null,
      source: "api",
      createdAt: new Date().toISOString(),
    });

    // Fire-and-forget: trigger Singapore Court search
    const baseUrl = req.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
    fetch(`${baseUrl}/api/singapore-court-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": process.env.NEXTAUTH_SECRET || "",
      },
      body: JSON.stringify({
        verificationId: finalId,
        candidateName: candidateName.trim(),
        court: court?.trim() || "",
        hearingType: hearingType?.trim() || "",
        startDate: startDate || "",
        endDate: endDate || "",
        judgeName: judgeName?.trim() || "",
        lawFirm: lawFirm?.trim() || "",
      }),
    }).catch((err) => {
      console.error(`[SINGAPORE_COURT_API] Failed to trigger search for ${finalId}:`, err.message);
    });

    return {
      data: {
        success: true,
        requestId: finalId,
        status: "processing",
        message: "Singapore Court check initiated. Results will be available via the status endpoint.",
      },
    };
  });
}
