import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, isErrorResponse } from "src/lib/apiAuth";
import { connectToDatabase } from "src/lib/mongodb";
import { decryptOrPassthrough } from "shared/encryption";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { user } = authResult;

    const roleError = requireRole(user, ["client", "org_owner"]);
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Verification ID is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const verification = await db.collection("verifications").findOne({ id });

    if (!verification) {
      return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
    }

    // Tenant Isolation: Client can only view verifications of their own organization
    if (verification.orgName.toLowerCase().trim() !== user.orgName.toLowerCase().trim()) {
      console.warn(`[AUTH] Tenant isolation breach attempt: user ${user.email} (${user.orgName}) tried to access verification ${id} belonging to ${verification.orgName}`);
      return NextResponse.json({ error: "Access Denied: Tenant Isolation Enforced" }, { status: 403 });
    }

    // Decrypt all encrypted PII fields for detail view
    const decrypted: any = { ...verification, _id: verification._id.toString() };

    // Generate setupUrl on-the-fly if missing but email and tempPassword exist
    if (!decrypted.setupUrl && decrypted.tempPassword && decrypted.email) {
      const candidatePortalUrl = process.env.CANDIDATE_PORTAL_URL || "https://candidate.verify.cluso.in";
      decrypted.setupUrl = `${candidatePortalUrl}/?email=${encodeURIComponent(decrypted.email.toLowerCase().trim())}&password=${encodeURIComponent(decrypted.tempPassword)}`;
    }
    delete decrypted.tempPassword;
    delete decrypted.password;
    
    if (decrypted.aadhaarNumber) {
      decrypted.aadhaarNumber = decryptOrPassthrough(decrypted.aadhaarNumber);
    }
    if (decrypted.dob) {
      decrypted.dob = decryptOrPassthrough(decrypted.dob);
    }
    
    if (decrypted.digilockerAadhaar) {
      decrypted.digilockerAadhaar = decryptOrPassthrough(decrypted.digilockerAadhaar);
    }
    if (decrypted.digilockerPan) {
      decrypted.digilockerPan = decryptOrPassthrough(decrypted.digilockerPan);
    }
    if (decrypted.digilockerDrivingLicence) {
      decrypted.digilockerDrivingLicence = decryptOrPassthrough(decrypted.digilockerDrivingLicence);
    }
    if (decrypted.digilockerDob) {
      decrypted.digilockerDob = decryptOrPassthrough(decrypted.digilockerDob);
    }
    if (decrypted.digilockerId) {
      decrypted.digilockerId = decryptOrPassthrough(decrypted.digilockerId);
    }
    if (decrypted.digilockerReferenceKey) {
      decrypted.digilockerReferenceKey = decryptOrPassthrough(decrypted.digilockerReferenceKey);
    }

    // Fetch company settings to get company contact info (address, city, contactEmail, etc.)
    const settings = await db.collection("settings").findOne({ companyName: verification.orgName }) || { companyName: verification.orgName };

    // Return full decrypted verification record and settings, force no-cache
    return new NextResponse(JSON.stringify({ verification: decrypted, settings }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    console.error("[DETAIL] Client verification detail error:", error.message);
    return NextResponse.json({ error: "Failed to fetch verification details" }, { status: 500 });
  }
}
