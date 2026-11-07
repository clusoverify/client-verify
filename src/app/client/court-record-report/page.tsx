"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import OzcluLogo from "../../components/OzcluLogo";

function CourtRecordReportContent() {
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
        <div className="w-10 h-10 border-4 border-[#016e1c] border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Generating Court Record Report...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">!</div>
        <h2 className="text-lg font-bold text-slate-800">Report Generation Failed</h2>
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

  if (verification.courtRecordStatus === "admin_review" || verification.courtRecordAdminReview === true) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-lg relative flex flex-col items-center gap-6">
          <div className="relative w-24 h-24 flex items-center justify-center bg-amber-50 rounded-full border border-amber-200">
            <svg className="w-12 h-12 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-extrabold text-slate-800 font-sans">Internal verification is in progress</h2>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-sm">
              Our compliance team is currently verifying the court records for accuracy. This check will complete before 12 hours.
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

  const reportNo = verification.id ? verification.id.replace(/^[A-Z]{3}/, "CRT") : "CRT-UNKNOWN";

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

  const generatedAtDate = verification.courtRecordCompletedAt
    ? new Date(verification.courtRecordCompletedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase()
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase();

  const hasRecords = verification.courtRecordHasRecords === true;
  const totalCases = verification.courtRecordTotalCases || 0;
  const totalComplexes = verification.courtRecordTotalComplexes || 0;
  const results = verification.courtRecordResults || [];
  const isSearchComplete = verification.courtRecordStatus === "completed" || verification.courtRecordStatus === "error" || verification.courtRecordStatus === "needs_admin_retry";

  const getVerificationYear = () => {
    try {
      const d = new Date(verification.courtRecordCompletedAt || verification.date);
      if (!isNaN(d.getTime())) return d.getFullYear();
    } catch {}
    return new Date().getFullYear();
  };
  const verificationYear = getVerificationYear();

  const getVerificationYearRange = () => {
    const defaultYearsBack = 3;
    const currentYear = new Date().getFullYear();
    if (!verification.addresses || !Array.isArray(verification.addresses) || verification.addresses.length === 0) {
      return { fromYear: currentYear - defaultYearsBack + 1, toYear: currentYear };
    }
    let minFrom = Infinity;
    let maxTo = -Infinity;
    for (const addr of verification.addresses) {
      const toYr = addr.toYear || currentYear;
      const fromYr = addr.fromYear || (toYr - defaultYearsBack + 1);
      if (fromYr < minFrom) minFrom = fromYr;
      if (toYr > maxTo) maxTo = toYr;
    }
    if (minFrom === Infinity) minFrom = currentYear - defaultYearsBack + 1;
    if (maxTo === -Infinity) maxTo = currentYear;
    return { fromYear: minFrom, toYear: maxTo };
  };
  const { fromYear, toYear } = getVerificationYearRange();

  const verdictColor = hasRecords ? "text-rose-700" : "text-emerald-700";
  const verdictBg = hasRecords ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200";
  const verdictText = hasRecords
    ? `${totalCases} Court Record(s) Found`
    : "No Court Records Found";

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
            border: 5px double #1B365D !important;
            padding: 16px 18px !important;
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
      <div className="no-print print:hidden w-full max-w-[700px] bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800">Court Record Report</span>
          <span className="text-xs text-slate-500">Ready to save or export as official A4 PDF document.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#016e1c] text-white rounded-lg font-bold text-xs hover:bg-[#00450e] cursor-pointer shadow-sm transition-all"
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

      {/* Main Report Container */}
      <div className="print-card w-full max-w-[700px] bg-white border-[6px] border-double border-[#1B365D] p-6 sm:p-8 shadow-lg relative my-0 mx-auto print:shadow-none print:p-6 print:max-w-full print:w-full">

        {/* Page 1 Content Block */}
        <div className="print-page-block">
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

            {/* Top Middle: Court Logo (20% larger) */}
            <div className="flex justify-center items-center w-1/3 text-center">
              <img
                src="/ecourts-logo.png"
                alt="eCourts Services"
                className="h-10 sm:h-12 w-auto max-w-[190px] object-contain drop-shadow-xs"
              />
            </div>

            {/* Top Right: Report Number & Date */}
            <div className="flex justify-end items-center shrink-0 w-1/3">
              <div className="text-right text-[11px] sm:text-xs font-bold text-slate-800 space-y-0.5">
                <div>Report #: <span className="font-mono text-slate-900">{reportNo}</span></div>
                <div>Date: <span className="text-slate-900">{formatDate(verification.courtRecordCompletedAt || verification.date)}</span></div>
              </div>
            </div>
          </div>

          {/* Report Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="font-sans text-[#1B365D] text-xl sm:text-2xl font-black tracking-widest uppercase leading-tight">
              COURT CHECK REPORT
            </h1>
          </div>

          {/* Metadata Card */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 mb-6">
            <div className="space-y-1.5">
              <div>Request Created: <span className="text-slate-900 font-mono">{verification.date}</span></div>
              <div>Search Status: <span className={`font-bold uppercase ${isSearchComplete ? "text-emerald-600" : "text-amber-500"}`}>
                {isSearchComplete ? "Completed" : "In Progress"}
              </span></div>
              <div>Verification Year Span: <span className="text-slate-900 font-mono">{fromYear} — {toYear} ({toYear - fromYear + 1} Years)</span></div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4 text-left sm:text-right">
              <div className="space-y-1.5">
                <div>Generated At: <span className="text-slate-900 font-mono">{generatedAtDate} (IST)</span></div>
                <div>Verified By: <span className="text-slate-900">eCourts India (Automated)</span></div>
              </div>
            </div>
          </div>

          {/* Details of the Report */}
          <div className="mb-6 border-b border-slate-100 pb-5">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1B365D] border-b border-slate-200 pb-1 mb-2.5">
              Details of the Report
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 text-[11px]">
              <div className="space-y-1">
                <div><span className="text-slate-500 font-semibold">Full Name:</span> <span className="font-bold text-slate-800">{verification.name || "Not Given"}</span></div>
                {verification.gender && verification.gender !== "Not Given" && verification.gender !== "Not Provided" && verification.gender !== "Not required" && (
                  <div><span className="text-slate-500 font-semibold">Gender:</span> <span className="font-semibold text-slate-800">{verification.gender}</span></div>
                )}
                <div><span className="text-slate-500 font-semibold">Date of Birth:</span> <span className="font-semibold text-slate-800">{verification.candidateDob || "Not Given"}</span></div>
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
                <div><span className="text-slate-500 font-semibold">Client Org:</span> <span className="font-semibold text-slate-800">{verification.orgName}</span></div>
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
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1B365D] mb-2">Addresses Provided</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5 border-r border-slate-200 w-12">#</th>
                      <th className="p-2.5 border-r border-slate-200">Address</th>
                      <th className="p-2.5 border-r border-slate-200">City</th>
                      <th className="p-2.5 border-r border-slate-200">State</th>
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
                        <td className="p-2">{addr.country || "India"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Overall Verdict */}
          <div className={`mb-8 p-5 border-2 rounded-xl ${verdictBg} print-avoid-break`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1B365D] mb-1">Overall Verdict</h3>
                <p className={`text-lg font-extrabold ${verdictColor}`}>{verdictText}</p>
                <p className="text-xs text-slate-600 mt-1 font-semibold">
                  Searched {totalComplexes} court complex(es) across {results.length} district(s)
                </p>
                <p className="text-[10px] text-slate-500 mt-2 font-medium leading-relaxed max-w-[480px]">
                  This report is generated through a secure verification process using the information provided by the candidate against records available on the eCourts India system for the period {fromYear}–{toYear}. The search is conducted in accordance with applicable Indian laws, including the Information Technology Act, 2000, and the Code of Civil Procedure, 1908.
                </p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-0.5 bg-white border border-slate-200/80 p-2 rounded-lg shadow-sm">
                <img src="/ecourts-logo.png" alt="eCourts India" className="w-14 h-14 object-contain" />
                <span className="text-[8px] font-extrabold uppercase text-[#1B365D] tracking-wider">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 Content Block */}
        <div className="print-page-block print-break-before mt-6 print:mt-0">
          {/* Detailed Results Per District/Address */}
          {results.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#1B365D] mb-4">Search Results by District</h3>

            {results.map((result: any, rIdx: number) => {
              const validComplexes = (result.complexSearches || []).filter((cs: any) => !cs.error);
              if (validComplexes.length === 0) return null;
              return (
                <div key={rIdx} className="mb-6 print-avoid-break">
                  {/* District Header */}
                  <div className="bg-slate-100 border border-slate-200 rounded-t-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1B365D]">
                        {result.district}, {result.state}
                      </span>
                      {result.address && (
                        <div className="text-[10px] text-slate-500 mt-0.5">{result.address}{result.city ? `, ${result.city}` : ""}{result.state ? `, ${result.state}` : ""}</div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {validComplexes.length} Complex(es)
                    </span>
                  </div>

                  {/* Court Complex Results */}
                  <div className="border border-t-0 border-slate-200 rounded-b-xl overflow-hidden">
                    {(() => {
                      const complexesMap = new Map<string, {
                        complexName: string;
                        complexCode: string;
                        hasEstablishments: boolean;
                        establishments: Array<{
                          establishmentName?: string;
                          establishmentCode?: string;
                          casesFound: number;
                          cases: any[];
                          error?: string;
                        }>;
                        casesFound?: number;
                        cases?: any[];
                        error?: string;
                      }>();

                      for (const cs of validComplexes) {
                        if (!complexesMap.has(cs.complexCode)) {
                          complexesMap.set(cs.complexCode, {
                            complexName: cs.complexName,
                            complexCode: cs.complexCode,
                            hasEstablishments: !!cs.establishmentName,
                            establishments: [],
                          });
                        }
                        const grouped = complexesMap.get(cs.complexCode)!;
                        if (cs.establishmentName) {
                          grouped.establishments.push({
                            establishmentName: cs.establishmentName,
                            establishmentCode: cs.establishmentCode,
                            casesFound: cs.casesFound,
                            cases: cs.cases,
                            error: cs.error,
                          });
                        } else {
                          grouped.casesFound = cs.casesFound;
                          grouped.cases = cs.cases;
                          grouped.error = cs.error;
                        }
                      }

                      const groupedList = Array.from(complexesMap.values());

                      return groupedList.map((g, gIdx) => (
                        <div key={gIdx} className={`${gIdx > 0 ? "border-t border-slate-200" : ""}`}>
                          {g.hasEstablishments ? (
                            <>
                              {/* Complex Header (No badge, serves as parent grouping) */}
                              <div className="px-4 py-2 bg-slate-50/75 border-b border-slate-200">
                                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                                  🏢 {g.complexName}
                                </span>
                              </div>
                              
                              {/* Establishments List */}
                              <div className="divide-y divide-slate-100 bg-white">
                                {g.establishments.map((est, estIdx) => (
                                  <div key={estIdx} className="pl-6 pr-4 py-2.5 bg-white">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[11px] font-bold text-slate-800">
                                        — {est.establishmentName}
                                      </span>
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                        est.casesFound > 0
                                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      }`}>
                                        {est.casesFound > 0
                                          ? `${est.casesFound} Record(s) Found`
                                          : "No Records"}
                                      </span>
                                    </div>

                                    {/* Case Details Table for this establishment */}
                                    {est.cases && est.cases.length > 0 && (
                                      <div className="mt-2 pb-1">
                                        <table className="w-full text-left text-[11px] border-collapse border border-slate-200 rounded-lg overflow-hidden">
                                          <thead>
                                            <tr className="bg-rose-50/50 text-slate-700 font-bold">
                                              <th className="p-2 border-r border-b border-slate-200 w-8">#</th>
                                              <th className="p-2 border-r border-b border-slate-200">Case Number</th>
                                              <th className="p-2 border-r border-b border-slate-200">Petitioner</th>
                                              <th className="p-2 border-r border-b border-slate-200">Respondent</th>
                                              <th className="p-2 border-b border-slate-200">Order Date</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold">
                                            {est.cases.map((c: any, cIdx: number) => (
                                              <tr key={cIdx}>
                                                <td className="p-2 border-r border-slate-200 text-center">{cIdx + 1}</td>
                                                <td className="p-2 border-r border-slate-200 font-mono">{c.caseNumber}</td>
                                                <td className="p-2 border-r border-slate-200">{c.petitioner}</td>
                                                <td className="p-2 border-r border-slate-200">{c.respondent}</td>
                                                <td className="p-2">{c.orderDate}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Standard Complex with No Establishments */}
                              <div className="px-4 py-2.5 bg-white flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">{g.complexName}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  g.casesFound && g.casesFound > 0
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}>
                                  {g.casesFound && g.casesFound > 0
                                    ? `${g.casesFound} Record(s) Found`
                                    : "No Records"}
                                </span>
                              </div>

                              {/* Case Details Table */}
                              {g.cases && g.cases.length > 0 && (
                                <div className="px-4 pb-3">
                                  <table className="w-full text-left text-[11px] border-collapse border border-slate-200 rounded-lg overflow-hidden">
                                    <thead>
                                      <tr className="bg-rose-50/50 text-slate-700 font-bold">
                                        <th className="p-2 border-r border-b border-slate-200 w-8">#</th>
                                        <th className="p-2 border-r border-b border-slate-200">Case Number</th>
                                        <th className="p-2 border-r border-b border-slate-200">Petitioner</th>
                                        <th className="p-2 border-r border-b border-slate-200">Respondent</th>
                                        <th className="p-2 border-b border-slate-200">Order Date</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-slate-800 font-semibold">
                                      {g.cases.map((c: any, cIdx: number) => (
                                        <tr key={cIdx}>
                                          <td className="p-2 border-r border-slate-200 text-center">{cIdx + 1}</td>
                                          <td className="p-2 border-r border-slate-200 font-mono">{c.caseNumber}</td>
                                          <td className="p-2 border-r border-slate-200">{c.petitioner}</td>
                                          <td className="p-2 border-r border-slate-200">{c.respondent}</td>
                                          <td className="p-2">{c.orderDate}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}



        {/* Disclaimer */}
        <div className="border-t-2 border-slate-200 pt-5 mt-8 text-[10px] text-slate-500 leading-relaxed print-avoid-break print:mt-auto">
          <p className="font-bold text-slate-700 mb-1 uppercase tracking-wider text-[9px]">Disclaimer</p>
          <p>
            This report is generated based on records available on the eCourts India portal using the search parameters provided and may include records relating to individuals with identical or similar names. The information is provided for informational purposes only and does not constitute legal verification or legal opinion. The report provider disclaims all liability arising from the use of or reliance upon this report, and independent verification is recommended before making any decision.
          </p>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <img src="/cluso-logo-long-default.svg" alt="Cluso Infolink" className="h-5 object-contain" />
              <span className="text-[9px] font-bold text-slate-400">Powered by Cluso Infolink Verify</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1B365D] text-white px-2 py-0.5 rounded shadow-sm border border-slate-200/80">
              <img src="/ecourts-logo.png" alt="eCourts Secured" className="w-3.5 h-3.5 object-contain invert brightness-200" />
              <span className="text-[8px] font-extrabold uppercase tracking-wider">eCourts Secured</span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">Generated: {generatedAtDate}</span>
          </div>
        </div>

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
    </div>
  );
}

export default function CourtRecordReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
          <div className="w-10 h-10 border-4 border-[#016e1c] border-t-transparent rounded-full animate-spin"></div>
          <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Loading...</span>
        </div>
      }
    >
      <CourtRecordReportContent />
    </Suspense>
  );
}
