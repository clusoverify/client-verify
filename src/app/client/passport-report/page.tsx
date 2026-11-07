"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import OzcluLogo from "../../components/OzcluLogo";

function PassportReportContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ verification: any; settings: any } | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No Verification ID provided.");
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
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Generating Passport Check Report...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">!</div>
        <h2 className="text-lg font-bold text-slate-800 font-sans">Report Generation Failed</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md">{error || "Could not retrieve verification details."}</p>
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
  const reportNo = verification.id || "PAS-UNKNOWN";
  const pData = verification.passportData || {};

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

  const maskDob = (dobStr: string) => {
    if (!dobStr) return "—";
    const match = dobStr.match(/\b\d{4}\b/);
    if (!match) return "xx/xx/xxxx";
    return `xx/xx/${match[0]}`;
  };

  const generatedAtDate = verification.createdAt
    ? new Date(verification.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase()
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase();

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
            border: 5px double #8B0000 !important;
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
            border: 3px double #8B0000;
            pointer-events: none;
            z-index: 9999;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Floating Toolbar */}
      <div className="no-print print:hidden w-full max-w-[800px] bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800">Passport Verification Report Viewer</span>
          <span className="text-xs text-slate-500">Ready to save or export as official A4 PDF document.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0284c7] text-white rounded-lg font-bold text-xs hover:bg-[#0369a1] cursor-pointer shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span>Generate PDF</span>
          </button>
          <button
            onClick={() => window.close()}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-50 cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Per-page border frame (repeats on every printed page via position:fixed) */}
      <div className="print-page-border hidden print:block" aria-hidden="true" />

      {/* Main Report Container */}
      <div className="print-card w-full max-w-[800px] bg-white border-[4px] border-double border-[#8B0000] p-8 sm:p-10 shadow-lg relative my-0 mx-auto print:shadow-none print:p-4 print:max-w-full print:w-full">
        
        {/* Page Block */}
        <div className="print-page-block">
          
          {/* Top Header */}
          <div className="grid grid-cols-3 items-center gap-4 mb-8 border-b border-slate-200 pb-6">
            <div className="flex justify-start">
              {settings && settings.logo ? (
                <div className="w-28 h-14 sm:w-36 sm:h-16 flex items-center justify-start shrink-0">
                  <img src={settings.logo} alt="Company Logo" className="object-contain max-h-full max-w-full" />
                </div>
              ) : (
                <div className="w-28 h-14 sm:w-36 sm:h-16 flex items-center justify-start shrink-0">
                  <img src="/cluso-logo-long-default.svg" alt="Cluso Infolink Logo" className="object-contain max-h-full" />
                </div>
              )}
            </div>
            <h1 className="text-center font-sans text-[#8B0000] text-xl sm:text-2xl font-extrabold tracking-widest uppercase mt-2 leading-tight">
              PASSPORT CHECK<br />REPORT
            </h1>
            <div className="text-right text-[11px] sm:text-xs font-bold text-slate-800 space-y-0.5">
              <div>Report #: <span className="font-mono text-slate-900">{reportNo}</span></div>
              <div>Date: <span className="text-slate-900">{formatDate(verification.createdAt || verification.date)}</span></div>
            </div>
          </div>

          {/* Boxed Metadata Card */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 mb-6">
            <div className="space-y-1.5">
              <div>Report Number: <span className="font-mono font-bold text-slate-900">{reportNo}</span></div>
              <div>Request Created: <span className="text-slate-900 font-mono">{verification.date}</span></div>
              <div>
                Overall Status:{" "}
                <span className="font-bold uppercase text-emerald-600">
                  COMPLETED / VERIFIED
                </span>
              </div>
            </div>
            <div className="space-y-1.5 sm:text-right flex flex-col sm:items-end justify-between">
              <div>Generated At: <span className="text-slate-900 font-mono">{generatedAtDate}</span></div>
              <div className="flex items-center gap-2 mt-1 sm:justify-end">
                <span className="text-[11px] text-slate-500 font-semibold">Verified Through:</span>
                <img src="/passport-seva-logo.png" alt="Passport Seva - Ministry of External Affairs, Govt of India" className="h-6 object-contain" />
              </div>
            </div>
          </div>

          {/* Candidate & Company Details Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 border-b border-slate-200 pb-6">
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#8B0000] border-b border-slate-200 pb-1 mb-2">Candidate Details</h3>
              <div className="space-y-1.5 text-xs">
                <div><span className="text-slate-500 font-semibold">Full Name:</span> <span className="font-bold text-slate-800">{pData.givenName && pData.givenName !== "—" ? `${pData.givenName} ${pData.surname || ""}` : verification.name}</span></div>
                <div><span className="text-slate-500 font-semibold">Passport File Number:</span> <span className="font-mono font-bold text-slate-900">{pData.fileNumber || "—"}</span></div>
                <div><span className="text-slate-500 font-semibold">Date of Birth:</span> <span className="font-semibold text-slate-800 font-mono">{maskDob(pData.dateOfBirth)}</span></div>
              </div>
            </div>
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#8B0000] border-b border-slate-200 pb-1 mb-2">Company Details</h3>
              <div className="space-y-1.5 text-xs">
                <div><span className="text-slate-500 font-semibold">Requesting Org:</span> <span className="font-bold text-slate-800">{verification.requestingOrgName || verification.orgName || "Client"}</span></div>
                <div><span className="text-slate-500 font-semibold">Client Org:</span> <span className="font-semibold text-slate-800">{verification.orgName || "Enterprise"}</span></div>
              </div>
            </div>
          </div>

          {/* Passport Verification Details Table */}
          <div className="mb-8 print-avoid-break">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#8B0000]">Passport Verification Details</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registry Authority:</span>
                <img src="/passport-seva-logo.png" alt="Passport Seva" className="h-5 object-contain" />
              </div>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5 border-r border-slate-200 w-5/12">Verification Parameter</th>
                    <th className="p-2.5">Audit Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold">
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Verification Authority</td>
                    <td className="p-2.5 font-bold text-slate-800 text-xs">Passport Seva (Ministry of External Affairs, Govt of India)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Given Name</td>
                    <td className="p-2.5 font-bold text-slate-900">{pData.givenName || verification.name || "—"}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Surname</td>
                    <td className="p-2.5 font-bold text-slate-900">{pData.surname || "—"}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Passport File Number</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">{pData.fileNumber || "—"}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Date of Birth</td>
                    <td className="p-2.5 font-semibold text-slate-900 font-mono">{maskDob(pData.dateOfBirth)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Application Service Type</td>
                    <td className="p-2.5">{pData.typeOfApplication || "Normal"}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Application Received Date</td>
                    <td className="p-2.5">{pData.applicationReceivedDate || "—"}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 bg-slate-50/50">Verification Result</td>
                    <td className="p-2.5 font-bold text-emerald-600 uppercase">OFFICIAL RECORD MATCH / CLEAR</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer & Footer */}
          <div className="border-t border-slate-200 pt-6 mt-8 text-[9px] sm:text-[10px] text-slate-500 leading-relaxed print-avoid-break print:mt-auto">
            <p className="font-bold uppercase tracking-wider mb-1 text-slate-700">Disclaimer & Verification Compliance</p>
            <p className="font-semibold">
              This report is electronically generated by Cluso Infolink Background Screening & Verification Division based on official passport registry verification records. The information contained herein has been validated against candidate-submitted passport credentials under standard audit compliance procedures.
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-4 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              <div>Verification ID: {reportNo}</div>
              <div className="font-mono">Hash: {reportNo}-{Date.now().toString(36).toUpperCase()}</div>
            </div>
          </div>

        </div>

        {/* Appendix: ID Proof Attachment */}
        {(() => {
          const file = verification?.idProofFile || verification?.passportData?.idProofFile;
          const fileName = verification?.idProofFileName || verification?.passportData?.idProofFileName || "Passport ID Proof";
          if (!file) return null;
          return (
            <div className="print-page-block print-break-before mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1B365D] mb-4">
                Appendix: ID Proof Attachment
              </h3>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 print-avoid-break">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                  <span className="text-[10px] font-bold text-[#1B365D] uppercase tracking-wider">
                    Attachment: {fileName}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">Candidate Submitted ID Proof</span>
                </div>
                <div className="flex justify-center bg-white border border-slate-200 rounded-lg p-2 overflow-hidden">
                  {file.startsWith("data:application/pdf") ? (
                    <iframe src={file} className="w-full h-[600px] border-0 rounded" title={fileName} />
                  ) : (
                    <img src={file} alt={fileName} className="object-contain max-h-[600px] w-full" />
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Appendix: Verification Evidence */}
        {(() => {
          const attemptsWithScreenshots = (verification?.verificationAttempts || verification?.employmentAttempts || verification?.educationAttempts || []).filter((att: any) => att.screenshot);
          if (!attemptsWithScreenshots || attemptsWithScreenshots.length === 0) return null;
          return (
            <div className="print-page-block print-break-before mt-6 print:mt-0 border-t border-slate-200 pt-6">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1B365D] mb-4">Appendix: Verification Evidence &amp; Screenshots</h3>
              <div className="space-y-6">
                {attemptsWithScreenshots.map((att: any, idx: number) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 print-avoid-break">
                    <span className="text-[10px] font-bold text-[#1B365D] uppercase block mb-1.5 tracking-wider">
                      Attachment #{idx + 1} — logged on {att.date} (Mode: {att.verificationMode || "Manual"}, Result: {att.result || att.status || "Completed"})
                    </span>
                    {(att.screenshotCaption || att.caption) && (
                      <p className="text-xs font-extrabold text-slate-800 mb-2 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/60 w-fit">
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
      </div>
    </div>
  );
}

export default function PassportReportPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="w-10 h-10 border-4 border-[#1B365D] border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Loading Passport Report...</span>
      </div>
    }>
      <PassportReportContent />
    </Suspense>
  );
}
