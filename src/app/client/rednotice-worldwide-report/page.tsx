"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import OzcluLogo from "../../components/OzcluLogo";

function RednoticeWorldwideReportContent() {
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
        <div className="w-10 h-10 border-4 border-rose-700 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Generating Worldwide Red Notice Report...</span>
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
  const reportNo = verification.id || "RNW-UNKNOWN";

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

  const generatedAtDate = verification.rednoticeWorldwideCompletedAt
    ? new Date(verification.rednoticeWorldwideCompletedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase()
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase();

  const hasRecords = verification.rednoticeWorldwideHasRecords === true || (verification.rednoticeWorldwideMatches && verification.rednoticeWorldwideMatches.length > 0);
  const matches = verification.rednoticeWorldwideMatches || [];

  const verdictColor = hasRecords ? "text-rose-700" : "text-emerald-700";
  const verdictBg = hasRecords ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200";
  const verdictText = hasRecords
    ? `${matches.length} Similarity Match(es) Found Across Global Red Notices`
    : "No Similarity Matches Found (Clear Worldwide Record)";

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
            border: 5px double #9f1239 !important;
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
          <span className="text-sm font-bold text-slate-800">Red Notice Worldwide Check Report</span>
          <span className="text-xs text-slate-500">Screened against 196 INTERPOL Member Countries</span>
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
        </div>
      </div>

      {/* Report Document Sheet (Page 1) */}
      <div className="print-card w-full max-w-[800px] bg-white shadow-xl rounded-none border border-slate-200 text-slate-800 flex flex-col font-sans mb-8">
        <div className="print-page-block p-8 md:p-12 relative flex-1 flex flex-col justify-between">
          <div>
            {/* Header / Brand Block */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
              <div className="flex flex-col">
                <OzcluLogo />
                <span className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold mt-1">
                  Global Background Screening &amp; International Risk Solutions
                </span>
              </div>
              <div className="flex items-center gap-4">
                <img 
                  src="/interpol-rednotice-banner.jpg" 
                  alt="Interpol Red Notice" 
                  className="h-14 w-auto rounded-lg shadow-sm border border-rose-300 object-contain hidden sm:block" 
                />
                <div className="text-right">
                  <h1 className="text-xl md:text-2xl font-black text-rose-950 tracking-tight uppercase">
                    RED NOTICE WORLDWIDE<br />CHECK REPORT
                  </h1>
                  <div className="text-xs text-slate-500 mt-1 font-mono">
                    <div>Report ID: <span className="font-bold text-slate-800">{reportNo}</span></div>
                    <div>Date: <span className="text-slate-900">{formatDate(verification.rednoticeWorldwideCompletedAt || verification.date)}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate & Requesting Organization Info */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Candidate &amp; Verification Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Candidate Name</span>
                  <span className="font-bold text-slate-800 text-sm">{verification.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Date of Birth</span>
                  <span className="font-bold text-slate-800">{maskDob(verification.candidateDob)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Place / Country of Birth</span>
                  <span className="font-bold text-slate-800">{verification.birthCity || "Not Provided"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Requesting Organization</span>
                  <span className="font-bold text-slate-800">{verification.requestingOrgName || verification.orgName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Database Scope</span>
                  <span className="font-bold text-rose-800">196 INTERPOL Member Countries</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Verification Timestamp</span>
                  <span className="font-bold text-slate-800">{generatedAtDate} IST</span>
                </div>
              </div>
            </div>

            {/* Final Verdict Banner */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Official Screening Result</h3>
              <div className={`p-5 rounded-lg border flex items-center justify-between ${verdictBg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white ${hasRecords ? "bg-rose-600" : "bg-emerald-600"}`}>
                    {hasRecords ? "!" : "✓"}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Overall Status</span>
                    <span className={`text-base font-black tracking-tight ${verdictColor}`}>
                      {verdictText}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Verification Method</span>
                    <span className="text-xs font-bold text-slate-700">Official Red Notices API &amp; Central Registry</span>
                  </div>
                  <img 
                    src="/interpol-rednotice-banner.jpg" 
                    alt="Interpol Red Notice" 
                    className="h-10 w-auto rounded shadow-2xs border border-rose-200 object-contain" 
                  />
                </div>
              </div>
            </div>

            {/* Scope / Sources Description */}
            <div className="mb-6 p-4 bg-rose-50/40 border border-rose-100 rounded-lg text-xs leading-relaxed text-slate-700">
              <strong className="text-rose-950 font-bold">Screening Methodology:</strong> Candidate name and birth details were cross-referenced against the central database of active Interpol Red Notices published by the International Criminal Police Organization (INTERPOL General Secretariat) across all 196 member countries ([https://www.interpol.int/en/How-we-work/Notices/Red-Notices/View-Red-Notices](https://www.interpol.int/en/How-we-work/Notices/Red-Notices/View-Red-Notices)).
            </div>

            {/* Record Summary Box */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Verification Summary Details</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed font-sans">
                {hasRecords
                  ? `Attention: The check query returned ${matches.length} active Red Notice record match(es) or close name/birth similarity in the Interpol Worldwide Red Notices repository. Review details below.`
                  : "The search query matched candidate details against records consisting of active Red Notices issued by Interpol member police jurisdictions worldwide. No active international Red Notices or fugitive alerts were found matching the candidate."}
              </div>
            </div>

            {/* Disclaimers & Certification Sign-Off */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
              <p className="mb-2">
                <strong>Disclaimer:</strong> This report reflects data retrieved directly from official international notice registries at the time of inquiry. An Interpol Red Notice is a request to law enforcement worldwide to locate and provisionally arrest a person pending extradition, surrender, or similar legal action; it is not an international arrest warrant.
              </p>
              <div className="flex justify-between items-end mt-4 pt-2 border-t border-slate-100">
                <div>
                  <span className="font-bold text-slate-600 block">CLUSO INFOLINK VERIFICATION SERVICES</span>
                  <span>Digitally Generated &amp; Cryptographically Logged Record</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-slate-400">Ref: {reportNo}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page 2 / Subsequent Pages for Matches (if any) */}
      {hasRecords && (
        <div className="print-card w-full max-w-[800px] bg-white shadow-xl rounded-none border border-slate-200 text-slate-800 flex flex-col font-sans mb-8 print-break-before">
          <div className="print-page-block p-8 md:p-12 relative flex-1 flex flex-col justify-between">
            <div>
              {/* Header on Page 2 */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <OzcluLogo />
                  <span className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold block mt-1">
                    Red Notice Worldwide Matching Records
                  </span>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono">
                  <div>Report ID: <span className="font-bold text-slate-800">{reportNo}</span></div>
                  <div>Candidate: <span className="font-bold text-slate-800">{verification.name}</span></div>
                </div>
              </div>

              <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wider mb-4">
                Interpol Red Notice Similarity Matches ({matches.length})
              </h2>

              <div className="flex flex-col gap-4">
                {matches.map((m: any, idx: number) => {
                  const warrants = m.arrestWarrants || [];
                  return (
                    <div key={idx} className="p-4 border border-rose-200 bg-rose-50/20 rounded-lg text-xs print-avoid-break">
                      <div className="flex justify-between items-start border-b border-rose-200/60 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-rose-700 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                            Match #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{m.name || `${m.forename || ""} ${m.surname || ""}`.trim() || "Unknown"}</span>
                        </div>
                        {m.entityId && (
                          <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Entity ID: {m.entityId}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Date of Birth</span>
                          <span className="font-bold text-slate-800">{m.dateOfBirth || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Place of Birth</span>
                          <span className="font-bold text-slate-800">{m.placeOfBirth || m.countryOfBirthId || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Nationalities</span>
                          <span className="font-bold text-slate-800">
                            {Array.isArray(m.nationalities) ? m.nationalities.join(", ") : (m.nationalities || "N/A")}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Sex</span>
                          <span className="font-bold text-slate-800">{m.sexId || "N/A"}</span>
                        </div>
                      </div>

                      {/* Arrest Warrants / Charges */}
                      {warrants.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-rose-200/50">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                            Charges / Arrest Warrants:
                          </span>
                          <div className="flex flex-col gap-2">
                            {warrants.map((w: any, wIdx: number) => (
                              <div key={wIdx} className="p-2.5 bg-white border border-rose-100 rounded text-xs">
                                <div className="font-semibold text-rose-950 whitespace-pre-line leading-relaxed">
                                  {w.charge || "Specific criminal charge information"}
                                </div>
                                {w.issuing_country_id && (
                                  <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                                    Issuing Country Jurisdiction: <strong className="text-slate-700">{w.issuing_country_id}</strong>
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Physical Characteristics / Distinguishing Marks */}
                      {m.distinguishingMarks && (
                        <div className="mt-2.5 pt-2 border-t border-rose-100 text-[11px] text-slate-650">
                          <strong className="text-slate-700">Distinguishing Marks:</strong> {m.distinguishingMarks}
                        </div>
                      )}

                      {/* Official Link */}
                      {m.link && (
                        <div className="mt-3 text-right">
                          <a
                            href={m.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-rose-700 hover:text-rose-900 font-bold underline inline-flex items-center gap-1"
                          >
                            <span>View Official Interpol Notice Record</span>
                            <span>&rarr;</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer on Page 2 */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center">
              <span>CLUSO INFOLINK VERIFICATION SERVICES &bull; CONFIDENTIAL &amp; PROPRIETARY</span>
              <span className="font-mono">Ref: {reportNo} (Page 2)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RednoticeWorldwideReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="w-8 h-8 border-4 border-rose-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <RednoticeWorldwideReportContent />
    </Suspense>
  );
}
