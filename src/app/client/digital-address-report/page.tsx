"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import OzcluLogo from "../../components/OzcluLogo";

function DigitalAddressReportContent() {
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6 font-sans">
        <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Generating Digital Address Report...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6 text-center font-sans">
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
  const reportNo = verification.id || "DAV-UNKNOWN";
  const davData = verification.digitalAddressData || {};

  const formatDate = (dateStr: any) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return String(dateStr);
    }
  };

  const generatedAtDate = verification.completedAt || verification.createdAt
    ? new Date(verification.completedAt || verification.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase()
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(/\u202f/g, " ").toLowerCase();

  // Helper distance calculator (Haversine formula in meters)
  const calcDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const distanceMeters = calcDistanceMeters(
    davData.selfieGeoLat,
    davData.selfieGeoLng,
    davData.houseGeoLat,
    davData.houseGeoLng
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white print:p-0 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-start font-sans">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
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
            border: 3px double #0891b2 !important;
            padding: 16px 20px !important;
            margin-bottom: 0 !important;
            box-sizing: border-box !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            background: white !important;
            max-height: 280mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      {/* Floating Toolbar */}
      <div className="no-print w-full max-w-4xl flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-center text-cyan-700 font-bold">
            📍
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">Digital Address Verification Report</h1>
            <p className="text-xs text-slate-500 font-mono">ID: {reportNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            🖨️ Print / Download PDF
          </button>
        </div>
      </div>

      {/* Printable Report Page */}
      <div className="print-card max-w-4xl w-full bg-white border border-slate-300 rounded-2xl shadow-xl overflow-hidden">
        <div className="print-page-block border-[5px] border-double border-cyan-800 p-6 sm:p-8 flex flex-col justify-between min-h-[960px]">
          <div>
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4">
              <div>
                <OzcluLogo />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Background Screening & Audit Portal</p>
              </div>
              <div className="text-right">
                <h2 className="text-base font-black text-cyan-900 uppercase tracking-tight">Digital Address Verification</h2>
                <div className="text-xs font-mono font-bold text-slate-700 mt-0.5">Report No: <span className="text-cyan-800">{reportNo}</span></div>
                <div className="text-[10.5px] text-slate-500 font-medium">Date: {generatedAtDate}</div>
              </div>
            </div>

            {/* Candidate & Request Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[8.5px] block">Candidate Name</span>
                <span className="font-bold text-slate-800 text-xs">{verification.name || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[8.5px] block">Email ID</span>
                <span className="font-semibold text-slate-700 text-xs">{verification.email || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[8.5px] block">Requesting Org</span>
                <span className="font-bold text-slate-800 text-xs">{verification.requestingOrgName || verification.orgName || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[8.5px] block">Verification Status</span>
                <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {verification.status || "Completed"}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-4 border-t border-slate-200 pt-2.5">
                <span className="text-slate-400 font-bold uppercase text-[8.5px] block">Declared Residential Address</span>
                <span className="font-semibold text-slate-800 text-xs leading-snug">{verification.candidateAddress || "N/A"}</span>
              </div>
            </div>

            {/* Captured Images Section */}
            <div className="mb-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-3 flex items-center justify-between">
                <span>Geo-Tagged Watermarked Photos</span>
                <span className="text-[9.5px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">Cluso Infolink Watermark Verified</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Selfie Photo */}
                <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>1. Candidate Selfie</span>
                    <span className="text-[9.5px] text-slate-500 font-mono">Front Camera</span>
                  </div>
                  {davData.selfieImage ? (
                    <img src={davData.selfieImage} alt="Candidate Selfie" className="w-full aspect-[16/9] max-h-[160px] object-cover rounded-lg border border-slate-300 shadow-xs" />
                  ) : (
                    <div className="w-full aspect-[16/9] max-h-[160px] bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">No Image Captured</div>
                  )}
                  <div className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded-md border border-slate-200 space-y-0.5">
                    <p className="font-bold text-slate-800">📍 Lat: {davData.selfieGeoLat ? davData.selfieGeoLat.toFixed(6) : "-"}, Lng: {davData.selfieGeoLng ? davData.selfieGeoLng.toFixed(6) : "-"}</p>
                    <p className="text-slate-500">🕒 {formatDate(davData.selfieTimestamp)} | Acc: ±{davData.selfieGeoAccuracy ? Math.round(davData.selfieGeoAccuracy) : "-"}m</p>
                    {davData.selfieGeoLat && (
                      <div className="pt-0.5">
                        <a
                          href={`https://www.google.com/maps?q=${davData.selfieGeoLat},${davData.selfieGeoLng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-[10px] rounded shadow-2xs transition-all cursor-pointer no-underline"
                        >
                          <span>🗺️ View Location on Google Maps</span>
                          <span className="text-[9px]">↗</span>
                        </a>
                        <span className="hidden print:block text-[8px] text-slate-500 font-mono mt-0.5 break-all">
                          https://www.google.com/maps?q={davData.selfieGeoLat},{davData.selfieGeoLng}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* House Photo */}
                <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>2. House Exterior</span>
                    <span className="text-[9.5px] text-slate-500 font-mono">Rear Camera</span>
                  </div>
                  {davData.houseImage ? (
                    <img src={davData.houseImage} alt="House Exterior" className="w-full aspect-[16/9] max-h-[160px] object-cover rounded-lg border border-slate-300 shadow-xs" />
                  ) : (
                    <div className="w-full aspect-[16/9] max-h-[160px] bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">No Image Captured</div>
                  )}
                  <div className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded-md border border-slate-200 space-y-0.5">
                    <p className="font-bold text-slate-800">📍 Lat: {davData.houseGeoLat ? davData.houseGeoLat.toFixed(6) : "-"}, Lng: {davData.houseGeoLng ? davData.houseGeoLng.toFixed(6) : "-"}</p>
                    <p className="text-slate-500">🕒 {formatDate(davData.houseTimestamp)} | Acc: ±{davData.houseGeoAccuracy ? Math.round(davData.houseGeoAccuracy) : "-"}m</p>
                    {davData.houseGeoLat && (
                      <div className="pt-0.5">
                        <a
                          href={`https://www.google.com/maps?q=${davData.houseGeoLat},${davData.houseGeoLng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-[10px] rounded shadow-2xs transition-all cursor-pointer no-underline"
                        >
                          <span>🗺️ View Location on Google Maps</span>
                          <span className="text-[9px]">↗</span>
                        </a>
                        <span className="hidden print:block text-[8px] text-slate-500 font-mono mt-0.5 break-all">
                          https://www.google.com/maps?q={davData.houseGeoLat},{davData.houseGeoLng}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Geolocation Audit & Distance Consistency */}
            <div className="border border-slate-200 rounded-xl p-3 bg-cyan-50/40 mb-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛡️ Geolocation Audit Summary</span>
                </h4>
                {(davData.houseGeoLat || davData.selfieGeoLat) && (
                  <a
                    href={`https://www.google.com/maps?q=${davData.houseGeoLat || davData.selfieGeoLat},${davData.houseGeoLng || davData.selfieGeoLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="no-print inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded shadow-2xs transition-all cursor-pointer"
                  >
                    <span>📍 Pinpoint Google Maps</span>
                    <span className="text-[9px]">↗</span>
                  </a>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Photo Coordinate Distance</span>
                  <span className="font-bold text-slate-800 text-xs">{distanceMeters !== null ? `${distanceMeters} meters` : "N/A"}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Distance Assessment</span>
                  <span className={`font-bold text-xs ${distanceMeters !== null && distanceMeters < 150 ? "text-emerald-700" : "text-amber-700"}`}>
                    {distanceMeters !== null && distanceMeters < 150 ? "Verified Co-located" : "Distance Variance Observed"}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Consent Audit</span>
                  <span className="font-bold text-emerald-700 text-xs">Digital Consent Recorded</span>
                </div>
              </div>
            </div>

            {/* Legal Disclaimer & Compliance Notice */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-[8.5px] leading-tight text-slate-500 mt-2">
              <span className="font-bold uppercase text-[#0891b2] block mb-0.5">Legal Disclaimer & Compliance Notice</span>
              This Digital Address Verification Report has been compiled electronically using real-time GPS geolocation metadata, biometric camera capture, and digital consent logging. Findings represent automated verification statements as of the capture timestamp for background screening purposes. Unauthorized alteration, redistribution, or duplication is strictly prohibited under applicable data protection & privacy laws.
            </div>
          </div>

          {/* Report Footer */}
          <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center text-[9.5px] text-slate-400 font-medium">
            <div>
              <span>Generated via Cluso Infolink Digital Address Verification Portal</span>
            </div>
            <div>
              <span>Confidential Background Verification Report</span>
            </div>
          </div>

          {/* Appendix: Verification Evidence */}
          {(() => {
            const attemptsWithScreenshots = (verification?.verificationAttempts || verification?.employmentAttempts || verification?.educationAttempts || []).filter((att: any) => att.screenshot);
            if (!attemptsWithScreenshots || attemptsWithScreenshots.length === 0) return null;
            return (
              <div className="print-page-block print-break-before mt-6 print:mt-0 border-t border-slate-200 pt-6">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#0891b2] mb-4">Appendix: Verification Evidence &amp; Screenshots</h3>
                <div className="space-y-6">
                  {attemptsWithScreenshots.map((att: any, idx: number) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 print-avoid-break">
                      <span className="text-[10px] font-bold text-[#0891b2] uppercase block mb-1.5 tracking-wider">
                        Attachment #{idx + 1} — logged on {att.date} (Mode: {att.verificationMode || "Manual"}, Result: {att.result || att.status || "Completed"})
                      </span>
                      {(att.screenshotCaption || att.caption) && (
                        <p className="text-xs font-extrabold text-slate-800 mb-2 bg-cyan-50/80 px-2.5 py-1 rounded-lg border border-cyan-200/60 w-fit">
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

export default function DigitalAddressReport() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading digital address report...</div>}>
      <DigitalAddressReportContent />
    </Suspense>
  );
}
