"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import OzcluLogo from "../../components/OzcluLogo";

function InterpolReportContent() {
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Generating Interpol Report...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">!</div>
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
  const reportNo = verification.id || "INT-UNKNOWN";

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return String(dateStr);
    }
  };

  const generatedAtDate = verification.interpolCompletedAt
    ? new Date(verification.interpolCompletedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase()
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase();

  const hasRecords = verification.interpolHasRecords === true;
  const matches = verification.interpolMatches || [];

  const verdictColor = hasRecords ? "text-rose-700" : "text-emerald-700";
  const verdictBg = hasRecords ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200";
  const verdictText = hasRecords
    ? `${matches.length} Similarity Match(es) Found`
    : "No Similarity Matches Found (Clear Record)";

  const maskDob = (dobStr?: string) => {
    if (!dobStr) return "xx/xx/xxxx";
    const yearMatch = dobStr.match(/\d{4}/);
    return yearMatch ? `xx/xx/${yearMatch[0]}` : dobStr;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-[#181d16] print:bg-white print:p-0 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-start font-sans">
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
            border: 5px double #1e3a8a !important;
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
        }
      `}</style>

      {/* Print Control Toolbar */}
      <div className="no-print print:hidden w-full max-w-[800px] bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800">Interpol Database Check Report</span>
          <span className="text-xs text-slate-500">Ready to save, print or review.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#181d16] text-white rounded-lg font-bold text-xs hover:bg-[#1E293B] cursor-pointer shadow-xs transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
            Close
          </button>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="print-card w-full max-w-[800px] bg-white border-[6px] border-double border-[#1e3a8a] p-8 sm:p-10 shadow-lg relative my-0 mx-auto print:shadow-none print:p-8 print:max-w-full print:w-full">
        
        {/* Page Block */}
        <div className="print-page-block">
          {/* Header */}
        <div className="grid grid-cols-3 items-center gap-4 mb-8 border-b-2 border-slate-100 pb-6">
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
          <h1 className="text-center font-sans text-[#1e3a8a] text-lg sm:text-xl font-extrabold tracking-widest uppercase mt-2 leading-tight">
            INTERPOL DATABASE<br />CHECK REPORT
          </h1>
          <div className="text-right text-[11px] sm:text-xs font-bold text-slate-800 space-y-0.5">
            <div>Report #: <span className="font-mono text-slate-900">{reportNo}</span></div>
            <div>Date: <span className="text-slate-900">{formatDate(verification.interpolCompletedAt || verification.date)}</span></div>
          </div>
        </div>

        {/* Metadata Card */}
        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 mb-6">
          <div className="space-y-1.5">
            <div>Report Number: <span className="font-mono font-bold text-slate-900">{reportNo}</span></div>
            <div>Request Created: <span className="text-slate-900 font-mono">{verification.date}</span></div>
            <div>Search Status: <span className="font-bold text-emerald-600 uppercase">COMPLETED</span></div>
          </div>
          <div className="space-y-1.5 sm:text-right">
            <div>Generated At: <span className="text-slate-900 font-mono">{generatedAtDate}</span></div>
            <div>Verified By: <span className="text-slate-900 font-bold">Cluso Infolink Verify</span></div>
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <span className="text-slate-500">Verified Through:</span>
              <img src="/Notice-removebg-preview.png" alt="Notice Authority" className="h-6 object-contain" />
            </div>
          </div>
        </div>

        {/* Candidate & Request Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 border-b border-slate-100 pb-6">
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1e3a8a] border-b border-slate-200 pb-1 mb-2">Candidate Details</h3>
            <div className="space-y-1.5 text-xs">
              <div><span className="text-slate-500 font-semibold">Full Name:</span> <span className="font-bold text-slate-800">{verification.name || "Suresh Kumar"}</span></div>
              <div><span className="text-slate-500 font-semibold">Date of Birth:</span> <span className="font-semibold text-slate-800">{maskDob(verification.candidateDob || "13 Jun 2000")}</span></div>
              <div><span className="text-slate-500 font-semibold">Place of Birth (City):</span> <span className="font-semibold text-slate-800">{verification.birthCity || "Not Provided"}</span></div>
            </div>
          </div>
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1e3a8a] border-b border-slate-200 pb-1 mb-2">Request Details</h3>
            <div className="space-y-1.5 text-xs">
              <div><span className="text-slate-500 font-semibold">Requesting Org:</span> <span className="font-bold text-slate-800">{verification.requestingOrgName || verification.orgName}</span></div>
              <div><span className="text-slate-500 font-semibold">Client Org:</span> <span className="font-bold text-slate-800">{verification.orgName || verification.requestingOrgName || "Cluso Infolink"}</span></div>
            </div>
          </div>
        </div>

        {/* Overall Verdict Card */}
        <div className={`mb-8 p-6 border-2 rounded-xl ${verdictBg} print-avoid-break relative overflow-hidden`}>
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="space-y-2 text-center md:text-left flex-1">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#1e3a8a]">Status:</span>
                <span className={`px-3 py-0.5 rounded-full font-extrabold text-xs tracking-wide uppercase ${hasRecords ? "bg-rose-700 text-white" : "bg-emerald-700 text-white"}`}>
                  {hasRecords ? "Failed" : "Passed"}
                </span>
              </div>
              
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 justify-center md:justify-start">
                <span>Issued by:</span>
                <span className="font-extrabold text-[#1e3a8a]">Cluso Infolink Verify</span>
              </div>

              <p className="text-xs text-slate-700 font-semibold leading-relaxed max-w-[560px] mt-2 bg-white/80 p-3 rounded-lg border border-slate-200/60 shadow-2xs">
                {hasRecords
                  ? "Similarity matches or notices were detected in the database check query."
                  : "The check query matched the candidate details against records consisting of Central Bureau of Investigation (CBI) Announced Rewards lists, Interpol Red Notices, and Interpol Yellow Notices. No similarity matches or notices were detected."}
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <img src="/Notice-removebg-preview.png" alt="Notice Authority" className="h-14 object-contain" />
              <span className="text-[9px] font-extrabold text-[#1e3a8a] uppercase tracking-wider mt-1">Verified Authority</span>
            </div>
          </div>
        </div>

        {hasRecords && (
          /* Notice List Display if MATCHES FOUND */
          <div className="space-y-6 mb-8 print-avoid-break">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1e3a8a] mb-2 flex items-center gap-1.5">
              <span>Potential Database Match Details</span>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] rounded-md font-bold">{matches.length} Record(s)</span>
            </h3>
            
            {matches.map((match: any, index: number) => {
              const noticeTypeLabel = match.noticeType === "red_notice" 
                ? "Interpol Red Notice" 
                : match.noticeType === "yellow_notice" 
                ? "Interpol Yellow Notice" 
                : "CBI Announced Reward";

              const typeBadgeColor = match.noticeType === "red_notice"
                ? "bg-rose-100 text-rose-800 border-rose-200"
                : match.noticeType === "yellow_notice"
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : "bg-blue-100 text-blue-800 border-blue-200";

              return (
                <div key={index} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all duration-300">
                  {/* Match Header Bar */}
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center bg-rose-50 border border-rose-100 rounded-lg text-xs font-bold text-rose-700">
                        {index + 1}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-lg uppercase tracking-wide ${typeBadgeColor}`}>
                        {noticeTypeLabel}
                      </span>
                    </div>
                    {match.noticeId && (
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        ID: {match.noticeId}
                      </span>
                    )}
                  </div>

                  {/* Match Details Grid */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                    <div className="space-y-1.5">
                      <div>Name in notice: <span className="text-slate-900 font-bold uppercase">{typeof match.name === "string" ? match.name : String(match.name || "")}</span></div>
                      <div>Date of Birth: <span className="text-slate-900 font-mono">{typeof match.dateOfBirth === "string" ? match.dateOfBirth : String(match.dateOfBirth || "Not Specified")}</span></div>
                      {match.placeOfBirth && typeof match.placeOfBirth === "string" && (
                        <div>Place of Birth / Address: <span className="text-slate-900">{match.placeOfBirth}</span></div>
                      )}
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-between sm:items-end">
                      {match.link && (
                        <button
                          onClick={() => window.open(match.link, "_blank")}
                          className="w-fit px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-all cursor-pointer text-[10px] inline-flex items-center gap-1"
                        >
                          <span>View Official Notice</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Charges Box for Red Notices & CBI Rewards */}
                  {match.details?.arrest_warrants && match.details.arrest_warrants.length > 0 && (
                    <div className="px-4 pb-4">
                      <div className="border border-rose-100 rounded-lg bg-rose-50/20 p-3">
                        <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block mb-1">Arrest Warrant Charges:</span>
                        <p className="text-xs text-rose-950 font-medium whitespace-pre-line leading-relaxed">
                          {match.details.arrest_warrants.map((w: any) => typeof w.charge === "string" ? w.charge : JSON.stringify(w.charge || "")).join("\n")}
                        </p>
                      </div>
                    </div>
                  )}

                  {match.details?.details && typeof match.details.details === "string" && match.details.details.trim() !== "" && (
                    <div className="px-4 pb-4">
                      <div className="border border-blue-100 rounded-lg bg-blue-50/10 p-3">
                        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">Case Details:</span>
                        <p className="text-xs text-blue-950 font-medium leading-relaxed">
                          {match.details.details}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer/Disclaimer */}
        <div className="border-t border-slate-200 pt-6 mt-8 text-[9px] sm:text-[10px] text-slate-500 leading-relaxed print-avoid-break print:mt-auto">
          <p className="font-bold uppercase tracking-wider mb-1 text-slate-700">Disclaimer & Data Limitations</p>
          <p className="font-semibold">
            This verification check is a database-level query matching candidate details against publicly available notifications issued by the CBI and Interpol, as compiled on July 20, 2026. This search does not constitute an active physical or biometric verification. False positives may occur due to similar name phonetics or name sequences; client discretion is advised. Clean results indicate no matching notice records were found at the time of query.
          </p>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-4 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            <div>Verification ID: {reportNo}</div>
            <div>Powered by Cluso Infolink Integrity Network</div>
          </div>
        </div>

        </div>

        {/* Appendix: ID Proof Attachment */}
        {(() => {
          const file = verification?.idProofFile;
          const fileName = verification?.idProofFileName || "ID Proof Attachment";
          if (!file) return null;
          return (
            <div className="print-page-block print-break-before mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1e3a8a] mb-4">
                Appendix: ID Proof Attachment
              </h3>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 print-avoid-break">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                  <span className="text-[10px] font-bold text-[#1e3a8a] uppercase tracking-wider">
                    Attachment: {fileName}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">Submitted ID Proof</span>
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
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1e3a8a] mb-4">Appendix: Verification Evidence &amp; Screenshots</h3>
              <div className="space-y-6">
                {attemptsWithScreenshots.map((att: any, idx: number) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 print-avoid-break">
                    <span className="text-[10px] font-bold text-[#1e3a8a] uppercase block mb-1.5 tracking-wider">
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

export default function InterpolReport() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Loading Report...</span>
      </div>
    }>
      <InterpolReportContent />
    </Suspense>
  );
}
