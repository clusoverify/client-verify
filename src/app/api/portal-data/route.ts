import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  requireRole,
  getOrgName,
  isErrorResponse,
  sanitizeVerification,
  sanitizeInvoice,
  sanitizeVerifier,
} from "src/lib/apiAuth";
import { connectToDatabase } from "src/lib/mongodb";
import { getClientIp, getUserAgent, logAuditEvent } from "shared/audit";

export async function GET(req: NextRequest) {
  try {
    // ── Auth: require authenticated client session ──
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { user } = authResult;

    const roleError = requireRole(user, ["client"]);
    if (roleError) return roleError;

    const orgName = getOrgName(user);
    if (!orgName) {
      console.warn(`[DATA] Client user ${user.email} has no orgName in session`);
      return NextResponse.json({ error: "No organisation associated with your account" }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    // ── Tenant-scoped queries — NEVER return all records ──
    // Settings: find by orgName (companyName field) 
    const settings = await db.collection("settings").findOne(
      { companyName: orgName },
      { projection: { password: 0 } }
    );

    // Verifications: only records belonging to this client's organisation and not soft-deleted
    const verifications = await db.collection("verifications").find(
      { orgName, isDeleted: { $ne: true } },
      { projection: { password: 0 } }
    ).toArray();

    // Invoices: only invoices for this client's organisation and not soft-deleted
    const invoices = await db.collection("invoices").find(
      { orgName, isDeleted: { $ne: true } },
      { projection: { password: 0 } }
    ).toArray();

    // Verifiers: return all verifiers not soft-deleted
    const verifiers = await db.collection("verifiers").find(
      { isDeleted: { $ne: true } },
      { projection: { password: 0 } }
    ).toArray();

    // Organisation: only this client's own organisation and not soft-deleted
    const organisation = await db.collection("organisations").findOne(
      {
        name: { $regex: new RegExp("^" + orgName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
        isDeleted: { $ne: true }
      },
      { projection: { password: 0 } }
    );

    // ── Sanitize responses ──
    const cleanSettings = settings
      ? { ...settings, _id: settings._id.toString() }
      : {
          id: orgName.replace(/\s+/g, "").toLowerCase(),
          companyName: orgName,
          address: "",
          city: "",
          postalCode: "",
          contactFirstName: "",
          contactLastName: "",
          contactEmail: user.email || "",
          billingOption: "invoice",
          cin: "",
          lut: "",
          tin: ""
        };

    const cleanVerifications = verifications.map(sanitizeVerification);
    const cleanInvoices = invoices.map(sanitizeInvoice);
    const cleanVerifiers = verifiers.map(sanitizeVerifier);

    return NextResponse.json({
      settings: cleanSettings,
      verifications: cleanVerifications,
      invoices: cleanInvoices,
      verifiers: cleanVerifiers,
      organisation: organisation ? { ...organisation, _id: organisation._id.toString() } : null
    });
  } catch (error: any) {
    console.error("[DATA] Client portal GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth: require authenticated client session ──
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { user } = authResult;

    const roleError = requireRole(user, ["client"]);
    if (roleError) return roleError;

    const sessionOrgName = getOrgName(user);

    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    switch (action) {
      case "addVerification": {
        const { id, name, email, orgName, date, status, verifier, notes } = payload;

        // Security: force orgName to the session user's org (prevent cross-tenant creation),
        // unless it's an administrator session (Cluso/Admin).
        const isAdminSession = sessionOrgName?.toLowerCase() === "cluso" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? orgName : (sessionOrgName || orgName);
        
        const { randomBytes } = await import("crypto");
        const bcrypt = await import("bcryptjs");

        // Generate a temporary password matching Cluso@<random8chars>
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randStr = "";
        const randomBytesArr = randomBytes(8);
        for (let i = 0; i < 8; i++) {
          randStr += charset.charAt(randomBytesArr[i] % charset.length);
        }
        const tempPassword = `Cluso@${randStr}`;
        const hashedTempPassword = bcrypt.hashSync(tempPassword, 10);
        
        const existingUser = await db.collection("users").findOne({ email: email.toLowerCase().trim() });
        if (!existingUser) {
          await db.collection("users").insertOne({
            email: email.toLowerCase().trim(),
            password: hashedTempPassword,
            fullName: name,
            role: "candidate",
            orgName: safeOrgName,
            createdAt: new Date()
          });
        } else {
          await db.collection("users").updateOne(
            { email: email.toLowerCase().trim() },
            { $set: { password: hashedTempPassword, role: "candidate", fullName: name } }
          );
        }

        const initialAttempt = {
          date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase(),
          verifier: verifier || "Client Init",
          status: status || "Processing",
          notes: notes || "Verification request created by client."
        };

        // Build the direct login URL (with email and password query parameters)
        const candidatePortalUrl = process.env.CANDIDATE_PORTAL_URL || "https://candidate.verify.cluso.in";
        const setupUrl = `${candidatePortalUrl}/?email=${encodeURIComponent(email.toLowerCase().trim())}&password=${encodeURIComponent(tempPassword)}`;

        await db.collection("verifications").insertOne({
          id,
          name,
          email: email.toLowerCase().trim(),
          orgName: safeOrgName,
          date,
          status,
          verifier,
          notes,
          onboardingStatus: "active",
          tempPassword,
          attempts: [initialAttempt],
          setupUrl
        });

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "verification_created",
          targetType: "verification",
          targetId: id,
          ip,
          userAgent,
          outcome: "success"
        });

        return NextResponse.json({ success: true, setupUrl });
      }
      case "updateSettings": {
        const { companyName, address, city, postalCode, contactFirstName, contactLastName, contactEmail, billingOption, cin, lut, tin } = payload;
        // Security: always scope settings update to the session user's org
        await db.collection("settings").updateOne(
          { companyName: sessionOrgName },
          {
            $set: {
              companyName: sessionOrgName,
              address, city, postalCode, contactFirstName, contactLastName, contactEmail, billingOption, cin, lut, tin
            }
          },
          { upsert: true }
        );
        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "settings_updated",
          targetType: "settings",
          targetId: sessionOrgName,
          ip,
          userAgent,
          outcome: "success"
        });
        break;
      }
      case "inviteVerifier": {
        const { id, name, email, org, status, password } = payload;
        await db.collection("verifiers").insertOne({
          id, name, email, org, status
        });
        
        if (password) {
          const bcrypt = await import("bcryptjs");
          const hashedPassword = bcrypt.hashSync(password, 10);
          
          const existingUser = await db.collection("users").findOne({ email: email.toLowerCase().trim() });
          if (!existingUser) {
            await db.collection("users").insertOne({
              email: email.toLowerCase().trim(),
              password: hashedPassword,
              fullName: name,
              role: "client",
              orgName: org,
              createdAt: new Date()
            });
          }
        }
        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "verifier_invited",
          targetType: "verifier",
          targetId: id,
          ip,
          userAgent,
          outcome: "success"
        });
        break;
      }
      case "updateInvoiceStatus": {
        const { id, status, paymentProof, paymentProofDate } = payload;
        // Security: only update invoice if it belongs to this org
        const existingInvoice = await db.collection("invoices").findOne({ id, orgName: sessionOrgName });
        if (!existingInvoice) {
          console.warn(`[AUTH] Client ${user.email} attempted to update invoice ${id} not belonging to org ${sessionOrgName}`);
          return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }
        const updateFields: any = { status };
        if (paymentProof !== undefined) updateFields.paymentProof = paymentProof;
        if (paymentProofDate !== undefined) updateFields.paymentProofDate = paymentProofDate;
        await db.collection("invoices").updateOne(
          { id, orgName: sessionOrgName },
          { $set: updateFields }
        );
        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "invoice_updated",
          targetType: "invoice",
          targetId: id,
          ip,
          userAgent,
          outcome: "success",
          metadata: { status }
        });
        break;
      }
      case "submitPaymentProof": {
        const { id, paymentProof, paymentProofDate } = payload;
        // Security: only update invoice if it belongs to this org
        const existingInvoice = await db.collection("invoices").findOne({ id, orgName: sessionOrgName });
        if (!existingInvoice) {
          console.warn(`[AUTH] Client ${user.email} attempted to submit proof for invoice ${id} not belonging to org ${sessionOrgName}`);
          return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }
        await db.collection("invoices").updateOne(
          { id, orgName: sessionOrgName },
          { $set: { status: "Pending", paymentProof, paymentProofDate } }
        );
        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "payment_proof_submitted",
          targetType: "invoice",
          targetId: id,
          ip,
          userAgent,
          outcome: "success"
        });
        break;
      }
      case "addInvoice": {
        const { id, orgName, date, dueDate, amount, status } = payload;
        // Security: force orgName to session org
        await db.collection("invoices").insertOne({
          id, orgName: sessionOrgName || orgName, date, dueDate, amount, status
        });
        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "invoice_created",
          targetType: "invoice",
          targetId: id,
          ip,
          userAgent,
          outcome: "success"
        });
        break;
      }
      case "assignVerifier": {
        const { verificationId, verifierName } = payload;
        // Security: only update verification if it belongs to this org
        const existingVerification = await db.collection("verifications").findOne({ id: verificationId, orgName: sessionOrgName });
        if (!existingVerification) {
          console.warn(`[AUTH] Client ${user.email} attempted to assign verifier to ${verificationId} not belonging to org ${sessionOrgName}`);
          return NextResponse.json({ error: "Verification not found" }, { status: 404 });
        }
        await db.collection("verifications").updateOne(
          { id: verificationId, orgName: sessionOrgName },
          { $set: { verifier: verifierName } }
        );
        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "verifier_assigned",
          targetType: "verification",
          targetId: verificationId,
          ip,
          userAgent,
          outcome: "success",
          metadata: { verifierName }
        });
        break;
      }
      case "updateVerificationStatus": {
        const { verificationId, status, notes, reportDetails } = payload;
        // Security: only update verification if it belongs to this org
        const existingVerification = await db.collection("verifications").findOne({ id: verificationId, orgName: sessionOrgName });
        if (!existingVerification) {
          console.warn(`[AUTH] Client ${user.email} attempted to update status of ${verificationId} not belonging to org ${sessionOrgName}`);
          return NextResponse.json({ error: "Verification not found" }, { status: 404 });
        }
        const updateDoc: any = { status };
        if (notes !== undefined) {
          updateDoc.notes = notes;
        }
        if (reportDetails !== undefined) {
          updateDoc.reportDetails = reportDetails;
        }
        await db.collection("verifications").updateOne(
          { id: verificationId, orgName: sessionOrgName },
          { $set: updateDoc }
        );
        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "verification_status_changed",
          targetType: "verification",
          targetId: verificationId,
          ip,
          userAgent,
          outcome: "success",
          metadata: { status }
        });
        break;
      }
      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DATA] Client portal POST error:", error.message);
    return NextResponse.json({ error: "Mutation failed" }, { status: 500 });
  }
}
