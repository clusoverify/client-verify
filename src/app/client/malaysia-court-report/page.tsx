"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import OzcluLogo from "../../components/OzcluLogo";
import { isRecordFullNameMatch } from "src/lib/nameMatching";

function MalaysiaCourtReportContent() {
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
        <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">
          Generating Malaysia Court Check Report...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">
          !
        </div>
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

  // If still searching
  if (verification.malaysiaCourtStatus === "searching") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-lg relative flex flex-col items-center gap-6">
          <div className="relative w-24 h-24 flex items-center justify-center bg-emerald-50 rounded-full border border-emerald-200">
            <svg
              className="w-12 h-12 text-emerald-700 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A48.24 48.24 0 0012 9.75c-2.551 0-5.056.2-7.5.583V21"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-extrabold text-slate-800 font-sans">Malaysia Court Search In Progress</h2>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-sm">
              The official Mahkamah Persekutuan Malaysia (Portal eJudgment) database query is in progress. This
              normally resolves in a few moments.
            </p>
          </div>
          <button
            onClick={() => window.close()}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-sm"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const reportNo = verification.id || "MYC-UNKNOWN";
  const themeColor = "#065f46"; // emerald-900

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return String(dateStr);
    }
  };

  const generatedAtDate = verification.malaysiaCourtCompletedAt
    ? new Date(verification.malaysiaCourtCompletedAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
      }).replace(/\u202f/g, " ").toLowerCase()
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase();

  const candidateName = verification.name || "";
  const rawResults = verification.malaysiaCourtResults || [];
  const results = rawResults.filter((rec: any) =>
    isRecordFullNameMatch(candidateName, [rec.parties, rec.rawParties])
  );
  const hasRecords = results.length > 0;
  const totalFound = results.length;

  // Extract addresses & jurisdictions
  const addresses: any[] = verification.addresses || [];
  const extractedJurisdictions: string[] = addresses
    .map((a: any) => (a.stateCode?.startsWith("Other:") ? a.stateCode.substring(6) : (a.state || a.stateCode || "")).trim())
    .filter(Boolean);
  const allJurisdictions = Array.from(new Set(extractedJurisdictions));
  const targetJurisdiction = allJurisdictions.join(", ") || "All States / Federal Territory";

  // Resolve address searches
  const addressSearches: any[] = (verification.malaysiaCourtAddressResults && Array.isArray(verification.malaysiaCourtAddressResults) && verification.malaysiaCourtAddressResults.length > 0)
    ? verification.malaysiaCourtAddressResults
    : addresses.length > 0
      ? addresses.map((addr: any, idx: number) => {
          const addrJurisdiction = (addr.stateCode?.startsWith("Other:") ? addr.stateCode.substring(6) : (addr.state || addr.stateCode || "")).trim();
          return {
            addressIndex: idx,
            address: addr.address || "",
            city: addr.city || "",
            province: addrJurisdiction || targetJurisdiction,
            state: addrJurisdiction || targetJurisdiction,
            country: addr.country || "Malaysia",
            fromYear: addr.fromYear,
            toYear: addr.toYear,
            casesFound: results.length,
            cases: results,
          };
        })
      : [
          {
            addressIndex: 0,
            address: "Primary Jurisdiction",
            city: "",
            province: targetJurisdiction,
            state: targetJurisdiction,
            country: "Malaysia",
            casesFound: results.length,
            cases: results,
          },
        ];

  const verdictBg = hasRecords ? "bg-rose-50 border-rose-200" : "bg-emerald-50/70 border-emerald-200";
  const totalPages = verification.idProofFile ? 3 : 2;

  const courtCategoryNames: Record<string, string> = {
    "11": "Federal Court (Mahkamah Persekutuan)",
    "3": "Court of Appeal (Mahkamah Rayuan)",
    "2": "High Court (Mahkamah Tinggi)",
    "10": "Sessions Court (Mahkamah Sesyen)",
    "5": "Magistrate Court (Mahkamah Majistret)",
  };

  const caseTypeNames: Record<string, string> = {
    "7": "Appellate and Special Powers (Rayuan & Kuasa Khas)",
    "1": "Bankruptcy (Kebankrapan)",
    "9": "Caveat (Kaveat)",
    "3": "Civil (Sivil)",
    "8": "Commercial (Dagang)",
    "2": "Criminal (Jenayah)",
    "6": "Family (Keluarga)",
    "4": "Execution (Pelaksanaan)",
    "10": "Muamalat",
    "11": "Admiralty (Maritim)",
    "12": "Intellectual Property (Harta Intelek)",
    "13": "Coroners Court (Mahkamah Koroner)",
    "14": "Special Cyber Court (Mahkamah Siber)",
    "15": "Environmental Court (Mahkamah Alam Sekitar)",
  };

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
            margin: 8mm;
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
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            background: transparent !important;
          }
          .print-card::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 4px double ${themeColor};
            pointer-events: none;
            z-index: 9999;
            box-sizing: border-box;
          }
          .print-page-block {
            border: none !important;
            padding: 14px 16px !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            background: white !important;
            min-height: 279mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-shadow: none !important;
          }
          .print-card h1, .print-page-block h1 { font-size: 14px !important; margin-bottom: 4px !important; }
          .print-card h2, .print-page-block h2 { font-size: 15px !important; }
          .print-card h3, .print-page-block h3 { font-size: 10px !important; }
          .print-card .grid, .print-page-block .grid { gap: 8px !important; }
          .print-card p, .print-card div, .print-card span,
          .print-page-block p, .print-page-block div, .print-page-block span { line-height: 1.35 !important; }
          .print-avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
          .print-break-before { break-before: page !important; page-break-before: always !important; }
          .verdict-card-inner { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: space-between !important; flex-wrap: nowrap !important; }
          .verdict-card-left { text-align: left !important; flex: 1 !important; }
          .verdict-card-row { display: flex !important; justify-content: flex-start !important; text-align: left !important; }
        }
      `}</style>

      {/* Print Control Toolbar */}
      <div className="no-print print:hidden w-full max-w-[210mm] bg-white border border-slate-200 rounded-xl p-3 sm:p-4 mb-5 shadow-xs flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-bold text-slate-800">Malaysia Court Check Report</span>
          <span className="text-[11px] text-slate-500">Ready to save, print or review.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#181d16] text-white rounded-lg font-bold text-xs hover:bg-[#1E293B] cursor-pointer shadow-xs transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Print Report</span>
          </button>
          <button
            onClick={() => window.close()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-50 cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="print-card w-full max-w-[210mm] mx-auto my-0">

        {/* Page 1 */}
        <div className="print-page-block w-full min-h-[297mm] bg-white border-[5px] border-double border-[#065f46] p-6 sm:p-8 relative my-0 mx-auto box-border flex flex-col justify-between">
          <div className="flex flex-col flex-1">
            {/* Header Top Row */}
            <div className="flex items-center justify-between gap-4 mb-6 border-b-2 border-slate-100 pb-5">
              <div className="flex justify-start items-center shrink-0 w-1/3">
                {settings && settings.logo ? (
                  <div className="h-9 sm:h-11 max-w-[180px] flex items-center justify-start">
                    <img src={settings.logo} alt="Company Logo" className="object-contain max-h-full max-w-full" />
                  </div>
                ) : (
                  <div className="h-9 sm:h-11 flex items-center justify-start">
                    <img src="/cluso-logo-long-default.svg" alt="Cluso Infolink Logo" className="h-8 sm:h-10 w-auto object-contain" />
                  </div>
                )}
              </div>

              <div className="flex justify-center items-center w-1/3 text-center">
                <img
                  src="/malaysia-court-logo.png"
                  alt="Mahkamah Malaysia Crest"
                  className="h-14 sm:h-17 w-auto object-contain drop-shadow-xs"
                />
              </div>

              <div className="flex justify-end items-center shrink-0 w-1/3">
                <div className="text-right text-[11px] sm:text-xs font-bold text-slate-800 space-y-0.5">
                  <div>Report #: <span className="font-mono text-slate-900">{reportNo}</span></div>
                  <div>Date: <span className="text-slate-900">{formatDate(verification.malaysiaCourtCompletedAt || verification.date)}</span></div>
                </div>
              </div>
            </div>

            {/* Report Title */}
            <div className="flex flex-col items-center text-center mb-6">
              <h1 className="font-sans text-[#065f46] text-xl sm:text-2xl font-black tracking-widest uppercase leading-tight">
                MALAYSIA COURT CHECK REPORT
              </h1>
            </div>

            {/* Metadata Card */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 mb-6">
              <div className="space-y-1.5">
                <div>Request Created: <span className="text-slate-900 font-mono">{verification.date}</span></div>
                <div>Search Status: <span className="font-bold text-emerald-600 uppercase">COMPLETED</span></div>
              </div>
              <div className="space-y-1.5 sm:text-right">
                <div>Generated At: <span className="text-slate-900 font-mono">{generatedAtDate} (IST)</span></div>
                <div>Verified By: <span className="text-slate-900 font-bold">Cluso Infolink Verify</span></div>
              </div>
            </div>

            {/* Details of the Report */}
            <div className="mb-6 border-b border-slate-100 pb-5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#065f46] border-b border-slate-200 pb-1 mb-2.5">
                Details of the Report
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 text-[11px]">
                <div className="space-y-1">
                  <div><span className="text-slate-500 font-semibold">Full Name:</span> <span className="font-bold text-slate-800">{candidateName || "Unknown"}</span></div>
                  {verification.gender && verification.gender !== "Not Given" && verification.gender !== "Not Provided" && verification.gender !== "Not required" && (
                    <div><span className="text-slate-500 font-semibold">Gender:</span> <span className="font-semibold text-slate-800">{verification.gender}</span></div>
                  )}
                  <div><span className="text-slate-500 font-semibold">Date of Birth:</span> <span className="font-semibold text-slate-800">{maskDob(verification.candidateDob)}</span></div>
                  <div><span className="text-slate-500 font-semibold">Father&apos;s Name:</span> <span className="font-semibold text-slate-800">{verification.candidateFatherName || "Not Given"}</span></div>
                  {verification.candidateMotherName && verification.candidateMotherName !== "Not Given" && verification.candidateMotherName !== "Not Provided" && (
                    <div><span className="text-slate-500 font-semibold">Mother&apos;s Name:</span> <span className="font-semibold text-slate-800">{verification.candidateMotherName}</span></div>
                  )}
                  {verification.candidateHusbandName && verification.candidateHusbandName !== "Not Given" && verification.candidateHusbandName !== "Not Provided" && (
                    <div><span className="text-slate-500 font-semibold">Husband&apos;s Name:</span> <span className="font-semibold text-slate-800">{verification.candidateHusbandName}</span></div>
                  )}
                </div>
                <div className="space-y-1">
                  <div><span className="text-slate-500 font-semibold">Requesting Org:</span> <span className="font-bold text-slate-800">{verification.requestingOrgName || verification.orgName}</span></div>
                  <div><span className="text-slate-500 font-semibold">Client Org:</span> <span className="font-bold text-slate-800">{verification.orgName || verification.requestingOrgName || "Cluso Infolink"}</span></div>
                  <div><span className="text-slate-500 font-semibold">Jurisdiction:</span> <span className="font-bold text-slate-800">Malaysia (Mahkamah Persekutuan)</span></div>
                  <div><span className="text-slate-500 font-semibold">Target Jurisdiction:</span> <span className="font-bold text-[#065f46]">{courtCategoryNames[verification.courtCategory] || "All Jurisdictions"}</span></div>
                  <div><span className="text-slate-500 font-semibold">Case Type:</span> <span className="font-semibold text-slate-800">{caseTypeNames[verification.caseType] || "All Case Types"}</span></div>
                  {verification.idProofType && verification.idProofType !== "Not Given" && verification.idProofType !== "Not Provided" && (
                    <div><span className="text-slate-500 font-semibold">ID Type:</span> <span className="font-semibold text-slate-800">{verification.idProofType}</span></div>
                  )}
                  {verification.idProofNumber && verification.idProofNumber !== "Not Given" && verification.idProofNumber !== "Not Provided" && (
                    <div><span className="text-slate-500 font-semibold">ID Number:</span> <span className="font-semibold text-slate-800">{verification.idProofNumber}</span></div>
                  )}
                </div>
              </div>
            </div>

            {/* Addresses Searched */}
            {verification.addresses && verification.addresses.length > 0 && (
              <div className="mb-8 print-avoid-break">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#065f46] mb-2">Addresses Provided</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5 border-r border-slate-200 w-12">#</th>
                        <th className="p-2.5 border-r border-slate-200">Address</th>
                        <th className="p-2.5 border-r border-slate-200">City</th>
                        <th className="p-2.5 border-r border-slate-200">State / Province</th>
                        <th className="p-2.5">Country</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold">
                      {verification.addresses.map((addr: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2.5 border-r border-slate-200 bg-slate-50/50 text-center">{i + 1}</td>
                          <td className="p-2.5 border-r border-slate-200">{addr.address || "Not Given"}</td>
                          <td className="p-2.5 border-r border-slate-200 font-bold">{addr.city || "Not Given"}</td>
                          <td className="p-2.5 border-r border-slate-200">{addr.state || "Not Given"}</td>
                          <td className="p-2">{addr.country || "Malaysia"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Overall Verdict Card */}
            <div className={`mb-8 p-5 sm:p-6 border-2 rounded-xl ${verdictBg} print-avoid-break relative overflow-hidden`}>
              <div className="flex flex-row items-center gap-4 justify-between verdict-card-inner">
                <div className="space-y-2 text-left flex-1 min-w-0 verdict-card-left">
                  <div className="flex items-center gap-2 justify-start verdict-card-row">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-[#065f46]">Status:</span>
                    <span className={`px-3 py-0.5 rounded-full font-extrabold text-xs tracking-wide uppercase ${hasRecords ? "bg-rose-700 text-white" : "bg-emerald-700 text-white"}`}>
                      {hasRecords ? "Adverse Record Identified" : "VERIFIED CLEAR"}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 justify-start verdict-card-row">
                    <span>Outcome:</span>
                    <span className={`font-black ${hasRecords ? "text-rose-900" : "text-emerald-900"}`}>
                      {hasRecords ? `ADVERSE COURT RECORD(S) IDENTIFIED (${totalFound} FOUND)` : "NO ADVERSE JUDICIAL RECORDS IDENTIFIED"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-semibold leading-relaxed max-w-[540px] mt-2 bg-white/80 p-3 rounded-lg border border-slate-200/60 shadow-2xs text-left">
                    {hasRecords
                      ? `The search query returned ${totalFound} court record(s) from the Mahkamah Persekutuan Malaysia (Portal eJudgment) database matching candidate "${candidateName}".`
                      : `An official judicial registry search was conducted across the Mahkamah Persekutuan Malaysia (Portal eJudgment) database. Zero matching adverse court judgments, active proceedings, or orders were identified for candidate "${candidateName}".`}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <img src="/malaysia-court-logo.png" alt="Mahkamah Malaysia" className="h-10 sm:h-12 max-w-[220px] object-contain" />
                  <span className="text-[10px] font-extrabold text-[#065f46] uppercase tracking-wider mt-1.5 text-center">Judicial Registry Verified</span>
                </div>
              </div>
            </div>

          </div>

          {/* Page 1 Footer */}
          <div className="border-t border-slate-200 pt-3 mt-auto text-[8px] sm:text-[8.5px] text-slate-500 leading-normal print-avoid-break flex justify-between items-center">
            <span className="font-medium text-[7.5px] sm:text-[8px]">Verification ID: {reportNo} • Malaysia Court Check</span>
            <span className="font-bold text-[7.5px] sm:text-[8px] text-slate-400 uppercase tracking-wider">Page 1 of {totalPages}</span>
          </div>
        </div>

        {/* Page 2 - Results by Address / Jurisdiction */}
        <div className="print-page-block print-break-before w-full min-h-[297mm] bg-white border-[5px] border-double border-[#065f46] p-6 sm:p-8 relative mt-6 print:mt-0 my-0 mx-auto box-border flex flex-col justify-between">
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <img src="/malaysia-court-logo.png" alt="Court Crest" className="h-7 w-auto object-contain" />
                <span className="text-xs font-black uppercase text-[#065f46] tracking-wider">Mahkamah Malaysia Judicial Registry Search Results</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500">Report #{reportNo}</span>
            </div>

            {/* Search Results by Province / Jurisdiction */}
            <div className="mb-6">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#065f46] mb-4 flex items-center justify-between">
                <span>Search Results by Province / Jurisdiction</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {addressSearches.length} Address Jurisdiction(s) Searched
                </span>
              </h3>

              <div className="space-y-6">
                {addressSearches.map((addrItem: any, aIdx: number) => {
                  const addrCases = addrItem.cases || [];
                  const addrHasRecords = addrCases.length > 0;
                  const addrJurisdictionName = addrItem.province || targetJurisdiction || "Malaysia";
                  const addrCityName = addrItem.city ? `${addrItem.city}, ` : "";
                  const yearSpanText = addrItem.fromYear && addrItem.toYear ? `${addrItem.fromYear} – ${addrItem.toYear}` : "";

                  return (
                    <div key={aIdx} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs print-avoid-break">
                      <div className="bg-slate-100 border-b border-slate-200 p-3.5 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#065f46] text-white font-extrabold text-xs flex items-center justify-center">
                            {aIdx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-[#065f46]">
                              {addrCityName}{addrJurisdictionName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {addrItem.address ? `${addrItem.address} • ` : ""}
                              {addrItem.country || "Malaysia"}
                              {yearSpanText ? ` (${yearSpanText})` : ""}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          addrHasRecords
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {addrHasRecords ? `${addrCases.length} Record(s) Found` : "Verified Clear"}
                        </span>
                      </div>

                      {addrHasRecords ? (
                        <div className="divide-y divide-slate-100 bg-white p-4 space-y-4">
                          {addrCases.map((rec: any, rIdx: number) => {
                            const docs = rec.documents || [];
                            return (
                              <div key={rIdx} className="p-3 border border-slate-200/80 rounded-xl bg-slate-50/40 space-y-2 text-xs font-semibold text-slate-700">
                                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200/60 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 border rounded-md uppercase tracking-wide bg-amber-100 text-amber-800 border-amber-200">
                                      Case #{rec.no || rIdx + 1}
                                    </span>
                                    {rec.courtLevel && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 border rounded-md bg-emerald-50 text-emerald-700 border-emerald-200">
                                        {rec.courtLevel}
                                      </span>
                                    )}
                                  </div>
                                  {rec.dateOfResult && (
                                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                                      Decision: {rec.dateOfResult}
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <span className="text-slate-500">Case No:</span>{" "}
                                  <span className="text-slate-900 font-bold font-mono">{rec.caseNo}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Parties:</span>{" "}
                                  <span className="text-slate-900 font-bold">{rec.parties || "Not specified"}</span>
                                </div>
                                {rec.judge && (
                                  <div>
                                    <span className="text-slate-500">Judge:</span>{" "}
                                    <span className="text-slate-900">{rec.judge}</span>
                                  </div>
                                )}
                                {rec.keyword && (
                                  <div>
                                    <span className="text-slate-500">Keywords:</span>{" "}
                                    <span className="text-slate-700 text-[11px]">{rec.keyword}</span>
                                  </div>
                                )}
                                {docs.length > 0 && (
                                  <div className="flex items-center justify-end pt-1 gap-2">
                                    {docs.map((doc: any, dIdx: number) => (
                                      <a
                                        key={dIdx}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-fit px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-all cursor-pointer text-[10px] inline-flex items-center gap-1"
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span>{doc.docName || "Download Grounds of Judgment (PDF)"}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-emerald-50/40 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
                            <div>
                              <div className="text-xs font-bold text-emerald-900">Zero Adverse Judicial Records Identified</div>
                              <div className="text-[10px] text-emerald-700 font-medium">No matching court judgments found in {addrJurisdictionName} division</div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-100/80 text-emerald-800 text-[10px] font-extrabold uppercase rounded-full border border-emerald-200">
                            Clean Record
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Page 2 Footer */}
          <div className="border-t border-slate-200 pt-3 mt-auto text-[8px] sm:text-[8.5px] text-slate-500 leading-normal print-avoid-break">
            <p className="font-bold uppercase tracking-wider mb-0.5 text-slate-700">Disclaimer &amp; Data Limitations</p>
            <p className="font-medium text-[7.5px] sm:text-[8px] leading-relaxed">
              This background verification was conducted via automated electronic interface with the public Portal eJudgment service of the Mahkamah Persekutuan Malaysia. Records reflect grounds of judgment, orders, and rulings filed by the courts of Malaysia up to the query timestamp. This report is issued for candidate screening and due diligence purposes in accordance with applicable data protection regulations.
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mt-2 text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider text-slate-400">
              <div>Verification ID: {reportNo}</div>
              <div>Page 2 of {totalPages}</div>
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
            <div className="print-page-block print-break-before w-full min-h-[297mm] bg-white border-[5px] border-double border-[#065f46] p-6 sm:p-8 relative mt-8 mx-auto box-border flex flex-col justify-between">
              <div className="flex flex-col flex-1">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#065f46] mb-4">
                  Appendix: ID Proof Attachment
                </h3>
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 print-avoid-break">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-bold text-[#065f46] uppercase tracking-wider">
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

              <div className="border-t border-slate-200 pt-3 mt-auto text-[8px] sm:text-[8.5px] text-slate-400 font-bold uppercase tracking-wider flex justify-between items-center">
                <div>Verification ID: {reportNo}</div>
                <div>Page 3 of 3</div>
                <div>Powered by Cluso Infolink Integrity Network</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default function MalaysiaCourtReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
          <div className="w-10 h-10 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Loading Report...</span>
        </div>
      }
    >
      <MalaysiaCourtReportContent />
    </Suspense>
  );
}
