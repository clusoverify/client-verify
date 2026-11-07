"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function EducationReportContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ verification: any; settings: any } | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No Verification ID provided in search query.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/portal-data/verification-detail?id=${id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to fetch verification details");
        }
        const json = await res.json();
        if (json.verification && !json.verification.sendToCustomer) {
          throw new Error("This verification report is not yet ready or has not been published to your portal.");
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while loading the report.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
        <div className="w-10 h-10 border-4 border-[#5b21b6] border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Generating Report...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">!</div>
        <h2 className="text-lg font-bold text-slate-800">Report Generation Failed</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md">{error || "Could not retrieve verification detail record."}</p>
        <button
          onClick={() => window.close()}
          className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-xs hover:bg-slate-700 cursor-pointer"
        >
          Close Window
        </button>
      </div>
    );
  }

  const { verification, settings } = data;
  const reportNo = verification.id ? verification.id.replace("REQ-", "RPT-").replace("EDU-", "RPT-") : "RPT-UNKNOWN";

  // Format Date functions
  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "numeric", year: "numeric" });
    } catch {
      return String(dateStr);
    }
  };

  const formatVerifierName = (val?: string): string => {
    if (!val) return "India Ops";
    const trimmed = String(val).trim();
    if (!trimmed) return "India Ops";
    if (!trimmed.includes("@")) return trimmed;
    const emailLower = trimmed.toLowerCase();
    if (emailLower.startsWith("indiaops")) return "India Ops";
    if (emailLower.startsWith("pkumar") || emailLower.startsWith("prabirkumar")) return "P Kumar";
    const handle = trimmed.split("@")[0];
    return handle
      .replace(/[._-]/g, " ")
      .split(" ")
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const generatedAtDate = verification.completedAt 
    ? new Date(verification.completedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase()
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase();

  const generatedBy = formatVerifierName(verification.verifier);

  const isVerified = verification.status === "Completed" || verification.status === "Verified";
  const isDiscrepancy = verification.status === "Needs Attention" || verification.status === "Discrepancy";

  const statusColor = isVerified
    ? "text-emerald-600"
    : isDiscrepancy
    ? "text-rose-600"
    : "text-amber-500";

  const verdictColor = isVerified
    ? "text-emerald-700"
    : isDiscrepancy
    ? "text-rose-700"
    : "text-amber-700";

  const verdictBg = isVerified
    ? "bg-emerald-50 border-emerald-200"
    : isDiscrepancy
    ? "bg-rose-50 border-rose-200"
    : "bg-amber-50 border-amber-200";

  const verdictText = isVerified
    ? "VERIFIED / COMPLETED"
    : isDiscrepancy
    ? "DISCREPANCY DETECTED"
    : "IN PROGRESS";

  const edu = verification.educationData || {};
  const attempts = verification.educationAttempts || [];

  const educationsList: any[] = (() => {
    if (Array.isArray(verification.educationList) && verification.educationList.length > 0) return verification.educationList;
    if (Array.isArray(verification.educations) && verification.educations.length > 0) return verification.educations;
    if (Array.isArray(verification.educationData?.educations) && verification.educationData.educations.length > 0) return verification.educationData.educations;
    if (Array.isArray(verification.educationData?.educationList) && verification.educationData.educationList.length > 0) return verification.educationData.educationList;
    return [edu];
  })();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white print:p-0 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-start font-sans">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html, body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .print-page-block {
            border: 5px double #5b21b6 !important;
            padding: 22px 26px !important;
            margin-bottom: 0 !important;
            box-sizing: border-box !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            background: white !important;
            min-height: 265mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .print-card h1 {
            font-size: 16px !important;
            margin-bottom: 5px !important;
          }
          .print-card h2 {
            font-size: 17px !important;
          }
          .print-card h3 {
            font-size: 11px !important;
          }
          .print-card .grid {
            gap: 10px !important;
          }
          .print-card p, .print-card div, .print-card span {
            line-height: 1.45 !important;
          }
          .print-card .mb-8 {
            margin-bottom: 18px !important;
          }
          .print-card .mb-6 {
            margin-bottom: 12px !important;
          }
          .print-card .p-8, .print-card .p-6, .print-card .p-5 {
            padding: 12px !important;
          }
          .print-card .pb-6 {
            padding-bottom: 10px !important;
          }
          .print-card .pt-6 {
            padding-top: 10px !important;
          }
          .print-card .mt-8 {
            margin-top: 16px !important;
          }
          .print-card .gap-6 {
            gap: 11px !important;
          }
          .print-card .gap-4 {
            gap: 8px !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-break-before {
            break-before: page !important;
            page-break-before: always !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          .print-page-border {
            display: block !important;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 3px double #5b21b6;
            pointer-events: none;
            z-index: 9999;
          }
          .report-page-card {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 8px 4px !important;
            margin: 0 !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            padding: 8px !important;
            display: flex !important;
            flex-direction: column !important;
            min-height: 100vh !important;
          }
          .report-sign-off {
            margin-top: auto !important;
            padding-top: 20px !important;
          }
        }
      `}</style>

      {/* Print Control Toolbar */}
      <div className="no-print print:hidden w-full max-w-[800px] bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800">Education Verification Report</span>
          <span className="text-xs text-slate-500">Ready to save or export as official A4 PDF document.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#5b21b6] text-white rounded-lg font-bold text-xs hover:bg-[#4c1d95] cursor-pointer shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span>Generate PDF</span>
          </button>
          <button
            onClick={() => window.close()}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-50 cursor-pointer transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Per-page border frame (repeats on every printed page via position:fixed) */}
      <div className="print-page-border hidden print:block" aria-hidden="true" />

      {/* Main Report Container */}
      <div className="print-card w-full max-w-[800px] bg-white border-[4px] border-double border-[#5b21b6] p-6 sm:p-8 shadow-md relative my-0 mx-auto print:max-w-full print:w-full">
        
        {/* Page 1 Block: Cover & Overall Verdict */}
        <div>
          {/* Top Header */}
        <div className="grid grid-cols-3 items-center gap-4 mb-8">
          <div className="flex justify-start">
            <div className="flex items-center gap-2">
              {settings && settings.logo ? (
                <div className="w-28 h-14 sm:w-36 sm:h-16 flex items-center justify-start shrink-0">
                  <img src={settings.logo} alt="Company Logo" className="object-contain max-h-full max-w-full" />
                </div>
              ) : (
                <div className="w-24 h-12 sm:w-28 sm:h-14 flex items-center justify-start shrink-0">
                  <img src="/cluso-logo-long-default.svg" alt="Cluso Infolink Logo" className="object-contain max-h-full" />
                </div>
              )}
            </div>
          </div>
          <h1 className="text-center font-sans text-[#5b21b6] text-lg sm:text-xl font-extrabold tracking-widest uppercase mt-2">EDUCATION<br />REPORT</h1>
          <div className="text-right text-[11px] sm:text-xs font-bold text-slate-800 space-y-0.5">
            <div>Report #: <span className="font-mono text-slate-900">{reportNo}</span></div>
            <div>Date: <span className="text-slate-900">{formatDate(verification.completedAt || verification.date)}</span></div>
          </div>
        </div>

        {/* Boxed Metadata Card */}
        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 mb-6">
          <div className="space-y-1.5">
            <div>Report Number: <span className="font-mono font-bold text-slate-900">{reportNo}</span></div>
            <div>Request Created: <span className="text-slate-900 font-mono">{verification.date}</span></div>
            <div>
              Overall Status:{" "}
              <span className={`font-bold uppercase ${statusColor}`}>
                {verification.status}
              </span>
            </div>
          </div>
          <div className="space-y-1.5 sm:text-right">
            <div>Generated At: <span className="text-slate-900 font-mono">{generatedAtDate}</span></div>
            <div>Generated By: <span className="text-slate-900">{generatedBy}</span></div>
          </div>
        </div>

        {/* Candidate & Company Details Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#5b21b6] border-b border-slate-200 pb-1 mb-2">Candidate Details</h3>
            <div className="space-y-1.5 text-xs">
              <div><span className="text-slate-500 font-semibold">Name:</span> <span className="font-bold text-slate-800">{verification.name}</span></div>
              <div><span className="text-slate-500 font-semibold">Email:</span> <span className="font-semibold text-slate-800">{verification.email}</span></div>
              {verification.candidateMobile && <div><span className="text-slate-500 font-semibold">Mobile:</span> <span className="font-semibold text-slate-800">{verification.candidateMobile}</span></div>}
            </div>
          </div>
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#5b21b6] border-b border-slate-200 pb-1 mb-2">Company Details</h3>
            <div className="space-y-1.5 text-xs">
              <div><span className="text-slate-500 font-semibold">Client Company:</span> <span className="font-bold text-slate-800">{verification.requestingOrgName || verification.orgName}</span></div>
              <div><span className="text-slate-500 font-semibold">Email:</span> <span className="font-semibold text-slate-800">{settings?.contactEmail || "contact@company.com"}</span></div>
              <div><span className="text-slate-500 font-semibold">Checks Requested:</span> <span className="font-bold text-slate-800">{verification.itemCount || (verification.educationList?.length || 1)} Check(s)</span></div>
            </div>
          </div>
        </div>

        {/* Overall Verdict Banner */}
        <div className={`mb-8 p-5 border-2 rounded-xl ${verdictBg} print-avoid-break`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#5b21b6] mb-1">Overall Verification Verdict</h3>
              <p className={`text-lg font-extrabold ${verdictColor}`}>{verdictText}</p>
              <p className="text-xs text-slate-600 mt-1 font-semibold">
                Completed manual & primary checks with {attempts.length} attempts logged
              </p>
              <p className="text-[10px] text-slate-500 mt-2 font-medium leading-relaxed max-w-[480px]">
                This report is generated through a rigorous background check involving manual, email, and/or physical site verification to confirm the candidate's academic credentials against original institutional registers.
              </p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center gap-0.5 bg-white border border-slate-200/80 p-3 rounded-lg shadow-sm">
              <span className="material-symbols-outlined text-[#5b21b6] text-3xl">school</span>
              <span className="text-[8px] font-extrabold uppercase text-[#5b21b6] tracking-wider mt-1">Secured</span>
            </div>
          </div>
        </div>

        {/* Education Information Table(s) with Per-Institution Attempt History */}
        <div className="mb-8">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#5b21b6] mb-3 print-avoid-break">
            Candidate Submitted Academic Details ({educationsList.length} Institution{educationsList.length > 1 ? "s" : ""})
          </h3>
          <div className="space-y-6">
            {educationsList.map((eduItem: any, idx: number) => (
              <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs p-4 bg-white mb-6">
                <div className="bg-slate-100/90 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#5b21b6] uppercase tracking-wide">
                    {idx + 1}. {eduItem.institutionName || eduItem.boardUniversity || `Institution #${idx + 1}`}
                    {idx === 0 ? " (Primary / Most Recent)" : " (Additional Academic Record)"}
                  </span>
                  {eduItem.country && (
                    <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {eduItem.country}
                    </span>
                  )}
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5 border-r border-slate-200 w-1/2">Academic Field</th>
                      <th className="p-2.5">Response Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold bg-white">
                    {Boolean(eduItem.degreeType) && (
                      <tr>
                        <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Degree Category</td>
                        <td className="p-2.5 font-bold text-slate-900">{eduItem.degreeType}</td>
                      </tr>
                    )}
                    {Boolean(eduItem.courseName) && (
                      <tr>
                        <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Course / Degree Name</td>
                        <td className="p-2.5 font-bold text-slate-900">{eduItem.courseName}</td>
                      </tr>
                    )}
                    {Boolean(eduItem.boardUniversity) && (
                      <tr>
                        <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Board / University</td>
                        <td className="p-2.5">{eduItem.boardUniversity}</td>
                      </tr>
                    )}
                    {Boolean(eduItem.institutionName) && (
                      <tr>
                        <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">School / College Name</td>
                        <td className="p-2.5">{eduItem.institutionName}</td>
                      </tr>
                    )}
                    {Boolean(eduItem.rollNumber) && (
                      <tr>
                        <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Roll / Registration No.</td>
                        <td className="p-2.5 font-mono">{eduItem.rollNumber}</td>
                      </tr>
                    )}
                    {Boolean(eduItem.passingYear) && (
                      <tr>
                        <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Passing Year</td>
                        <td className="p-2.5 font-mono">{eduItem.passingYear}</td>
                      </tr>
                    )}
                    {Boolean(eduItem.country) && (
                      <tr>
                        <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Country</td>
                        <td className="p-2.5">{eduItem.country}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Per-Education Verification Result Log History */}
                {(() => {
                  const orgAttempts = (attempts || []).filter((att: any) => {
                    if (!att.targetOrg || att.targetOrg === "All / General") {
                      return idx === 0;
                    }
                    const orgPrefix = `${idx + 1}.`;
                    return att.targetOrg.startsWith(orgPrefix);
                  });

                  return (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-[#5b21b6] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">history</span>
                          Verification Result Log History for {eduItem.institutionName || eduItem.boardUniversity || `Institution #${idx + 1}`} ({orgAttempts.length})
                        </span>
                      </div>
                      <div className="print-avoid-break">
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <th className="p-2.5 border-r border-slate-200 w-1/4">Date &amp; Time</th>
                                <th className="p-2.5 border-r border-slate-200 w-1/6">Status</th>
                                <th className="p-2.5 border-r border-slate-200 w-1/6">Mode</th>
                                <th className="p-2.5">Attempt Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold bg-white">
                              {orgAttempts.length > 0 ? (
                                orgAttempts.slice().reverse().map((att: any, attIdx: number) => {
                                  const attOutcome = att.result || att.status || "In Progress";
                                  return (
                                    <tr key={attIdx} className="hover:bg-slate-50/30">
                                      <td className="p-2.5 border-r border-slate-200 font-mono text-[10px] bg-slate-50/30">{att.date}</td>
                                      <td className="p-2.5 border-r border-slate-200">
                                        <span className={`inline-block font-bold px-1.5 py-0.5 rounded text-[8px] uppercase border ${
                                          attOutcome === "Verified" || attOutcome === "Completed"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : attOutcome === "In Progress" || attOutcome === "Processing"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                        }`}>
                                          {attOutcome}
                                        </span>
                                      </td>
                                      <td className="p-2.5 border-r border-slate-200 font-medium text-slate-700 capitalize">{att.verificationMode || "Manual"}</td>
                                      <td className="p-2.5 text-[10px] text-slate-665 font-medium leading-normal">
                                        {att.comment && <div className="font-bold text-slate-800">Comment: {att.comment}</div>}
                                        {att.respondentName && <div className="mt-1">Respondent: {att.respondentName} {att.respondentEmail ? `(${att.respondentEmail})` : ""}</div>}
                                        {att.respondentComment && <div className="italic text-slate-500">Respondent Comment: &quot;{att.respondentComment}&quot;</div>}
                                        <div className="text-[9px] text-slate-400 mt-1">Logged by: {formatVerifierName(att.loggedBy || generatedBy)}</div>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={4} className="p-3 text-center text-slate-400 text-[11px] italic">No verification attempt logs recorded for this institution.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

        {/* Sign-off & Disclaimer Section */}
        <div>

          {/* Sign-Off & Disclaimer — pushed to bottom of last page */}
          <div className="report-sign-off mt-10 print:mt-auto">
          {/* Double Sign-off Section */}
          <div className="flex justify-between items-center my-10 px-4 text-xs font-bold text-slate-700 print-avoid-break">
            <div className="text-center">
              <div className="border-b border-slate-300 w-40 sm:w-44 pb-1 mb-1 font-semibold italic text-slate-900 min-h-[24px] flex items-center justify-center">
                {formatVerifierName(attempts.length > 0 ? (attempts[attempts.length - 1].loggedBy || generatedBy) : generatedBy)}
              </div>
              <div>Verifier Signature</div>
            </div>
            <div className="text-center">
              <div className="border-b border-slate-300 w-40 sm:w-44 pb-1 mb-1 font-semibold italic text-[#5b21b6] min-h-[24px] flex items-center justify-center">
                {isVerified ? "VERIFIED" : "IN PROGRESS"}
              </div>
              <div>Verification Status</div>
            </div>
          </div>

          {/* Disclaimer / End of Report Box */}
          <div className="border border-slate-300 rounded-lg p-5 text-[10px] text-slate-600 bg-white font-medium leading-relaxed print-avoid-break">
            <div className="text-center font-bold text-slate-900 mb-2">--END OF REPORT--</div>
            <div className="font-bold text-slate-950 mb-1 uppercase tracking-wider text-[9px]">Important Notice &amp; Disclaimer</div>
            <p className="mb-2">
              This report is provided by CLUSO INFOLINK PRIVATE LIMITED on a strictly confidential basis, solely for the exclusive use of the recipient for legitimate corporate and business purposes. It may not be reproduced, redistributed, or disclosed, in whole or in part, in any manner whatsoever without prior written consent.
            </p>
            <p className="mb-2">
              CLUSO INFOLINK PRIVATE LIMITED endeavors to ensure the highest level of accuracy and diligence in procuring, collecting, and compiling this data. Consequently, CLUSO INFOLINK PRIVATE LIMITED shall not be held liable for any direct, indirect, or consequential loss, damage, or injury resulting from any errors, omissions, or negligence in the procurement or communication of this information. Reliance upon this report is strictly at the user's sole risk.
            </p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <img src="/cluso-logo-long-default.svg" alt="Cluso Infolink" className="h-5 object-contain" />
                <span className="text-[9px] font-bold text-slate-400">Powered by Cluso Infolink Verify</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">Generated: {generatedAtDate}</span>
            </div>
          </div>
          </div>
        </div>
        </div>

        {/* Appendix: Verification Evidence */}
        {(() => {
          const attemptsWithScreenshots = attempts.filter((att: any) => att.screenshot);
          if (attemptsWithScreenshots.length === 0) return null;
          return (
            <div className="print-page-block print-break-before mt-6 print:mt-0 border-t border-slate-200 pt-6">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#5b21b6] mb-4">Appendix: Verification Evidence</h3>
              <div className="space-y-6">
                {attemptsWithScreenshots.map((att: any, idx: number) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 print-avoid-break">
                    <span className="text-[10px] font-bold text-[#5b21b6] uppercase block mb-1.5 tracking-wider">
                      Attachment #{idx + 1} — logged on {att.date} (Mode: {att.verificationMode}, Result: {att.result || att.status})
                    </span>
                    {(att.screenshotCaption || att.caption) && (
                      <p className="text-xs font-extrabold text-[#5b21b6] mb-2 bg-purple-50/80 px-2.5 py-1 rounded-lg border border-purple-200/60 w-fit">
                        Caption: {att.screenshotCaption || att.caption}
                      </p>
                    )}
                    {att.comment && (
                      <p className="text-[10.5px] text-slate-600 font-semibold mb-3">
                        Comment: {att.comment}
                      </p>
                    )}
                    <div className="flex justify-center bg-white border border-slate-200 rounded-lg p-2 max-h-[500px] overflow-hidden">
                      <img src={att.screenshot} alt={att.screenshotCaption || att.caption || `Evidence #${idx + 1}`} className="object-contain max-h-[480px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        {/* Appendix: Degree / Marksheet / Certificate Attachment */}
        {(() => {
          const certs: Array<{ file: string; name: string; course: string }> = [];
          if (verification?.educationData?.certificateFile) {
            certs.push({
              file: verification.educationData.certificateFile,
              name: verification.educationData.certificateFileName || "Degree / Marksheet / Certificate",
              course: verification.educationData.courseName || verification.educationData.boardUniversity || "Declared Academic Credential"
            });
          }
          if (Array.isArray(verification?.educationList)) {
            verification.educationList.forEach((edu: any, idx: number) => {
              if (edu.certificateFile && !certs.some(c => c.file === edu.certificateFile)) {
                certs.push({
                  file: edu.certificateFile,
                  name: edu.certificateFileName || `Degree Certificate #${idx + 1}`,
                  course: edu.courseName || edu.boardUniversity || `Credential #${idx + 1}`
                });
              }
            });
          }
          if (certs.length === 0) return null;
          return (
            <div className="print-page-block print-break-before mt-6 print:mt-0 border-t border-slate-200 pt-6">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#5b21b6] mb-4">
                Appendix: Degree / Marksheet / Certificate Attachment
              </h3>
              <div className="space-y-6">
                {certs.map((certItem, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 print-avoid-break">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-bold text-[#5b21b6] uppercase tracking-wider">
                        Attachment #{idx + 1}: {certItem.name}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">{certItem.course}</span>
                    </div>
                    <div className="flex justify-center bg-white border border-slate-200 rounded-lg p-2 overflow-hidden">
                      {certItem.file.startsWith("data:application/pdf") ? (
                        <iframe src={certItem.file} className="w-full h-[600px] border-0 rounded" title={certItem.name} />
                      ) : (
                        <img src={certItem.file} alt={certItem.name} className="object-contain max-h-[600px] w-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default function EducationReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
          <div className="w-10 h-10 border-4 border-[#5b21b6] border-t-transparent rounded-full animate-spin"></div>
          <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Loading...</span>
        </div>
      }
    >
      <EducationReportContent />
    </Suspense>
  );
}
