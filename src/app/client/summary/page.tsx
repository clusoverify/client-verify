"use client";

import React, { useState } from "react";
import { usePortal, Verification, Invoice } from "src/context/PortalContext";
import { 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  AlertTriangle, 
  Key, 
  Receipt, 
  CreditCard, 
  CheckCircle, 
  Lock, 
  UploadCloud, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  X,
  ShieldAlert,
  Search,
  CheckCircle2,
  Building,
  User,
  AlertCircle
} from "lucide-react";

export default function OrderSummaryPage() {
  const { verifications, invoices, settings, organisation, submitPaymentProof, fetchVerificationDetail } = usePortal();

  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"wire" | "paypal">("wire");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>("");
  const [revealStates, setRevealStates] = useState<Record<string, boolean>>({});

  const toggleReveal = (fieldKey: string) => {
    setRevealStates((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const handleInitiatePayment = (invoice: Invoice) => {
    setActiveInvoice(invoice);
    setPaymentMethod("wire");
    setPaymentSuccess(false);
    setPaymentProcessing(false);
    setProofFile(null);
    setProofFileName("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be under 2MB.");
      return;
    }
    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPayment = async () => {
    if (!activeInvoice || !proofFile) return;
    setPaymentProcessing(true);
    setTimeout(async () => {
      try {
        await submitPaymentProof(activeInvoice.id, proofFile);
        setPaymentProcessing(false);
        setPaymentSuccess(true);
        setTimeout(() => {
          setActiveInvoice(null);
          setPaymentSuccess(false);
          setProofFile(null);
          setProofFileName("");
        }, 2500);
      } catch (err) {
        console.error("Payment confirmation failed:", err);
        setPaymentProcessing(false);
      }
    }, 1200);
  };

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getUrlParams = (urlStr?: string) => {
    if (!urlStr) return { email: "", password: "" };
    try {
      const url = new URL(urlStr);
      return {
        email: url.searchParams.get("email") || "",
        password: url.searchParams.get("password") || ""
      };
    } catch (e) {
      return { email: "", password: "" };
    }
  };

  const getPhotoSrc = (photo: string) => {
    if (!photo) return "";
    if (photo.startsWith("data:image/svg+xml;utf8,")) {
      return "data:image/svg+xml," + encodeURIComponent(photo.substring("data:image/svg+xml;utf8,".length));
    }
    if (photo.startsWith("data:image/svg+xml,") && photo.includes("<svg")) {
      return "data:image/svg+xml," + encodeURIComponent(photo.substring("data:image/svg+xml,".length));
    }
    return photo;
  };

  const renderFieldCard = (
    label: string,
    value: string,
    isBadge = false,
    maskKey?: string,
    defaultMasked = false
  ) => {
    const isMasked = defaultMasked && maskKey;
    const isRevealed = maskKey ? revealStates[maskKey] : true;

    const getMaskedValue = () => {
      if (!value) return "••••••••";
      if (label === "EMAIL") {
        const parts = value.split("@");
        if (parts.length === 2) {
          const name = parts[0];
          const domain = parts[1];
          if (name.length > 2) {
            return `${name.substring(0, 2)}••••@${domain}`;
          }
          return `••••@${domain}`;
        }
        return "••••••••";
      }
      if (label === "MOBILE") {
        const cleanVal = value.replace(/\s+/g, "");
        if (cleanVal.length >= 4) {
          return "••••••" + cleanVal.slice(-4);
        }
        return "••••••••••";
      }
      if (label === "AADHAAR") {
        const cleanVal = value.replace(/\s+/g, "");
        if (cleanVal.length >= 4) {
          return "••••••••" + cleanVal.slice(-4);
        }
        return "••••••••••••";
      }
      if (label === "DATE OF BIRTH") return "••-••-••••";
      if (label === "PAN") {
        if (value.length >= 4) {
          return value.substring(0, 2) + "••••••" + value.slice(-2);
        }
        return "••••••••••";
      }
      if (label === "DRIVING LICENCE") {
        if (value.length >= 6) {
          return value.substring(0, 4) + "••••••" + value.slice(-2);
        }
        return "•••••••••••••••";
      }
      return "••••••••";
    };

    const displayValue = !isMasked || isRevealed ? value : getMaskedValue();
    const isIdCard = ["AADHAAR", "PAN", "DRIVING LICENCE"].includes(label);

    return (
      <div 
        className={`rounded-xl p-3.5 border relative flex flex-col justify-between gap-1.5 shadow-2xs transition-all hover:shadow-xs ${
          isIdCard 
            ? "bg-[#FFDDAE]/15 border-[#FFDDAE]/50 hover:border-[#FFDDAE]" 
            : "bg-[#D4F6FF]/20 border-[#C6E7FF]/55 hover:border-[#C6E7FF]"
        }`}
      >
        <div className="flex justify-between items-center w-full">
          {isBadge ? (
            <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
              isIdCard ? "bg-[#5C3A21] text-white" : "bg-[#0F172A] text-white"
            }`}>
              {label}
            </span>
          ) : (
            <span className="font-label-caps text-[#475569] text-[9px] uppercase tracking-wider font-semibold">
              {label}
            </span>
          )}
          {isMasked && (
            <button
              onClick={() => toggleReveal(maskKey!)}
              className={`transition-colors cursor-pointer flex items-center justify-center p-1 rounded-full ${
                isIdCard ? "text-[#5C3A21] hover:bg-[#FFDDAE]/40" : "text-[#1E3A5F] hover:bg-[#C6E7FF]/40"
              }`}
              type="button"
            >
              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        <div className="font-body-sm font-bold text-[#0F172A] break-all mt-0.5 pr-4">
          {displayValue || "N/A"}
        </div>
      </div>
    );
  };

  // Filter verifications for the current company
  const clientCompany = settings.companyName || "";
  const clientVerifications = verifications.filter(
    (v) => v.orgName.toLowerCase() === clientCompany.toLowerCase()
  );

  // Filter invoices for the current company
  const clientInvoices = invoices.filter(
    (inv) => inv.orgName.toLowerCase() === clientCompany.toLowerCase()
  );

  // Calculate balance from Unpaid/Overdue invoices
  const unpaidBalance = clientInvoices
    .filter((inv) => inv.status === "Unpaid" || inv.status === "Overdue")
    .reduce((sum, inv) => sum + inv.amount, 0);

  // UI state for filter modal, active report modal, billing history modal, and report toast
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Verification | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [billingHistoryOpen, setBillingHistoryOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleViewReport = async (v: Verification) => {
    setSelectedVerification(v);
    setSelectedDetail(null);
    setIsLoadingDetail(true);
    try {
      const detail = await fetchVerificationDetail(v.id);
      setSelectedDetail(detail);
    } catch (err) {
      console.error("Error fetching verification detail:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const displayVerification = selectedDetail || selectedVerification;

  const handleDownload = () => {
    setToastMsg("Generating PDF Audit Statement... File downloaded successfully.");
    setTimeout(() => setToastMsg(""), 3000);
  };

  const filteredVerifications = clientVerifications.filter((v) => {
    if (statusFilter === "all") return true;
    return v.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="flex flex-col gap-6 pt-4 animate-fade-in pb-12">
      <div className="flex flex-col gap-1 border-b border-[#D4F6FF] pb-5 mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#1E3A5F] bg-[#D4F6FF]/60 px-2.5 py-1 rounded-full w-fit uppercase tracking-wider font-label-caps border border-[#C6E7FF]/60">
          <Sparkles className="w-3.5 h-3.5 text-[#0F172A]" />
          <span>MANAGEMENT PORTAL</span>
        </div>
        <h2 className="font-display-lg text-primary font-bold tracking-tight text-3xl mt-2 text-[#0F172A]">Order Summary</h2>
        <p className="font-body-sm text-secondary mt-1 max-w-2xl text-slate-500">
          Review your recent verification requests, billing history, and access detailed findings reports.
        </p>
      </div>

      {toastMsg && (
        <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-6xl animate-fade-in shadow-2xs">
          <Download className="w-5 h-5 text-[#00a877] shrink-0" />
          <span className="font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">
        {/* Request Summary (Spans 2 columns on xl screens) */}
        <section className="xl:col-span-2 bg-white border border-[#C6E7FF] rounded-3xl p-6 flex flex-col gap-6 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#C6E7FF]"></div>
          <div className="flex justify-between items-center mb-1 relative">
            <h3 className="font-semibold text-lg text-[#0F172A]">Request Summary</h3>
            <div className="relative">
              <button
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className="font-bold text-xs text-[#0F172A] bg-white hover:bg-[#D4F6FF]/35 px-4 py-2.5 rounded-xl transition-all border border-[#C6E7FF] flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Filter className="w-4 h-4 text-[#1E3A5F]" />
                <span>Filter: {statusFilter.toUpperCase()}</span>
              </button>

              {filterDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#C6E7FF] rounded-xl shadow-lg z-30 overflow-hidden animate-fade-in">
                  <div className="p-1 flex flex-col gap-1 font-body-sm">
                    {["all", "Completed", "Processing", "Needs Attention"].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setFilterDropdownOpen(false);
                        }}
                        className={`text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer font-semibold ${
                          statusFilter === status ? "bg-[#C6E7FF] text-[#0F172A]" : "text-[#475569] hover:bg-[#D4F6FF]/30 hover:text-[#0F172A]"
                        }`}
                      >
                        {status.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border border-[#D4F6FF]/65 rounded-2xl shadow-2xs">
            <table className="w-full text-left font-body-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#D4F6FF] bg-[#D4F6FF]/20 text-[#0F172A] font-bold text-xs">
                  <th className="py-3 px-4 font-label-caps uppercase tracking-wider">Request ID</th>
                  <th className="py-3 px-4 font-label-caps uppercase tracking-wider">Subject</th>
                  <th className="py-3 px-4 font-label-caps uppercase tracking-wider">Date Submitted</th>
                  <th className="py-3 px-4 font-label-caps uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 font-label-caps text-right uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4F6FF]/40 bg-white">
                {filteredVerifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#475569] text-xs font-medium">
                      No verification requests found matching filter constraints.
                    </td>
                  </tr>
                ) : (
                  filteredVerifications.map((v) => (
                    <tr key={v.id} className="hover:bg-[#D4F6FF]/15 transition-colors group">
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A] text-xs">{v.id}</td>
                      <td className="py-3.5 px-4 text-[#0F172A] text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold">{v.name}</span>
                          <span className="text-[11px] text-[#475569] font-medium">{v.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#475569] text-xs font-semibold">{v.date}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide uppercase border ${
                            v.status === "Completed"
                              ? "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                              : v.status === "Processing"
                              ? "bg-[#D4F6FF]/40 text-[#0F172A] border-[#C6E7FF]/70"
                              : "bg-[#FFDDAE]/40 text-[#5C3A21] border-[#FFDDAE]"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {v.status === "Completed" ? (
                          <button
                            onClick={() => handleViewReport(v)}
                            className="font-bold text-[11px] px-3 py-1.5 rounded-lg bg-[#C6E7FF]/40 text-[#0F172A] hover:bg-[#C6E7FF] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>View Report</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : v.status === "Needs Attention" ? (
                          <button
                            onClick={() => handleViewReport(v)}
                            className="font-bold text-[11px] px-3 py-1.5 rounded-lg bg-[#FFDDAE] text-[#5C3A21] hover:bg-[#FFDDAE]/85 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>Resolve Issue</span>
                            <AlertTriangle className="w-3.5 h-3.5 text-[#5C3A21]" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleViewReport(v)}
                            className="font-bold text-[11px] px-3 py-1.5 rounded-lg bg-[#D4F6FF]/65 text-[#0F172A] hover:bg-[#D4F6FF] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>Credentials</span>
                            <Key className="w-3.5 h-3.5 text-[#0F172A]" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-2 pt-4 border-t border-[#D4F6FF]/60 flex justify-between items-center text-xs">
            <span className="text-[#475569] font-medium">
              Showing {filteredVerifications.length} of {clientVerifications.length} requests
            </span>
            <div className="flex gap-2">
              <button className="p-1.5 rounded-lg text-secondary hover:bg-[#D4F6FF]/30 disabled:opacity-50 transition-colors" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg text-secondary hover:bg-[#D4F6FF]/30 disabled:opacity-50 transition-colors" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Sidebar Cards Column */}
        <div className="flex flex-col gap-6">
          {/* Invoice Summary */}
          <section className="bg-white border border-[#C6E7FF] rounded-3xl p-6 flex flex-col gap-5 relative overflow-hidden group shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#C6E7FF] opacity-25 rounded-full blur-2xl group-hover:opacity-35 transition-opacity pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#C6E7FF]"></div>
            <div className="flex justify-between items-start mb-1 relative z-10">
              <h3 className="font-semibold text-lg text-[#0F172A]">Invoice Summary</h3>
              <Receipt className="w-5 h-5 text-[#475569]" />
            </div>
            
            <div className="relative z-10">
              <p className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider uppercase mb-1">Current Balance</p>
              <p className="font-display-lg text-[#0F172A] font-bold tracking-tight text-3xl">${unpaidBalance.toFixed(2)}</p>
              <p className="text-slate-500 text-xs mt-1 font-medium">Due by next statement</p>
            </div>

            <div className="space-y-3 relative z-10 mt-2">
              {clientInvoices.slice(0, 2).map((inv) => (
                <div key={inv._id || inv.id} className="flex justify-between items-center border-b border-[#D4F6FF]/40 pb-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-[#0F172A]">{inv.id}</span>
                    <span className="text-[11px] text-[#475569] font-medium">Due {inv.dueDate}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-xs text-[#0F172A]">${inv.amount.toFixed(2)}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {inv.status !== "Paid" && inv.status !== "Pending" && (
                        <button
                          type="button"
                          onClick={() => handleInitiatePayment(inv)}
                          className="text-[11px] text-[#0F172A] hover:text-[#1E293B] font-bold underline cursor-pointer hover:no-underline"
                        >
                          Pay
                        </button>
                      )}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                          inv.status === "Paid"
                            ? "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                            : inv.status === "Pending"
                            ? "bg-[#FFDDAE]/40 text-[#5C3A21] border border-[#FFDDAE]"
                            : inv.status === "Overdue"
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : "bg-surface-container-high text-[#475569] border border-outline-variant"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setBillingHistoryOpen(true)}
              className="mt-2 w-full py-2.5 bg-[#FBFBFB] hover:bg-[#D4F6FF]/35 text-[#0F172A] font-bold text-xs rounded-xl border border-[#C6E7FF] transition-all relative z-10 flex justify-center items-center gap-2 cursor-pointer shadow-2xs"
            >
              <span>View Billing History</span>
              <ArrowRight className="w-4 h-4 text-[#0F172A]" />
            </button>
          </section>

          {/* Quick Action Card */}
          <section className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#134074] text-white rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#C6E7FF]/10 via-transparent to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex flex-col gap-1">
              <h3 className="font-semibold text-base text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFDDAE]" />
                <span>Need a detailed audit?</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1.5 font-medium">
                Download a comprehensive PDF of all activities for compliance records.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="mt-2 w-full py-2.5 bg-[#C6E7FF] text-[#0F172A] font-bold text-sm rounded-xl hover:bg-white active:scale-95 transition-all shadow-sm relative z-10 flex justify-center items-center gap-2 group cursor-pointer"
            >
              <span>Generate Compliance PDF</span>
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </section>
        </div>
      </div>

      {/* View Report Detail Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`bg-white border border-[#C6E7FF] rounded-3xl p-8 w-full shadow-2xl relative max-h-[85vh] overflow-y-auto ${displayVerification?.digilockerStatus === "Verified" ? "max-w-3xl" : "max-w-lg"}`}>
            <button
              onClick={() => {
                setSelectedVerification(null);
                setSelectedDetail(null);
              }}
              className="absolute right-4 top-4 p-2 hover:bg-[#D4F6FF]/40 transition-colors rounded-xl text-[#0F172A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {isLoadingDetail ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#1E3A5F]">
                <div className="w-10 h-10 border-4 border-[#C6E7FF] border-t-[#0F172A] rounded-full animate-spin"></div>
                <span className="text-xs font-bold font-label-caps uppercase tracking-wider animate-pulse">Decrypting Secured Records...</span>
              </div>
            ) : displayVerification && (
              <>
                <div className="flex items-center gap-3 mb-6 animate-fade-in">
                  <div className={`p-2.5 rounded-xl border ${
                      displayVerification.status === "Completed"
                        ? "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                        : "bg-red-50 text-red-800 border-red-200"
                    }`}
                  >
                    {displayVerification.status === "Completed" ? (
                      <CheckCircle2 className="w-6 h-6 text-[#00684A]" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-700" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#0F172A]">Verification Report</h3>
                    <p className="text-[11px] font-bold text-[#475569] font-mono">ID: {displayVerification.id}</p>
                  </div>
                </div>

                <div className="space-y-4 font-body-sm animate-fade-in">
                  {displayVerification.onboardingStatus === "setup_pending" && (
                    <div className="p-4 bg-[#FFF8E1] border border-[#FFE082] rounded-2xl text-sm flex items-center gap-3 shadow-2xs mb-4">
                      <div className="w-8 h-8 bg-[#FFF3E0] border border-[#FFE082] rounded-full flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4 text-[#F57C00]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#E65100] text-xs">Password Setup Pending</span>
                        <span className="text-[10px] text-[#BF360C]">The candidate has not yet set their password via the setup link.</span>
                      </div>
                    </div>
                  )}

                  {displayVerification.digilockerStatus === "Verified" ? (
                    <div className="space-y-6 mt-4">
                      <div className="bg-[#E6F8F3] border border-[#A3EAD6] rounded-xl p-4 flex items-center gap-3 shadow-xs">
                        <CheckCircle className="w-6 h-6 text-[#00684A] shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-bold text-[#00684A] text-sm">
                            Identity Verified via DigiLocker
                          </span>
                          <span className="text-[11px] text-[#00684A]/80 font-bold">
                            Verified on {displayVerification.completedAt ? new Date(displayVerification.completedAt).toLocaleString("en-US", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Photo on left */}
                        <div className="w-24 h-28 bg-[#D4F6FF]/20 rounded-2xl overflow-hidden border border-[#D4F6FF] shrink-0 flex items-center justify-center shadow-xs">
                          {displayVerification.digilockerPhoto ? (
                            <img 
                              src={getPhotoSrc(displayVerification.digilockerPhoto)} 
                              alt="DigiLocker User Avatar" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-[#1E3A5F]">No Photo</span>
                          )}
                        </div>

                        {/* Grid fields on right */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                          <div className="sm:col-span-2">
                            {renderFieldCard("FULL NAME", displayVerification.digilockerName || "", false)}
                          </div>
                          <div className="sm:col-span-1">
                            {renderFieldCard("AGE", displayVerification.digilockerAge || "", false)}
                          </div>

                          <div className="sm:col-span-1">
                            {renderFieldCard("DATE OF BIRTH", displayVerification.digilockerDob || "", false, `dob-${displayVerification.id}`, true)}
                          </div>
                          <div className="sm:col-span-1">
                            {renderFieldCard("GENDER", displayVerification.digilockerGender || "", false)}
                          </div>
                          <div className="sm:col-span-1">
                            {(() => {
                              const val = displayVerification.digilockerMobile || "";
                              const cleanVal = val.replace(/\s+/g, "");
                              const maskedVal = cleanVal.length >= 4 ? "••••••" + cleanVal.slice(-4) : "••••••••••";
                              return renderFieldCard("MOBILE", maskedVal, false);
                            })()}
                          </div>

                          <div className="sm:col-span-2">
                            {renderFieldCard("EMAIL", displayVerification.digilockerEmail || "", false, `email-${displayVerification.id}`, true)}
                          </div>
                          <div className="sm:col-span-1">
                            {renderFieldCard("AADHAAR", displayVerification.digilockerAadhaar || "", false, `aadhaar-${displayVerification.id}`, true)}
                          </div>

                          <div className="sm:col-span-1">
                            {renderFieldCard("PAN", displayVerification.digilockerPan || "", true, `pan-${displayVerification.id}`, true)}
                          </div>
                          <div className="sm:col-span-2">
                            {renderFieldCard("DRIVING LICENCE", displayVerification.digilockerDrivingLicence || "", true, `dl-${displayVerification.id}`, true)}
                          </div>
                        </div>
                      </div>

                      {displayVerification.digilockerDocuments && displayVerification.digilockerDocuments.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <span className="font-label-caps text-[#475569] text-[10px] uppercase font-bold tracking-wider block">VERIFIED DOCUMENTS</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {displayVerification.digilockerDocuments.map((doc: any) => (
                              <div key={doc.id} className="p-3.5 bg-[#D4F6FF]/10 border border-[#D4F6FF] rounded-xl flex flex-col gap-1.5 shadow-2xs">
                                <span className="font-bold text-xs text-[#0F172A]">{doc.name}</span>
                                <span className="text-[10px] text-[#475569] font-semibold">{doc.issuer}</span>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#D4F6FF]/40">
                                  <span className="text-[9px] font-mono text-secondary truncate max-w-[150px]" title={doc.uri}>{doc.uri}</span>
                                  <span className="text-[9px] bg-[#E6F8F3] text-[#00684A] font-bold px-2 py-0.5 rounded border border-[#A3EAD6]">{doc.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4 bg-[#D4F6FF]/15 border border-[#D4F6FF] p-4 rounded-xl text-left">
                        <div>
                          <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider block">CANDIDATE NAME</span>
                          <span className="text-[#0F172A] font-bold text-xs">{displayVerification.name}</span>
                        </div>
                        <div>
                          <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider block">CANDIDATE EMAIL</span>
                          <span className="text-[#0F172A] text-xs font-semibold">{displayVerification.email}</span>
                        </div>
                        <div>
                          <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider block">ORGANIZATION</span>
                          <span className="text-[#0F172A] text-xs font-semibold">{displayVerification.orgName}</span>
                        </div>
                        <div>
                          <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider block">DATE INITIATED</span>
                          <span className="text-[#0F172A] text-xs font-semibold">{displayVerification.date}</span>
                        </div>
                        <div>
                          <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider block">VERIFIER ASSIGNED</span>
                          <span className="text-[#0F172A] text-xs font-semibold">{displayVerification.verifier || "Not Assigned"}</span>
                        </div>
                        <div>
                          <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider block mb-0.5">STATUS</span>
                          <span
                            className={`inline-block font-bold px-2 py-0.5 rounded border text-[9px] uppercase ${
                              displayVerification.status === "Completed"
                                ? "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                                : "bg-[#FFDDAE]/40 text-[#5C3A21] border border-[#FFDDAE]"
                            }`}
                          >
                            {displayVerification.status}
                          </span>
                        </div>
                      </div>

                      {displayVerification.status !== "Completed" && displayVerification.setupUrl && (
                        <div className="w-full mt-4 p-5 bg-[#D4F6FF]/25 border border-[#C6E7FF] rounded-2xl text-left flex flex-col gap-3 relative overflow-hidden shadow-2xs">
                          <div className="absolute right-3 top-3">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-[#0F172A] bg-white border border-[#C6E7FF] px-2 py-0.5 rounded animate-pulse">
                              Direct Login Link
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1 pt-3">
                            <span className="font-label-caps text-[#334155] text-[10px] uppercase font-semibold tracking-wider">Candidate Direct Login Link</span>
                            <p className="text-[11px] text-[#475569] leading-relaxed mb-2">
                              Share this direct login link with the candidate. Credentials are embedded and will pre-fill automatically.
                            </p>
                            <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-[#C6E7FF]/60 gap-3 mt-1 shadow-2xs">
                              <span className="font-mono text-xs text-[#0F172A] truncate max-w-[65%]" title={displayVerification.setupUrl}>
                                {displayVerification.setupUrl}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(displayVerification.setupUrl || "");
                                    setCopiedUrl(true);
                                    setTimeout(() => setCopiedUrl(false), 2000);
                                  }}
                                  className="text-xs px-3 py-1.5 bg-[#0F172A] text-white rounded-lg font-semibold hover:bg-[#1E293B] transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedUrl ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                            </div>

                            {/* Pre-filled credentials detail */}
                            {(() => {
                              const params = getUrlParams(displayVerification.setupUrl);
                              return (
                                <div className="mt-3 p-4 bg-white/70 border border-[#C6E7FF]/40 rounded-2xl text-xs flex flex-col gap-2.5 shadow-2xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[#475569] font-semibold uppercase tracking-wider text-[10px] font-label-caps">Candidate Email ID</span>
                                    <span className="font-mono text-[#0F172A] font-bold text-xs select-all">{params.email}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-t border-[#D4F6FF]/30 pt-2">
                                    <span className="text-[#475569] font-semibold uppercase tracking-wider text-[10px] font-label-caps">Temporary Password</span>
                                    <span className="font-mono text-[#0F172A] font-bold text-xs select-all">{params.password}</span>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-[#64748B]">
                              <Sparkles className="w-3 h-3 text-[#1E3A5F]" />
                              <span>The candidate can log in directly using this link without setting a password.</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="text-left">
                        <span className="font-label-caps text-[#475569] text-[10px] uppercase font-bold tracking-wider block mb-1">
                          Verification Findings &amp; Summary
                        </span>
                        <p className="p-4 bg-[#D4F6FF]/10 border border-[#D4F6FF] rounded-xl text-[#0F172A] leading-relaxed text-xs font-semibold">
                          {displayVerification.reportDetails ||
                            "This verification is currently in progress. Standard validation is being conducted by the verification officer. If additional paperwork is required, you will be notified."}
                        </p>
                      </div>
                    </>
                  )}

                  {displayVerification.notes && (
                    <div className="pt-2">
                      <span className="font-label-caps text-[#475569] text-[10px] uppercase font-bold tracking-wider block mb-1">Status Notes</span>
                      <p className="text-secondary italic pl-3 border-l-2 border-[#C6E7FF] text-xs font-semibold">
                        {displayVerification.notes}
                      </p>
                    </div>
                  )}

                  {displayVerification.status === "Needs Attention" && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 mt-2 flex flex-col gap-1 shadow-2xs">
                      <span className="font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <span>Resolution Action Required:</span>
                      </span>
                      <p className="leading-relaxed font-semibold">
                        Please contact the candidate to upload a high-resolution, uncropped copy of their passport bio page to resolve the identification check block.
                      </p>
                    </div>
                  )}
                </div>
     
                <div className="mt-8 flex justify-end gap-3 border-t border-[#D4F6FF]/40 pt-5">
                  <button
                    onClick={() => {
                      setSelectedVerification(null);
                      setSelectedDetail(null);
                    }}
                    className="px-5 py-2.5 border border-[#D4F6FF] hover:bg-[#FBFBFB] rounded-xl font-semibold text-xs text-[#334155] cursor-pointer bg-white"
                  >
                    Close
                  </button>
                  {displayVerification.status === "Completed" && (
                    <button
                      onClick={() => {
                        window.open(`/client/report?id=${displayVerification.id}`, "_blank");
                        setSelectedVerification(null);
                        setSelectedDetail(null);
                      }}
                      className="px-5 py-2.5 bg-[#0F172A] text-white rounded-xl font-semibold hover:bg-[#1E293B] flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
                    >
                      <Download className="w-4 h-4 text-white" />
                      <span>Download PDF Report</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
 
      {/* View Billing History Modal */}
      {billingHistoryOpen && (
        <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#C6E7FF] rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setBillingHistoryOpen(false)}
              className="absolute right-4 top-4 p-2 hover:bg-[#D4F6FF]/40 transition-colors rounded-xl text-[#0F172A] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
 
            <h3 className="font-semibold text-lg text-[#0F172A] mb-1">Billing &amp; Invoice History</h3>
            <p className="text-secondary text-xs mb-6 font-medium text-slate-500">
              Full log of all monthly statements issued to {clientCompany}.
            </p>
 
            <div className="overflow-x-auto border border-[#D4F6FF]/65 rounded-2xl shadow-2xs">
              <table className="w-full text-left font-body-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#D4F6FF] bg-[#D4F6FF]/20 text-[#0F172A] font-bold text-xs">
                    <th className="py-2.5 px-4 font-label-caps uppercase tracking-wider">INVOICE ID</th>
                    <th className="py-2.5 px-4 font-label-caps uppercase tracking-wider">DATE GENERATED</th>
                    <th className="py-2.5 px-4 font-label-caps uppercase tracking-wider">DUE DATE</th>
                    <th className="py-2.5 px-4 font-label-caps uppercase tracking-wider">AMOUNT</th>
                    <th className="py-2.5 px-4 font-label-caps text-right uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4F6FF]/40 bg-white">
                  {clientInvoices.map((inv) => (
                    <tr key={inv._id || inv.id} className="hover:bg-[#D4F6FF]/10 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0F172A] text-xs">{inv.id}</td>
                      <td className="py-3 px-4 text-[#475569] text-xs font-semibold">{inv.date}</td>
                      <td className="py-3 px-4 text-[#475569] text-xs font-semibold">{inv.dueDate}</td>
                      <td className="py-3 px-4 text-[#0F172A] font-bold text-xs">${inv.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span
                            className={`inline-block font-bold px-2 py-0.5 rounded border text-[9px] uppercase ${
                              inv.status === "Paid"
                                ? "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                                : inv.status === "Pending"
                                ? "bg-[#FFDDAE]/40 text-[#5C3A21] border border-[#FFDDAE]"
                                : inv.status === "Overdue"
                                ? "bg-red-50 text-red-800 border border-red-200"
                                : "bg-surface-container-high text-[#475569] border border-outline-variant"
                            }`}
                          >
                            {inv.status}
                          </span>
                          {inv.status !== "Paid" && inv.status !== "Pending" && (
                            <button
                              type="button"
                              onClick={() => {
                                setBillingHistoryOpen(false);
                                handleInitiatePayment(inv);
                              }}
                              className="text-xs px-3 py-1.5 bg-[#0F172A] text-white rounded-lg font-semibold hover:bg-[#1E293B] transition-all cursor-pointer shadow-2xs"
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
 
            <div className="mt-8 flex justify-end border-t border-[#D4F6FF]/40 pt-5">
              <button
                onClick={() => setBillingHistoryOpen(false)}
                className="px-5 py-2.5 bg-[#0F172A] text-white hover:bg-[#1E293B] rounded-xl font-semibold cursor-pointer text-xs shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Payment Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#C6E7FF] rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                if (!paymentProcessing && !paymentSuccess) {
                  setActiveInvoice(null);
                }
              }}
              disabled={paymentProcessing || paymentSuccess}
              className="absolute right-4 top-4 p-2 hover:bg-[#D4F6FF]/40 rounded-xl text-[#0F172A] disabled:opacity-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
 
            {paymentSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-[#E6F8F3] border border-[#A3EAD6] rounded-full flex items-center justify-center text-[#00684A] mb-4 animate-bounce-subtle">
                  <CheckCircle className="w-8 h-8 text-[#00a877]" />
                </div>
                <h3 className="font-semibold text-lg text-[#0F172A]">Proof Uploaded Successfully</h3>
                <p className="text-secondary text-xs mt-2 font-semibold">
                  Your payment proof has been uploaded.
                </p>
                <p className="text-secondary text-xs mt-1 font-semibold">
                  Invoice <strong className="text-[#0F172A] font-bold">{activeInvoice.id}</strong> is now <strong className="text-[#5C3A21] font-bold">Pending</strong> approval from the administrator.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="text-left">
                  <h3 className="font-semibold text-lg text-[#0F172A]">Pay Invoice</h3>
                  <p className="text-secondary text-xs mt-1 font-medium text-slate-500">
                    Select a payment method to settle your outstanding balance.
                  </p>
                </div>
 
                {/* Invoice Summary Row */}
                <div className="flex justify-between items-center bg-[#D4F6FF]/15 px-4 py-3 rounded-xl border border-[#C6E7FF]/60">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-[#0F172A]">{activeInvoice.id}</span>
                    <span className="text-[10px] text-[#475569] font-medium">Due by {activeInvoice.dueDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-[#475569] uppercase font-label-caps block font-bold tracking-wider">Amount Due</span>
                    <span className="text-base font-bold text-[#0F172A] font-mono">${activeInvoice.amount.toFixed(2)}</span>
                  </div>
                </div>
 
                {/* Payment Method Tabs */}
                <div className="flex border-b border-[#D4F6FF]">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("wire")}
                    className={`flex-1 py-2.5 font-bold text-xs transition-all border-b-2 text-center flex justify-center items-center gap-1.5 cursor-pointer ${
                      paymentMethod === "wire"
                        ? "border-[#0F172A] text-[#0F172A]"
                        : "border-transparent text-secondary hover:text-primary"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Wire Transfer</span>
                  </button>
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-2.5 font-bold text-xs border-transparent text-[#94A3B8] flex justify-center items-center gap-1.5 cursor-not-allowed select-none"
                  >
                    <Lock className="w-4 h-4 text-[#94A3B8]/60" />
                    <span className="flex items-center gap-1">
                      <span>PayPal</span>
                      <span className="bg-[#D4F6FF]/50 text-[#0F172A] text-[8px] uppercase px-1.5 py-0.5 rounded font-extrabold">Soon</span>
                    </span>
                  </button>
                </div>
 
                {/* Tab Contents */}
                {paymentMethod === "wire" && (
                  <div className="flex flex-col gap-4 animate-fade-in text-left">
                    <p className="text-secondary text-xs leading-relaxed font-medium text-slate-500">
                      Please transfer the exact amount due to the bank details below. Use the copy buttons for quick transfer input.
                    </p>
 
                    {organisation && organisation.bankName ? (
                      <div className="flex flex-col gap-3 bg-[#D4F6FF]/10 p-4 rounded-2xl border border-[#C6E7FF]">
                        {/* Bank Name */}
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">BANK NAME</span>
                            <span className="text-[#0F172A] font-bold">{organisation.bankName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(organisation.bankName || "", "bankName")}
                            className="text-[10px] text-[#0F172A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedField === "bankName" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedField === "bankName" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
 
                        {/* Account Number */}
                        {organisation.accountNumber && (
                          <div className="flex justify-between items-center text-xs border-t border-[#D4F6FF]/65 pt-2.5">
                            <div>
                              <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">ACCOUNT NUMBER</span>
                              <span className="text-[#0F172A] font-mono font-bold">{organisation.accountNumber}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(organisation.accountNumber || "", "accountNumber")}
                              className="text-[10px] text-[#0F172A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === "accountNumber" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedField === "accountNumber" ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                        )}
 
                        {/* IFSC Code */}
                        {organisation.ifscCode && (
                          <div className="flex justify-between items-center text-xs border-t border-[#D4F6FF]/65 pt-2.5">
                            <div>
                              <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">IFSC CODE</span>
                              <span className="text-[#0F172A] font-mono font-bold">{organisation.ifscCode}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(organisation.ifscCode || "", "ifscCode")}
                              className="text-[10px] text-[#0F172A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === "ifscCode" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedField === "ifscCode" ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                        )}
 
                        {/* UPI ID */}
                        {organisation.upiId && (
                          <div className="flex justify-between items-center text-xs border-t border-[#D4F6FF]/65 pt-2.5">
                            <div>
                              <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">UPI ID</span>
                              <span className="text-[#0F172A] font-mono font-bold">{organisation.upiId}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(organisation.upiId || "", "upiId")}
                              className="text-[10px] text-[#0F172A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === "upiId" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedField === "upiId" ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                        )}
 
                        {/* Payment Notes */}
                        {organisation.paymentNotes && (
                          <div className="border-t border-[#D4F6FF]/65 pt-2.5">
                            <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block mb-0.5">PAYMENT NOTES</span>
                            <p className="text-[10px] text-[#475569] italic leading-relaxed">
                              {organisation.paymentNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[#FBFBFB] p-4 rounded-xl border border-[#D4F6FF] text-center flex flex-col gap-2 justify-center py-6 text-secondary">
                        <Lock className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold">No bank details have been configured for your organisation.</p>
                        <p className="text-[10px] opacity-80 font-medium">Please contact the system administrator to set up payment options.</p>
                      </div>
                    )}
                    {/* Payment Proof Upload Section */}
                    <div className="mt-3 border-t border-[#D4F6FF]/60 pt-3 flex flex-col gap-2">
                      <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">UPLOAD PAYMENT PROOF SCREENSHOT</span>
                      
                      {!proofFile ? (
                        <label className="border-2 border-dashed border-[#D4F6FF] hover:border-[#0F172A]/50 bg-[#FBFBFB] hover:bg-[#D4F6FF]/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                          <UploadCloud className="w-8 h-8 text-slate-400 animate-pulse" />
                          <span className="text-xs text-[#0F172A] font-bold">Click to upload payment proof</span>
                          <span className="text-[10px] text-secondary">PNG, JPG or PDF up to 2MB</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="bg-[#D4F6FF]/10 border border-[#D4F6FF] rounded-2xl p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 max-w-[80%]">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-[#0F172A] font-bold truncate" title={proofFileName}>
                                {proofFileName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setProofFile(null);
                                setProofFileName("");
                              }}
                              className="text-[11px] text-red-600 hover:underline cursor-pointer flex items-center gap-1 font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
 
                          {proofFile.startsWith("data:image/") && (
                            <div className="w-full h-40 rounded-xl overflow-hidden border border-[#D4F6FF]/50 flex items-center justify-center bg-black/5 animate-fade-in">
                              <img src={proofFile} alt="Payment proof preview" className="w-full h-full object-contain" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
 
                {/* Actions */}
                <div className="mt-4 flex justify-end gap-3 border-t border-[#D4F6FF]/60 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveInvoice(null)}
                    disabled={paymentProcessing}
                    className="px-5 py-2.5 border border-[#D4F6FF] hover:bg-[#FBFBFB] rounded-xl font-semibold text-[#334155] cursor-pointer text-xs disabled:opacity-50 bg-white"
                  >
                    Cancel
                  </button>
                  {paymentMethod === "wire" && organisation && organisation.bankName && (
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      disabled={paymentProcessing || !proofFile}
                      className="px-5 py-2.5 bg-[#0F172A] text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50 min-w-[130px] justify-center shadow-xs"
                    >
                      {paymentProcessing ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin text-sm">⏳</span>
                          <span>Processing...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>Confirm Payment</span>
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
