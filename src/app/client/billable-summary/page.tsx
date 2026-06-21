"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePortal } from "src/context/PortalContext";

function BillableSummaryContent() {
  const searchParams = useSearchParams();
  const { settings, verifications, organisation } = usePortal();
  const [loaded, setLoaded] = useState(false);

  // Determine billing month and year
  const now = new Date();
  const monthName = searchParams.get("month") || now.toLocaleDateString("en-US", { month: "long" });
  const yearStr = searchParams.get("year") || String(now.getFullYear());
  const year = parseInt(yearStr);

  // Month index mapping
  const monthsList = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  const monthIndex = monthsList.indexOf(monthName.toLowerCase());
  const activeMonthIndex = monthIndex !== -1 ? monthIndex : now.getMonth();

  // Billing period dates
  const daysInMonth = new Date(year, activeMonthIndex + 1, 0).getDate();
  const monthShort = new Date(year, activeMonthIndex, 1).toLocaleDateString("en-US", { month: "short" });
  const startDateStr = `1 ${monthShort} ${year}`;
  const endDateStr = `${daysInMonth} ${monthShort} ${year}`;

  // Filter completed verifications for the selected month/year
  const clientCompany = settings?.companyName || "";
  const filteredVerifications = verifications.filter((v) => {
    if (v.status !== "Completed") return false;
    if (v.orgName.toLowerCase() !== clientCompany.toLowerCase()) return false;
    try {
      const d = new Date(v.completedAt || v.date);
      if (isNaN(d.getTime())) return false;
      return d.getMonth() === activeMonthIndex && d.getFullYear() === year;
    } catch {
      return false;
    }
  });

  const perVerificationRate = organisation?.monthlyRate || 100.00; // Default to 100 as in the image
  const subTotal = filteredVerifications.length * perVerificationRate;

  useEffect(() => {
    if (settings && organisation && verifications.length > 0) {
      setLoaded(true);
    } else if (settings && organisation) {
      // Allow loading even if there are no verifications
      setLoaded(true);
    }
  }, [settings, organisation, verifications]);

  useEffect(() => {
    if (loaded) {
      // Trigger print dialog automatically
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Loading Billable Summary...</span>
      </div>
    );
  }

  // Address helper
  const customerAddress = [settings.address, settings.city, settings.postalCode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8 font-sans text-slate-800 printable-area">
      {/* Outer Border Frame */}
      <div className="border-[3px] border-double border-[#8C1D40] p-6 max-w-6xl mx-auto rounded-xs">
        
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-[#D4F6FF]/60 pb-6 mb-6 gap-6">
          <div className="flex-1 text-left">
            <h1 className="text-[#1E3A5F] text-2xl font-extrabold tracking-tight mb-2">Billable Requests Summary</h1>
            <div className="space-y-1 text-xs text-slate-600 font-semibold">
              <p>Billing Month: <span className="text-[#0F172A] font-bold">{monthName} {year}</span></p>
              <p>Billing Period: <span className="text-[#0F172A] font-bold">{startDateStr} to {endDateStr}</span></p>
              <p>Total Billable Requests: <span className="text-[#0F172A] font-bold">{filteredVerifications.length}</span></p>
            </div>
          </div>
          
          {/* Cluso Logo */}
          <div className="flex items-center gap-3 self-center md:self-start bg-[#D4F6FF]/10 border border-[#C6E7FF]/40 px-4 py-2 rounded-2xl shrink-0">
            {/* Mock Cluso Diamond Logo */}
            <div className="relative w-8 h-8 flex items-center justify-center rotate-45 border-2 border-[#85F4FF] bg-gradient-to-br from-[#EFFFFD] via-[#B8FFF9] to-[#85F4FF] rounded-lg shadow-2xs shrink-0">
              <div className="w-4 h-4 bg-[#0369a1] rounded-xs -rotate-45"></div>
            </div>
            <div className="text-left">
              <span className="font-extrabold text-[#0F172A] text-lg leading-none block">Cluso</span>
              <span className="text-[10px] uppercase tracking-widest text-[#475569] font-bold block leading-none mt-0.5">Infolink</span>
            </div>
          </div>
        </div>

        {/* Customer Details vs Cluso Details Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 border border-slate-200 rounded-xl overflow-hidden mb-8 shadow-3xs">
          
          {/* Customer Details */}
          <div className="p-5 bg-white text-left border-r border-slate-200">
            <h3 className="font-extrabold text-sm text-[#1E3A5F] border-b border-slate-100 pb-2 mb-3">Customer Details - Enterprise Details</h3>
            <table className="w-full text-xs font-semibold text-slate-600 space-y-2.5">
              <tbody>
                <tr>
                  <td className="w-1/3 py-1 font-bold">Company Name:</td>
                  <td className="w-2/3 py-1 text-slate-900">{settings.companyName || "Custent"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">Login Email:</td>
                  <td className="py-1 text-slate-900">{settings.contactEmail || "cust@test.com"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">GSTIN:</td>
                  <td className="py-1 text-slate-900">{settings.gstin || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">CIN / Registration:</td>
                  <td className="py-1 text-slate-900">{settings.cin || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">Address:</td>
                  <td className="py-1 text-slate-900 leading-tight">{customerAddress || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">Invoice Email:</td>
                  <td className="py-1 text-slate-900">{settings.invoiceEmail || settings.contactEmail || "cust@test.com"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">Billing same as company:</td>
                  <td className="py-1 text-slate-900">{settings.billingSameAsCompany ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">Billing Address:</td>
                  <td className="py-1 text-slate-900 leading-tight">
                    {settings.billingSameAsCompany ? "-" : settings.billingAddress || "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cluso Infolink Details */}
          <div className="p-5 bg-white text-left">
            <h3 className="font-extrabold text-sm text-[#1E3A5F] border-b border-slate-100 pb-2 mb-3">Cluso Infolink Details</h3>
            <table className="w-full text-xs font-semibold text-slate-600 space-y-2.5">
              <tbody>
                <tr>
                  <td className="w-1/3 py-1 font-bold">Company Name:</td>
                  <td className="w-2/3 py-1 text-slate-900">Cluso Infolink Private Limited</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">Login Email:</td>
                  <td className="py-1 text-slate-900">indiaops@cluso.in</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">GSTIN:</td>
                  <td className="py-1 text-slate-900">29AADCC1935C1ZZ</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">CIN / Registration:</td>
                  <td className="py-1 text-slate-900">U74140KA2007PTC042369</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">SAC Code:</td>
                  <td className="py-1 text-slate-900">U72900GJ2018PTC654321</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">LUT Code:</td>
                  <td className="py-1 text-slate-900">LUT12345</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">Address:</td>
                  <td className="py-1 text-slate-900 leading-tight">Evoma #14, Old Madras Road, Near Garden City College,, Bhattarahalli, Binna Mangala, Krishnarajapuram,, Bengaluru, Karnataka, 560049</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">Invoice Email:</td>
                  <td className="py-1 text-slate-900">indiaops@cluso.in</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">Billing same as company:</td>
                  <td className="py-1 text-slate-900">Yes</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">Billing Address:</td>
                  <td className="py-1 text-slate-900 leading-tight">Evoma #14, Old Madras Road, Near Garden City College,, Bhattarahalli, Binna Mangala, Krishnarajapuram,, Bengaluru, Karnataka, 560049</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Section Header */}
        <h2 className="text-[#1E3A5F] text-sm font-extrabold tracking-wide uppercase text-left mb-3">Candidate-wise Billable Summary</h2>

        {/* Billable Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl mb-4">
          <table className="w-full text-left text-xs whitespace-nowrap font-medium text-slate-700">
            <thead>
              <tr className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                <th className="py-3 px-3">Sr No.</th>
                <th className="py-3 px-3">Requested Date</th>
                <th className="py-3 px-3">Name of Candidate</th>
                <th className="py-3 px-3">User Name</th>
                <th className="py-3 px-3">Verifier Name</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Service</th>
                <th className="py-3 px-3">Verification Origin</th>
                <th className="py-3 px-3">Price Currency</th>
                <th className="py-3 px-3 text-right">Price (Excl. GST)</th>
                <th className="py-3 px-3 text-right">Price (Incl. GST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredVerifications.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400 font-semibold">
                    No billable requests completed for {monthName} {year}.
                  </td>
                </tr>
              ) : (
                filteredVerifications.map((v, idx) => {
                  let formattedDate = v.date;
                  try {
                    const d = new Date(v.completedAt || v.date);
                    if (!isNaN(d.getTime())) {
                      formattedDate = d.toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      });
                    }
                  } catch {}

                  return (
                    <tr key={v.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-slate-900">{idx + 1}</td>
                      <td className="py-3 px-3">{formattedDate}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{v.name}</td>
                      <td className="py-3 px-3">{settings.companyName || "Custent"}</td>
                      <td className="py-3 px-3">{v.verifier || "Prabir Kumar"}</td>
                      <td className="py-3 px-3 font-bold text-emerald-700">Verified</td>
                      <td className="py-3 px-3">PAN Verification</td>
                      <td className="py-3 px-3">India</td>
                      <td className="py-3 px-3">INR</td>
                      <td className="py-3 px-3 text-right font-mono">₹{perVerificationRate.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{perVerificationRate.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Subtotal / GST / Total Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl mb-6">
          <table className="w-full text-left text-xs whitespace-nowrap font-medium text-slate-700">
            <thead>
              <tr className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                <th className="py-3 px-3">Currency</th>
                <th className="py-3 px-3 text-right">Sub Total</th>
                <th className="py-3 px-3 text-right">GST</th>
                <th className="py-3 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                <td className="py-3.5 px-3 font-bold text-slate-900">INR</td>
                <td className="py-3.5 px-3 text-right font-bold text-slate-900 font-mono">₹{subTotal.toFixed(2)}</td>
                <td className="py-3.5 px-3 text-right font-semibold text-slate-400 font-mono">—</td>
                <td className="py-3.5 px-3 text-right font-extrabold text-[#8C1D40] font-mono text-sm">₹{subTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer print action button (hidden in printout) */}
        <div className="flex justify-end gap-3 mt-8 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-[#1E3A5F] text-white hover:bg-[#0F172A] rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Print Report</span>
          </button>
          <button
            onClick={() => window.close()}
            className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .printable-area {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}

export default function BillableSummaryPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">Loading Billable Summary...</span>
      </div>
    }>
      <BillableSummaryContent />
    </Suspense>
  );
}
