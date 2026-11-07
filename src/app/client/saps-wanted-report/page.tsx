"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function SapsWantedReportContent() {
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
        <div className="w-10 h-10 border-4 border-[#0F2A5C] border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">
          Generating SAPS Wanted Verification Certificate...
        </span>
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

  // If Halted and not yet released to customer
  if (verification.status === "Halted" && !verification.sendToCustomer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-lg relative flex flex-col items-center gap-6">
          <div className="relative w-20 h-20 flex items-center justify-center bg-amber-50 rounded-full border border-amber-200">
            <svg className="w-10 h-10 text-amber-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full self-center border border-amber-200">
              Legal Hold • Verification In Progress
            </span>
            <h2 className="text-xl font-extrabold text-slate-800 font-sans mt-1">Verifying with Attorney</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm">
              A preliminary registry match has been flagged for legal compliance review. In accordance with screening policy, this report is temporarily held while our legal team verifies candidate identity against the South African Police Service records.
            </p>
          </div>
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
            <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
              <span className="text-slate-400 font-medium">Candidate Name:</span>
              <span className="text-slate-800 font-bold">{verification.name}</span>
            </div>
            <div className="flex justify-between text-xs py-1 pt-2">
              <span className="text-slate-400 font-medium">Reference ID:</span>
              <span className="text-slate-800 font-mono font-bold">{verification.id}</span>
            </div>
          </div>
          <button
            onClick={() => window.close()}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const reportNo = verification.id || "SAPS-UNKNOWN";
  const themeColor = "#0F2A5C";

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

  const generatedAtDate = verification.sapsWantedCompletedAt
    ? new Date(verification.sapsWantedCompletedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase()
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase();

  const candidateName = verification.name || verification.candidateName || "";
  const matches = verification.sapsWantedMatches || [];
  const hasRecords = verification.sapsWantedHasRecords === true && matches.length > 0;
  const totalFound = matches.length;
  const attorneyResolution = verification.attorneyResolution;

  // Extract addresses & provinces
  const addresses: any[] = verification.addresses || [];
  const extractedProvinces: string[] = addresses
    .map((a: any) => (a.stateCode?.startsWith("Other:") ? a.stateCode.substring(6) : (a.state || a.stateCode || "")).trim())
    .filter(Boolean);

  const savedProvinces: string[] = [
    ...(Array.isArray(verification.provinces) ? verification.provinces : []),
    ...(verification.province ? String(verification.province).split(",").map((p: string) => p.trim()) : []),
    ...(verification.provinceCity ? String(verification.provinceCity).split(",").map((p: string) => p.trim()) : []),
  ].filter(Boolean);

  const allProvinces = Array.from(new Set([...extractedProvinces, ...savedProvinces]));
  const targetProvince = allProvinces.join(", ") || verification.provinceCity || "National (All Provinces)";

  const addressSearches = addresses.length > 0
    ? addresses.map((addr: any, idx: number) => {
        const addrProv = (addr.stateCode?.startsWith("Other:") ? addr.stateCode.substring(6) : (addr.state || addr.stateCode || "")).trim();
        return {
          addressIndex: idx,
          address: addr.address || "",
          city: addr.city || "",
          province: addrProv || targetProvince,
          state: addrProv || targetProvince,
          country: addr.country || "South Africa",
          fromYear: addr.fromYear,
          toYear: addr.toYear,
          casesFound: hasRecords ? matches.length : 0,
          cases: matches,
        };
      })
    : [
        {
          addressIndex: 0,
          address: "Primary Jurisdiction",
          city: "",
          province: targetProvince,
          state: targetProvince,
          country: "South Africa",
          casesFound: hasRecords ? matches.length : 0,
          cases: matches,
        },
      ];

  const verdictBg = hasRecords ? "bg-rose-50 border-rose-200" : "bg-emerald-50/70 border-emerald-200";
  const totalPages = verification.idProofFile ? 3 : 2;

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
          <span className="text-xs sm:text-sm font-bold text-slate-800">SAPS Wanted Persons Check Report</span>
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
        <div className="print-page-block w-full min-h-[297mm] bg-white border-[5px] border-double border-[#0F2A5C] p-6 sm:p-8 relative my-0 mx-auto box-border flex flex-col justify-between">
          <div className="flex flex-col flex-1">
            {/* Header Top Row: Left Cluso Infolink logo, Middle Authority Logo, Right Report Number */}
            <div className="flex items-center justify-between gap-4 mb-6 border-b-2 border-slate-100 pb-5">
              {/* Top Left: Cluso Infolink / Company Logo */}
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

              {/* Top Middle: Authority Logo (SAPS Crest Badge) */}
              <div className="flex justify-center items-center w-1/3 text-center">
                <img
                  src="/saps-badge.webp"
                  alt="South African Police Service"
                  className="h-14 sm:h-17 w-auto object-contain drop-shadow-xs"
                />
              </div>

              {/* Top Right: Report Number & Date */}
              <div className="flex justify-end items-center shrink-0 w-1/3">
                <div className="text-right text-[11px] sm:text-xs font-bold text-slate-800 space-y-0.5">
                  <div>Report #: <span className="font-mono text-slate-900">{reportNo}</span></div>
                  <div>Date: <span className="text-slate-900">{formatDate(verification.sapsWantedCompletedAt || verification.date)}</span></div>
                </div>
              </div>
            </div>

            {/* Report Title */}
            <div className="flex flex-col items-center text-center mb-6">
              <h1 className="font-sans text-[#0F2A5C] text-xl sm:text-2xl font-black tracking-widest uppercase leading-tight">
                SAPS WANTED PERSONS CHECK REPORT
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
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#0F2A5C] border-b border-slate-200 pb-1 mb-2.5">
                Details of the Report
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 text-[11px]">
                <div className="space-y-1">
                  <div><span className="text-slate-500 font-semibold">Full Legal Name:</span> <span className="font-bold text-slate-800">{candidateName || "Unknown"}</span></div>
                  {verification.candidateForename && (
                    <div><span className="text-slate-500 font-semibold">Forename(s):</span> <span className="font-semibold text-slate-800">{verification.candidateForename}</span></div>
                  )}
                  {verification.candidateSurname && (
                    <div><span className="text-slate-500 font-semibold">Surname:</span> <span className="font-semibold text-slate-800">{verification.candidateSurname}</span></div>
                  )}
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
                  <div><span className="text-slate-500 font-semibold">Jurisdiction:</span> <span className="font-bold text-slate-800">Republic of South Africa</span></div>
                  <div><span className="text-slate-500 font-semibold">Screening Registry:</span> <span className="font-bold text-[#0F2A5C]">South African Police Service (SAPS)</span></div>
                  <div><span className="text-slate-500 font-semibold">Target Province:</span> <span className="font-bold text-slate-800">{targetProvince || "National (All Provinces)"}</span></div>
                  <div><span className="text-slate-500 font-semibold">SA ID / Passport:</span> <span className="font-semibold font-mono text-slate-800">{verification.candidateIdNumber || verification.idProofNumber || "—"}</span></div>
                  {verification.idProofType && verification.idProofType !== "Not Given" && verification.idProofType !== "Not Provided" && (
                    <div><span className="text-slate-500 font-semibold">ID Type:</span> <span className="font-semibold text-slate-800">{verification.idProofType}</span></div>
                  )}
                </div>
              </div>
            </div>

            {/* Addresses Searched */}
            {verification.addresses && verification.addresses.length > 0 && (
              <div className="mb-8 print-avoid-break">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#0F2A5C] mb-2">Addresses Provided</h3>
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
                          <td className="p-2">{addr.country || "South Africa"}</td>
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
                    <span className="text-xs uppercase font-extrabold tracking-wider text-[#0F2A5C]">Status:</span>
                    <span className={`px-3 py-0.5 rounded-full font-extrabold text-xs tracking-wide uppercase ${hasRecords ? "bg-rose-700 text-white" : "bg-emerald-700 text-white"}`}>
                      {hasRecords ? "Adverse Record Identified" : "VERIFIED CLEAR"}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 justify-start verdict-card-row">
                    <span>Outcome:</span>
                    <span className={`font-black ${hasRecords ? "text-rose-900" : "text-emerald-900"}`}>
                      {hasRecords ? `ACTIVE SAPS WANTED PERSON RECORD(S) IDENTIFIED (${totalFound} FOUND)` : "NO ACTIVE ARREST WARRANTS OR SAPS WANTED MATCHES IDENTIFIED"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-semibold leading-relaxed max-w-[540px] mt-2 bg-white/80 p-3 rounded-lg border border-slate-200/60 shadow-2xs text-left">
                    {hasRecords
                      ? `The screening inquiry returned ${totalFound} active wanted suspect record(s) from the South African Police Service (SAPS) Crime Stop registry matching candidate "${candidateName}".`
                      : attorneyResolution?.verdict === "cleared"
                      ? `A similarity inquiry flagged during automated checking was formally reviewed by legal counsel and cleared as a false positive. Candidate "${candidateName}" is certified clean of active arrest warrants.`
                      : `An official law-enforcement database search was conducted across the South African Police Service (SAPS) Crime Stop Registry. Zero active arrest warrants, crime-stop notices, or published wanted suspect records were identified for candidate "${candidateName}".`}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <img src="/saps-badge.webp" alt="South African Police Service" className="h-10 sm:h-12 max-w-[220px] object-contain" />
                  <span className="text-[10px] font-extrabold text-[#0F2A5C] uppercase tracking-wider mt-1.5 text-center">SAPS Registry Verified</span>
                </div>
              </div>
            </div>

            {/* Attorney Legal Determination Box (If reviewed by attorney) */}
            {attorneyResolution && (
              <div className="mb-8 bg-slate-50 border border-slate-300 rounded-xl p-5 relative overflow-hidden print-avoid-break">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-[#0F2A5C] text-white rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs tracking-tight uppercase">
                    Attorney Legal Determination &amp; Formal Sign-Off
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-blue-50 text-[#0F2A5C] border border-blue-200 px-2.5 py-0.5 rounded-full ml-auto">
                    Formal Counsel Review
                  </span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3.5 rounded-lg border border-slate-200 italic">
                  &quot;{attorneyResolution.notes}&quot;
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-200 text-[10px] text-slate-500 font-semibold">
                  <div>Counsel Officer: <strong className="text-slate-800">{attorneyResolution.resolvedBy || "Legal Compliance Officer"}</strong></div>
                  <div>Resolution Date: <strong className="text-slate-800">{formatDate(attorneyResolution.resolvedAt)}</strong></div>
                  <div>Final Verdict: <strong className={attorneyResolution.verdict === "cleared" ? "text-emerald-700 uppercase" : "text-rose-700 uppercase"}>{attorneyResolution.verdict}</strong></div>
                </div>
              </div>
            )}

          </div>

          {/* Page 1 Footer */}
          <div className="border-t border-slate-200 pt-3 mt-auto text-[8px] sm:text-[8.5px] text-slate-500 leading-normal print-avoid-break flex justify-between items-center">
            <span className="font-medium text-[7.5px] sm:text-[8px]">Verification ID: {reportNo} • SAPS Wanted Persons Check</span>
            <span className="font-bold text-[7.5px] sm:text-[8px] text-slate-400 uppercase tracking-wider">Page 1 of {totalPages}</span>
          </div>
        </div>

        {/* Page 2 Content Block - Registry Search Results & Profiles */}
        <div className="print-page-block print-break-before w-full min-h-[297mm] bg-white border-[5px] border-double border-[#0F2A5C] p-6 sm:p-8 relative mt-6 print:mt-0 my-0 mx-auto box-border flex flex-col justify-between">
          <div className="flex flex-col flex-1">
            {/* Page 2 Top Header Mini */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <img src="/saps-badge.webp" alt="SAPS Crest" className="h-7 w-auto object-contain" />
                <span className="text-xs font-black uppercase text-[#0F2A5C] tracking-wider">South African Police Service Registry Search Results</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500">Report #{reportNo}</span>
            </div>

            {/* Results Section */}
            <div className="mb-6">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#0F2A5C] mb-4 flex items-center justify-between">
                <span>Registry Search Breakdown by Jurisdiction</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {addressSearches.length} Division / Area(s) Checked
                </span>
              </h3>

              {hasRecords ? (
                /* Adverse Matched Profiles List */
                <div className="space-y-4">
                  {matches.map((suspect: any, idx: number) => (
                    <div
                      key={idx}
                      className="border-2 border-rose-200 rounded-2xl p-5 bg-rose-50/30 flex flex-col md:flex-row gap-5 print-avoid-break"
                    >
                      {suspect.imageUrl && (
                        <div className="shrink-0 flex flex-col items-center gap-1.5">
                          <img
                            src={suspect.imageUrl}
                            alt={suspect.name || suspect.surname}
                            className="w-28 h-32 object-cover rounded-xl border border-slate-300 shadow-xs bg-slate-100"
                          />
                          <span className="text-[9px] font-mono font-bold text-slate-500">
                            SAPS BID: {suspect.bid || idx + 1}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-rose-600 uppercase block">
                              Adverse Match #{idx + 1}
                            </span>
                            <h5 className="text-sm sm:text-base font-black text-slate-900">
                              {suspect.name || `${suspect.forename || ""} ${suspect.surname || ""}`.trim()}
                            </h5>
                          </div>
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-md">
                            Status: {suspect.crime || "Wanted Offender"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] bg-white p-3 rounded-xl border border-rose-100">
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 uppercase block">Police Station</span>
                            <span className="font-bold text-slate-800">{suspect.station || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 uppercase block">Case Number</span>
                            <span className="font-bold font-mono text-slate-800">{suspect.caseNumber || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 uppercase block">Crime Date</span>
                            <span className="font-bold text-slate-800">{suspect.crimeDate || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 uppercase block">Investigating Officer</span>
                            <span className="font-bold text-slate-800">{suspect.investigatingOfficer || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 uppercase block">Contact Telephone</span>
                            <span className="font-bold font-mono text-slate-800">{suspect.stationTelephone || suspect.contactNumber || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 uppercase block">Officer Email</span>
                            <span className="font-bold text-slate-800">{suspect.email || "—"}</span>
                          </div>
                        </div>

                        {suspect.circumstances && (
                          <div className="bg-white p-3 rounded-xl border border-rose-100 text-xs text-slate-700 leading-relaxed font-medium">
                            <strong className="text-slate-900 block text-[10px] uppercase font-mono mb-0.5">Circumstances:</strong>
                            {suspect.circumstances}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Clean Status Banner by Address / Jurisdiction */
                <div className="space-y-4">
                  {addressSearches.map((addrItem: any, aIdx: number) => {
                    const addrProvinceName = addrItem.province || targetProvince || "South Africa";
                    const addrCityName = addrItem.city ? `${addrItem.city}, ` : "";
                    const yearSpanText = addrItem.fromYear && addrItem.toYear ? `${addrItem.fromYear} – ${addrItem.toYear}` : "";

                    return (
                      <div key={aIdx} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs print-avoid-break">
                        <div className="bg-slate-100 border-b border-slate-200 p-3.5 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-[#0F2A5C] text-white font-extrabold text-xs flex items-center justify-center">
                              {aIdx + 1}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-[#0F2A5C]">
                                {addrCityName}{addrProvinceName}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {addrItem.address ? `${addrItem.address} • ` : ""}
                                {addrItem.country || "South Africa"}
                                {yearSpanText ? ` (${yearSpanText})` : ""}
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-extrabold uppercase">
                            Verified Clear
                          </span>
                        </div>

                        <div className="p-4 bg-emerald-50/40 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>
                            <div>
                              <div className="text-xs font-bold text-emerald-900">Zero Active Arrest Warrants or Wanted Records Identified</div>
                              <div className="text-[10px] text-emerald-700 font-medium">
                                No matching criminal records, police stop bulletins, or wanted suspect files identified in {addrProvinceName} division
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-100/80 text-emerald-800 text-[10px] font-extrabold uppercase rounded-full border border-emerald-200">
                            Clean Record
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Official Seal & Signature Section */}
            <div className="my-6 p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print-avoid-break">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0F2A5C] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  CI
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block">Cluso Infolink Verify Technologies</span>
                  <span className="text-[10px] text-slate-500">Official Identity &amp; Crime-Stop Screening Authority</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase text-slate-400 block">Digital Verification Seal</span>
                  <span className="text-xs font-mono font-bold text-emerald-700">SHA256-VERIFIED-{reportNo.substring(0, 10)}</span>
                </div>
                <div className="w-12 h-12 border border-slate-200 rounded-lg bg-white flex items-center justify-center p-1 shadow-2xs">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://verify.clusoinfolink.com/verify?id=${reportNo}`)}`}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Footer/Disclaimer at bottom of Page 2 */}
          <div className="border-t border-slate-200 pt-3 mt-auto text-[8px] sm:text-[8.5px] text-slate-500 leading-normal print-avoid-break">
            <p className="font-bold uppercase tracking-wider mb-0.5 text-slate-700">Methodology &amp; Legal Compliance Statement</p>
            <p className="font-medium text-[7.5px] sm:text-[8px] leading-relaxed">
              This report certifies that the subject candidate was verified against the South African Police Service (SAPS) Crime Stop Registry pursuant to statutory background screening standards. A clean record indicates that no active arrest warrants, police stop bulletins, or published wanted suspect files match the provided surname, forenames, and identifying criteria at the time of inquiry.
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
            <div className="print-page-block print-break-before w-full min-h-[297mm] bg-white border-[5px] border-double border-[#0F2A5C] p-6 sm:p-8 relative mt-8 mx-auto box-border flex flex-col justify-between">
              <div className="flex flex-col flex-1">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#0F2A5C] mb-4">
                  Appendix: ID Proof Attachment
                </h3>
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 print-avoid-break">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-bold text-[#0F2A5C] uppercase tracking-wider">
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

export default function SapsWantedReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
          <div className="w-10 h-10 border-4 border-[#0F2A5C] border-t-transparent rounded-full animate-spin"></div>
          <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Loading Report...</span>
        </div>
      }
    >
      <SapsWantedReportContent />
    </Suspense>
  );
}
