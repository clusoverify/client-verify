"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import OzcluLogo from "../../components/OzcluLogo";
import { isRecordFullNameMatch } from "src/lib/nameMatching";

function UkCourtReportContent() {
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
        <div className="w-10 h-10 border-4 border-[#1e1b4b] border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Generating UK Court Check Report...</span>
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

  // If still searching
  if (verification.ukCourtStatus === "searching") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-lg relative flex flex-col items-center gap-6">
          <div className="relative w-24 h-24 flex items-center justify-center bg-indigo-50 rounded-full border border-indigo-200">
            <svg className="w-12 h-12 text-indigo-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-extrabold text-slate-800 font-sans">UK Court Search In Progress</h2>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-sm">
              The Courts and Tribunals Judiciary database search is currently in progress. This usually completes in a few moments.
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

  const reportNo = verification.id || "UKC-UNKNOWN";

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

  const generatedAtDate = verification.ukCourtCompletedAt
    ? new Date(verification.ukCourtCompletedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase()
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase();

  const candidateName = verification.name || verification.candidateName || "";

  // Extract addresses & jurisdictions
  const addresses: any[] = verification.addresses || [];
  const extractedJurisdictions: string[] = addresses
    .map((a: any) => (a.stateCode?.startsWith("Other:") ? a.stateCode.substring(6) : (a.state || a.stateCode || "")).trim())
    .filter(Boolean);

  const savedJurisdictions: string[] = [
    ...(verification.jurisdiction ? String(verification.jurisdiction).split(",").map((p: string) => p.trim()) : []),
  ].filter(Boolean);

  const allJurisdictions = Array.from(new Set([...extractedJurisdictions, ...savedJurisdictions]));
  const targetJurisdiction = allJurisdictions.join(", ") || "England & Wales (All Divisions)";

  const rawResults = verification.ukCourtResults || [];
  // Ensure only records matching the candidate's strict full name are shown
  const results = rawResults.filter((rec: any) =>
    isRecordFullNameMatch(candidateName, [rec.caseTitle, rec.title, rec.snippet])
  );
  const hasRecords = results.length > 0;
  const totalFound = results.length;

  // Resolve address searches (either precomputed from ukCourtAddressResults or synthesized)
  const addressSearches: any[] = (verification.ukCourtAddressResults && Array.isArray(verification.ukCourtAddressResults) && verification.ukCourtAddressResults.length > 0)
    ? verification.ukCourtAddressResults
    : addresses.length > 0
      ? addresses.map((addr: any, idx: number) => {
          const addrJurisdiction = (addr.stateCode?.startsWith("Other:") ? addr.stateCode.substring(6) : (addr.state || addr.stateCode || "")).trim();
          return {
            addressIndex: idx,
            address: addr.address || "",
            city: addr.city || "",
            province: addrJurisdiction || targetJurisdiction,
            state: addrJurisdiction || targetJurisdiction,
            country: addr.country || "United Kingdom",
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
            country: "United Kingdom",
            casesFound: results.length,
            cases: results,
          },
        ];

  const totalPages = verification.idProofFile ? 3 : 2;
  const verdictBg = hasRecords ? "bg-rose-50 border-rose-200" : "bg-emerald-50/70 border-emerald-200";

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
            border: 4px double #1e1b4b;
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
          .print-card h1, .print-page-block h1 {
            font-size: 14px !important;
            margin-bottom: 4px !important;
          }
          .print-card h2, .print-page-block h2 {
            font-size: 15px !important;
          }
          .print-card h3, .print-page-block h3 {
            font-size: 10px !important;
          }
          .print-card .grid, .print-page-block .grid {
            gap: 8px !important;
          }
          .print-card p, .print-card div, .print-card span,
          .print-page-block p, .print-page-block div, .print-page-block span {
            line-height: 1.35 !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-break-before {
            break-before: page !important;
            page-break-before: always !important;
          }
          .verdict-card-inner {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            flex-wrap: nowrap !important;
          }
          .verdict-card-left {
            text-align: left !important;
            flex: 1 !important;
          }
          .verdict-card-row {
            display: flex !important;
            justify-content: flex-start !important;
            text-align: left !important;
          }
        }
      `}</style>

      {/* Print Control Toolbar */}
      <div className="no-print print:hidden w-full max-w-[210mm] bg-white border border-slate-200 rounded-xl p-3 sm:p-4 mb-5 shadow-xs flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-bold text-slate-800">United Kingdom Court Check Report</span>
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

      {/* Main Report Container - True A4 Page Form */}
      <div className="print-card w-full max-w-[210mm] mx-auto my-0">

        {/* Page Block (A4 Sheet Dimensions 210mm x 297mm) */}
        <div className="print-page-block w-full min-h-[297mm] bg-white border-[5px] border-double border-[#1e1b4b] p-6 sm:p-8 relative my-0 mx-auto box-border flex flex-col justify-between">
          <div className="flex flex-col flex-1">
            {/* Header Top Row: Left Cluso Infolink logo (smaller), Middle Court logo (smaller), Right Report Number */}
          <div className="flex items-center justify-between gap-4 mb-6 border-b-2 border-slate-100 pb-5">
            {/* Top Left: Cluso Infolink / Company Logo (smaller) */}
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

            {/* Top Middle: Court Logo (UK Courts & Tribunals Judiciary) */}
            <div className="flex justify-center items-center w-1/3 text-center">
              <img
                src="/uk-court-logo-is.png"
                alt="Courts and Tribunals Judiciary"
                className="h-14 sm:h-17 w-auto object-contain drop-shadow-xs"
              />
            </div>

            {/* Top Right: Report Number & Date */}
            <div className="flex justify-end items-center shrink-0 w-1/3">
              <div className="text-right text-[11px] sm:text-xs font-bold text-slate-800 space-y-0.5">
                <div>Report #: <span className="font-mono text-slate-900">{reportNo}</span></div>
                <div>Date: <span className="text-slate-900">{formatDate(verification.ukCourtCompletedAt || verification.date)}</span></div>
              </div>
            </div>
          </div>

          {/* Report Title - Centered */}
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="font-sans text-[#1e1b4b] text-xl sm:text-2xl font-black tracking-widest uppercase leading-tight">
              UNITED KINGDOM COURT CHECK REPORT
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
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1e1b4b] border-b border-slate-200 pb-1 mb-2.5">
              Details of the Report
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 text-[11px]">
              <div className="space-y-1">
                <div><span className="text-slate-500 font-semibold">Full Name:</span> <span className="font-bold text-slate-800">{verification.name || "Unknown"}</span></div>
                {verification.gender && verification.gender !== "Not Given" && verification.gender !== "Not Provided" && verification.gender !== "Not required" && (
                  <div><span className="text-slate-500 font-semibold">Gender:</span> <span className="font-semibold text-slate-800">{verification.gender}</span></div>
                )}
                <div><span className="text-slate-500 font-semibold">Date of Birth:</span> <span className="font-semibold text-slate-800">{maskDob(verification.candidateDob)}</span></div>
                {verification.birthCity && verification.birthCity !== "Not Provided" && verification.birthCity !== "Not Given" && (
                  <div><span className="text-slate-500 font-semibold">Place of Birth:</span> <span className="font-semibold text-slate-800">{verification.birthCity}</span></div>
                )}
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
                <div><span className="text-slate-500 font-semibold">Jurisdiction:</span> <span className="font-bold text-slate-800">England &amp; Wales (Judiciary UK)</span></div>
                <div><span className="text-slate-500 font-semibold">Target Jurisdiction:</span> <span className="font-bold text-[#1e1b4b]">{targetJurisdiction}</span></div>
                {verification.idProofType && verification.idProofType !== "Not Given" && verification.idProofType !== "Not Provided" && (
                  <div><span className="text-slate-500 font-semibold">ID Type:</span> <span className="font-semibold text-slate-800">{verification.idProofType}</span></div>
                )}
                {verification.idProofNumber && verification.idProofNumber !== "Not Given" && verification.idProofNumber !== "Not Provided" && (
                  <div><span className="text-slate-500 font-semibold">ID Number:</span> <span className="font-semibold text-slate-800">{verification.idProofNumber}</span></div>
                )}
                {verification.judgmentType && (
                  <div><span className="text-slate-500 font-semibold">Judgment Type Filter:</span> <span className="font-semibold text-slate-800">{verification.judgmentType}</span></div>
                )}
                {verification.jurisdiction && (
                  <div><span className="text-slate-500 font-semibold">Court Filter:</span> <span className="font-semibold text-slate-800">{verification.jurisdiction}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Addresses Searched */}
          {verification.addresses && verification.addresses.length > 0 && (
            <div className="mb-8 print-avoid-break">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1e1b4b] mb-2">Addresses Provided</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5 border-r border-slate-200 w-12">#</th>
                      <th className="p-2.5 border-r border-slate-200">Address</th>
                      <th className="p-2.5 border-r border-slate-200">City</th>
                      <th className="p-2.5 border-r border-slate-200">State / County</th>
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
                        <td className="p-2">{addr.country || "United Kingdom"}</td>
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
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#1e1b4b]">Status:</span>
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
                    ? `The search query returned ${totalFound} court record(s) from the Courts and Tribunals Judiciary database matching candidate "${candidateName}" in jurisdiction ${targetJurisdiction || "England & Wales"}.`
                    : `An official judicial registry search was conducted across the Courts and Tribunals Judiciary database covering judgments, sentencing remarks, tribunal decisions, and court orders in England & Wales. Zero matching adverse court judgments, active proceedings, or tribunal orders were identified for candidate "${candidateName}" in ${targetJurisdiction ? `the ${targetJurisdiction} judicial division` : "all court registries"}.`}
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <img src="/uk-court-logo.svg" alt="Courts and Tribunals Judiciary" className="h-10 sm:h-12 max-w-[220px] object-contain" />
                <span className="text-[10px] font-extrabold text-[#1e1b4b] uppercase tracking-wider mt-1.5 text-center">Judiciary Registry Verified</span>
              </div>
            </div>
          </div>

          </div>

          {/* Page 1 Footer */}
          <div className="border-t border-slate-200 pt-3 mt-auto text-[8px] sm:text-[8.5px] text-slate-500 leading-normal print-avoid-break flex justify-between items-center">
            <span className="font-medium text-[7.5px] sm:text-[8px]">Verification ID: {reportNo} • United Kingdom Court Check</span>
            <span className="font-bold text-[7.5px] sm:text-[8px] text-slate-400 uppercase tracking-wider">Page 1 of {totalPages}</span>
          </div>
        </div>

        {/* Page 2 Content Block - Results by Address / Jurisdiction */}
        <div className="print-page-block print-break-before w-full min-h-[297mm] bg-white border-[5px] border-double border-[#1e1b4b] p-6 sm:p-8 relative mt-6 print:mt-0 my-0 mx-auto box-border flex flex-col justify-between">
          <div className="flex flex-col flex-1">
            {/* Page 2 Top Header Mini */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <img src="/uk-court-logo-is.png" alt="Court Crest" className="h-7 w-auto object-contain" />
                <span className="text-xs font-black uppercase text-[#1e1b4b] tracking-wider">Courts & Tribunals Judiciary Search Results</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500">Report #{reportNo}</span>
            </div>

            {/* Search Results by Province / Jurisdiction */}
            <div className="mb-6">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1e1b4b] mb-4 flex items-center justify-between">
                <span>Search Results by Province / Jurisdiction</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {addressSearches.length} Address Jurisdiction(s) Searched
                </span>
              </h3>

              <div className="space-y-6">
                {addressSearches.map((addrItem: any, aIdx: number) => {
                  const addrCases = addrItem.cases || [];
                  const addrHasRecords = addrCases.length > 0;
                  const addrJurisdictionName = addrItem.province || targetJurisdiction || "England & Wales";
                  const addrCityName = addrItem.city ? `${addrItem.city}, ` : "";
                  const yearSpanText = addrItem.fromYear && addrItem.toYear ? `${addrItem.fromYear} – ${addrItem.toYear}` : "";

                  return (
                    <div key={aIdx} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs print-avoid-break">
                      {/* Address / Jurisdiction Header */}
                      <div className="bg-slate-100 border-b border-slate-200 p-3.5 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#1e1b4b] text-white font-extrabold text-xs flex items-center justify-center">
                            {aIdx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-[#1e1b4b]">
                              {addrCityName}{addrJurisdictionName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {addrItem.address ? `${addrItem.address} • ` : ""}
                              {addrItem.country || "United Kingdom"}
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

                      {/* If records found for this address */}
                      {addrHasRecords ? (
                        <div className="divide-y divide-slate-100 bg-white p-4 space-y-4">
                          {addrCases.map((record: any, rIdx: number) => (
                            <div key={rIdx} className="p-3 border border-slate-200/80 rounded-xl bg-slate-50/40 space-y-2 text-xs font-semibold text-slate-700">
                              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200/60 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold px-2 py-0.5 border rounded-md uppercase tracking-wide bg-amber-100 text-amber-800 border-amber-200">
                                    Record #{rIdx + 1}
                                  </span>
                                  {record.court && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 border rounded-md bg-indigo-50 text-indigo-700 border-indigo-200">
                                      {record.court}
                                    </span>
                                  )}
                                  {record.judgmentType && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 border rounded-md bg-blue-50 text-blue-700 border-blue-200">
                                      {record.judgmentType}
                                    </span>
                                  )}
                                </div>
                                {record.date && (
                                  <span className="text-[10px] font-bold text-slate-500 font-mono">
                                    Published: {record.date}
                                  </span>
                                )}
                              </div>

                              <div>
                                <span className="text-slate-500">Case Title:</span>{" "}
                                <span className="text-slate-900 font-bold">{record.caseTitle}</span>
                              </div>
                              {record.court && (
                                <div>
                                  <span className="text-slate-500">Division / Jurisdiction:</span>{" "}
                                  <span className="text-slate-900">{record.court}</span>
                                </div>
                              )}
                              {record.pills && record.pills.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  <span className="text-slate-500 text-[10px]">Tags:</span>
                                  {record.pills.map((pill: string, pIdx: number) => (
                                    <span key={pIdx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded font-medium">
                                      {pill}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {record.snippet && (
                                <div className="mt-2 border border-slate-100 rounded-lg bg-white p-3">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Excerpt:</span>
                                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{record.snippet}</p>
                                </div>
                              )}
                              {record.url && (
                                <div className="flex items-center justify-end pt-1">
                                  <button
                                    onClick={() => window.open(record.url, "_blank")}
                                    className="w-fit px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-all cursor-pointer text-[10px] inline-flex items-center gap-1"
                                  >
                                    <span>View Official Judgment on Judiciary UK</span>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Clear Status Banner for this address */
                        <div className="p-4 bg-emerald-50/40 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
                            <div>
                              <div className="text-xs font-bold text-emerald-900">Zero Adverse Judicial Records Identified</div>
                              <div className="text-[10px] text-emerald-700 font-medium">No matching criminal, civil, or appellate court judgments found in {addrJurisdictionName} division</div>
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

          {/* Footer/Disclaimer at bottom of Page 2 */}
          <div className="border-t border-slate-200 pt-3 mt-auto text-[8px] sm:text-[8.5px] text-slate-500 leading-normal print-avoid-break">
            <p className="font-bold uppercase tracking-wider mb-0.5 text-slate-700">Disclaimer &amp; Data Limitations</p>
            <p className="font-medium text-[7.5px] sm:text-[8px] leading-relaxed">
              This verification check is an automated gateway query against publicly available judgments, sentencing remarks, tribunal decisions, and court orders published by the Courts and Tribunals Judiciary of England &amp; Wales (judiciary.uk). This is a name-based keyword search and may return judgments for individuals with identical or similar names. Client discretion and human review are advised before making adverse employment decisions. Clean results reflect absence of matching published judgments at the time of query.
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
            <div className="print-page-block print-break-before w-full min-h-[297mm] bg-white border-[5px] border-double border-[#1e1b4b] p-6 sm:p-8 relative mt-8 mx-auto box-border flex flex-col justify-between">
              <div className="flex flex-col flex-1">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1e1b4b] mb-4">
                  Appendix: ID Proof Attachment
                </h3>
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 print-avoid-break">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-bold text-[#1e1b4b] uppercase tracking-wider">
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

export default function UkCourtReport() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="w-10 h-10 border-4 border-[#1e1b4b] border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Loading Report...</span>
      </div>
    }>
      <UkCourtReportContent />
    </Suspense>
  );
}
