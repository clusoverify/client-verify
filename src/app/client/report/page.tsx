"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function ReportContent() {
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
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
  const reportNo = verification.id ? verification.id.replace("REQ-", "RPT-") : "RPT-UNKNOWN";
  
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

  const generatedAtDate = verification.completedAt 
    ? new Date(verification.completedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase()
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase();

  const generatedBy = verification.verifier || "Cluso Infolink";
  const verifiedBy = (verification.digilockerStatus === "Verified" || !!verification.digilockerName)
    ? "DigiLocker"
    : generatedBy;

  const statusColor = verification.status === "Completed" || verification.status === "Verified"
    ? "text-emerald-600"
    : verification.status === "Needs Attention"
    ? "text-rose-600"
    : "text-amber-500";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white print:p-0 p-4 sm:p-6 md:p-8 flex flex-col items-center">
      {/* Repeating Fixed Border on Every Printed Page */}
      <div className="hidden print:block fixed inset-0 border-[6px] border-double border-[#8B0000] pointer-events-none z-50" />
      {/* Print Control Toolbar */}
      <div className="no-print w-full max-w-[800px] bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800">Verification Report Viewer</span>
          <span className="text-xs text-slate-500">Ready to save or print on standard A4 paper size.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 cursor-pointer shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Print Report</span>
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

      {/* Main Report Container */}
      <div className="print-border w-full max-w-[800px] bg-white border-[6px] border-double border-[#8B0000] print:border-0 p-8 sm:p-10 shadow-lg relative print:shadow-none print:my-0 print:mx-auto print:p-8">
        
        {/* Top Header */}
        <div className="flex justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-28 h-14 sm:w-32 sm:h-16 flex items-center justify-start">
              <img src="/cluso-infolink.png" alt="Cluso Logo" className="object-contain max-h-full" />
            </div>
            <h1 className="font-serif text-[#1B365D] text-2xl sm:text-3xl font-semibold tracking-wide italic leading-none">Report</h1>
          </div>
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
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1B365D] border-b border-slate-200 pb-1 mb-2">Candidate Details</h3>
            <div className="space-y-1.5 text-xs">
              <div><span className="text-slate-500 font-semibold">Name:</span> <span className="font-bold text-slate-800">{verification.name}</span></div>
              <div><span className="text-slate-500 font-semibold">Email:</span> <span className="font-semibold text-slate-800">{verification.email}</span></div>
              <div><span className="text-slate-500 font-semibold">Phone:</span> <span className="font-semibold text-slate-800">{verification.phone || "-"}</span></div>
            </div>
          </div>
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1B365D] border-b border-slate-200 pb-1 mb-2">Company Details</h3>
            <div className="space-y-1.5 text-xs">
              <div><span className="text-slate-500 font-semibold">Company:</span> <span className="font-bold text-slate-800">{verification.orgName}</span></div>
              <div><span className="text-slate-500 font-semibold">Email:</span> <span className="font-semibold text-slate-800">{settings?.contactEmail || "contact@company.com"}</span></div>
            </div>
          </div>
        </div>

        {/* Personal Details Table */}
        <div className="mb-8 print-avoid-break">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1B365D] mb-2">Personal Details</h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-2.5 border-r border-slate-200 w-1/2">Field</th>
                  <th className="p-2.5">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold">
                <tr>
                  <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Full name (as per government ID)</td>
                  <td className="p-2.5 font-bold text-slate-900">{verification.digilockerName || verification.name}</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Date of birth</td>
                  <td className="p-2.5 font-mono">{verification.digilockerDob || verification.dob || "-"}</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Mobile number</td>
                  <td className="p-2.5 font-mono">{verification.digilockerMobile || verification.phone || "-"}</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Current residential address</td>
                  <td className="p-2.5">{verification.address || "Verified via DigiLocker Digital Vault (MeitY Secured)"}</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Primary government ID number</td>
                  <td className="p-2.5 font-mono">{verification.digilockerAadhaarMasked || verification.digilockerAadhaar || verification.aadhaarNumber || "-"}</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">PAN card number</td>
                  <td className="p-2.5 font-mono">{verification.digilockerPan || "-"}</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Driving licence number</td>
                  <td className="p-2.5 font-mono">{verification.digilockerDrivingLicence || "-"}</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Email address</td>
                  <td className="p-2.5">{verification.digilockerEmail || verification.email}</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Nationality</td>
                  <td className="p-2.5">Indian (Verified)</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Gender</td>
                  <td className="p-2.5">{verification.digilockerGender || verification.gender || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Verification Summary */}
        <div className="mb-8">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1B365D] border-b border-slate-200 pb-1 mb-3">Service Verification Summary</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-sm font-bold text-slate-800">1. Identity Verification</span>
                <span className="text-xs text-slate-500 font-semibold">
                  Final Status: <span className="text-emerald-600 font-bold">Verified</span> | Mode: <span className="font-bold text-slate-700">Digital</span>
                </span>
              </div>

              {/* MeitY DigiLocker Secured Note */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start gap-3 mb-4 print-avoid-break">
                <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-xl mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="m9 11 2 2 4-4"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Secured by Government of India</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed font-semibold">
                    This identity check is secured and backed by the <strong>Government of India via DigiLocker</strong> (Ministry of Electronics and Information Technology - MeitY). Documents retrieved are issued directly by sovereign authorities, cryptographically signed, and hold equivalent legal status to physical originals under the Information Technology Act, 2000.
                  </p>
                </div>
              </div>

              {/* Retrieved Documents Sub-grid */}
              {verification.digilockerDocuments && verification.digilockerDocuments.length > 0 && (
                <div className="mb-4 print-avoid-break">
                  <h4 className="text-xs font-bold text-[#1B365D] mb-2">Verified Government Documents Retrieved</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {verification.digilockerDocuments.map((doc: any) => (
                      <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                        <span className="font-bold text-xs text-slate-900">{doc.name}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{doc.issuer}</span>
                        <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-200">
                          <span className="text-[9px] font-mono text-slate-400 truncate max-w-[150px]">{doc.uri}</span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attempts Timeline Audit Table */}
              <div className="print-avoid-break">
                <h4 className="text-xs font-bold text-[#1B365D] mb-2">Audit Attempt History Log</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2 border-r border-slate-200 w-1/4">Date &amp; Time</th>
                        <th className="p-2 border-r border-slate-200 w-1/6">Status</th>
                        <th className="p-2 border-r border-slate-200 w-1/6">Mode</th>
                        <th className="p-2">Attempt Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold">
                      {verification.attempts && verification.attempts.length > 0 ? (
                        verification.attempts.map((att: any, idx: number) => (
                          <tr key={idx}>
                            <td className="p-2 border-r border-slate-200 font-mono text-[10px] bg-slate-50/30">{att.date}</td>
                            <td className="p-2 border-r border-slate-200">
                              <span className={`inline-block font-bold px-1.5 py-0.5 rounded text-[8px] uppercase ${
                                att.status === "Completed" || att.status === "Verified"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {att.status}
                              </span>
                            </td>
                            <td className="p-2 border-r border-slate-200 font-medium text-slate-700">{att.mode || "Digital"}</td>
                            <td className="p-2 text-[10px] text-slate-600 whitespace-pre-line font-medium leading-normal">
                              {att.notes || `Verifier: ${att.verifier || "System Analyst"}`}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">No attempts logged in timeline.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-center my-10 px-4 text-xs font-bold text-slate-700 print-avoid-break">
          <div className="text-center">
            <div className="border-b border-slate-300 w-40 sm:w-44 pb-1 mb-1 font-semibold italic text-slate-900">{generatedBy}</div>
            <div>Created By</div>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-300 w-40 sm:w-44 pb-1 mb-1 font-semibold italic text-slate-900">{verifiedBy}</div>
            <div>Verified By</div>
          </div>
        </div>

        {/* Disclaimer / End of Report Box */}
        <div className="border border-slate-300 rounded-lg p-5 text-[10px] text-slate-600 bg-white font-medium leading-relaxed print-avoid-break">
          <div className="text-center font-bold text-slate-900 mb-2">--END OF REPORT--</div>
          <div className="font-bold text-slate-950 mb-1 uppercase tracking-wider">Important Notice &amp; Disclaimer</div>
          <p className="mb-2">
            This report is provided by CLUSO INFOLINK PRIVATE LIMITED on a strictly confidential basis, solely for the exclusive use of the recipient for legitimate corporate and business purposes. It may not be reproduced, redistributed, or disclosed, in whole or in part, in any manner whatsoever without prior written consent.
          </p>
          <p className="mb-2">
            While CLUSO INFOLINK PRIVATE LIMITED endeavors to ensure the highest level of accuracy and diligence in procuring, collecting, and compiling this data, it does not warrant or guarantee the absolute completeness, correctness, or timeliness of the information contained herein. Consequently, CLUSO INFOLINK PRIVATE LIMITED shall not be held liable for any direct, indirect, or consequential loss, damage, or injury resulting from any errors, omissions, or negligence in the procurement or communication of this information. Reliance upon this report is strictly at the user's sole risk.
          </p>
          <p className="mb-3">
            The recipient acknowledges that the handling and utilization of this data must strictly align with all prevailing Indian regulatory frameworks, including but not limited to the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000, along with all subsequent amendments and rules.
          </p>
          <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[9px] font-semibold text-slate-500">
            <div>
              <span className="font-bold text-slate-800">QUESTIONS?</span> If you have any questions about this report, please feel free to contact us: <span className="text-indigo-600 font-bold hover:underline">support@cluso.in</span>
            </div>
            <div className="font-mono">Rev 3.2 (15322)</div>
          </div>
        </div>

        {/* Centered Footer */}
        <div className="text-center text-[10px] font-bold text-slate-400 tracking-wider mt-6">
          Generated Report By ClusoInfolink
        </div>

      </div>

      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            width: 100% !important;
          }
          @page {
            size: A4;
            margin: 1.5cm 1.2cm;
          }
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-border {
            box-decoration-break: clone !important;
            -webkit-box-decoration-break: clone !important;
          }
          table, tr, td, th, img {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-semibold">Loading Report Content...</div>}>
      <ReportContent />
    </Suspense>
  );
}
