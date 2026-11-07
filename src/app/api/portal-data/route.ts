import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  requireRole,
  getOrgName,
  isErrorResponse,
  sanitizeVerification,
  sanitizeInvoice,
  sanitizeVerifier,
  getCandidatePortalUrl,
} from "src/lib/apiAuth";
import { connectToDatabase } from "src/lib/mongodb";
import { ObjectId } from "mongodb";
import { getClientIp, getUserAgent, logAuditEvent } from "shared/audit";
import { generateApiKey } from "shared/apiKeys";

export async function GET(req: NextRequest) {
  try {
    // ── Auth: require authenticated client session ──
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { user } = authResult;

    const roleError = requireRole(user, ["client", "org_owner"]);
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

    // Verifiers: return only verifiers belonging to this client's organisation and not soft-deleted
    const verifiers = await db.collection("verifiers").find(
      { org: orgName, isDeleted: { $ne: true } },
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

    // Suggestions / Grievances: for this client's organisation
    const suggestions = await db.collection("suggestions").find(
      { orgName, isDeleted: { $ne: true } }
    ).sort({ createdAt: -1 }).toArray();

    // ── Sanitize responses ──
    const ozcluSettings = await db.collection("settings").findOne(
      { id: "acme" },
      { projection: { password: 0 } }
    );

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
    const cleanVerifiers = verifiers.map(v => {
      const clean = sanitizeVerifier(v);
      return {
        ...clean,
        ratePerVerification: organisation ? (organisation.monthlyRate || 0) : (clean.ratePerVerification || 0) // Display rate (identity); billing uses per-service org rates
      };
    });
    const cleanSuggestions = suggestions.map(s => ({ ...s, _id: s._id.toString() }));

    // API keys belonging to this client's org (hashes omitted)
    const orgId = organisation?.id || organisation?._id?.toString() || orgName;
    const apiKeys = await db.collection("api_keys").find(
      {
        $or: [{ orgId }, { orgName }],
        isDeleted: { $ne: true }
      }
    ).sort({ createdAt: -1 }).toArray();

    const cleanApiKeys = apiKeys.map(k => ({
      _id: k._id.toString(),
      orgId: k.orgId,
      orgName: k.orgName,
      keySuffix: k.keySuffix,
      keyPrefix: k.keyPrefix || "sk_live_",
      permissions: k.permissions || ["*"],
      rateLimit: k.rateLimit || 100,
      status: k.status || "active",
      createdBy: k.createdBy || "",
      createdAt: k.createdAt || "",
      lastUsedAt: k.lastUsedAt || null,
      revokedAt: k.revokedAt || null,
    }));

    // Current month API usage summary for this org
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const usageLogs = await db.collection("api_usage_logs").find({
      $or: [{ orgId }, { orgName }],
      timestamp: { $gte: startOfMonth }
    }).sort({ timestamp: -1 }).toArray();

    const totalCalls = usageLogs.length;
    const totalCost = usageLogs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
    const successfulCalls = usageLogs.filter(l => (l.statusCode || 200) < 400).length;
    const failedCalls = totalCalls - successfulCalls;

    const breakdownMap: Record<string, { count: number; cost: number }> = {};
    for (const log of usageLogs) {
      const ct = log.checkType || "other";
      if (!breakdownMap[ct]) breakdownMap[ct] = { count: 0, cost: 0 };
      breakdownMap[ct].count++;
      breakdownMap[ct].cost += Number(log.cost) || 0;
    }

    const apiUsage = {
      totalCalls,
      successfulCalls,
      failedCalls,
      totalCost,
      currency: organisation?.currency || "USD",
      breakdown: breakdownMap,
      recentLogs: usageLogs.slice(0, 50).map(l => ({
        ...l,
        _id: l._id.toString(),
        timestamp: l.timestamp ? (l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp) : null,
      }))
    };

    return NextResponse.json({
      settings: cleanSettings,
      ozcluSettings: ozcluSettings ? { ...ozcluSettings, _id: ozcluSettings._id.toString() } : null,
      verifications: cleanVerifications,
      invoices: cleanInvoices,
      verifiers: cleanVerifiers,
      organisation: organisation ? { ...organisation, _id: organisation._id.toString() } : null,
      suggestions: cleanSuggestions,
      apiKeys: cleanApiKeys,
      apiUsage,
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

    const roleError = requireRole(user, ["client", "org_owner"]);
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
      case "submitSuggestion": {
        const { type, title, message, targetService } = payload || {};
        if (!title || !message) {
          return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
        }
        const count = await db.collection("suggestions").countDocuments({});
        const id = `REQ-${1000 + count + 1}`;
        const newSuggestion = {
          id,
          orgName: sessionOrgName,
          clientEmail: user.email,
          type: type || "suggestion",
          title,
          message,
          targetService: targetService || "General",
          status: "Pending",
          createdAt: new Date().toISOString(),
          isDeleted: false
        };
        await db.collection("suggestions").insertOne(newSuggestion);
        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "create_suggestion",
          targetType: "suggestion",
          targetId: id,
          metadata: { targetOrg: sessionOrgName },
          ip,
          userAgent,
          outcome: "success"
        });
        return NextResponse.json({ success: true, suggestion: newSuggestion });
      }
      case "addVerification": {
        const { name, email, orgName, requestingOrgName, date, status, verifier, notes } = payload;

        // Security: force orgName to the session user's org (prevent cross-tenant creation),
        // unless it's an administrator session (Ozclu/Admin).
        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? orgName : (sessionOrgName || orgName);
        
        const cleanOrg = safeOrgName.replace(/[^a-zA-Z]/g, "").slice(0, 3).padEnd(3, "X").toUpperCase();
        
        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `${cleanOrg}${dateStr}-`;
        
        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

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
        const candidatePortalUrl = getCandidatePortalUrl();
        const setupUrl = `${candidatePortalUrl}/?email=${encodeURIComponent(email.toLowerCase().trim())}&password=${encodeURIComponent(tempPassword)}`;
 
        await db.collection("verifications").insertOne({
          id: finalId,
          name,
          email: email.toLowerCase().trim(),
          orgName: safeOrgName,
          requestingOrgName: requestingOrgName || safeOrgName,
          date,
          status,
          verifier,
          notes,
          onboardingStatus: "active",
          tempPassword,
          attempts: [initialAttempt],
          setupUrl,
          source: "portal",
          createdAt: new Date().toISOString()
        });
 
        if (requestingOrgName && requestingOrgName.trim()) {
          const trimmedOrg = requestingOrgName.trim();
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: trimmedOrg } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });
 
        return NextResponse.json({ success: true, id: finalId, setupUrl });
      }
      case "removeRecentRequestingOrg": {
        const { requestingOrgName } = payload;
        await db.collection("settings").updateOne(
          { companyName: sessionOrgName },
          { $pull: { recentRequestingOrgs: requestingOrgName } }
        );
        return NextResponse.json({ success: true });
      }
      case "updateSettings": {
        const { companyName, address, city, postalCode, contactFirstName, contactLastName, contactEmail, billingOption, cin, lut, tin, gstin, invoiceEmail, billingSameAsCompany, billingAddress, logo } = payload;
        // Security: always scope settings update to the session user's org
        await db.collection("settings").updateOne(
          { companyName: sessionOrgName },
          {
            $set: {
              companyName: sessionOrgName,
              address, city, postalCode, contactFirstName, contactLastName, contactEmail, billingOption, cin, lut, tin, gstin, invoiceEmail, billingSameAsCompany, billingAddress, logo
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
        if (user.role !== "org_owner") {
          return NextResponse.json({ error: "Access denied. Only organisation owners can invite verifiers." }, { status: 403 });
        }

        const { id, name, email, org, status, password } = payload;
        
        // Force organization to session organisation for security
        const targetOrgName = sessionOrgName || org;

        // Count verifiers and check limit
        const organisation = await db.collection("organisations").findOne({
          name: targetOrgName,
          isDeleted: { $ne: true }
        });
        const maxV = organisation?.maxVerifiers ?? 5;
        const activeCount = await db.collection("verifiers").countDocuments({
          org: targetOrgName,
          status: "Active",
          isDeleted: { $ne: true }
        });

        if (activeCount >= maxV) {
          return NextResponse.json({ error: `Cannot invite verifier. Maximum active verifier limit of ${maxV} reached. Deactivate an existing verifier to free up a slot.` }, { status: 400 });
        }

        // ratePerVerification is display-only (identity rate); billing uses per-service org rates
        await db.collection("verifiers").insertOne({
          id, name, email, org: targetOrgName, status, createdBy: user.email, ratePerVerification: organisation?.monthlyRate || 0
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
              orgName: targetOrgName,
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
      case "updateVerifierStatus": {
        if (user.role !== "org_owner") {
          return NextResponse.json({ error: "Access denied. Only organisation owners can update verifier status." }, { status: 403 });
        }
        const { verifierId, status: newStatus } = payload;
        // Security: only update verifiers belonging to this org
        const verifierDoc = await db.collection("verifiers").findOne({ id: verifierId, org: sessionOrgName, isDeleted: { $ne: true } });
        if (!verifierDoc) {
          return NextResponse.json({ error: "Verifier not found or does not belong to your organisation." }, { status: 404 });
        }
        // Prevent deactivating yourself (the owner)
        if (verifierDoc.isOwner && newStatus === "Inactive") {
          return NextResponse.json({ error: "Cannot deactivate the organisation owner account." }, { status: 400 });
        }
        await db.collection("verifiers").updateOne(
          { id: verifierId },
          { $set: { status: newStatus } }
        );
        break;
      }
      case "updateInvoiceStatus": {
        const { id, _id, status, paymentProof, paymentProofDate } = payload;
        // Security: only update invoice if it belongs to this org
        const query: any = { orgName: sessionOrgName };
        if (_id) {
          query._id = new ObjectId(String(_id));
        } else {
          query.id = id;
        }

        const existingInvoice = await db.collection("invoices").findOne(query);
        if (!existingInvoice) {
          console.warn(`[AUTH] Client ${user.email} attempted to update invoice ${id || _id} not belonging to org ${sessionOrgName}`);
          return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }
        const updateFields: any = { status };
        if (paymentProof !== undefined) updateFields.paymentProof = paymentProof;
        if (paymentProofDate !== undefined) updateFields.paymentProofDate = paymentProofDate;
        await db.collection("invoices").updateOne(
          { _id: existingInvoice._id },
          { $set: updateFields }
        );
        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "invoice_updated",
          targetType: "invoice",
          targetId: existingInvoice.id,
          ip,
          userAgent,
          outcome: "success",
          metadata: { status }
        });
        break;
      }
      case "submitPaymentProof": {
        const { id, _id, paymentProof, paymentProofDate, clientNote, activityLog } = payload;
        // Security: only update invoice if it belongs to this org
        const query: any = { orgName: sessionOrgName };
        if (_id) {
          query._id = new ObjectId(String(_id));
        } else {
          query.id = id;
        }

        const existingInvoice = await db.collection("invoices").findOne(query);
        if (!existingInvoice) {
          console.warn(`[AUTH] Client ${user.email} attempted to submit proof for invoice ${id || _id} not belonging to org ${sessionOrgName}`);
          return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        const updateDoc: any = {
          status: "Pending",
          paymentProof,
          paymentProofDate,
          clientNote: clientNote || "",
          rejectionReason: ""
        };
        if (activityLog) {
          updateDoc.activityLog = activityLog;
        }

        await db.collection("invoices").updateOne(
          { _id: existingInvoice._id },
          { $set: updateDoc }
        );
        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "payment_proof_submitted",
          targetType: "invoice",
          targetId: existingInvoice.id,
          ip,
          userAgent,
          outcome: "success"
        });
        break;
      }
      case "addInvoice": {
        const { id, orgName, date, dueDate, amount, currency, status, generationType, activityLog } = payload;
        // Security: force orgName to session org
        await db.collection("invoices").insertOne({
          id, orgName: sessionOrgName || orgName, date, dueDate, amount,
          currency: currency || "USD",
          status, generationType: generationType || "Manual", activityLog: activityLog || []
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
      case "addEmploymentVerification": {
        const { name, mobile, email, orgName, requestingOrgName: empReqOrgName, skipCandidateLogin, employments } = payload;

        if (!name?.trim()) {
          return NextResponse.json({ error: "Candidate name is required" }, { status: 400 });
        }
        if (!skipCandidateLogin && !email?.trim()) {
          return NextResponse.json({ error: "Candidate email is required" }, { status: 400 });
        }

        const validEmployments = Array.isArray(employments) ? employments.filter(e => e?.companyName?.trim()) : [];
        const itemCount = validEmployments.length > 0 ? validEmployments.length : 1;

        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const defaultCountryRates: Record<string, number> = { Singapore: 15, Malaysia: 12, Philippines: 10, UAE: 20, India: 5 };
        const orgDoc = await db.collection("organisations").findOne({
          name: { $regex: new RegExp("^" + (safeOrgName || "").replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") }
        });

        // Calculate per-item country-specific pricing
        const employmentsWithCountry = validEmployments.map(e => ({
          ...e,
          country: e.country || "India"
        }));
        const serviceCharge = employmentsWithCountry.length > 0
          ? employmentsWithCountry.reduce((sum: number, e: any) => {
              const itemCountry = e.country || "India";
              const rate = orgDoc?.employmentRates?.[itemCountry] ?? (defaultCountryRates[itemCountry] || 5);
              return sum + rate;
            }, 0)
          : (orgDoc?.employmentRates?.["India"] ?? (defaultCountryRates["India"] || 5));

        // Derive countries list for the verification document
        const countriesList = [...new Set(employmentsWithCountry.map(e => e.country))];
        const country = countriesList.join(", ");

        const cleanOrg = (safeOrgName || "XXX").replace(/[^a-zA-Z]/g, "").slice(0, 3).padEnd(3, "X").toUpperCase();
        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `${cleanOrg}${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        let tempPassword: string | null = null;
        let setupUrl: string | null = null;

        if (!skipCandidateLogin && email?.trim()) {
          const { randomBytes } = await import("crypto");
          const bcrypt = await import("bcryptjs");

          const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          let randStr = "";
          const randomBytesArr = randomBytes(8);
          for (let i = 0; i < 8; i++) {
            randStr += charset.charAt(randomBytesArr[i] % charset.length);
          }
          tempPassword = `Cluso@${randStr}`;
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

          const candidatePortalUrl = getCandidatePortalUrl();
          setupUrl = `${candidatePortalUrl}/?email=${encodeURIComponent(email.toLowerCase().trim())}&password=${encodeURIComponent(tempPassword)}`;
        }

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        const initialAttempt = {
          date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase(),
          verifier: "Client Init",
          status: "Processing",
          notes: skipCandidateLogin ? `Employment verification created directly by client (${itemCount} check(s), candidate login skipped).` : `Employment verification request created by client (${itemCount} check(s)).`
        };

        await db.collection("verifications").insertOne({
          id: finalId,
          name,
          email: (email || "").toLowerCase().trim(),
          orgName: safeOrgName,
          requestingOrgName: empReqOrgName || safeOrgName,
          date: dateFormatted,
          status: "Processing",
          verifier: null,
          notes: skipCandidateLogin ? `Direct client submission (${itemCount} check(s)).` : "Awaiting candidate employment data submission.",
          type: "employment",
          candidateMobile: mobile || "",
          onboardingStatus: "active",
          tempPassword,
          skipCandidateLogin: !!skipCandidateLogin,
          employments: employmentsWithCountry,
          itemCount,
          serviceCharge,
          country,
          attempts: [initialAttempt],
          setupUrl,
          source: "portal",
          createdAt: new Date().toISOString()
        });

        if (empReqOrgName && empReqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: empReqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "employment_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        return NextResponse.json({ success: true, id: finalId, setupUrl, skipCandidateLogin: !!skipCandidateLogin });
      }
      case "addEducationVerification": {
        const { name, mobile, email, orgName, requestingOrgName: eduReqOrgName, skipCandidateLogin, educationList } = payload;

        if (!name?.trim()) {
          return NextResponse.json({ error: "Candidate name is required" }, { status: 400 });
        }
        if (!skipCandidateLogin && !email?.trim()) {
          return NextResponse.json({ error: "Candidate email is required" }, { status: 400 });
        }

        const validEducation = Array.isArray(educationList) ? educationList.filter(e => e?.boardUniversity?.trim()) : [];
        const itemCount = validEducation.length > 0 ? validEducation.length : 1;

        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const defaultCountryRates: Record<string, number> = { Singapore: 15, Malaysia: 12, Philippines: 10, UAE: 20, India: 5 };
        const orgDoc = await db.collection("organisations").findOne({
          name: { $regex: new RegExp("^" + (safeOrgName || "").replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") }
        });

        // Calculate per-item country-specific pricing
        const educationWithCountry = validEducation.map(e => ({
          ...e,
          country: e.country || "India"
        }));
        const serviceCharge = educationWithCountry.length > 0
          ? educationWithCountry.reduce((sum: number, e: any) => {
              const itemCountry = e.country || "India";
              const rate = orgDoc?.educationRates?.[itemCountry] ?? (defaultCountryRates[itemCountry] || 5);
              return sum + rate;
            }, 0)
          : (orgDoc?.educationRates?.["India"] ?? (defaultCountryRates["India"] || 5));

        // Derive countries list for the verification document
        const countriesList = [...new Set(educationWithCountry.map(e => e.country))];
        const country = countriesList.join(", ");

        const cleanOrg = (safeOrgName || "XXX").replace(/[^a-zA-Z]/g, "").slice(0, 3).padEnd(3, "X").toUpperCase();
        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `${cleanOrg}${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        let tempPassword: string | null = null;
        let setupUrl: string | null = null;

        if (!skipCandidateLogin && email?.trim()) {
          const { randomBytes } = await import("crypto");
          const bcrypt = await import("bcryptjs");

          const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          let randStr = "";
          const randomBytesArr = randomBytes(8);
          for (let i = 0; i < 8; i++) {
            randStr += charset.charAt(randomBytesArr[i] % charset.length);
          }
          tempPassword = `Cluso@${randStr}`;
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

          const candidatePortalUrl = getCandidatePortalUrl();
          setupUrl = `${candidatePortalUrl}/?email=${encodeURIComponent(email.toLowerCase().trim())}&password=${encodeURIComponent(tempPassword)}`;
        }

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        const initialAttempt = {
          date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase(),
          verifier: "Client Init",
          status: "Processing",
          notes: skipCandidateLogin ? `Education verification created directly by client (${itemCount} check(s), candidate login skipped).` : `Education verification request created by client (${itemCount} check(s)).`
        };

        await db.collection("verifications").insertOne({
          id: finalId,
          name,
          email: (email || "").toLowerCase().trim(),
          orgName: safeOrgName,
          requestingOrgName: eduReqOrgName || safeOrgName,
          date: dateFormatted,
          status: "Processing",
          verifier: null,
          notes: skipCandidateLogin ? `Direct client submission (${itemCount} check(s)).` : "Awaiting candidate education data submission.",
          type: "education",
          candidateMobile: mobile || "",
          onboardingStatus: "active",
          tempPassword,
          skipCandidateLogin: !!skipCandidateLogin,
          educationList: educationWithCountry,
          itemCount,
          serviceCharge,
          country,
          attempts: [initialAttempt],
          setupUrl,
          source: "portal",
          createdAt: new Date().toISOString()
        });

        if (eduReqOrgName && eduReqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: eduReqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "education_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        return NextResponse.json({ success: true, id: finalId, setupUrl, skipCandidateLogin: !!skipCandidateLogin });
      }
      case "submitEmploymentData": {
        const { verificationId, employmentData } = payload;
        if (!verificationId || !employmentData) {
          return NextResponse.json({ error: "Verification ID and employment data are required" }, { status: 400 });
        }

        const existingVer = await db.collection("verifications").findOne({ id: verificationId });
        if (!existingVer) {
          return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
        }

        const submittedEmployments = Array.isArray(employmentData.employments) && employmentData.employments.length > 0
          ? employmentData.employments
          : (Array.isArray(employmentData.pastOrganisations) && employmentData.pastOrganisations.length > 0
              ? employmentData.pastOrganisations
              : [employmentData]);

        const validEmps = submittedEmployments.filter((e: any) => e?.companyName?.trim() || e?.position?.trim());
        const itemCount = validEmps.length > 0 ? validEmps.length : 1;

        const defaultCountryRates: Record<string, number> = { Singapore: 15, Malaysia: 12, Philippines: 10, UAE: 20, India: 5 };
        const safeOrgName = existingVer.orgName;
        const orgDoc = await db.collection("organisations").findOne({
          name: { $regex: new RegExp("^" + (safeOrgName || "").replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") }
        });

        const serviceCharge = (validEmps.length > 0 ? validEmps : [employmentData]).reduce((sum: number, e: any) => {
          const itemCountry = e.country || "India";
          const rate = orgDoc?.employmentRates?.[itemCountry] ?? (defaultCountryRates[itemCountry] || 5);
          return sum + rate;
        }, 0);

        const countriesList = [...new Set((validEmps.length > 0 ? validEmps : [employmentData]).map((e: any) => e.country || "India"))];
        const country = countriesList.join(", ");

        const primaryEmp = validEmps[0] || employmentData;

        const result = await db.collection("verifications").updateOne(
          { id: verificationId },
          {
            $set: {
              employmentData: {
                country: primaryEmp.country || "",
                state: primaryEmp.state || "",
                city: primaryEmp.city || "",
                companyName: primaryEmp.companyName || "",
                addressLine1: primaryEmp.addressLine1 || "",
                addressLine2: primaryEmp.addressLine2 || "",
                companyTelephoneCode: primaryEmp.companyTelephoneCode || "+91",
                companyTelephone: primaryEmp.companyTelephone || "",
                department: primaryEmp.department || "",
                position: primaryEmp.position || "",
                employmentPeriodFrom: primaryEmp.employmentPeriodFrom || "",
                employmentPeriodTo: primaryEmp.employmentPeriodTo || "",
                employeeCode: primaryEmp.employeeCode || "",
                reportingManagerName: primaryEmp.reportingManagerName || "",
                reportingManagerDepartment: primaryEmp.reportingManagerDepartment || "",
                reportingManagerContactCode: primaryEmp.reportingManagerContactCode || "+91",
                reportingManagerContact: primaryEmp.reportingManagerContact || "",
                reportingManagerEmail: primaryEmp.reportingManagerEmail || "",
                annualCTC: primaryEmp.annualCTC || "",
                employmentType: primaryEmp.employmentType || "",
                agencyDetails: primaryEmp.agencyDetails || "",
                reasonForLeaving: primaryEmp.reasonForLeaving || "",
                remarks: primaryEmp.remarks || "",
                experienceLetterFile: primaryEmp.experienceLetterFile || "",
                experienceLetterFileName: primaryEmp.experienceLetterFileName || "",
                employments: validEmps.length > 0 ? validEmps : [primaryEmp],
                pastOrganisations: validEmps.length > 0 ? validEmps : [primaryEmp],
              },
              pastOrganisations: validEmps.length > 0 ? validEmps : [primaryEmp],
              employments: validEmps.length > 0 ? validEmps : [primaryEmp],
              itemCount,
              serviceCharge,
              country,
              employmentDataSubmitted: true,
              employmentDataSubmittedAt: new Date().toISOString(),
              updatedAt: new Date()
            }
          }
        );
        return NextResponse.json({ success: true });
      }
      case "submitEducationData": {
        const { verificationId, educationData } = payload;
        if (!verificationId || !educationData) {
          return NextResponse.json({ error: "Verification ID and education data are required" }, { status: 400 });
        }

        const existingVer = await db.collection("verifications").findOne({ id: verificationId });
        if (!existingVer) {
          return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
        }

        // Normalize to array (support multi-entry like employment)
        const submittedEducations = Array.isArray(educationData.educations) && educationData.educations.length > 0
          ? educationData.educations
          : (Array.isArray(educationData.educationList) && educationData.educationList.length > 0
              ? educationData.educationList
              : [educationData]);

        const validEdus = submittedEducations.filter((e: any) => e?.degreeType?.trim() || e?.courseName?.trim());
        const itemCount = validEdus.length > 0 ? validEdus.length : 1;

        const defaultCountryRates: Record<string, number> = { Singapore: 15, Malaysia: 12, Philippines: 10, UAE: 20, India: 5 };
        const safeOrgName = existingVer.orgName;
        const orgDoc = await db.collection("organisations").findOne({
          name: { $regex: new RegExp("^" + (safeOrgName || "").replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") }
        });

        const serviceCharge = (validEdus.length > 0 ? validEdus : [educationData]).reduce((sum: number, e: any) => {
          const itemCountry = e.country || "India";
          const rate = orgDoc?.educationRates?.[itemCountry] ?? (defaultCountryRates[itemCountry] || 5);
          return sum + rate;
        }, 0);

        const countriesList = [...new Set((validEdus.length > 0 ? validEdus : [educationData]).map((e: any) => e.country || "India"))];
        const country = countriesList.join(", ");

        const primaryEdu = validEdus[0] || educationData;

        const result = await db.collection("verifications").updateOne(
          { id: verificationId },
          {
            $set: {
              educationData: {
                country: primaryEdu.country || "",
                degreeType: primaryEdu.degreeType || "",
                courseName: primaryEdu.courseName || "",
                boardUniversity: primaryEdu.boardUniversity || "",
                institutionName: primaryEdu.institutionName || "",
                rollNumber: primaryEdu.rollNumber || "",
                passingYear: primaryEdu.passingYear || "",
                certificateFile: primaryEdu.certificateFile || "",
                certificateFileName: primaryEdu.certificateFileName || "",
                educations: validEdus.length > 0 ? validEdus : [primaryEdu],
                educationList: validEdus.length > 0 ? validEdus : [primaryEdu],
              },
              educationList: validEdus.length > 0 ? validEdus : [primaryEdu],
              educations: validEdus.length > 0 ? validEdus : [primaryEdu],
              itemCount,
              serviceCharge,
              country,
              educationDataSubmitted: true,
              educationDataSubmittedAt: new Date().toISOString(),
              updatedAt: new Date()
            }
          }
        );
        return NextResponse.json({ success: true });
      }

      case "addCourtRecordVerification": {
        const { candidateName, candidateDob, candidateFatherName, candidateMotherName, candidateIsMarried, candidateHusbandName, gender, idProofType, idProofNumber, idProofFile, addresses, orgName, requestingOrgName: reqOrgName } = payload;

        if (!candidateName?.trim() || !addresses || !Array.isArray(addresses) || addresses.length === 0) {
          return NextResponse.json({ error: "Candidate name and at least one address are required" }, { status: 400 });
        }

        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const cleanOrg = (safeOrgName || "XXX").replace(/[^a-zA-Z]/g, "").slice(0, 3).padEnd(3, "X").toUpperCase();
        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `${cleanOrg}${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        const initialAttempt = {
          date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase(),
          verifier: "System",
          status: "Processing",
          notes: "Court record verification request created. eCourts search initiated."
        };

        await db.collection("verifications").insertOne({
          id: finalId,
          name: candidateName.trim(),
          email: "",
          orgName: safeOrgName,
          requestingOrgName: reqOrgName || safeOrgName,
          date: dateFormatted,
          status: "Processing",
          verifier: null,
          notes: "Court record search in progress...",
          type: "court_record",
          candidateDob: candidateDob || "",
          candidateFatherName: candidateFatherName?.trim() || "",
          candidateMotherName: candidateMotherName?.trim() || "",
          candidateIsMarried: !!candidateIsMarried,
          candidateHusbandName: candidateIsMarried ? (candidateHusbandName?.trim() || "") : "",
          gender: gender || "",
          idProofType: idProofType || "",
          idProofNumber: idProofNumber?.trim() || "",
          idProofFile: idProofFile || "",
          addresses,
          courtRecordStatus: "pending",
          courtRecordSummary: "Search in progress...",
          attempts: [initialAttempt],
          source: "portal",
          createdAt: new Date().toISOString()
        });

        if (reqOrgName && reqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: reqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "court_record_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        // Fire and forget the eCourts search (it runs in the background)
        const baseUrl = req.headers.get("origin") || req.headers.get("host") || "";
        const searchUrl = baseUrl.startsWith("http") ? `${baseUrl}/api/ecourts-search` : `http://${baseUrl}/api/ecourts-search`;

        // Get the cookie header to forward auth
        const cookieHeader = req.headers.get("cookie") || "";

        fetch(searchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cookie": cookieHeader,
          },
          body: JSON.stringify({
            verificationId: finalId,
            candidateName: candidateName.trim(),
            addresses,
          }),
        }).catch((err) => {
          console.error(`[ECOURTS] Failed to trigger search for ${finalId}:`, err.message);
        });

        return NextResponse.json({ success: true, id: finalId });
      }
      case "addInterpolVerification": {
        const { candidateName, candidateDob, birthCity, orgName, requestingOrgName: reqOrgName } = payload;

        if (!candidateName?.trim() || !candidateDob?.trim()) {
          return NextResponse.json({ error: "Candidate name and date of birth are required" }, { status: 400 });
        }

        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const cleanOrg = (safeOrgName || "XXX").replace(/[^a-zA-Z]/g, "").slice(0, 3).padEnd(3, "X").toUpperCase();
        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `INT${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        const extractBirthYear = (dobStr: string) => {
          if (!dobStr) return null;
          const match = dobStr.toString().match(/\b(19\d\d|20\d\d)\b/);
          return match ? parseInt(match[0], 10) : null;
        };
        const dobYear = extractBirthYear(candidateDob);

        const normalizeName = (str: string) => {
          if (!str) return "";
          return str
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        };
        const searchNormalized = normalizeName(candidateName);

        let query: any = {};
        if (dobYear) {
          query.dobYear = dobYear;
        }

        const potentialMatches = await db.collection("interpol_notices").find(query).toArray();

        const inputWords = searchNormalized.split(" ").filter(w => w.length > 2);
        const matchedNotices = potentialMatches.filter((notice: any) => {
          const noticeNormalized = notice.normalizedName || "";
          
          // 1. Exact match
          if (searchNormalized === noticeNormalized) return true;
          
          // 2. Substring match
          if (searchNormalized.includes(noticeNormalized) || noticeNormalized.includes(searchNormalized)) return true;
          
          // 3. Word overlap
          const noticeWords = noticeNormalized.split(" ").filter((w: any) => w.length > 2);
          const commonWords = inputWords.filter(w => noticeWords.includes(w));
          
          if (commonWords.length >= 2) return true;
          if (inputWords.length > 0 && noticeWords.every((w: any) => inputWords.includes(w))) return true;
          if (noticeWords.length > 0 && inputWords.every((w: any) => noticeWords.includes(w))) return true;
          
          return false;
        });

        const sanitizedMatches = matchedNotices.map((m: any) => {
          const rawDetails = m.details?.details || m.details || {};
          const arrestWarrants = rawDetails.arrest_warrants || m.details?.arrest_warrants || [];
          return {
            name: m.name || rawDetails.forename || "",
            dateOfBirth: m.dateOfBirth || String(rawDetails.date_of_birth || ""),
            placeOfBirth: m.placeOfBirth || rawDetails.place_of_birth || "",
            noticeType: m.noticeType || "",
            noticeId: m.noticeId || rawDetails.entity_id || "",
            link: m.link || "",
            details: {
              arrest_warrants: arrestWarrants.map((w: any) => ({
                charge: typeof w.charge === "string" ? w.charge : JSON.stringify(w.charge || ""),
                issuing_country_id: w.issuing_country_id || "",
              })),
              details: typeof rawDetails.details === "string" ? rawDetails.details : (rawDetails.case_details || ""),
              sex: rawDetails.sex_id || "",
              nationalities: Array.isArray(rawDetails.nationalities) ? rawDetails.nationalities.join(", ") : "",
              distinguishing_marks: typeof rawDetails.distinguishing_marks === "string" ? rawDetails.distinguishing_marks : "",
            },
          };
        });

        const hasRecords = sanitizedMatches.length > 0;
        const status = hasRecords ? "Needs Attention" : "Completed";
        const notes = hasRecords
          ? `Potential similarity match(es) found in Interpol database: ${sanitizedMatches.length} record(s).`
          : "No records found in Interpol database. Clean record verified.";

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        await db.collection("verifications").insertOne({
          id: finalId,
          name: candidateName.trim(),
          email: "",
          orgName: safeOrgName,
          requestingOrgName: reqOrgName || safeOrgName,
          date: dateFormatted,
          status: status,
          verifier: "System",
          notes: notes,
          type: "interpol",
          candidateDob: candidateDob,
          birthCity: birthCity?.trim() || "",
          interpolHasRecords: hasRecords,
          interpolMatches: sanitizedMatches,
          idProofFile: payload.idProofFile || null,
          idProofFileName: payload.idProofFileName || "",
          interpolCompletedAt: new Date().toISOString(),
          source: "portal",
          createdAt: new Date().toISOString()
        });

        if (reqOrgName && reqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: reqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "interpol_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        return NextResponse.json({ success: true, id: finalId });
      }
      case "addRednoticeWorldwideVerification": {
        const { candidateName, candidateDob, birthCity, orgName, requestingOrgName: reqOrgName } = payload;

        if (!candidateName?.trim() || !candidateDob?.trim()) {
          return NextResponse.json({ error: "Candidate name and date of birth are required" }, { status: 400 });
        }

        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const cleanOrg = (safeOrgName || "XXX").replace(/[^a-zA-Z]/g, "").slice(0, 3).padEnd(3, "X").toUpperCase();
        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `RNW${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        const extractBirthYear = (dobStr: string) => {
          if (!dobStr) return null;
          const match = dobStr.toString().match(/\b(19\d\d|20\d\d)\b/);
          return match ? parseInt(match[0], 10) : null;
        };
        const dobYear = extractBirthYear(candidateDob);

        const normalizeName = (str: string) => {
          if (!str) return "";
          return str
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        };
        const searchNormalized = normalizeName(candidateName);

        // Find potential matches in worldwide database
        let query: any = {};
        if (dobYear) {
          query.$or = [{ dobYear: dobYear }, { dobYear: null }];
        }

        const potentialMatches = await db.collection("rednotices_worldwide").find(query).toArray();

        const inputWords = searchNormalized.split(" ").filter(w => w.length > 2);
        const matchedNotices = potentialMatches.filter((notice: any) => {
          const noticeNormalized = notice.normalizedName || "";
          
          // 1. Exact match
          if (searchNormalized === noticeNormalized) return true;
          
          // 2. Substring match
          if (searchNormalized.includes(noticeNormalized) || noticeNormalized.includes(searchNormalized)) return true;
          
          // 3. Word overlap
          const noticeWords = noticeNormalized.split(" ").filter((w: any) => w.length > 2);
          const commonWords = inputWords.filter(w => noticeWords.includes(w));
          
          if (commonWords.length >= 2) return true;
          if (inputWords.length > 0 && noticeWords.every((w: any) => inputWords.includes(w))) return true;
          if (noticeWords.length > 0 && inputWords.every((w: any) => noticeWords.includes(w))) return true;
          
          return false;
        });

        const sanitizedMatches = matchedNotices.map((m: any) => {
          const rawDetails = m.details || {};
          const arrestWarrants = m.arrestWarrants || rawDetails.arrest_warrants || [];
          return {
            name: m.name || `${m.forename || ""} ${m.surname || ""}`.trim() || rawDetails.name || "",
            forename: m.forename || rawDetails.forename || "",
            surname: m.surname || rawDetails.name || "",
            dateOfBirth: m.dateOfBirth || String(rawDetails.date_of_birth || ""),
            dobYear: m.dobYear || null,
            placeOfBirth: m.placeOfBirth || rawDetails.place_of_birth || "",
            countryOfBirthId: m.countryOfBirthId || rawDetails.country_of_birth_id || "",
            nationalities: Array.isArray(m.nationalities) ? m.nationalities : (rawDetails.nationalities || []),
            sexId: m.sexId || rawDetails.sex_id || "",
            noticeType: "red_notice_worldwide",
            noticeId: m.noticeId || (m.entityId || "").replace("/", "-"),
            entityId: m.entityId || rawDetails.entity_id || "",
            link: m.link || `https://www.interpol.int/en/How-we-work/Notices/Red-Notices/View-Red-Notices#${(m.entityId || "").replace("/", "-")}`,
            arrestWarrants: arrestWarrants.map((w: any) => ({
              charge: typeof w.charge === "string" ? w.charge : JSON.stringify(w.charge || ""),
              issuing_country_id: w.issuing_country_id || "",
            })),
            distinguishingMarks: m.distinguishingMarks || rawDetails.distinguishing_marks || "",
            languagesSpoken: m.languagesSpoken || rawDetails.languages_spoken_ids || [],
            thumbnailUrl: m.thumbnailUrl || rawDetails._links?.thumbnail?.href || "",
            imageUrl: m.imageUrl || rawDetails._links?.images?.href || "",
          };
        });

        const hasRecords = sanitizedMatches.length > 0;
        const status = hasRecords ? "Needs Attention" : "Completed";
        const notes = hasRecords
          ? `Potential similarity match(es) found in Interpol Worldwide Red Notice database: ${sanitizedMatches.length} record(s).`
          : "No similarity matches found in Interpol Worldwide Red Notice database. Clean global record verified.";

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        await db.collection("verifications").insertOne({
          id: finalId,
          name: candidateName.trim(),
          email: "",
          orgName: safeOrgName,
          requestingOrgName: reqOrgName || safeOrgName,
          date: dateFormatted,
          status: status,
          verifier: "System",
          notes: notes,
          type: "rednotice_worldwide",
          candidateDob: candidateDob,
          birthCity: birthCity?.trim() || "",
          rednoticeWorldwideHasRecords: hasRecords,
          rednoticeWorldwideMatches: sanitizedMatches,
          idProofFile: payload.idProofFile || null,
          idProofFileName: payload.idProofFileName || "",
          rednoticeWorldwideCompletedAt: new Date().toISOString(),
          source: "portal",
          createdAt: new Date().toISOString()
        });

        if (reqOrgName && reqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: reqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "rednotice_worldwide_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        return NextResponse.json({ success: true, id: finalId, rednoticeWorldwideHasRecords: hasRecords });
      }
      case "addSapsWantedVerification": {
        const {
          candidateName,
          candidateForename: passedForename,
          candidateSurname: passedSurname,
          candidateDob,
          candidateIdNumber,
          provinceCity,
          orgName,
          requestingOrgName: reqOrgName,
          idProofFile,
          idProofFileName,
        } = payload;

        if (!candidateName?.trim() && (!passedForename?.trim() || !passedSurname?.trim())) {
          return NextResponse.json({ error: "Candidate name or forename and surname are required" }, { status: 400 });
        }

        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `SAPS${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        const normalizeText = (str: string) => {
          if (!str) return "";
          return str
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        };

        // Resolve Forename and Surname
        let forename = (passedForename || "").trim();
        let surname = (passedSurname || "").trim();
        const rawFullName = (candidateName || `${forename} ${surname}`).trim();

        if (!forename || !surname) {
          const nameParts = rawFullName.split(/\s+/).filter(Boolean);
          if (nameParts.length === 1) {
            surname = nameParts[0];
            forename = nameParts[0];
          } else {
            surname = nameParts[nameParts.length - 1];
            forename = nameParts.slice(0, nameParts.length - 1).join(" ");
          }
        }

        const normForename = normalizeText(forename);
        const normSurname = normalizeText(surname);
        const normFullName = normalizeText(rawFullName);

        // Fetch potential candidates from saps_wanted collection
        const candidateMatches = await db.collection("saps_wanted").find({
          $or: [
            { normalizedSurname: normSurname },
            { normalizedName: normFullName },
            { normalizedSurname: { $regex: `^${normSurname}$`, $options: "i" } }
          ]
        }).toArray();

        // Exact match verification for BOTH forename and surname
        const matchedSuspects = candidateMatches.filter((suspect: any) => {
          const sSurname = suspect.normalizedSurname || normalizeText(suspect.surname);
          const sForename = suspect.normalizedForename || normalizeText(suspect.forename);
          const sFullName = suspect.normalizedName || normalizeText(suspect.name);

          // 1. Full name exact match
          if (normFullName === sFullName) return true;

          // 2. Exact Surname match AND Forename match / overlap
          const surnameMatches = sSurname === normSurname || 
            (sSurname.length > 2 && normSurname.length > 2 && (sSurname.includes(normSurname) || normSurname.includes(sSurname)));

          if (!surnameMatches) return false;

          // Check forename
          if (sForename === normForename) return true;

          // Word-level forename overlap (e.g. "Anele Mabheka" vs "Anele")
          const inputForenameWords = normForename.split(" ").filter((w: string) => w.length > 2);
          const suspectForenameWords = sForename.split(" ").filter((w: string) => w.length > 2);

          const hasCommonWord = inputForenameWords.some((w: string) => suspectForenameWords.includes(w));
          if (hasCommonWord) return true;

          return false;
        });

        const sanitizedMatches = matchedSuspects.map((s: any) => ({
          bid: s.sapsBid || s.bid,
          name: s.name || `${s.forename || ""} ${s.surname || ""}`.trim(),
          forename: s.forename || "",
          surname: s.surname || "",
          crime: s.crime || "",
          circumstances: s.circumstances || "",
          crimeDate: s.crimeDate || "",
          aliases: s.aliases || "",
          gender: s.gender || "",
          eyeColour: s.eyeColour || "",
          hairColour: s.hairColour || "",
          height: s.height || "",
          weight: s.weight || "",
          build: s.build || "",
          station: s.station || "",
          caseNumber: s.caseNumber || "",
          stationTelephone: s.stationTelephone || "",
          investigatingOfficer: s.investigatingOfficer || "",
          contactNumber: s.contactNumber || "",
          email: s.email || "",
          imageUrl: s.imageUrl || "",
          detailUrl: s.detailUrl || "",
        }));

        const hasMatch = sanitizedMatches.length > 0;
        
        // If matched -> Halt verification, set status to Halted and substatus to verifying_with_attorney, do not send to customer
        // If not matched -> Status is Completed, sendToCustomer is true, directly show report
        const status = hasMatch ? "Halted" : "Completed";
        const sapsWantedStatus = hasMatch ? "verifying_with_attorney" : "completed";
        const sendToCustomer = !hasMatch;

        const notes = hasMatch
          ? `Potential match identified on SAPS Wanted registry: ${sanitizedMatches.length} record(s). Verification halted pending attorney review.`
          : "No similarity matches found in South African Police Service (SAPS) Registry. Clean record verified.";

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        await db.collection("verifications").insertOne({
          id: finalId,
          name: rawFullName,
          candidateForename: forename,
          candidateSurname: surname,
          candidateDob: candidateDob || "",
          candidateIdNumber: candidateIdNumber || "",
          provinceCity: provinceCity || "",
          email: "",
          orgName: safeOrgName,
          requestingOrgName: reqOrgName || safeOrgName,
          date: dateFormatted,
          status: status,
          sapsWantedStatus: sapsWantedStatus,
          verifier: "System",
          notes: notes,
          type: "saps_wanted",
          sendToCustomer: sendToCustomer,
          sapsWantedHasRecords: hasMatch,
          sapsWantedMatches: sanitizedMatches,
          idProofFile: idProofFile || null,
          idProofFileName: idProofFileName || "",
          sapsWantedCompletedAt: hasMatch ? null : new Date().toISOString(),
          source: "portal",
          createdAt: new Date().toISOString(),
        });

        if (reqOrgName && reqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: reqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "saps_wanted_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        return NextResponse.json({
          success: true,
          id: finalId,
          sapsWantedHasRecords: hasMatch,
          status: status,
          sapsWantedStatus: sapsWantedStatus,
          sendToCustomer: sendToCustomer,
        });
      }
      case "addSafliiCourtVerification": {
        const {
          candidateName,
          candidateDob,
          birthCity,
          province,
          orgName,
          requestingOrgName: reqOrgName,
          candidateFatherName,
          candidateMotherName,
          candidateIsMarried,
          candidateHusbandName,
          gender,
          idProofType,
          idProofNumber,
          addresses
        } = payload;

        const extractedProvinces = Array.isArray(addresses)
          ? addresses.map((a: any) => (a.stateCode?.startsWith("Other:") ? a.stateCode.substring(6) : (a.state || a.stateCode || "")).trim()).filter(Boolean)
          : [];
        const uniqueProvinces = Array.from(new Set(extractedProvinces));
        const resolvedProvince = province?.trim() || uniqueProvinces.join(", ");

        if (!candidateName?.trim()) {
          return NextResponse.json({ error: "Candidate name is required" }, { status: 400 });
        }
        if (!resolvedProvince) {
          return NextResponse.json({ error: "State / Province is required in candidate address" }, { status: 400 });
        }

        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `SAF${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        await db.collection("verifications").insertOne({
          id: finalId,
          name: candidateName.trim(),
          email: "",
          orgName: safeOrgName,
          requestingOrgName: reqOrgName || safeOrgName,
          date: dateFormatted,
          status: "Processing",
          verifier: "System",
          notes: `SAFLII South African Court Check initiated for ${resolvedProvince}. Search in progress...`,
          type: "saflii_court",
          candidateDob: candidateDob || "",
          birthCity: birthCity?.trim() || "",
          province: resolvedProvince,
          provinceCity: resolvedProvince,
          provinces: uniqueProvinces,
          candidateFatherName: candidateFatherName?.trim() || "",
          candidateMotherName: candidateMotherName?.trim() || "",
          candidateIsMarried: !!candidateIsMarried,
          candidateHusbandName: candidateIsMarried ? (candidateHusbandName?.trim() || "") : "",
          gender: gender || "",
          idProofType: idProofType || "",
          idProofNumber: idProofNumber?.trim() || "",
          addresses: addresses || [],
          safliiCourtStatus: "searching",
          safliiCourtHasRecords: false,
          safliiCourtResults: [],
          idProofFile: payload.idProofFile || null,
          idProofFileName: payload.idProofFileName || "",
          safliiCourtCompletedAt: null,
          source: "portal",
          createdAt: new Date().toISOString()
        });

        if (reqOrgName && reqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: reqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "saflii_court_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        // Fire-and-forget: trigger SAFLII search in background
        const baseUrl = req.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
        fetch(`${baseUrl}/api/saflii-search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-api-key": process.env.NEXTAUTH_SECRET || "",
          },
          body: JSON.stringify({
            verificationId: finalId,
            candidateName: candidateName.trim(),
            province: resolvedProvince,
            provinces: uniqueProvinces,
            addresses: addresses || [],
          }),
        }).catch((err) => {
          console.error(`[SAFLII] Failed to trigger search for ${finalId}:`, err.message);
        });

        return NextResponse.json({ success: true, id: finalId });
      }
      case "addUkCourtVerification": {
        const {
          candidateName,
          candidateDob,
          birthCity,
          judgmentType,
          jurisdiction,
          orgName,
          requestingOrgName: reqOrgName,
          candidateFatherName,
          candidateMotherName,
          candidateIsMarried,
          candidateHusbandName,
          gender,
          idProofType,
          idProofNumber,
          addresses
        } = payload;

        if (!candidateName?.trim()) {
          return NextResponse.json({ error: "Candidate name is required" }, { status: 400 });
        }

        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `UKC${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        await db.collection("verifications").insertOne({
          id: finalId,
          name: candidateName.trim(),
          email: "",
          orgName: safeOrgName,
          requestingOrgName: reqOrgName || safeOrgName,
          date: dateFormatted,
          status: "Processing",
          verifier: "System",
          notes: "UK Court Check initiated. Searching Courts and Tribunals Judiciary...",
          type: "uk_court",
          candidateDob: candidateDob || "",
          birthCity: birthCity?.trim() || "",
          judgmentType: judgmentType || "",
          jurisdiction: jurisdiction?.trim() || "All UK Jurisdictions",
          candidateFatherName: candidateFatherName?.trim() || "",
          candidateMotherName: candidateMotherName?.trim() || "",
          candidateIsMarried: !!candidateIsMarried,
          candidateHusbandName: candidateIsMarried ? (candidateHusbandName?.trim() || "") : "",
          gender: gender || "",
          idProofType: idProofType || "",
          idProofNumber: idProofNumber?.trim() || "",
          addresses: addresses || [],
          ukCourtStatus: "searching",
          ukCourtHasRecords: false,
          ukCourtResults: [],
          ukCourtTotalResults: 0,
          ukCourtTotalAvailable: 0,
          idProofFile: payload.idProofFile || null,
          idProofFileName: payload.idProofFileName || "",
          ukCourtCompletedAt: null,
          source: "portal",
          createdAt: new Date().toISOString()
        });

        if (reqOrgName && reqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: reqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "uk_court_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        // Fire-and-forget: trigger UK Court search in background
        const baseUrl = req.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
        fetch(`${baseUrl}/api/uk-court-search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-api-key": process.env.NEXTAUTH_SECRET || "",
          },
          body: JSON.stringify({
            verificationId: finalId,
            candidateName: candidateName.trim(),
            judgmentType: judgmentType || "",
            jurisdiction: jurisdiction?.trim() || "All UK Jurisdictions",
          }),
        }).catch((err) => {
          console.error(`[UK-COURT] Failed to trigger search for ${finalId}:`, err.message);
        });

        return NextResponse.json({ success: true, id: finalId });
      }
      case "addMalaysiaCourtVerification": {
        const {
          candidateName,
          candidateDob,
          courtCategory,
          courtLocation,
          caseType,
          dateOfDecisionFrom,
          dateOfDecisionTo,
          dateOfAPFrom,
          dateOfAPTo,
          judgeName,
          orgName,
          requestingOrgName: reqOrgName,
          candidateFatherName,
          candidateMotherName,
          candidateIsMarried,
          candidateHusbandName,
          gender,
          idProofType,
          idProofNumber,
          addresses
        } = payload;

        if (!candidateName?.trim()) {
          return NextResponse.json({ error: "Candidate / Search keyword is required" }, { status: 400 });
        }

        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `MYC${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        await db.collection("verifications").insertOne({
          id: finalId,
          name: candidateName.trim(),
          email: "",
          orgName: safeOrgName,
          requestingOrgName: reqOrgName || safeOrgName,
          date: dateFormatted,
          status: "Processing",
          verifier: "System",
          notes: "Malaysia Court Check initiated. Searching Portal eJudgment Mahkamah Persekutuan Malaysia...",
          type: "malaysia_court",
          candidateDob: candidateDob || "",
          candidateFatherName: candidateFatherName?.trim() || "",
          candidateMotherName: candidateMotherName?.trim() || "",
          candidateIsMarried: !!candidateIsMarried,
          candidateHusbandName: candidateIsMarried ? (candidateHusbandName?.trim() || "") : "",
          gender: gender || "",
          idProofType: idProofType || "",
          idProofNumber: idProofNumber?.trim() || "",
          addresses: addresses || [],
          courtCategory: courtCategory || "",
          courtLocation: courtLocation || "",
          caseType: caseType || "",
          dateOfDecisionFrom: dateOfDecisionFrom || "",
          dateOfDecisionTo: dateOfDecisionTo || "",
          dateOfAPFrom: dateOfAPFrom || "",
          dateOfAPTo: dateOfAPTo || "",
          judgeName: judgeName?.trim() || "",
          malaysiaCourtStatus: "searching",
          malaysiaCourtHasRecords: false,
          malaysiaCourtResults: [],
          malaysiaCourtTotalResults: 0,
          malaysiaCourtTotalAvailable: 0,
          idProofFile: payload.idProofFile || null,
          idProofFileName: payload.idProofFileName || "",
          malaysiaCourtCompletedAt: null,
          source: "portal",
          createdAt: new Date().toISOString()
        });

        if (reqOrgName && reqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: reqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "malaysia_court_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        // Fire-and-forget: trigger Malaysia Court search in background
        const baseUrl = req.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
        fetch(`${baseUrl}/api/malaysia-court-search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-api-key": process.env.NEXTAUTH_SECRET || "",
          },
          body: JSON.stringify({
            verificationId: finalId,
            candidateName: candidateName.trim(),
            courtCategory: courtCategory || "",
            courtLocation: courtLocation || "",
            caseType: caseType || "",
            dateOfDecisionFrom: dateOfDecisionFrom || "",
            dateOfDecisionTo: dateOfDecisionTo || "",
            dateOfAPFrom: dateOfAPFrom || "",
            dateOfAPTo: dateOfAPTo || "",
            judgeName: judgeName?.trim() || "",
          }),
        }).catch((err) => {
          console.error(`[MY-COURT] Failed to trigger search for ${finalId}:`, err.message);
        });

        return NextResponse.json({ success: true, id: finalId });
      }
      case "addSingaporeCourtVerification": {
        const {
          candidateName,
          candidateDob,
          court,
          hearingType,
          startDate,
          endDate,
          judgeName,
          lawFirm,
          orgName,
          requestingOrgName: reqOrgName,
          candidateFatherName,
          candidateMotherName,
          candidateIsMarried,
          candidateHusbandName,
          gender,
          idProofType,
          idProofNumber,
          addresses
        } = payload;

        if (!candidateName?.trim()) {
          return NextResponse.json({ error: "Candidate / Search keyword is required" }, { status: 400 });
        }

        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `SGC${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        await db.collection("verifications").insertOne({
          id: finalId,
          name: candidateName.trim(),
          email: "",
          orgName: safeOrgName,
          requestingOrgName: reqOrgName || safeOrgName,
          date: dateFormatted,
          status: "Processing",
          verifier: "System",
          notes: "Singapore Court Check initiated. Searching Singapore Judiciary hearing list gateway...",
          type: "singapore_court",
          candidateDob: candidateDob || "",
          candidateFatherName: candidateFatherName?.trim() || "",
          candidateMotherName: candidateMotherName?.trim() || "",
          candidateIsMarried: !!candidateIsMarried,
          candidateHusbandName: candidateIsMarried ? (candidateHusbandName?.trim() || "") : "",
          gender: gender || "",
          idProofType: idProofType || "",
          idProofNumber: idProofNumber?.trim() || "",
          addresses: addresses || [],
          singaporeCourtSelectedCourt: court || "All Courts",
          singaporeCourtSelectedHearingType: hearingType || "All Types",
          singaporeCourtStartDate: startDate || "",
          singaporeCourtEndDate: endDate || "",
          judgeName: judgeName?.trim() || "",
          singaporeCourtStatus: "searching",
          singaporeCourtHasRecords: false,
          singaporeCourtResults: [],
          singaporeCourtTotalResults: 0,
          singaporeCourtTotalAvailable: 0,
          idProofFile: payload.idProofFile || null,
          idProofFileName: payload.idProofFileName || "",
          singaporeCourtCompletedAt: null,
          source: "portal",
          createdAt: new Date().toISOString()
        });

        if (reqOrgName && reqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: reqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "singapore_court_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        // Fire-and-forget: trigger Singapore Court search in background
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
            court: court || "",
            hearingType: hearingType || "",
            startDate: startDate || "",
            endDate: endDate || "",
            judgeName: judgeName || "",
            lawFirm: lawFirm || "",
          }),
        }).catch((err) => {
          console.error(`[SG-COURT] Failed to trigger search for ${finalId}:`, err.message);
        });

        return NextResponse.json({ success: true, id: finalId });
      }
      case "addPhilippinesCourtVerification": {
        const {
          candidateName,
          candidateDob,
          partyName,
          caseNo,
          station,
          orgName,
          requestingOrgName: reqOrgName,
          candidateFatherName,
          candidateMotherName,
          candidateIsMarried,
          candidateHusbandName,
          gender,
          idProofType,
          idProofNumber,
          addresses
        } = payload;

        if (!candidateName?.trim() && !partyName?.trim() && !caseNo?.trim()) {
          return NextResponse.json({ error: "Candidate name, party name, or case number is required" }, { status: 400 });
        }

        const effectiveName = (partyName || candidateName || caseNo || "").trim();
        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `PHC${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        await db.collection("verifications").insertOne({
          id: finalId,
          name: effectiveName,
          email: "",
          orgName: safeOrgName,
          requestingOrgName: reqOrgName || safeOrgName,
          date: dateFormatted,
          status: "Processing",
          verifier: "System",
          notes: "Philippines Court Check initiated. Searching Court of Appeals case status inquiry gateway...",
          type: "philippines_court",
          candidateDob: candidateDob || "",
          candidateFatherName: candidateFatherName?.trim() || "",
          candidateMotherName: candidateMotherName?.trim() || "",
          candidateIsMarried: !!candidateIsMarried,
          candidateHusbandName: candidateIsMarried ? (candidateHusbandName?.trim() || "") : "",
          gender: gender || "",
          idProofType: idProofType || "",
          idProofNumber: idProofNumber?.trim() || "",
          addresses: addresses || [],
          philippinesCourtStation: station || "all",
          philippinesCourtPartyName: effectiveName,
          philippinesCourtCaseNo: caseNo?.trim() || "",
          philippinesCourtStatus: "searching",
          philippinesCourtHasRecords: false,
          philippinesCourtResults: [],
          philippinesCourtTotalResults: 0,
          idProofFile: payload.idProofFile || null,
          idProofFileName: payload.idProofFileName || "",
          philippinesCourtCompletedAt: null,
          source: "portal",
          createdAt: new Date().toISOString()
        });

        if (reqOrgName && reqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: reqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "philippines_court_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        // Fire-and-forget: trigger Philippines Court search in background
        const baseUrl = req.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
        fetch(`${baseUrl}/api/philippines-court-search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-api-key": process.env.NEXTAUTH_SECRET || "",
          },
          body: JSON.stringify({
            verificationId: finalId,
            candidateName: effectiveName,
            caseNo: caseNo || "",
            station: station || "all",
          }),
        }).catch((err) => {
          console.error(`[PH-COURT] Failed to trigger search for ${finalId}:`, err.message);
        });

        return NextResponse.json({ success: true, id: finalId });
      }
      case "addPassportVerification": {
        const { fileNumber, dateOfBirth, orgName, requestingOrgName: reqOrgName } = payload;

        if (!fileNumber?.trim() || !dateOfBirth?.trim()) {
          return NextResponse.json({ error: "File number and date of birth are required" }, { status: 400 });
        }

        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const cleanOrg = (safeOrgName || "XXX").replace(/[^a-zA-Z]/g, "").slice(0, 3).padEnd(3, "X").toUpperCase();
        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `PAS${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        let formattedDob = dateOfBirth.trim();
        if (formattedDob.includes('-')) {
          const parts = formattedDob.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              formattedDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
            } else {
              formattedDob = `${parts[0]}/${parts[1]}/${parts[2]}`;
            }
          }
        }

        // ── API1: Passport Seva (primary) ──
        const api1Headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://www.passportindia.gov.in',
          'Referer': 'https://www.passportindia.gov.in/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        };

        const api1Url = 'https://api1.passportindia.gov.in/v1/online/trackStatusForFileNo';
        const api1Payload = {
          requestResponseMap: {
            fileNo: fileNumber.trim().toUpperCase(),
            applDob: formattedDob,
            optStatus: 'Application_Status'
          }
        };

        let passportResult: any = null;
        let api1Error: string | null = null;
        let dataSource: string = 'api1';

        try {
          const apiRes = await fetch(api1Url, {
            method: 'POST',
            headers: api1Headers,
            body: JSON.stringify(api1Payload)
          });

          if (!apiRes.ok) {
            const errText = await apiRes.text();
            api1Error = `Passport India portal returned status ${apiRes.status}.`;
          } else {
            const data = await apiRes.json();
            if (data.strReturnString === 'error' || (data.fieldErrors && Object.keys(data.fieldErrors).length > 0)) {
              const fieldMsg = data.fieldErrors ? Object.values(data.fieldErrors).flat().join(', ') : '';
              api1Error = fieldMsg || 'Invalid File Number or Date of Birth.';
            } else {
              passportResult = data;
            }
          }
        } catch (err: any) {
          api1Error = err?.message || 'Failed to connect to Passport India server.';
        }

        // ── API2: Mission Portal (fallback) — only if API1 failed ──
        if (api1Error || !passportResult) {
          let api2Error: string | null = null;

          const api2Headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://mportal.passportindia.gov.in',
            'Referer': 'https://mportal.passportindia.gov.in/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36'
          };

          const api2Url = 'https://api2.passportindia.gov.in/v1/mproddc/online/gpsp/trackApplicationStatus';
          const api2Payload = {
            requestResponseMap: {
              refNo: fileNumber.trim().toUpperCase(),
              applDob: formattedDob,
              optStatus: 'Application_Status'
            }
          };

          try {
            const api2Res = await fetch(api2Url, {
              method: 'POST',
              headers: api2Headers,
              body: JSON.stringify(api2Payload)
            });

            if (!api2Res.ok) {
              const errText = await api2Res.text();
              api2Error = `Mission Portal returned status ${api2Res.status}.`;
            } else {
              const data2 = await api2Res.json();
              if (data2.strReturnString === 'error') {
                const errMsg2 = data2.actionErrors?.join(', ') || 'Invalid ARN / File Number or Date of Birth.';
                api2Error = errMsg2;
              } else {
                passportResult = data2;
                dataSource = 'api2_mportal';
              }
            }
          } catch (err2: any) {
            api2Error = err2?.message || 'Failed to connect to Mission Portal server.';
          }

          // If both APIs failed, return error
          if (api2Error || !passportResult) {
            return NextResponse.json({ error: api2Error || api1Error || 'Passport verification query failed on both portals.' }, { status: 400 });
          }
        }

        const map = passportResult.requestResponseMap || {};
        const appStatusObj = Array.isArray(map.applicationStatus) && map.applicationStatus.length > 0
          ? map.applicationStatus[0]
          : {};

        const passportData = {
          fileNumber: appStatusObj.FILE_NO || map.fileNo || map.refNo || fileNumber.trim().toUpperCase(),
          dateOfBirth: appStatusObj.DATE_OF_BIRTH || map.applDob || formattedDob,
          givenName: appStatusObj.APPL_GIVEN_NAME || '—',
          surname: appStatusObj.APPL_SURNAME || '—',
          applicantName: appStatusObj.APPL_GIVEN_NAME && appStatusObj.APPL_SURNAME
            ? `${appStatusObj.APPL_GIVEN_NAME} ${appStatusObj.APPL_SURNAME}`
            : appStatusObj.APPL_GIVEN_NAME || appStatusObj.APPL_SURNAME || '—',
          typeOfApplication: appStatusObj.PARAM_VALUE || 'Normal',
          applicationReceivedDate: appStatusObj.APP_SUB_DATE || '—',
          applicationRefNo: appStatusObj.APP_REF_NO_FK || '—',
          statusMessage: map.statusMessage || appStatusObj.STATUS_MESSAGE || 'Status Retrieved Successfully',
          dataSource,
          rawResponse: passportResult
        };

        const candidateDisplayName = passportData.givenName && passportData.givenName !== '—'
          ? `${passportData.givenName} ${passportData.surname !== '—' ? passportData.surname : ''}`.trim()
          : passportData.fileNumber;

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        await db.collection("verifications").insertOne({
          id: finalId,
          name: candidateDisplayName,
          email: "",
          orgName: safeOrgName,
          requestingOrgName: reqOrgName || safeOrgName,
          date: dateFormatted,
          status: "Completed",
          verifier: "System",
          notes: `Passport status tracked successfully: ${passportData.statusMessage}`,
          type: "passport",
          passportData,
          idProofFile: payload.idProofFile || null,
          idProofFileName: payload.idProofFileName || "",
          price: 15,
          source: "portal",
          createdAt: new Date().toISOString()
        });

        if (reqOrgName && reqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: reqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "passport_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        return NextResponse.json({ success: true, id: finalId, passportData });
      }
      case "addDigitalAddressVerification": {
        const { candidateName, candidateEmail, candidateAddress, orgName, requestingOrgName: reqOrgName } = payload;

        if (!candidateName?.trim() || !candidateEmail?.trim() || !candidateAddress?.trim()) {
          return NextResponse.json({ error: "Candidate name, email, and address are required" }, { status: 400 });
        }

        const isAdminSession = sessionOrgName?.toLowerCase() === "clusoinfolink" || sessionOrgName?.toLowerCase() === "ozclu" || sessionOrgName?.toLowerCase() === "admin";
        const safeOrgName = isAdminSession ? (orgName || sessionOrgName) : (sessionOrgName || orgName);

        const cleanOrg = (safeOrgName || "XXX").replace(/[^a-zA-Z]/g, "").slice(0, 3).padEnd(3, "X").toUpperCase();
        const nowTime = new Date();
        const dd = String(nowTime.getDate()).padStart(2, "0");
        const mm = String(nowTime.getMonth() + 1).padStart(2, "0");
        const yy = String(nowTime.getFullYear()).slice(-2);
        const dateStr = `${dd}${mm}${yy}`;
        const prefix = `DAV${dateStr}-`;

        const count = await db.collection("verifications").countDocuments({
          id: { $regex: `^${prefix}` }
        });
        const finalId = `${prefix}${String(count + 1).padStart(4, "0")}`;

        // Generate temporary password and create/update candidate user
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

        const emailLower = candidateEmail.toLowerCase().trim();
        const existingUser = await db.collection("users").findOne({ email: emailLower });
        if (!existingUser) {
          await db.collection("users").insertOne({
            email: emailLower,
            password: hashedTempPassword,
            fullName: candidateName.trim(),
            role: "candidate",
            orgName: safeOrgName,
            createdAt: new Date()
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
          verifier: "Client Init",
          status: "Processing",
          notes: "Digital address verification request created by client. Awaiting candidate photo submission."
        };

        const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

        await db.collection("verifications").insertOne({
          id: finalId,
          name: candidateName.trim(),
          email: emailLower,
          orgName: safeOrgName,
          requestingOrgName: reqOrgName || safeOrgName,
          candidateAddress: candidateAddress.trim(),
          date: dateFormatted,
          status: "Processing",
          verifier: null,
          notes: "Digital address verification request created. Awaiting candidate submission.",
          type: "digital_address",
          onboardingStatus: "active",
          tempPassword,
          attempts: [initialAttempt],
          setupUrl,
          digitalAddressSubmitted: false,
          source: "portal",
          createdAt: new Date().toISOString()
        });

        if (reqOrgName && reqOrgName.trim()) {
          await db.collection("settings").updateOne(
            { companyName: safeOrgName },
            { $addToSet: { recentRequestingOrgs: reqOrgName.trim() } },
            { upsert: true }
          );
        }

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "digital_address_verification_created",
          targetType: "verification",
          targetId: finalId,
          ip,
          userAgent,
          outcome: "success"
        });

        return NextResponse.json({ success: true, id: finalId, setupUrl });
      }
      case "generateApiKey": {
        if (user.role !== "org_owner") {
          return NextResponse.json({ error: "Only organisation owners can generate API keys" }, { status: 403 });
        }

        const org = await db.collection("organisations").findOne({
          name: { $regex: new RegExp("^" + sessionOrgName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i") },
          isDeleted: { $ne: true }
        });

        if (!org) {
          return NextResponse.json({ error: "Organisation record not found" }, { status: 404 });
        }

        const { fullKey, keyHash, keySuffix, keyPrefix } = generateApiKey();

        const newKeyDoc = {
          orgId: org.id || org._id.toString(),
          orgName: org.name,
          keyHash,
          keySuffix,
          keyPrefix,
          permissions: ["*"],
          rateLimit: 100,
          status: "active",
          createdBy: user.email,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          revokedAt: null,
          isDeleted: false
        };

        const insertResult = await db.collection("api_keys").insertOne(newKeyDoc);

        await db.collection("organisations").updateOne(
          { _id: org._id },
          { $set: { apiEnabled: true, updatedAt: new Date().toISOString() } }
        );

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "generate_api_key",
          targetType: "api_key",
          targetId: insertResult.insertedId.toString(),
          metadata: { orgName: org.name, keySuffix },
          ip,
          userAgent,
          outcome: "success"
        });

        return NextResponse.json({
          success: true,
          apiKey: {
            _id: insertResult.insertedId.toString(),
            fullKey,
            keySuffix,
            keyPrefix,
            orgId: newKeyDoc.orgId,
            orgName: newKeyDoc.orgName,
            permissions: newKeyDoc.permissions,
            rateLimit: newKeyDoc.rateLimit,
            status: newKeyDoc.status,
            createdAt: newKeyDoc.createdAt
          }
        });
      }
      case "revokeApiKey": {
        if (user.role !== "org_owner") {
          return NextResponse.json({ error: "Only organisation owners can revoke API keys" }, { status: 403 });
        }

        const { apiKeyId } = payload || {};
        if (!apiKeyId) {
          return NextResponse.json({ error: "apiKeyId is required" }, { status: 400 });
        }

        const query = ObjectId.isValid(apiKeyId) ? { _id: new ObjectId(apiKeyId) } : { _id: apiKeyId };
        const targetKey = await db.collection("api_keys").findOne(query);

        if (!targetKey) {
          return NextResponse.json({ error: "API key not found" }, { status: 404 });
        }

        // Tenant isolation check
        const orgNameRegex = new RegExp("^" + sessionOrgName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i");
        if (!orgNameRegex.test(targetKey.orgName)) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await db.collection("api_keys").updateOne(
          query,
          { $set: { status: "revoked", revokedAt: new Date().toISOString(), revokedBy: user.email } }
        );

        await logAuditEvent(db, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          portal: "client",
          action: "revoke_api_key",
          targetType: "api_key",
          targetId: apiKeyId,
          metadata: { orgName: targetKey.orgName, keySuffix: targetKey.keySuffix },
          ip,
          userAgent,
          outcome: "success"
        });

        return NextResponse.json({ success: true });
      }
      case "getApiUsage": {
        const org = await db.collection("organisations").findOne({
          name: { $regex: new RegExp("^" + sessionOrgName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$", "i") },
          isDeleted: { $ne: true }
        });
        const orgId = org?.id || org?._id?.toString() || sessionOrgName;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const usageLogs = await db.collection("api_usage_logs").find({
          $or: [{ orgId }, { orgName: sessionOrgName }],
          timestamp: { $gte: startOfMonth }
        }).sort({ timestamp: -1 }).toArray();

        const totalCalls = usageLogs.length;
        const totalCost = usageLogs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
        const successfulCalls = usageLogs.filter(l => (l.statusCode || 200) < 400).length;
        const failedCalls = totalCalls - successfulCalls;

        const breakdownMap: Record<string, { count: number; cost: number }> = {};
        for (const log of usageLogs) {
          const ct = log.checkType || "other";
          if (!breakdownMap[ct]) breakdownMap[ct] = { count: 0, cost: 0 };
          breakdownMap[ct].count++;
          breakdownMap[ct].cost += Number(log.cost) || 0;
        }

        return NextResponse.json({
          success: true,
          apiUsage: {
            totalCalls,
            successfulCalls,
            failedCalls,
            totalCost,
            currency: org?.currency || "USD",
            breakdown: breakdownMap,
            recentLogs: usageLogs.slice(0, 50).map(l => ({
              ...l,
              _id: l._id.toString(),
              timestamp: l.timestamp ? (l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp) : null,
            }))
          }
        });
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
