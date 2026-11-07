/**
 * External API: Download Verification Report as PDF-Ready HTML
 * GET /api/v1/external/report/[requestId]/pdf
 *
 * Returns a fully self-contained, print-optimised HTML document that can be
 * saved as .html and printed to PDF via the browser's Ctrl+P / window.print(),
 * or piped through any HTML-to-PDF tool (wkhtmltopdf, Puppeteer, etc.).
 *
 * Content-Type: text/html
 * Content-Disposition: attachment; filename="report-{requestId}.html"
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, isApiAuthError } from "src/lib/externalApiAuth";
import { applyRateLimit, rateLimitHeaders } from "src/lib/apiRateLimit";
import { connectToDatabase } from "src/lib/mongodb";
import { logApiUsage } from "src/lib/apiUsageLog";

// ─── Helper: escape HTML entities ────────────────────────────────
function esc(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(d: string | Date | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

// ─── Type-specific report section generators ─────────────────────

function renderIdentitySection(v: any): string {
  return `
    <div class="section">
      <h2>Identity Verification Details</h2>
      <table class="details-table">
        <tr><td class="label">Full Name</td><td>${esc(v.name)}</td></tr>
        <tr><td class="label">Email</td><td>${esc(v.email)}</td></tr>
        <tr><td class="label">Date of Birth</td><td>${esc(v.candidateDob)}</td></tr>
        <tr><td class="label">Father's Name</td><td>${esc(v.candidateFatherName)}</td></tr>
        <tr><td class="label">Mother's Name</td><td>${esc(v.candidateMotherName)}</td></tr>
        <tr><td class="label">Gender</td><td>${esc(v.gender)}</td></tr>
        <tr><td class="label">ID Proof</td><td>${esc(v.idProofType)} — ${esc(v.idProofNumber)}</td></tr>
        <tr><td class="label">Status</td><td><span class="status-badge ${v.status === 'Completed' || v.status === 'Verified' ? 'status-clear' : 'status-alert'}">${esc(v.status)}</span></td></tr>
      </table>
    </div>`;
}

function renderCourtRecordSection(v: any): string {
  const addresses = Array.isArray(v.addresses)
    ? v.addresses.map((a: any) => `${esc(a.city || a.district || "")}, ${esc(a.state || "")}`).join("; ")
    : "—";
  return `
    <div class="section">
      <h2>Court Record (eCourts India) Details</h2>
      <table class="details-table">
        <tr><td class="label">Candidate</td><td>${esc(v.name)}</td></tr>
        <tr><td class="label">Father's Name</td><td>${esc(v.candidateFatherName)}</td></tr>
        <tr><td class="label">Addresses Searched</td><td>${addresses}</td></tr>
        <tr><td class="label">Court Record Status</td><td>${esc(v.courtRecordStatus)}</td></tr>
        <tr><td class="label">Summary</td><td>${esc(v.courtRecordSummary)}</td></tr>
      </table>
    </div>`;
}

function renderCourtResultsTable(results: any[], titleLabel: string): string {
  if (!results || results.length === 0) {
    return `<div class="section"><h2>${esc(titleLabel)}</h2><p class="no-records">No court records found — Verified Clear ✓</p></div>`;
  }
  const rows = results.map((r: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(r.caseNo || r.caseNumber || "—")}</td>
      <td>${esc(r.caseTitle || r.title || r.caseName || "—")}</td>
      <td>${esc(r.station || r.court || r.venue || "—")}</td>
      <td>${esc(r.decisionStatus || r.hearingType || r.status || "—")}</td>
    </tr>`).join("");

  return `
    <div class="section">
      <h2>${esc(titleLabel)} — ${results.length} Record(s) Found</h2>
      <table class="records-table">
        <thead><tr><th>#</th><th>Case No</th><th>Title / Parties</th><th>Court / Station</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderPassportSection(v: any): string {
  return `
    <div class="section">
      <h2>Passport Status Check</h2>
      <table class="details-table">
        <tr><td class="label">File Number</td><td>${esc(v.passportFileNumber || v.fileNumber)}</td></tr>
        <tr><td class="label">Applicant Name</td><td>${esc(v.passportApplicantName || v.name)}</td></tr>
        <tr><td class="label">Status Message</td><td>${esc(v.passportStatusMessage || v.passportStatus)}</td></tr>
        <tr><td class="label">Application Type</td><td>${esc(v.passportApplicationType)}</td></tr>
      </table>
    </div>`;
}

function renderInterpolSection(v: any): string {
  return `
    <div class="section">
      <h2>Interpol / Red Notice Check</h2>
      <table class="details-table">
        <tr><td class="label">Candidate</td><td>${esc(v.name)}</td></tr>
        <tr><td class="label">Has Records</td><td>${v.interpolHasRecords || v.rednoticeWorldwideHasRecords ? "⚠ Yes" : "✓ No — Cleared"}</td></tr>
        <tr><td class="label">Match Count</td><td>${esc(v.interpolMatchCount || v.rednoticeWorldwideMatchCount || 0)}</td></tr>
      </table>
    </div>`;
}

function renderGenericSection(v: any): string {
  return `
    <div class="section">
      <h2>Verification Details</h2>
      <table class="details-table">
        <tr><td class="label">Candidate</td><td>${esc(v.name)}</td></tr>
        <tr><td class="label">Type</td><td>${esc(v.type)}</td></tr>
        <tr><td class="label">Status</td><td><span class="status-badge ${v.status === 'Completed' || v.status === 'Verified' ? 'status-clear' : 'status-alert'}">${esc(v.status)}</span></td></tr>
        <tr><td class="label">Notes</td><td>${esc(v.notes || v.reportDetails)}</td></tr>
      </table>
    </div>`;
}

// ─── Build the body sections based on verification type ──────────
function buildReportBody(v: any): string {
  const type = v.type || "identity";

  // Candidate info header (common)
  let html = `
    <div class="section">
      <h2>Candidate Information</h2>
      <table class="details-table">
        <tr><td class="label">Full Name</td><td>${esc(v.name)}</td></tr>
        ${v.candidateDob ? `<tr><td class="label">Date of Birth</td><td>${esc(v.candidateDob)}</td></tr>` : ""}
        ${v.candidateFatherName ? `<tr><td class="label">Father's Name</td><td>${esc(v.candidateFatherName)}</td></tr>` : ""}
        ${v.gender ? `<tr><td class="label">Gender</td><td>${esc(v.gender)}</td></tr>` : ""}
        ${v.idProofType ? `<tr><td class="label">ID Proof</td><td>${esc(v.idProofType)} — ${esc(v.idProofNumber)}</td></tr>` : ""}
      </table>
    </div>`;

  switch (type) {
    case "identity":
      html += renderIdentitySection(v);
      break;
    case "court_record":
      html += renderCourtRecordSection(v);
      break;
    case "philippines_court":
      html += renderCourtResultsTable(v.philippinesCourtResults, "Philippines Court of Appeals Records");
      break;
    case "singapore_court":
      html += renderCourtResultsTable(v.singaporeCourtResults, "Singapore Judiciary Court Records");
      break;
    case "uk_court":
      html += renderCourtResultsTable(v.ukCourtResults, "UK Courts & Tribunals Judiciary Records");
      break;
    case "malaysia_court":
      html += renderCourtResultsTable(v.malaysiaCourtResults, "Malaysia Court (eJudgment) Records");
      break;
    case "saflii_court":
      html += renderCourtResultsTable(v.safliiCourtResults, "South African Court (SAFLII) Records");
      break;
    case "passport":
      html += renderPassportSection(v);
      break;
    case "interpol":
    case "rednotice_worldwide":
      html += renderInterpolSection(v);
      break;
    default:
      html += renderGenericSection(v);
  }

  // Notes / summary
  if (v.notes || v.reportDetails) {
    html += `
      <div class="section">
        <h2>Verification Notes</h2>
        <p>${esc(v.notes || v.reportDetails)}</p>
      </div>`;
  }

  return html;
}

// ─── Main HTML document generator ────────────────────────────────
function generateReportHtml(v: any, orgName: string): string {
  const reportDate = formatDate(v.completedAt || v.courtRecordCompletedAt || v.philippinesCourtCompletedAt || v.singaporeCourtCompletedAt || v.ukCourtCompletedAt || v.malaysiaCourtCompletedAt || v.safliiCourtCompletedAt || v.passportCompletedAt || v.sapsWantedCompletedAt || v.interpolCompletedAt || v.rednoticeWorldwideCompletedAt || v.date);
  const statusClass = (v.status === "Completed" || v.status === "Verified") ? "status-clear" : (v.status === "Discrepancy" || v.status === "Needs Attention") ? "status-alert" : "status-processing";
  const typeLabel: Record<string, string> = {
    identity: "Identity Verification",
    court_record: "Court Record Check (eCourts India)",
    philippines_court: "Philippines Court of Appeals Check",
    singapore_court: "Singapore Court Check",
    uk_court: "UK Court Records Check",
    malaysia_court: "Malaysia Court Records Check",
    saflii_court: "South African Court (SAFLII) Check",
    saps_wanted: "SAPS Wanted Persons Check",
    passport: "Passport Status Verification",
    interpol: "Interpol Wanted Notices Check",
    rednotice_worldwide: "Interpol Worldwide Red Notice Check",
    digital_address: "Digital Address Verification",
    employment: "Employment Verification",
    education: "Education Verification",
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cluso Infolink Verify Report — ${esc(v.id)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1e293b;
    background: #fff;
    font-size: 11px;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    max-width: 800px;
    margin: 0 auto;
    padding: 32px 40px;
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #134074;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .header-left h1 {
    font-size: 18px;
    font-weight: 900;
    color: #134074;
    letter-spacing: -0.3px;
  }
  .header-left p {
    font-size: 10px;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-top: 2px;
  }
  .header-right {
    text-align: right;
    font-size: 10px;
    color: #64748b;
  }
  .header-right strong {
    color: #1e293b;
    font-weight: 700;
  }

  /* Meta bar */
  .meta-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 24px;
  }
  .meta-item {
    flex: 1 1 auto;
    min-width: 120px;
  }
  .meta-item .label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-item .value { font-size: 11px; font-weight: 700; color: #1e293b; margin-top: 2px; }

  /* Status badges */
  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .status-clear { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .status-alert { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  .status-processing { background: #fef9c3; color: #854d0e; border: 1px solid #fde68a; }

  /* Sections */
  .section {
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
  .section h2 {
    font-size: 13px;
    font-weight: 800;
    color: #134074;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }
  .section p {
    font-size: 11px;
    color: #475569;
  }

  /* Details table */
  .details-table {
    width: 100%;
    border-collapse: collapse;
  }
  .details-table td {
    padding: 6px 8px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 11px;
    vertical-align: top;
  }
  .details-table .label {
    font-weight: 700;
    color: #64748b;
    width: 180px;
    white-space: nowrap;
  }

  /* Records table */
  .records-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
  }
  .records-table th {
    background: #f1f5f9;
    padding: 6px 8px;
    text-align: left;
    font-weight: 700;
    color: #475569;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e2e8f0;
  }
  .records-table td {
    padding: 6px 8px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: top;
  }
  .records-table tr:nth-child(even) td {
    background: #fafbfc;
  }

  .no-records {
    padding: 16px;
    text-align: center;
    color: #16a34a;
    font-weight: 700;
    font-size: 12px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
  }

  /* Footer */
  .footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9px;
    color: #94a3b8;
  }
  .footer strong { color: #64748b; }

  /* Disclaimer */
  .disclaimer {
    margin-top: 12px;
    padding: 10px 14px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    font-size: 9px;
    color: #92400e;
    line-height: 1.5;
  }

  /* Print overrides */
  @media print {
    body { background: #fff; }
    .page { padding: 20px 30px; max-width: none; }
    .header { border-bottom-width: 2px; }
    .meta-bar { background: #f8fafc !important; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>CLUSO INFOLINK VERIFY</h1>
      <p>Background Verification Report</p>
    </div>
    <div class="header-right">
      <div><strong>Report ID:</strong> ${esc(v.id)}</div>
      <div><strong>Report Date:</strong> ${reportDate}</div>
      <div><strong>Organisation:</strong> ${esc(orgName)}</div>
    </div>
  </div>

  <!-- Meta bar -->
  <div class="meta-bar">
    <div class="meta-item">
      <div class="label">Check Type</div>
      <div class="value">${esc(typeLabel[v.type] || v.type || "Verification")}</div>
    </div>
    <div class="meta-item">
      <div class="label">Overall Status</div>
      <div class="value"><span class="status-badge ${statusClass}">${esc(v.status)}</span></div>
    </div>
    <div class="meta-item">
      <div class="label">Candidate</div>
      <div class="value">${esc(v.name)}</div>
    </div>
    <div class="meta-item">
      <div class="label">Source</div>
      <div class="value">${esc(v.source === "api" ? "API Integration" : "Portal")}</div>
    </div>
  </div>

  <!-- Dynamic Report Body -->
  ${buildReportBody(v)}

  <!-- Disclaimer -->
  <div class="disclaimer">
    <strong>DISCLAIMER:</strong> This report has been generated by Cluso Infolink Verify based on data retrieved from
    official government and judicial portals at the time of search. Results reflect the records available at
    the time of the query and may not capture records added after the search was completed. This report is
    provided for informational purposes only and does not constitute legal advice. Cluso Infolink Verify is not
    responsible for the accuracy, completeness, or timeliness of data provided by third-party sources.
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <strong>Cluso Infolink Verify</strong> — Automated Background Verification Platform<br>
      Generated on ${new Date().toISOString().split("T")[0]} • Confidential
    </div>
    <div style="text-align:right;">
      <strong>verify.clusoinfolink.com</strong><br>
      © ${new Date().getFullYear()} Cluso Infolink Private Limited
    </div>
  </div>

  <!-- Print button (hidden in print) -->
  <div class="no-print" style="text-align:center;margin-top:20px;">
    <button onclick="window.print()" style="
      padding: 10px 28px;
      background: #134074;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    ">Download as PDF (Ctrl+P)</button>
  </div>
</div>
</body>
</html>`;
}

// ─── Route Handler ───────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const startTime = Date.now();
  const authResult = await authenticateApiKey(req);
  if (isApiAuthError(authResult)) return authResult;

  const rateLimitError = applyRateLimit(authResult.apiKey._id, authResult.apiKey.rateLimit);
  if (rateLimitError) return rateLimitError;

  const { requestId } = await params;
  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }

  const { db } = await connectToDatabase();
  const orgNameRegex = new RegExp(`^${authResult.org.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i");

  const verification = await db.collection("verifications").findOne({
    id: requestId,
    orgName: { $regex: orgNameRegex },
    isDeleted: { $ne: true },
  });

  if (!verification) {
    return NextResponse.json(
      { error: "Verification record not found or does not belong to your organisation" },
      { status: 404, headers: rateLimitHeaders(authResult.apiKey._id, authResult.apiKey.rateLimit) }
    );
  }

  // Check if verification is completed
  const isCompleted =
    verification.status === "Completed" ||
    verification.status === "Verified" ||
    verification.status === "Discrepancy" ||
    verification.status === "Needs Attention" ||
    verification.courtRecordStatus === "completed" ||
    verification.safliiCourtStatus === "completed" ||
    verification.ukCourtStatus === "completed" ||
    verification.malaysiaCourtStatus === "completed" ||
    verification.philippinesCourtStatus === "completed" ||
    verification.singaporeCourtStatus === "completed" ||
    verification.sapsWantedStatus === "completed" ||
    verification.sapsWantedStatus === "cleared_by_attorney" ||
    verification.sapsWantedStatus === "confirmed_wanted" ||
    verification.passportStatus === "completed" ||
    Boolean(verification.interpolCompletedAt) ||
    Boolean(verification.rednoticeWorldwideCompletedAt);

  if (!isCompleted) {
    return NextResponse.json(
      {
        success: false,
        requestId: verification.id,
        status: verification.status,
        message: "Verification report is not yet ready for PDF download. Current status: " + verification.status,
      },
      { status: 200, headers: rateLimitHeaders(authResult.apiKey._id, authResult.apiKey.rateLimit) }
    );
  }

  const htmlContent = generateReportHtml(verification, authResult.org.name);

  // Log usage (fire-and-forget)
  logApiUsage(db, {
    orgId: authResult.org.id,
    orgName: authResult.org.name,
    apiKeyId: authResult.apiKey._id,
    keySuffix: authResult.apiKey.keySuffix,
    endpoint: req.nextUrl.pathname,
    checkType: verification.type || "report_pdf",
    method: "GET",
    statusCode: 200,
    cost: 0,
    currency: authResult.org.currency || "USD",
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown",
    requestId,
    timestamp: new Date(),
    responseTimeMs: Date.now() - startTime,
  }).catch(() => {});

  return new NextResponse(htmlContent, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="cluso-infolink-report-${requestId}.html"`,
      ...Object.fromEntries(
        Object.entries(rateLimitHeaders(authResult.apiKey._id, authResult.apiKey.rateLimit))
      ),
    },
  });
}
