"use client";

import React, { useState } from "react";
import { usePortal, Invoice, InvoiceActivity } from "src/context/PortalContext";
import { 
  Download, 
  Receipt, 
  CreditCard, 
  CheckCircle, 
  Lock, 
  UploadCloud, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles,
  X,
  AlertCircle,
  Clock,
  Coins
} from "lucide-react";

export default function ClientBillingPage() {
  const { invoices, settings, submitPaymentProof, refreshData } = usePortal();

  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"wire" | "paypal">("wire");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState("");
  const [clientNote, setClientNote] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (err) {
      console.error("Error refreshing billing data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getInvoiceBillingPeriod = (inv: Invoice) => {
    let month = inv.month || "";
    let year = inv.year || new Date().getFullYear();
    if (!month && inv.id) {
      const parts = inv.id.split("-");
      if (parts.length >= 4) {
        const yearPart = parseInt(parts[2]);
        if (!isNaN(yearPart)) year = yearPart;
        const monthPart = parts[3].toLowerCase();
        const monthsMap: Record<string, string> = {
          jan: "January", feb: "February", mar: "March", apr: "April", may: "May", jun: "June",
          jul: "July", aug: "August", sep: "September", oct: "October", nov: "November", dec: "December"
        };
        if (monthsMap[monthPart]) {
          month = monthsMap[monthPart];
        }
      }
    }
    if (!month && inv.date) {
      try {
        const d = new Date(inv.date);
        if (!isNaN(d.getTime())) {
          month = d.toLocaleDateString("en-US", { month: "long" });
          year = d.getFullYear();
        }
      } catch {}
    }
    return { month, year };
  };

  const handleCloseInvoiceModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setActiveInvoice(null);
      setModalClosing(false);
      setProofFile(null);
      setProofFileName("");
      setClientNote("");
    }, 500);
  };

  const handleInitiatePayment = (inv: Invoice) => {
    setActiveInvoice(inv);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Payment proof image must be smaller than 2MB");
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
        await submitPaymentProof(activeInvoice.id, proofFile, activeInvoice._id, clientNote);
        setPaymentProcessing(false);
        setPaymentSuccess(true);
        setTimeout(() => {
          setActiveInvoice(null);
          setPaymentSuccess(false);
          setProofFile(null);
          setProofFileName("");
          setClientNote("");
        }, 2500);
      } catch (err) {
        console.error("Payment confirmation failed:", err);
        setPaymentProcessing(false);
      }
    }, 1200);
  };

  const clientCompany = settings.companyName || "";
  const clientInvoices = invoices.filter(
    (inv) => inv.orgName.toLowerCase() === clientCompany.toLowerCase()
  );

  const unpaidBalance = clientInvoices
    .filter((inv) => inv.status === "Unpaid" || inv.status === "Overdue" || inv.status === "Pending")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="flex flex-col gap-6 pt-4 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-[#D4F6FF] pb-5 mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#1E3A5F] bg-[#D4F6FF]/60 px-2.5 py-1 rounded-full w-fit uppercase tracking-wider font-label-caps border border-[#C6E7FF]/60">
          <Receipt className="w-3.5 h-3.5 text-[#0F172A]" />
          <span>FINANCIAL ACCOUNTING</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div>
            <h2 className="font-display-lg text-primary font-bold tracking-tight text-3xl text-[#0F172A]">Billing &amp; Invoices</h2>
            <p className="font-body-sm text-secondary mt-1 max-w-2xl text-slate-500">
              Manage your billing details, submit bank transfer confirmations, and download detailed requests audit reports.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 font-bold text-xs text-[#0F172A] bg-white hover:bg-[#D4F6FF]/35 px-4 py-2.5 rounded-xl border border-[#C6E7FF] cursor-pointer shadow-2xs transition-all disabled:opacity-50"
          >
            <Clock className={`w-4 h-4 text-[#1E3A5F] ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">
        <div className="bg-white border border-[#C6E7FF] rounded-3xl p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-400"></div>
          <p className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider uppercase mb-1">Total Outstanding</p>
          <p className="font-display-lg text-[#0F172A] font-bold tracking-tight text-3xl font-mono">${unpaidBalance.toFixed(2)}</p>
          <p className="text-slate-500 text-xs mt-1 font-medium">Due across outstanding statements</p>
        </div>
        <div className="bg-white border border-[#C6E7FF] rounded-3xl p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#C6E7FF]"></div>
          <p className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider uppercase mb-1">Active Statements</p>
          <p className="font-display-lg text-[#0F172A] font-bold tracking-tight text-3xl font-mono">{clientInvoices.length}</p>
          <p className="text-slate-500 text-xs mt-1 font-medium">Total issued invoices</p>
        </div>
        <div className="bg-white border border-[#C6E7FF] rounded-3xl p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400"></div>
          <p className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider uppercase mb-1">Payment Method</p>
          <p className="font-display-lg text-[#0F172A] font-bold tracking-tight text-lg mt-2 flex items-center gap-1.5"><Coins className="w-5 h-5 text-emerald-600" /> Bank Wire Transfer</p>
          <p className="text-slate-500 text-xs mt-1.5 font-medium">Standard corporate terms (Net 30)</p>
        </div>
      </div>

      {/* Main Billing Card */}
      <section className="bg-white border border-[#C6E7FF] rounded-3xl p-6 max-w-6xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#C6E7FF]"></div>
        <h3 className="font-semibold text-lg text-[#0F172A] mb-4 text-left">Invoice History</h3>

        <div className="overflow-x-auto border border-[#D4F6FF]/65 rounded-2xl shadow-2xs">
          <table className="w-full text-left font-body-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#D4F6FF] bg-[#D4F6FF]/20 text-[#0F172A] font-bold text-xs">
                <th className="py-3 px-4 font-label-caps uppercase tracking-wider">Statement ID</th>
                <th className="py-3 px-4 font-label-caps uppercase tracking-wider">Issue Date</th>
                <th className="py-3 px-4 font-label-caps uppercase tracking-wider">Due Date</th>
                <th className="py-3 px-4 font-label-caps uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 font-label-caps uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-label-caps text-right uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4F6FF]/40 bg-white">
              {clientInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#475569] text-xs font-semibold italic">
                    No financial statements issued to your account yet.
                  </td>
                </tr>
              ) : (
                clientInvoices.map((inv) => {
                  const { month, year } = getInvoiceBillingPeriod(inv);
                  const displayPeriod = month ? `${month.substring(0, 3)} ${year}` : inv.date;
                  return (
                    <tr key={inv._id || inv.id} className="hover:bg-[#D4F6FF]/15 transition-all group/row">
                      <td className="py-3.5 px-4 font-bold text-[#0F172A] text-xs">{inv.id}</td>
                      <td className="py-3.5 px-4 text-[#475569] text-xs font-semibold">{inv.date}</td>
                      <td className="py-3.5 px-4 text-[#475569] text-xs font-semibold">{inv.dueDate}</td>
                      <td className="py-3.5 px-4 text-[#0F172A] font-bold text-xs font-mono">${inv.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block font-bold px-2 py-0.5 rounded border text-[9px] uppercase tracking-wider ${
                            inv.status === "Paid"
                              ? "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                              : inv.status === "Pending"
                              ? "bg-[#FFDDAE]/40 text-[#5C3A21] border-[#FFDDAE]"
                              : inv.status === "Overdue"
                              ? "bg-red-50 text-red-800 border border-red-200"
                              : "bg-slate-50 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleInitiatePayment(inv)}
                          className="font-bold text-[10px] px-3 py-1.5 rounded-lg bg-[#C6E7FF]/40 text-[#0F172A] hover:bg-[#C6E7FF] transition-all cursor-pointer shadow-2xs font-semibold"
                        >
                          View Details &amp; Pay
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invoice Detail Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 bg-slate-900/15 backdrop-blur-xs overflow-y-auto flex justify-center p-4 z-[99999] animate-fade-in">
          <div className="bg-white border border-[#C6E7FF] rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative my-auto animate-fade-in">
            <button
              onClick={() => {
                if (!paymentProcessing && !paymentSuccess && !modalClosing) {
                  handleCloseInvoiceModal();
                }
              }}
              disabled={paymentProcessing || paymentSuccess || modalClosing}
              className="absolute right-4 top-4 p-2 hover:bg-[#D4F6FF]/40 rounded-xl text-[#0F172A] disabled:opacity-50 cursor-pointer border-none bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>

            {modalClosing ? (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in min-h-[300px]">
                <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="font-semibold text-sm text-[#0F172A]">Closing Invoice Details...</h3>
                <p className="text-secondary text-[10px] mt-1 text-slate-500 font-medium">Please wait a moment</p>
              </div>
            ) : paymentSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-[#E6F8F3] border border-[#A3EAD6] rounded-full flex items-center justify-center text-[#00684A] mb-4 animate-bounce-subtle">
                  <CheckCircle className="w-8 h-8 text-[#00a877]" />
                </div>
                <h3 className="font-bold text-lg text-[#0F172A]">Payment Confirmation Submitted!</h3>
                <p className="text-secondary mt-1 max-w-sm text-xs font-semibold text-slate-500 leading-relaxed">
                  We have received your payment transfer screenshot. Our audit team will review the transaction and clear this invoice shortly.
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-lg text-[#0F172A] mb-1 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#1E3A5F]" />
                  <span>Invoice Statement Details</span>
                </h3>
                <p className="text-secondary text-[11px] mb-6 font-medium text-slate-500">
                  Detailed summary of statement balances, downloads, and payment transfer portal.
                </p>

                <div className="grid grid-cols-2 gap-4 bg-[#D4F6FF]/20 p-4 border border-[#C6E7FF]/55 rounded-2xl mb-4 font-body-sm animate-fade-in">
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider uppercase">INVOICE ID</span>
                    <span className="font-bold text-xs text-[#0F172A] font-mono">{activeInvoice.id}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider uppercase">DATE OF ISSUE</span>
                    <span className="font-semibold text-xs text-[#0F172A]">{activeInvoice.date}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider uppercase">CLIENT ORGANISATION</span>
                    <span className="font-semibold text-xs text-[#0F172A]">{clientCompany}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider uppercase">DUE DATE</span>
                    <span className="text-[#0F172A] font-semibold text-xs">{activeInvoice.dueDate}</span>
                  </div>
                  <div className="col-span-2 border-t border-[#D4F6FF]/40 pt-2 mt-1 flex justify-between items-baseline">
                    <div className="text-left">
                      <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">AMOUNT DUE</span>
                      <span className="text-xl font-extrabold text-[#0F172A] font-mono">${activeInvoice.amount.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">STATUS</span>
                      <span
                        className={`inline-block font-bold px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider ${
                          activeInvoice.status === "Paid"
                            ? "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                            : activeInvoice.status === "Pending"
                            ? "bg-[#FFDDAE]/40 text-[#5C3A21] border-[#FFDDAE]"
                            : activeInvoice.status === "Overdue"
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : "bg-slate-50 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {activeInvoice.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Per-Invoice Billable Summary Button */}
                <button
                  type="button"
                  onClick={() => {
                    const { month, year } = getInvoiceBillingPeriod(activeInvoice);
                    window.open(`/client/billable-summary?month=${encodeURIComponent(month)}&year=${year}`, "_blank");
                  }}
                  className="w-full py-2.5 bg-[#C6E7FF]/40 text-[#0F172A] hover:bg-[#C6E7FF]/70 font-bold text-xs rounded-xl border border-[#C6E7FF] transition-all flex justify-center items-center gap-2 cursor-pointer shadow-3xs"
                >
                  <Download className="w-4 h-4 text-[#0F172A]" />
                  <span>Download Billable Requests Summary</span>
                </button>

                {/* Invoice Activity Timeline */}
                {(() => {
                  const base: InvoiceActivity[] = [...(activeInvoice.activityLog || [])];
                  if (base.length === 0) {
                    base.push({
                      id: `fallback-gen`,
                      type: "generated",
                      timestamp: activeInvoice.date ? new Date(activeInvoice.date).toISOString() : new Date().toISOString(),
                      actor: "System",
                      note: "Invoice generated"
                    });
                    if (activeInvoice.paymentProofDate) {
                      base.push({
                        id: `fallback-sub`,
                        type: "submitted",
                        timestamp: activeInvoice.paymentProofDate,
                        actor: activeInvoice.orgName || "Client",
                        note: activeInvoice.clientNote || "",
                        paymentProof: activeInvoice.paymentProof
                      });
                    }
                    if (activeInvoice.status === "Paid") {
                      base.push({
                        id: `fallback-app`,
                        type: "approved",
                        timestamp: activeInvoice.approvedDate || new Date().toISOString(),
                        actor: activeInvoice.approvedBy || "Admin",
                        note: activeInvoice.adminNote || "Payment approved by administrator"
                      });
                    } else if (activeInvoice.status === "Unpaid" && activeInvoice.rejectionReason) {
                      base.push({
                        id: `fallback-rej`,
                        type: "rejected",
                        timestamp: activeInvoice.rejectedDate || new Date().toISOString(),
                        actor: activeInvoice.rejectedBy || "Administrator",
                        note: activeInvoice.rejectionReason
                      });
                    }
                  }
                  const sorted = base.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                  return (
                    <div className="mt-4 p-4 bg-white border border-[#D4F6FF]/60 rounded-2xl text-left flex flex-col gap-3">
                      <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider uppercase block border-b border-[#D4F6FF]/30 pb-2 mb-1 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Invoice Activity History</span>
                      </span>

                      <div className="relative border-l border-[#D4F6FF] pl-5 ml-2.5 flex flex-col gap-4">
                        {sorted.map((act, index) => {
                          let icon = (
                            <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          );
                          let title = "";
                          let content = null;

                          if (act.type === "generated") {
                            title = "Invoice Generated";
                            content = (
                              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                Generated on {new Date(act.timestamp).toLocaleString()}
                              </p>
                            );
                          } else if (act.type === "submitted") {
                            icon = (
                              <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-xs" />
                            );
                            title = "Payment Proof Submitted";
                            content = (
                              <div className="flex flex-col gap-1 mt-0.5 text-[10px] text-slate-500 font-medium">
                                <p>Submitted on {new Date(act.timestamp).toLocaleString()}</p>
                                {act.note && (
                                  <p className="text-[11px] italic text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-sm mt-1">
                                    "{act.note}"
                                  </p>
                                )}
                              </div>
                            );
                          } else if (act.type === "approved") {
                            icon = (
                              <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs" />
                            );
                            title = "Payment Approved & Cleared";
                            content = (
                              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                Approved by {act.actor} on {new Date(act.timestamp).toLocaleString()}
                              </p>
                            );
                          } else if (act.type === "rejected") {
                            icon = (
                              <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-xs" />
                            );
                            title = "Payment Disapproved / Rejected";
                            content = (
                              <div className="flex flex-col gap-1 mt-0.5 text-[10px] text-slate-500 font-medium">
                                <p>Rejected by {act.actor} on {new Date(act.timestamp).toLocaleString()}</p>
                                {act.note && (
                                  <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 max-w-sm mt-1">
                                    <span className="text-[9px] font-bold text-rose-500 block mb-0.5">REJECTION REASON</span>
                                    <p className="text-xs text-rose-700 italic text-left">"{act.note}"</p>
                                  </div>
                                )}
                              </div>
                            );
                          } else if (act.type === "status_change") {
                            title = `Status Changed to ${act.status}`;
                            content = (
                              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                Changed on {new Date(act.timestamp).toLocaleString()}
                              </p>
                            );
                          }

                          return (
                            <div key={act.id || index} className="relative">
                              {icon}
                              <div className="text-left">
                                <p className="text-xs font-bold text-slate-800">{title}</p>
                                {content}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Unpaid / Overdue workflow: show payment transfer options and upload form */}
                {(activeInvoice.status === "Unpaid" || activeInvoice.status === "Overdue") && (
                  <div className="mt-4 flex flex-col gap-4 border-t border-[#D4F6FF]/40 pt-4">
                    {activeInvoice.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl text-left flex flex-col gap-1.5 animate-fade-in">
                        <span className="font-bold text-red-750 text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-red-650" />
                          <span>Payment Disapproved by Our Administrator</span>
                        </span>
                        <p className="text-[11px] text-red-700 font-semibold leading-relaxed">
                          Reason: <span className="italic">"{activeInvoice.rejectionReason}"</span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Please review the comment above and upload another payment proof screenshot below.
                        </p>
                      </div>
                    )}
                    
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
                        className="flex-1 py-2.5 font-bold text-xs border-transparent text-[#94A3B8] flex justify-center items-center gap-1.5 cursor-not-allowed select-none animate-fade-in"
                      >
                        <Lock className="w-4 h-4 text-[#94A3B8]/60" />
                        <span className="flex items-center gap-1">
                          <span>PayPal</span>
                          <span className="bg-[#D4F6FF]/50 text-[#0F172A] text-[8px] uppercase px-1.5 py-0.5 rounded font-extrabold">Soon</span>
                        </span>
                      </button>
                    </div>

                    <div className="p-4 bg-[#FBFBFB] border border-[#D4F6FF] rounded-2xl text-xs flex flex-col gap-3 font-semibold text-slate-700 animate-fade-in text-left">
                      <div className="flex justify-between items-center border-b border-[#D4F6FF]/30 pb-2 mb-1">
                        <span className="text-[#475569] font-bold text-[10px] uppercase font-label-caps">Corporate Bank Account Details</span>
                        <span className="text-[9px] bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] px-1.5 py-0.5 rounded font-extrabold tracking-wide">VERIFIED</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-secondary text-[10px] font-bold">BANK NAME</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#0F172A] font-bold">{settings.companyName || "ICICI Bank"}</span>
                          <button onClick={() => handleCopyText("ICICI Bank", "bank")} className="text-slate-400 hover:text-[#0ea5e9] transition-colors cursor-pointer">
                            {copiedField === "bank" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-secondary text-[10px] font-bold">ACCOUNT NUMBER</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-[#0F172A] font-bold">000405003921</span>
                          <button onClick={() => handleCopyText("000405003921", "account")} className="text-slate-400 hover:text-[#0ea5e9] transition-colors cursor-pointer">
                            {copiedField === "account" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-secondary text-[10px] font-bold">IFSC CODE</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-[#0F172A] font-bold">ICIC0000004</span>
                          <button onClick={() => handleCopyText("ICIC0000004", "ifsc")} className="text-slate-400 hover:text-[#0ea5e9] transition-colors cursor-pointer">
                            {copiedField === "ifsc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Payment Proof Upload */}
                    <div className="flex flex-col gap-2">
                      <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider uppercase block text-left">Upload Payment Confirmation Proof</span>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <label className="flex-1 border border-dashed border-[#C6E7FF] hover:border-[#0F172A] rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white transition-all hover:bg-slate-50 shadow-3xs group">
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                          <UploadCloud className="w-6 h-6 text-[#1E3A5F] group-hover:scale-110 transition-transform" />
                          <span className="font-bold text-xs text-[#0F172A]">{proofFileName ? "Change Proof Screenshot" : "Choose Screenshot File"}</span>
                          <span className="text-[9px] text-[#475569] font-medium">{proofFileName || "PNG, JPG up to 2MB"}</span>
                        </label>

                        <div className="flex-1 flex flex-col gap-2">
                          <textarea
                            value={clientNote}
                            onChange={(e) => setClientNote(e.target.value)}
                            placeholder="Add reference notes e.g., transaction number or remarks (optional)..."
                            className="w-full h-full min-h-[90px] border border-[#C6E7FF] focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] rounded-2xl p-3 text-xs placeholder-slate-400 font-semibold resize-none bg-[#FBFBFB]/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-end gap-3 border-t border-[#D4F6FF]/40 pt-5">
                  <button
                    onClick={handleCloseInvoiceModal}
                    disabled={paymentProcessing}
                    className="px-5 py-2.5 border border-[#D4F6FF] hover:bg-[#FBFBFB] rounded-xl font-semibold text-xs text-[#334155] cursor-pointer bg-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  {(activeInvoice.status === "Unpaid" || activeInvoice.status === "Overdue") && (
                    <button
                      onClick={handleConfirmPayment}
                      disabled={paymentProcessing || !proofFile}
                      className="px-5 py-2.5 bg-[#0F172A] text-white hover:bg-[#1E293B] active:scale-95 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      <Lock className="w-3.5 h-3.5 text-white" />
                      <span>{paymentProcessing ? "Submitting Proof..." : "Submit Payment Proof"}</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
