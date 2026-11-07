"use client";

import React, { useState, useEffect } from "react";
import { usePortal, Verification, Invoice, InvoiceActivity } from "src/context/PortalContext";
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
  Calendar,
  RotateCw,
  Search,
  CheckCircle2,
  Building,
  User,
  AlertCircle,
  Clock,
  Timer,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit3,
  FileEdit,
} from "lucide-react";
import CandidateFillModal from "src/app/components/CandidateFillModal";
import { getCurrencySymbol } from "src/lib/currencies";

// ─── Helper: format elapsed/remaining seconds into "Xm Ys" ───
function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

// ─── Search Progress Indicator Component ───
function SearchProgressIndicator({ verification, now }: { verification: Verification; now: number }) {
  const verType = (verification.type as string) || "identity";

  if (verType === "digital_address") {
    const isSubmitted = verification.digitalAddressSubmitted || verification.digitalAddressData?.selfieImage;
    return (
      <div className="flex flex-col items-end gap-1 min-w-[140px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-[#0891b2] rounded-full animate-pulse shrink-0"></div>
          <span className="text-[11px] text-[#0369A1] font-bold">
            {isSubmitted ? "Verifying GPS & Photos..." : "Awaiting Candidate Capture"}
          </span>
        </div>
        <span className="text-[9px] text-[#475569] font-medium text-right leading-tight">
          {isSubmitted ? "Processing watermark..." : "Live camera link sent to candidate"}
        </span>
      </div>
    );
  }

  if (verType === "saflii_court") {
    const sacStatus = (verification as any).safliiCourtStatus || "searching";
    return (
      <div className="flex flex-col items-end gap-1 min-w-[140px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0"></div>
          <span className="text-[11px] text-emerald-700 font-bold">
            {sacStatus === "searching" ? "Searching SA Courts..." : "Finalizing..."}
          </span>
        </div>
        <span className="text-[9px] text-[#475569] font-medium text-right leading-tight">
          Checking South African court judgment databases
        </span>
      </div>
    );
  }

  if (verType === "uk_court") {
    const ukcStatus = (verification as any).ukCourtStatus || "searching";
    return (
      <div className="flex flex-col items-end gap-1 min-w-[140px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shrink-0"></div>
          <span className="text-[11px] text-indigo-700 font-bold">
            {ukcStatus === "searching" ? "Searching UK Courts..." : "Finalizing..."}
          </span>
        </div>
        <span className="text-[9px] text-[#475569] font-medium text-right leading-tight">
          Checking Courts & Tribunals Judiciary databases
        </span>
      </div>
    );
  }

  if (verType === "malaysia_court") {
    const mycStatus = (verification as any).malaysiaCourtStatus || "searching";
    return (
      <div className="flex flex-col items-end gap-1 min-w-[140px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
          <span className="text-[11px] text-emerald-800 font-bold">
            {mycStatus === "searching" ? "Searching eJudgment..." : "Finalizing..."}
          </span>
        </div>
        <span className="text-[9px] text-[#475569] font-medium text-right leading-tight">
          Checking Mahkamah Persekutuan Malaysia
        </span>
      </div>
    );
  }

  if (verType === "singapore_court") {
    const sgcStatus = (verification as any).singaporeCourtStatus || "searching";
    return (
      <div className="flex flex-col items-end gap-1 min-w-[140px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-rose-700 rounded-full animate-pulse shrink-0"></div>
          <span className="text-[11px] text-rose-900 font-bold">
            {sgcStatus === "searching" ? "Searching Judiciary..." : "Finalizing..."}
          </span>
        </div>
        <span className="text-[9px] text-[#475569] font-medium text-right leading-tight">
          Checking Singapore Courts hearing list
        </span>
      </div>
    );
  }

  if (verType === "philippines_court") {
    const phcStatus = (verification as any).philippinesCourtStatus || "searching";
    return (
      <div className="flex flex-col items-end gap-1 min-w-[140px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse shrink-0"></div>
          <span className="text-[11px] text-amber-900 font-bold">
            {phcStatus === "searching" ? "Searching CSIS 3.0..." : "Finalizing..."}
          </span>
        </div>
        <span className="text-[9px] text-[#475569] font-medium text-right leading-tight">
          Checking Court of Appeals appellate records
        </span>
      </div>
    );
  }

  const MAX_SEARCH_DURATION_S = 180; // 3 minutes max

  // Calculate elapsed time
  const startedAt = verification.courtRecordSearchStartedAt;
  let elapsedSeconds = 0;
  if (startedAt) {
    elapsedSeconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  }

  // Parse progress text from backend: "Searched X establishments/complexes, found Y cases"
  const progress = verification.courtRecordProgress || "";
  const progressMatch = progress.match(/Searched (\d+) establishments/);
  const searched = progressMatch ? parseInt(progressMatch[1]) : 0;

  // Calculate remaining time
  const remainingSeconds = Math.max(0, MAX_SEARCH_DURATION_S - elapsedSeconds);
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / MAX_SEARCH_DURATION_S) * 100));

  return (
    <div className="flex flex-col gap-1.5 min-w-[140px]">
      {/* Live timer */}
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shrink-0"></div>
        <span className="text-[11px] text-[#475569] font-semibold">Searching eCourts...</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#f0f5ea] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${Math.max(5, progressPercent)}%` }}
        />
      </div>

      {/* Time info */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] text-[#475569] font-medium flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {formatDuration(elapsedSeconds)} elapsed
        </span>
        <span className="text-[9px] text-amber-600 font-semibold">
          ≤{formatDuration(remainingSeconds)} left
        </span>
      </div>

      {/* Searched count */}
      {searched > 0 && (
        <span className="text-[9px] text-[#475569] font-medium">
          {searched} court(s) checked
        </span>
      )}
    </div>
  );
}

function QuickReportProgressIndicator({ verification, now }: { verification: Verification; now: number }) {
  const verType = (verification.type as string) || "identity";
  const isPassport = verType === "passport";
  const isDigitalAddress = verType === "digital_address";
  const isSafliiCourt = verType === "saflii_court";
  const isSapsWanted = verType === "saps_wanted";
  const isUkCourt = verType === "uk_court";
  const isMalaysiaCourt = verType === "malaysia_court";
  const isSingaporeCourt = verType === "singapore_court";
  const isPhilippinesCourt = verType === "philippines_court";
  const MIN_HOLD_S = isPassport ? 5 : isDigitalAddress ? 4 : isSapsWanted ? 4 : isUkCourt || isMalaysiaCourt || isSingaporeCourt || isPhilippinesCourt ? 4 : 10;
  const startedAt = verification.createdAt;
  let elapsedSeconds = 0;
  if (startedAt) {
    elapsedSeconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  }
  const remainingSeconds = Math.max(1, MIN_HOLD_S - elapsedSeconds);

  let stepText = isPassport
    ? "Step 1/3: Connecting..."
    : isDigitalAddress
    ? "Step 1/3: Validating GPS..."
    : isSafliiCourt
    ? "Step 1/3: Querying SA Courts..."
    : isSapsWanted
    ? "Step 1/2: Checking SAPS..."
    : isPhilippinesCourt
    ? "Step 1/2: Querying CA CSIS 3.0..."
    : "Step 1/3: Scanning NCB...";

  if (isPassport) {
    if (remainingSeconds <= 3 && remainingSeconds >= 2) stepText = "Step 2/3: Auditing DB...";
    else if (remainingSeconds <= 1) stepText = "Step 3/3: Generating...";
  } else if (isDigitalAddress) {
    if (remainingSeconds <= 2 && remainingSeconds >= 2) stepText = "Step 2/3: Watermarking...";
    else if (remainingSeconds <= 1) stepText = "Step 3/3: Finalizing Report...";
  } else if (isSafliiCourt) {
    if (remainingSeconds <= 6 && remainingSeconds >= 3) stepText = "Step 2/3: Scanning Judgments...";
    else if (remainingSeconds <= 2) stepText = "Step 3/3: Generating Report...";
  } else if (isSapsWanted) {
    if (remainingSeconds <= 2) stepText = "Step 2/2: Verifying Police Records...";
    else stepText = "Step 1/2: Querying SAPS Registry...";
  } else if (isPhilippinesCourt) {
    if (remainingSeconds <= 2) stepText = "Step 2/2: Parsing Appellate Decisions...";
    else stepText = "Step 1/2: Querying CA CSIS 3.0...";
  } else {
    if (remainingSeconds <= 6 && remainingSeconds >= 3) stepText = "Step 2/3: Checking Notices...";
    else if (remainingSeconds <= 2) stepText = "Step 3/3: Generating...";
  }

  return (
    <div className="flex flex-col items-end gap-1 min-w-[140px]">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
        <span className="text-[11px] text-[#00684A] font-bold">{stepText}</span>
      </div>
      <span className="text-[9px] text-[#475569] font-mono font-semibold">
        Ready in {remainingSeconds}s
      </span>
    </div>
  );
}

export default function OrderSummaryPage() {
  const { verifications, invoices, settings, organisation, submitPaymentProof, fetchVerificationDetail, refreshData } = usePortal();

  // Tick state for live timer updates (re-renders every second when searches are active)
  const [tickNow, setTickNow] = useState(Date.now());

  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"wire" | "paypal">("wire");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeFillModal, setActiveFillModal] = useState<{
    isOpen: boolean;
    id: string;
    type: "employment" | "education";
    name?: string;
    initialData?: any;
  } | null>(null);

  const openCandidateFillModal = (v: Verification) => {
    const empList = (v as any).employments || (v as any).pastOrganisations || (v as any).employmentData?.employments || (v as any).employmentData?.pastOrganisations;
    const eduList = (v as any).educationList || (v as any).educations || (v as any).educationData?.educationList || (v as any).educationData?.educations;
    const data = v.type === "employment"
      ? { ...v.employmentData, ...(empList ? { employments: empList, pastOrganisations: empList } : {}) }
      : { ...v.educationData, ...(eduList ? { educations: eduList, educationList: eduList } : {}) };
    setActiveFillModal({
      isOpen: true,
      id: v.id,
      type: v.type as "employment" | "education",
      name: v.name,
      initialData: data,
    });
  };

  // Check if any searches or quick report generation timers are active
  const hasActiveSearches = verifications.some((v) => {
    if (v.type === "court_record" && v.status === "Processing" && v.courtRecordStatus !== "completed" && v.courtRecordStatus !== "error" && v.courtRecordStatus !== "needs_admin_retry") {
      return true;
    }
    if (((v.type as string) === "passport" || v.type === "interpol" || (v.type as string) === "rednotice_worldwide" || (v.type as string) === "saflii_court" || (v.type as string) === "saps_wanted" || (v.type as string) === "uk_court" || (v.type as string) === "malaysia_court" || (v.type as string) === "singapore_court" || (v.type as string) === "philippines_court") && v.createdAt) {
      const elapsed = Math.floor((tickNow - new Date(v.createdAt).getTime()) / 1000);
      const minHold = (v.type as string) === "passport" ? 5 : (v.type as string) === "uk_court" || (v.type as string) === "malaysia_court" || (v.type as string) === "singapore_court" || (v.type as string) === "philippines_court" || (v.type as string) === "saps_wanted" ? 4 : 8;
      if (elapsed < minHold) return true;
    }
    return false;
  });

  // Tick every second while searches are active (for live timer)
  useEffect(() => {
    if (!hasActiveSearches) return;
    const interval = setInterval(() => setTickNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [hasActiveSearches]);

  // Auto-refresh data every 15s while searches are active
  useEffect(() => {
    if (!hasActiveSearches) return;
    const interval = setInterval(() => {
      refreshData().catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [hasActiveSearches, refreshData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCloseInvoiceModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setActiveInvoice(null);
      setModalClosing(false);
    }, 600);
  };
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>("");
  const [clientNote, setClientNote] = useState<string>("");
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
    setClientNote("");
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
            ? "bg-[#FFF4CC]/15 border-[#FFF4CC]/50 hover:border-[#FFF4CC]" 
            : "bg-[#f0f5ea]/20 border-[#eaf0e4]/55 hover:border-[#eaf0e4]"
        }`}
      >
        <div className="flex justify-between items-center w-full">
          {isBadge ? (
            <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
              isIdCard ? "bg-[#805b00] text-white" : "bg-[#181d16] text-white"
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
                isIdCard ? "text-[#805b00] hover:bg-[#FFF4CC]/40" : "text-[#00450e] hover:bg-[#eaf0e4]/40"
              }`}
              type="button"
            >
              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        <div className="font-body-sm font-bold text-[#181d16] break-all mt-0.5 pr-4">
          {displayValue || "N/A"}
        </div>
      </div>
    );
  };

  // Filter verifications for the current company and sort by submission date/completion date descending (newest first)
  const clientCompany = settings.companyName || "";
  const clientVerifications = verifications
    .filter((v) => v.orgName.toLowerCase() === clientCompany.toLowerCase())
    .sort((a, b) => {
      try {
        // 1. Sort by createdAt ISO string timestamp descending if available
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // 2. Fallback: Sort by submission date
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (!isNaN(timeA) && !isNaN(timeB)) {
          if (timeB !== timeA) {
            return timeB - timeA;
          }
        }
        // 3. Fallback 2: Sort by ID descending (newer requests have higher ID suffixes)
        return (b.id || "").localeCompare(a.id || "");
      } catch {
        return 0;
      }
    });

  // Filter invoices for the current company
  const clientInvoices = invoices.filter(
    (inv) => inv.orgName.toLowerCase() === clientCompany.toLowerCase()
  );

  // Calculate balance from Unpaid/Overdue invoices
  const unpaidBalance = clientInvoices
    .filter((inv) => inv.status === "Unpaid" || inv.status === "Overdue")
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Real-time: count all COMPLETED/READY verifications that have NOT been invoiced yet
  const uninvoicedVerifications = clientVerifications.filter((v) => {
    const isCompleted = v.status === "Completed" || v.courtRecordStatus === "completed" || (v as any).sendToCustomer;
    if (!isCompleted) return false;

    if ((v as any).invoiced === true || (v as any).invoiceId) return false;

    try {
      const rawDate = v.completedAt || v.date || v.createdAt;
      if (!rawDate) return true;
      const vDate = new Date(rawDate);
      if (isNaN(vDate.getTime())) return true;

      const mName = vDate.toLocaleDateString("en-US", { month: "long" }).toLowerCase();
      const yVal = vDate.getFullYear();

      // Look for an invoice matching this month and year
      const matchingInvoice = clientInvoices.find(
        (inv) => {
          const invMonth = inv.month?.toLowerCase();
          return invMonth === mName && inv.year === yVal && (inv as any).isDeleted !== true;
        }
      );

      if (!matchingInvoice) return true;

      // If an invoice exists for this month, check if verification occurred AFTER the invoice issue date/createdAt
      const invRawDate = (matchingInvoice as any).createdAt || matchingInvoice.date;
      if (invRawDate) {
        const invDate = new Date(invRawDate);
        if (!isNaN(invDate.getTime())) {
          return vDate.getTime() > invDate.getTime();
        }
      }
      return false;
    } catch {
      return true;
    }
  });

  const currentMonthCompleted = uninvoicedVerifications.length;

  const currentMonthRunningTotal = uninvoicedVerifications.reduce((sum, v) => {
    if ((v as any).serviceCharge !== undefined && (v as any).serviceCharge !== null) {
      return sum + Number((v as any).serviceCharge);
    }
    if ((v as any).price !== undefined && (v as any).price !== null) {
      return sum + Number((v as any).price);
    }
    const verType = (v.type as string) || "identity";
    let rate = 1;
    if (verType === "court_record") {
      rate = organisation?.courtRecordRate !== undefined ? organisation.courtRecordRate : 12;
    } else if (verType === "interpol") {
      rate = organisation?.interpolRate !== undefined ? organisation.interpolRate : 10;
    } else if (verType === "rednotice_worldwide") {
      rate = organisation?.rednoticeWorldwideRate !== undefined ? organisation.rednoticeWorldwideRate : 15;
    } else if (verType === "saflii_court") {
      rate = organisation?.safliiCourtRate !== undefined ? organisation.safliiCourtRate : 15;
    } else if (verType === "uk_court") {
      rate = organisation?.ukCourtRate !== undefined ? organisation.ukCourtRate : 25;
    } else if (verType === "malaysia_court") {
      rate = (organisation as any)?.malaysiaCourtRate !== undefined ? (organisation as any).malaysiaCourtRate : 20;
    } else if (verType === "singapore_court") {
      rate = (organisation as any)?.singaporeCourtRate !== undefined ? (organisation as any).singaporeCourtRate : 20;
    } else if (verType === "philippines_court") {
      rate = (organisation as any)?.philippinesCourtRate !== undefined ? (organisation as any).philippinesCourtRate : 20;
    } else if (verType === "saps_wanted") {
      rate = (organisation as any)?.sapsWantedRate !== undefined ? (organisation as any).sapsWantedRate : 15;
    } else if (verType === "passport") {
      rate = organisation?.passportRate !== undefined ? organisation.passportRate : 8;
    } else if (verType === "digital_address") {
      rate = organisation?.digitalAddressRate !== undefined ? organisation.digitalAddressRate : 5;
    } else if (verType === "employment") {
      const c = v.country || (v as any).employmentData?.country || (v as any).addresses?.[0]?.country || "";
      if (c && organisation?.employmentRates && organisation.employmentRates[c] !== undefined) {
        rate = organisation.employmentRates[c];
      } else if (organisation?.employmentRates?.["Default"] !== undefined) {
        rate = organisation.employmentRates["Default"];
      } else {
        rate = organisation?.employmentRate !== undefined ? organisation.employmentRate : 5;
      }
    } else if (verType === "education") {
      const c = v.country || (v as any).educationData?.country || (v as any).addresses?.[0]?.country || "";
      if (c && organisation?.educationRates && organisation.educationRates[c] !== undefined) {
        rate = organisation.educationRates[c];
      } else if (organisation?.educationRates?.["Default"] !== undefined) {
        rate = organisation.educationRates["Default"];
      } else {
        rate = organisation?.educationRate !== undefined ? organisation.educationRate : 5;
      }
    } else {
      rate = organisation?.identityRate !== undefined ? organisation.identityRate : 1;
    }
    return sum + rate;
  }, 0);

  // UI state for filter modal, active report modal, billing history modal, and report toast
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [monthFilter, setMonthFilter] = useState<string>(() => {
    return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  });
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<"date" | "subject" | "id" | "type" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Verification | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [billingHistoryOpen, setBillingHistoryOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, monthFilter, typeFilter]);

  // Dynamically extract month-year options from verifications
  const monthOptions = Array.from(
    new Set(
      clientVerifications
        .map((v) => {
          try {
            const d = new Date(v.completedAt || v.date);
            if (isNaN(d.getTime())) return null;
            return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    )
  ) as string[];

  // Sort month options chronologically descending
  monthOptions.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

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
    const matchesStatus = statusFilter === "all" || v.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === "all" || (v.type || "identity").toLowerCase() === typeFilter.toLowerCase();
    
    let matchesMonth = true;
    if (monthFilter !== "all") {
      try {
        const d = new Date(v.completedAt || v.date);
        if (isNaN(d.getTime())) {
          matchesMonth = false;
        } else {
          const vMonthStr = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          matchesMonth = vMonthStr === monthFilter;
        }
      } catch {
        matchesMonth = false;
      }
    }
    
    return matchesStatus && matchesMonth && matchesType;
  });

  const sortedVerifications = [...filteredVerifications].sort((a, b) => {
    let comparison = 0;
    if (sortField === "date") {
      try {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
        if (!isNaN(timeA) && !isNaN(timeB)) {
          comparison = timeA - timeB;
        } else {
          comparison = (a.id || "").localeCompare(b.id || "");
        }
      } catch {
        comparison = 0;
      }
    } else if (sortField === "subject") {
      comparison = (a.name || "").localeCompare(b.name || "");
    } else if (sortField === "id") {
      comparison = (a.id || "").localeCompare(b.id || "");
    } else if (sortField === "type") {
      const typeA = a.type || "identity";
      const typeB = b.type || "identity";
      comparison = typeA.localeCompare(typeB);
    } else if (sortField === "status") {
      const statusA = (a.type === "court_record" && a.courtRecordStatus === "admin_review") ? "under review" : a.status.toLowerCase();
      const statusB = (b.type === "court_record" && b.courtRecordStatus === "admin_review") ? "under review" : b.status.toLowerCase();
      comparison = statusA.localeCompare(statusB);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const itemsPerPage = 5;
  const totalPages = Math.ceil(sortedVerifications.length / itemsPerPage) || 1;
  const paginatedVerifications = sortedVerifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="flex flex-col gap-6 pt-4 animate-fade-in pb-12">
      <div className="flex flex-col gap-1 border-b border-[#f0f5ea] pb-5 mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#00450e] bg-[#f0f5ea]/60 px-2.5 py-1 rounded-full w-fit uppercase tracking-wider font-label-caps border border-[#eaf0e4]/60">
          <Sparkles className="w-3.5 h-3.5 text-[#181d16]" />
          <span>MANAGEMENT PORTAL</span>
        </div>
        <h2 className="font-display-lg text-primary font-bold tracking-tight text-3xl mt-2 text-[#181d16]">Order Summary</h2>
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
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 w-full max-w-none">
        {/* Request Summary (Spans 3 columns on xl screens) */}
        <section className="xl:col-span-3 bg-white border border-[#eaf0e4] rounded-3xl p-6 flex flex-col gap-6 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#eaf0e4]"></div>
          <div className="flex justify-between items-center mb-1 relative">
            <h3 className="font-semibold text-lg text-[#181d16]">Request Summary</h3>
            <div className="flex flex-wrap gap-2 relative justify-end items-center">
              {/* Small Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh requests"
                className="p-2.5 rounded-xl transition-all border border-[#eaf0e4] bg-white hover:bg-[#f0f5ea]/35 flex items-center justify-center cursor-pointer shadow-2xs text-[#00450e] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>

              {/* Month Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setMonthDropdownOpen(!monthDropdownOpen);
                    setFilterDropdownOpen(false);
                    setTypeDropdownOpen(false);
                    setSortDropdownOpen(false);
                  }}
                  className="font-bold text-xs text-[#181d16] bg-white hover:bg-[#f0f5ea]/35 px-4 py-2.5 rounded-xl transition-all border border-[#eaf0e4] flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Calendar className="w-4 h-4 text-[#00450e]" />
                  <span>Month: {monthFilter === "all" ? "ALL" : monthFilter}</span>
                </button>

                {monthDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#eaf0e4] rounded-xl shadow-lg z-30 overflow-hidden animate-fade-in">
                    <div className="p-1 flex flex-col gap-1 font-body-sm max-h-60 overflow-y-auto">
                      <button
                        onClick={() => {
                          setMonthFilter("all");
                          setMonthDropdownOpen(false);
                        }}
                        className={`text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer font-semibold ${
                          monthFilter === "all" ? "bg-[#eaf0e4] text-[#181d16]" : "text-[#475569] hover:bg-[#f0f5ea]/30 hover:text-[#181d16]"
                        }`}
                      >
                        ALL MONTHS
                      </button>
                      {monthOptions.map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setMonthFilter(m);
                            setMonthDropdownOpen(false);
                          }}
                          className={`text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer font-semibold ${
                            monthFilter === m ? "bg-[#eaf0e4] text-[#181d16]" : "text-[#475569] hover:bg-[#f0f5ea]/30 hover:text-[#181d16]"
                          }`}
                        >
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Type Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setTypeDropdownOpen(!typeDropdownOpen);
                    setMonthDropdownOpen(false);
                    setFilterDropdownOpen(false);
                    setSortDropdownOpen(false);
                  }}
                  className="font-bold text-xs text-[#181d16] bg-white hover:bg-[#f0f5ea]/35 px-4 py-2.5 rounded-xl transition-all border border-[#eaf0e4] flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Layers className="w-4 h-4 text-[#00450e]" />
                  <span>Type: {typeFilter === "all" ? "ALL" : typeFilter === "court_record" ? "COURT RECORD" : typeFilter === "interpol" ? "INTERPOL CHECK" : typeFilter === "rednotice_worldwide" ? "REDNOTICE WORLDWIDE" : typeFilter === "saflii_court" ? "SA COURT CHECK" : typeFilter === "saps_wanted" ? "SAPS WANTED" : typeFilter === "uk_court" ? "UK COURT CHECK" : typeFilter === "malaysia_court" ? "MALAYSIA COURT CHECK" : typeFilter === "singapore_court" ? "SINGAPORE COURT CHECK" : typeFilter === "philippines_court" ? "PHILIPPINES COURT CHECK" : typeFilter === "passport" ? "PASSPORT CHECK" : typeFilter === "digital_address" ? "DIGITAL ADDRESS" : typeFilter === "employment" ? "EMPLOYMENT" : typeFilter === "education" ? "EDUCATION" : "IDENTITY"}</span>
                </button>

                {typeDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#eaf0e4] rounded-xl shadow-lg z-30 overflow-hidden animate-fade-in">
                    <div className="p-1 flex flex-col gap-1 font-body-sm">
                      {[
                        { key: "all", label: "ALL" },
                        { key: "digital_address", label: "DIGITAL ADDRESS" },
                        { key: "identity", label: "IDENTITY" },
                        { key: "court_record", label: "COURT RECORD" },
                        { key: "interpol", label: "INTERPOL CHECK" },
                        { key: "rednotice_worldwide", label: "REDNOTICE WORLDWIDE" },
                        { key: "saflii_court", label: "SA COURT CHECK" },
                        { key: "saps_wanted", label: "SAPS WANTED" },
                        { key: "uk_court", label: "UK COURT CHECK" },
                        { key: "malaysia_court", label: "MALAYSIA COURT CHECK" },
                        { key: "singapore_court", label: "SINGAPORE COURT CHECK" },
                        { key: "philippines_court", label: "PHILIPPINES COURT CHECK" },
                        { key: "passport", label: "PASSPORT CHECK" },
                        { key: "employment", label: "EMPLOYMENT" },
                        { key: "education", label: "EDUCATION" }
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => {
                            setTypeFilter(item.key);
                            setTypeDropdownOpen(false);
                          }}
                          className={`text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer font-semibold ${
                            typeFilter === item.key ? "bg-[#eaf0e4] text-[#181d16]" : "text-[#475569] hover:bg-[#f0f5ea]/30 hover:text-[#181d16]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setFilterDropdownOpen(!filterDropdownOpen);
                    setMonthDropdownOpen(false);
                    setTypeDropdownOpen(false);
                    setSortDropdownOpen(false);
                  }}
                  className="font-bold text-xs text-[#181d16] bg-white hover:bg-[#f0f5ea]/35 px-4 py-2.5 rounded-xl transition-all border border-[#eaf0e4] flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Filter className="w-4 h-4 text-[#00450e]" />
                  <span>Filter: {statusFilter.toUpperCase()}</span>
                </button>

                {filterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#eaf0e4] rounded-xl shadow-lg z-30 overflow-hidden animate-fade-in">
                    <div className="p-1 flex flex-col gap-1 font-body-sm">
                      {["all", "Completed", "Processing"].map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);
                            setFilterDropdownOpen(false);
                          }}
                          className={`text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer font-semibold ${
                            statusFilter === status ? "bg-[#eaf0e4] text-[#181d16]" : "text-[#475569] hover:bg-[#f0f5ea]/30 hover:text-[#181d16]"
                          }`}
                        >
                          {status.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setSortDropdownOpen(!sortDropdownOpen);
                    setMonthDropdownOpen(false);
                    setFilterDropdownOpen(false);
                    setTypeDropdownOpen(false);
                  }}
                  className="font-bold text-xs text-[#181d16] bg-white hover:bg-[#f0f5ea]/35 px-4 py-2.5 rounded-xl transition-all border border-[#eaf0e4] flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <ArrowUpDown className="w-4 h-4 text-[#00450e]" />
                  <span>Sort: {sortField === "date" ? (sortOrder === "desc" ? "Newest First" : "Oldest First") : `${sortField.toUpperCase()} (${sortOrder.toUpperCase()})`}</span>
                </button>

                {sortDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-[#eaf0e4] rounded-xl shadow-lg z-30 overflow-hidden animate-fade-in">
                    <div className="p-1 flex flex-col gap-1 font-body-sm max-h-64 overflow-y-auto">
                      {[
                        { field: "date", order: "desc", label: "Date: Newest First" },
                        { field: "date", order: "asc", label: "Date: Oldest First" },
                        { field: "subject", order: "asc", label: "Subject: A to Z" },
                        { field: "subject", order: "desc", label: "Subject: Z to A" },
                        { field: "id", order: "asc", label: "ID: Ascending" },
                        { field: "id", order: "desc", label: "ID: Descending" },
                        { field: "type", order: "asc", label: "Type: A to Z" },
                        { field: "type", order: "desc", label: "Type: Z to A" },
                        { field: "status", order: "asc", label: "Status: A to Z" },
                        { field: "status", order: "desc", label: "Status: Z to A" },
                      ].map((opt) => (
                        <button
                          key={`${opt.field}-${opt.order}`}
                          onClick={() => {
                            setSortField(opt.field as any);
                            setSortOrder(opt.order as any);
                            setSortDropdownOpen(false);
                          }}
                          className={`text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer font-semibold ${
                            sortField === opt.field && sortOrder === opt.order
                              ? "bg-[#eaf0e4] text-[#181d16]"
                              : "text-[#475569] hover:bg-[#f0f5ea]/30 hover:text-[#181d16]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#f0f5ea]/65 rounded-2xl shadow-2xs">
            <table className="w-full text-left font-body-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#f0f5ea] bg-[#f0f5ea]/20 text-[#181d16] font-bold text-xs">
                  <th 
                    onClick={() => {
                      if (sortField === "id") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortField("id");
                        setSortOrder("asc");
                      }
                    }}
                    className="py-3 px-2.5 font-label-caps uppercase tracking-wider cursor-pointer hover:bg-[#f0f5ea]/40 transition-colors select-none group rounded-lg animate-fade-in"
                  >
                    <div className="flex items-center gap-1">
                      <span>Request ID</span>
                      {sortField === "id" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#00450e] inline" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#00450e] inline" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => {
                      if (sortField === "type") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortField("type");
                        setSortOrder("asc");
                      }
                    }}
                    className="py-3 px-2.5 font-label-caps uppercase tracking-wider cursor-pointer hover:bg-[#f0f5ea]/40 transition-colors select-none group rounded-lg"
                  >
                    <div className="flex items-center gap-1">
                      <span>Type</span>
                      {sortField === "type" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#00450e] inline" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#00450e] inline" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => {
                      if (sortField === "subject") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortField("subject");
                        setSortOrder("asc");
                      }
                    }}
                    className="py-3 px-2.5 font-label-caps uppercase tracking-wider cursor-pointer hover:bg-[#f0f5ea]/40 transition-colors select-none group rounded-lg"
                  >
                    <div className="flex items-center gap-1">
                      <span>Subject</span>
                      {sortField === "subject" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#00450e] inline" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#00450e] inline" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => {
                      if (sortField === "date") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortField("date");
                        setSortOrder("desc");
                      }
                    }}
                    className="py-3 px-2.5 font-label-caps uppercase tracking-wider cursor-pointer hover:bg-[#f0f5ea]/40 transition-colors select-none group rounded-lg"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date Submitted</span>
                      {sortField === "date" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#00450e] inline" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#00450e] inline" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => {
                      if (sortField === "status") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortField("status");
                        setSortOrder("asc");
                      }
                    }}
                    className="py-3 px-2.5 font-label-caps uppercase tracking-wider cursor-pointer hover:bg-[#f0f5ea]/40 transition-colors select-none group rounded-lg"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {sortField === "status" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#00450e] inline" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#00450e] inline" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-2.5 font-label-caps text-right uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f5ea]/40 bg-white">
                {sortedVerifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#475569] text-xs font-medium">
                      No verification requests found matching filter constraints.
                    </td>
                  </tr>
                ) : (
                  paginatedVerifications.map((v) => (
                    <tr key={v.id} className="hover:bg-[#f0f5ea]/15 transition-colors group">
                      <td className="py-3.5 px-2.5 font-semibold text-[#181d16] text-xs">{v.id}</td>
                      <td className="py-3.5 px-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wide uppercase border ${
                          v.type === "court_record"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : v.type === "interpol"
                            ? "bg-blue-50/70 text-blue-800 border-blue-200"
                            : (v.type as string) === "rednotice_worldwide"
                            ? "bg-rose-50/80 text-rose-800 border-rose-200"
                            : (v.type as string) === "saflii_court"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : (v.type as string) === "uk_court"
                            ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                            : (v.type as string) === "malaysia_court"
                            ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                            : (v.type as string) === "singapore_court"
                            ? "bg-rose-50 text-rose-900 border-rose-200"
                            : (v.type as string) === "philippines_court"
                            ? "bg-amber-50 text-amber-900 border-amber-200"
                            : (v.type as string) === "saps_wanted"
                            ? "bg-blue-900/10 text-blue-900 border-blue-900/20"
                            : (v.type as string) === "passport"
                            ? "bg-[#EBF5FF] text-[#1E40AF] border-[#BFDBFE]"
                            : (v.type as string) === "digital_address"
                            ? "bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]"
                            : v.type === "employment"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : v.type === "education"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                        }`}>
                          {v.type === "court_record" 
                            ? "Court Record" 
                            : v.type === "interpol"
                            ? "Interpol Check"
                            : (v.type as string) === "rednotice_worldwide"
                            ? "Red Notice Worldwide"
                            : (v.type as string) === "saflii_court"
                            ? "SA Court Check"
                            : (v.type as string) === "uk_court"
                            ? "UK Court Check"
                            : (v.type as string) === "malaysia_court"
                            ? "Malaysia Court Check"
                            : (v.type as string) === "singapore_court"
                            ? "Singapore Court Check"
                            : (v.type as string) === "philippines_court"
                            ? "Philippines Court Check"
                            : (v.type as string) === "saps_wanted"
                            ? "SAPS Wanted"
                            : (v.type as string) === "passport"
                            ? "Passport Check"
                            : (v.type as string) === "digital_address"
                            ? "Digital Address Check"
                            : v.type === "employment" 
                            ? "Employment Check" 
                            : v.type === "education" 
                            ? "Education Check" 
                            : "Identity Check"}
                        </span>
                      </td>
                      <td className="py-3.5 px-2.5 text-[#181d16] text-xs whitespace-normal max-w-[450px]">
                        <div className="flex flex-col">
                          <span className="font-bold">{v.name}</span>
                          <span className="text-[11px] text-[#475569] font-medium break-words">
                            {v.type === "court_record"
                              ? (v.courtRecordSummary
                                || (v.courtRecordProgress
                                  ? v.courtRecordProgress
                                  : "Search in progress..."))
                              : (v.type as string) === "singapore_court"
                              ? `Singapore Judiciary • ${(v as any).singaporeCourtSelectedCourt || "All Courts"}${(v as any).singaporeCourtSelectedHearingType ? ` | ${(v as any).singaporeCourtSelectedHearingType}` : ""}`
                              : (v.type as string) === "philippines_court"
                              ? `Court of Appeals • ${(v as any).philippinesCourtStation ? (v as any).philippinesCourtStation.toUpperCase() : "All Stations"}${v.philippinesCourtCaseNo ? ` | Case: ${v.philippinesCourtCaseNo}` : ""}${v.philippinesCourtHasRecords !== undefined ? ` • ${v.philippinesCourtHasRecords ? `${(v as any).philippinesCourtResults?.length || 0} Record(s) Found` : "Clean Record"}` : ""}`
                              : v.type === "interpol" || (v.type as string) === "rednotice_worldwide" || (v.type as string) === "saflii_court" || (v.type as string) === "saps_wanted" || (v.type as string) === "uk_court" || (v.type as string) === "malaysia_court"
                              ? `DOB: ${v.candidateDob || "Not Given"}${v.birthCity ? ` | City: ${v.birthCity}` : ""}${v.candidateIdNumber ? ` | ID: ${v.candidateIdNumber}` : ""}`
                              : (v.type as string) === "passport"
                              ? `File No: ${(v as any).passportData?.fileNumber || "—"}${(v as any).passportData?.dateOfBirth ? ` | DOB: ${(v as any).passportData.dateOfBirth}` : ""}`
                              : (v.type as string) === "digital_address"
                              ? `${v.candidateAddress ? `${v.candidateAddress} | ` : ""}${v.email}`
                              : v.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2.5 text-[#475569] text-xs font-semibold">{v.date}</td>
                      <td className="py-3.5 px-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide uppercase border ${
                            v.status === "Halted" || (v.type as string) === "saps_wanted" && v.sapsWantedStatus === "verifying_with_attorney"
                              ? "bg-amber-100 text-amber-800 border-amber-300 font-extrabold"
                              : ((v.type === "court_record" && (v.courtRecordStatus === "admin_review" || v.courtRecordStatus === "needs_admin_retry")) || (!v.sendToCustomer && (v.type as string) !== "passport" && v.type !== "interpol" && (v.type as string) !== "rednotice_worldwide" && (v.type as string) !== "saflii_court" && (v.type as string) !== "saps_wanted" && (v.type as string) !== "uk_court" && (v.type as string) !== "malaysia_court" && (v.type as string) !== "singapore_court" && (v.type as string) !== "philippines_court" && v.type !== "court_record" && (v.type as string) !== "digital_address"))
                              ? "bg-amber-100/60 text-amber-700 border-amber-300/50"
                              : v.status === "Completed"
                              ? "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                              : v.status === "Processing"
                              ? "bg-[#f0f5ea]/40 text-[#181d16] border-[#eaf0e4]/70"
                              : "bg-[#FFF4CC]/40 text-[#805b00] border-[#FFF4CC]"
                          }`}
                        >
                          {v.status === "Halted" || ((v.type as string) === "saps_wanted" && v.sapsWantedStatus === "verifying_with_attorney")
                            ? "Halted"
                            : ((v.type === "court_record" && (v.courtRecordStatus === "admin_review" || v.courtRecordStatus === "needs_admin_retry")) || (!v.sendToCustomer && (v.type as string) !== "passport" && v.type !== "interpol" && (v.type as string) !== "rednotice_worldwide" && (v.type as string) !== "saflii_court" && (v.type as string) !== "saps_wanted" && (v.type as string) !== "uk_court" && (v.type as string) !== "malaysia_court" && (v.type as string) !== "singapore_court" && (v.type as string) !== "philippines_court" && v.type !== "court_record" && (v.type as string) !== "digital_address")) ? "In Progress" : v.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2.5 text-right">
                        {(v.type as string) === "digital_address" ? (
                          v.sendToCustomer || v.status === "Completed" ? (
                            <button
                              onClick={() => window.open(`/client/digital-address-report?id=${v.id}`, "_blank")}
                              className="font-bold text-[11px] px-3 py-1.5 rounded-lg bg-[#eaf0e4]/40 text-[#181d16] hover:bg-[#eaf0e4] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <span>View Report</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <div className="flex flex-col items-end gap-0.5 min-w-[130px]">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 bg-[#0891b2] rounded-full animate-pulse shrink-0"></div>
                                  <span className="text-[11px] text-[#0369A1] font-bold">
                                    {v.digitalAddressSubmitted || v.digitalAddressData?.selfieImage ? "Verifying GPS & Photos..." : "Awaiting Capture"}
                                  </span>
                                </div>
                                <span className="text-[9px] text-[#475569] font-medium text-right leading-tight">
                                  {v.digitalAddressSubmitted || v.digitalAddressData?.selfieImage ? "Processing..." : "Live camera link active"}
                                </span>
                              </div>
                              {!v.skipCandidateLogin && (
                                <button
                                  onClick={() => handleViewReport(v)}
                                  className="font-bold text-[11px] px-2.5 py-1.5 rounded-lg bg-[#f0f5ea]/65 text-[#181d16] hover:bg-[#f0f5ea] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs border border-[#eaf0e4]"
                                  title="View Candidate Login Credentials & Direct Link"
                                >
                                  <span>Credentials</span>
                                  <Key className="w-3.5 h-3.5 text-[#181d16]" />
                                </button>
                              )}
                            </div>
                          )
                        ) : (v.type as string) === "court_record" || (v.type as string) === "interpol" || (v.type as string) === "rednotice_worldwide" || (v.type as string) === "saflii_court" || (v.type as string) === "saps_wanted" || (v.type as string) === "uk_court" || (v.type as string) === "malaysia_court" || (v.type as string) === "singapore_court" || (v.type as string) === "philippines_court" || (v.type as string) === "passport" ? (
                          (() => {
                            const isPassport = (v.type as string) === "passport";
                            const isSapsWanted = (v.type as string) === "saps_wanted";
                            const isUkCourt = (v.type as string) === "uk_court";
                            const isMalaysiaCourt = (v.type as string) === "malaysia_court";
                            const isSingaporeCourt = (v.type as string) === "singapore_court";
                            const isPhilippinesCourt = (v.type as string) === "philippines_court";
                            const isHalted = v.status === "Halted" || (isSapsWanted && v.sapsWantedStatus === "verifying_with_attorney");
                            
                            // If halted for attorney verification, display the attorney review status indicator
                            if (isHalted) {
                              return (
                                <div className="flex flex-col items-end gap-1 min-w-[140px]">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping shrink-0"></div>
                                    <span className="text-[11px] text-amber-700 font-bold">Verifying with attorney</span>
                                  </div>
                                  <span className="text-[9px] text-[#475569] font-medium text-right leading-tight">
                                    Match flagged for review
                                  </span>
                                </div>
                              );
                            }

                            const isQuickCheck = isPassport || (v.type as string) === "interpol" || (v.type as string) === "rednotice_worldwide" || (v.type as string) === "saflii_court" || isSapsWanted || isUkCourt || isMalaysiaCourt || isSingaporeCourt || isPhilippinesCourt;
                            const minHoldS = isPassport ? 5 : isSapsWanted || isUkCourt || isMalaysiaCourt || isSingaporeCourt || isPhilippinesCourt ? 4 : 8;
                            const elapsedSeconds = v.createdAt ? Math.floor((tickNow - new Date(v.createdAt).getTime()) / 1000) : 999;
                            const isHolding = isQuickCheck && elapsedSeconds < minHoldS;

                            if (isHolding) {
                              return <QuickReportProgressIndicator verification={v} now={tickNow} />;
                            }

                            if (v.sendToCustomer || v.status === "Completed" || v.courtRecordStatus === "completed" || v.status === "Needs Attention") {
                              return (
                                <button
                                  onClick={() => window.open(
                                    (v.type as string) === "philippines_court"
                                      ? `/client/philippines-court-report?id=${v.id}`
                                      : (v.type as string) === "singapore_court"
                                      ? `/client/singapore-court-report?id=${v.id}`
                                      : (v.type as string) === "malaysia_court"
                                      ? `/client/malaysia-court-report?id=${v.id}`
                                      : (v.type as string) === "uk_court"
                                      ? `/client/uk-court-report?id=${v.id}`
                                      : (v.type as string) === "saps_wanted"
                                      ? `/client/saps-wanted-report?id=${v.id}`
                                      : (v.type as string) === "rednotice_worldwide"
                                      ? `/client/rednotice-worldwide-report?id=${v.id}`
                                      : (v.type as string) === "saflii_court"
                                      ? `/client/saflii-court-report?id=${v.id}`
                                      : (v.type as string) === "interpol"
                                      ? `/client/interpol-report?id=${v.id}`
                                      : (v.type as string) === "passport"
                                      ? `/client/passport-report?id=${v.id}`
                                      : `/client/court-record-report?id=${v.id}`,
                                    "_blank"
                                  )}
                                  className="font-bold text-[11px] px-3 py-1.5 rounded-lg bg-[#eaf0e4]/40 text-[#181d16] hover:bg-[#eaf0e4] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                                >
                                  <span>View Report</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              );
                            }

                            if (v.courtRecordStatus === "admin_review" || v.courtRecordStatus === "needs_admin_retry") {
                              return (
                                <div className="flex flex-col items-end gap-1 min-w-[140px]">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shrink-0"></div>
                                    <span className="text-[11px] text-amber-700 font-bold">Reviewing with attorney</span>
                                  </div>
                                  <span className="text-[9px] text-[#475569] font-medium text-right leading-tight">Will complete within<br/>24 hours.</span>
                                </div>
                              );
                            }

                            return <SearchProgressIndicator verification={v} now={tickNow} />;
                          })()
                        ) : ((v.type === "employment" || v.type === "education") && !v.sendToCustomer) ? (
                          (v.type === "employment" ? v.employmentDataSubmitted : v.educationDataSubmitted) ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => openCandidateFillModal(v)}
                                className="font-bold text-[11px] px-2.5 py-1.5 rounded-lg bg-[#f0f5ea] text-[#181d16] hover:bg-[#eaf0e4] transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                title="View or Edit Submitted Candidate Details"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#00450e]" />
                                <span>Edit Details</span>
                              </button>
                              <button
                                onClick={() => handleViewReport(v)}
                                className="font-bold text-[11px] px-2.5 py-1.5 rounded-lg bg-[#FFF4CC]/60 text-[#805b00] hover:bg-[#FFF4CC]/80 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                              >
                                <span>In Progress</span>
                                <Clock className="w-3.5 h-3.5 text-[#805b00]" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => openCandidateFillModal(v)}
                                className="font-bold text-[11px] px-3 py-1.5 rounded-lg bg-[#00450e] text-white hover:bg-[#00330a] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                                <span>Fill Candidate Details</span>
                              </button>
                              {!v.skipCandidateLogin && (
                                <button
                                  onClick={() => handleViewReport(v)}
                                  className="font-bold text-[11px] px-2.5 py-1.5 rounded-lg bg-[#f0f5ea]/65 text-[#181d16] hover:bg-[#f0f5ea] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                                  title="View Candidate Login Credentials"
                                >
                                  <span>Credentials</span>
                                  <Key className="w-3.5 h-3.5 text-[#181d16]" />
                                </button>
                              )}
                            </div>
                          )
                        ) : v.status === "Completed" ? (
                          <button
                            onClick={() => handleViewReport(v)}
                            className="font-bold text-[11px] px-3 py-1.5 rounded-lg bg-[#eaf0e4]/40 text-[#181d16] hover:bg-[#eaf0e4] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>View Report</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : v.status === "Needs Attention" ? (
                          <button
                            onClick={() => handleViewReport(v)}
                            className="font-bold text-[11px] px-3 py-1.5 rounded-lg bg-[#FFF4CC] text-[#805b00] hover:bg-[#FFF4CC]/85 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>Resolve Issue</span>
                            <AlertTriangle className="w-3.5 h-3.5 text-[#805b00]" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleViewReport(v)}
                            className="font-bold text-[11px] px-3 py-1.5 rounded-lg bg-[#f0f5ea]/65 text-[#181d16] hover:bg-[#f0f5ea] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>Credentials</span>
                            <Key className="w-3.5 h-3.5 text-[#181d16]" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-2 pt-4 border-t border-[#f0f5ea]/60 flex justify-between items-center text-xs">
            <span className="text-[#475569] font-medium">
              Showing {paginatedVerifications.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, sortedVerifications.length)} of {sortedVerifications.length} requests
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-[#181d16] hover:bg-[#f0f5ea]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-[#181d16] hover:bg-[#f0f5ea]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Sidebar Cards Column */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          {/* Redesigned Invoices & Billing Panel */}
          <section className="bg-white border border-[#eaf0e4] rounded-3xl p-6 flex flex-col gap-5 relative overflow-hidden group shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#eaf0e4] opacity-25 rounded-full blur-2xl group-hover:opacity-35 transition-opacity pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#eaf0e4]"></div>
            <div className="flex justify-between items-start mb-1 relative z-10">
              <h3 className="font-semibold text-lg text-[#181d16]">Invoices &amp; Billing</h3>
              <Receipt className="w-5 h-5 text-[#475569]" />
            </div>
            
            <div className="relative z-10">
              <p className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider uppercase mb-1">Total Outstanding</p>
              <p className="font-display-lg text-[#181d16] font-bold tracking-tight text-3xl">{getCurrencySymbol(organisation?.currency)}{(unpaidBalance + currentMonthRunningTotal).toFixed(2)}</p>
              <p className="text-slate-500 text-xs mt-1 font-medium">Due by next statement</p>
            </div>

            {/* Real-time Current Month Running Total */}
            {currentMonthCompleted > 0 && (
              <div className="relative z-10 mt-1 p-3 bg-[#f0f5ea]/25 border border-[#eaf0e4]/50 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label-caps text-[10px] text-[#475569] font-bold tracking-wider uppercase">Uninvoiced Charges</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#eaf0e4]/40 text-[#181d16] border border-[#eaf0e4] uppercase">Live</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-[#475569] font-medium">{currentMonthCompleted} verification{currentMonthCompleted !== 1 ? "s" : ""}</span>
                  <span className="font-bold text-sm text-[#181d16]">{getCurrencySymbol(organisation?.currency)}{currentMonthRunningTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Clickable Recent Invoices List */}
            <div className="space-y-2 relative z-10 mt-2">
              <p className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider uppercase mb-2">Recent Invoices</p>
              {clientInvoices.length === 0 ? (
                <p className="text-xs text-slate-500 font-medium italic text-center py-4">No statements issued.</p>
              ) : (
                clientInvoices.slice(0, 4).map((inv) => {
                  const { month, year } = getInvoiceBillingPeriod(inv);
                  const displayPeriod = month ? `${month.substring(0, 3)} ${year}` : inv.date;
                  return (
                    <button
                      key={inv._id || inv.id}
                      type="button"
                      onClick={() => handleInitiatePayment(inv)}
                      className="w-full text-left p-3 rounded-xl border border-[#f0f5ea]/40 bg-white hover:bg-[#f0f5ea]/15 transition-all flex justify-between items-center cursor-pointer shadow-3xs hover:shadow-2xs group/row"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-xs text-[#181d16] group-hover/row:text-[#00450e] transition-colors">{inv.id}</span>
                        <span className="text-[10px] text-[#475569] font-medium">{displayPeriod} · Due {inv.dueDate}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-xs text-[#181d16]">{getCurrencySymbol(inv.currency || organisation?.currency)}{inv.amount.toFixed(2)}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                            inv.status === "Paid"
                              ? "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                              : inv.status === "Pending"
                              ? "bg-[#FFF4CC]/40 text-[#805b00] border-[#FFF4CC]"
                              : inv.status === "Overdue"
                              ? "bg-red-50 text-red-800 border border-red-200"
                              : "bg-slate-50 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>


          </section>
        </div>
      </div>
    </div>

      {/* View Report Detail Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-slate-900/15 backdrop-blur-xs overflow-y-auto flex justify-center p-4 z-[99999] animate-fade-in">
          <div className={`bg-white border border-[#eaf0e4] rounded-3xl p-8 w-full shadow-2xl relative my-auto ${displayVerification?.digilockerStatus === "Verified" ? "max-w-3xl animate-fade-in" : "max-w-lg animate-fade-in"}`}>
            <button
              onClick={() => {
                setSelectedVerification(null);
                setSelectedDetail(null);
              }}
              className="absolute right-4 top-4 p-2 hover:bg-[#f0f5ea]/40 transition-colors rounded-xl text-[#181d16] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {isLoadingDetail ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#00450e]">
                <div className="w-10 h-10 border-4 border-[#eaf0e4] border-t-[#181d16] rounded-full animate-spin"></div>
                <span className="text-xs font-bold font-label-caps uppercase tracking-wider animate-pulse">Decrypting Secured Records...</span>
              </div>
            ) : displayVerification && (
              <>
                <div className="flex items-center gap-2 mb-6 animate-fade-in">
                  {displayVerification.status === "Completed" ? (
                    <CheckCircle2 className="w-6 h-6 text-[#00684A] shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-700 shrink-0" />
                  )}
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-semibold text-lg text-[#181d16]">Report</h3>
                    <span className="text-[11px] font-bold text-[#475569] font-mono">ID: {displayVerification.id}</span>
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
                        <div className="w-24 h-28 bg-[#f0f5ea]/20 rounded-2xl overflow-hidden border border-[#f0f5ea] shrink-0 flex items-center justify-center shadow-xs">
                          {displayVerification.digilockerPhoto ? (
                            <img 
                              src={getPhotoSrc(displayVerification.digilockerPhoto)} 
                              alt="DigiLocker User Avatar" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-[#00450e]">No Photo</span>
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
                              <div key={doc.id} className="p-3.5 bg-[#f0f5ea]/10 border border-[#f0f5ea] rounded-xl flex flex-col gap-1.5 shadow-2xs">
                                <span className="font-bold text-xs text-[#181d16]">{doc.name}</span>
                                <span className="text-[10px] text-[#475569] font-semibold">{doc.issuer}</span>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#f0f5ea]/40">
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
                      <div className="grid grid-cols-2 gap-4 bg-[#f0f5ea]/15 border border-[#f0f5ea] p-4 rounded-xl text-left">
                        <div>
                          <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider block">CANDIDATE NAME</span>
                          <span className="text-[#181d16] font-bold text-xs">{displayVerification.name}</span>
                        </div>
                        <div>
                          <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider block">CANDIDATE EMAIL</span>
                          <span className="text-[#181d16] text-xs font-semibold">{displayVerification.email}</span>
                        </div>
                        <div>
                          <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider block">ORGANIZATION</span>
                          <span className="text-[#181d16] text-xs font-semibold">{displayVerification.orgName}</span>
                        </div>
                        <div>
                          <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider block">DATE INITIATED</span>
                          <span className="text-[#181d16] text-xs font-semibold">{displayVerification.date}</span>
                        </div>
                        <div>
                          <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider block">VERIFIER ASSIGNED</span>
                          <span className="text-[#181d16] text-xs font-semibold">{displayVerification.verifier || "Not Assigned"}</span>
                        </div>
                        <div>
                          <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider block mb-0.5">STATUS</span>
                          <span
                            className={`inline-block font-bold px-2 py-0.5 rounded border text-[9px] uppercase ${
                              displayVerification.status === "Completed"
                                ? "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                                : "bg-[#FFF4CC]/40 text-[#805b00] border border-[#FFF4CC]"
                            }`}
                          >
                            {displayVerification.status}
                          </span>
                        </div>
                      </div>

                      {displayVerification.status !== "Completed" && displayVerification.setupUrl && (
                        <div className="w-full mt-4 p-5 bg-[#f0f5ea]/25 border border-[#eaf0e4] rounded-2xl text-left flex flex-col gap-3 relative overflow-hidden shadow-2xs">
                          <div className="absolute right-3 top-3">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-[#181d16] bg-white border border-[#eaf0e4] px-2 py-0.5 rounded animate-pulse">
                              Direct Login Link
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1 pt-3">
                            <span className="font-label-caps text-[#334155] text-[10px] uppercase font-semibold tracking-wider">Candidate Direct Login Link</span>
                            <p className="text-[11px] text-[#475569] leading-relaxed mb-2">
                              Share this direct login link with the candidate. Credentials are embedded and will pre-fill automatically.
                            </p>
                              {(() => {
                                const formattedUrl = displayVerification.setupUrl && typeof window !== "undefined" && window.location.hostname !== "localhost" && (displayVerification.setupUrl.includes("localhost") || displayVerification.setupUrl.includes("127.0.0.1"))
                                  ? displayVerification.setupUrl.replace(/^https?:\/\/[^\/]+/, process.env.NEXT_PUBLIC_CANDIDATE_PORTAL_URL || "https://candidate.verify.clusoinfolink.com")
                                  : displayVerification.setupUrl;
                                return (
                                  <>
                                    <span className="font-mono text-xs text-[#181d16] truncate max-w-[65%]" title={formattedUrl}>
                                      {formattedUrl}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(formattedUrl || "");
                                          setCopiedUrl(true);
                                          setTimeout(() => setCopiedUrl(false), 2000);
                                        }}
                                        className="text-xs px-3 py-1.5 bg-[#181d16] text-white rounded-lg font-semibold hover:bg-[#1E293B] transition-all flex items-center gap-1.5 cursor-pointer"
                                      >
                                        {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copiedUrl ? "Copied" : "Copy"}</span>
                                      </button>
                                    </div>
                                  </>
                                );
                              })()}

                            {/* Pre-filled credentials detail */}
                            {(() => {
                              const params = getUrlParams(displayVerification.setupUrl);
                              return (
                                <div className="mt-3 p-4 bg-white/70 border border-[#eaf0e4]/40 rounded-2xl text-xs flex flex-col gap-2.5 shadow-2xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[#475569] font-semibold uppercase tracking-wider text-[10px] font-label-caps">Candidate Email ID</span>
                                    <span className="font-mono text-[#181d16] font-bold text-xs select-all">{params.email}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-t border-[#f0f5ea]/30 pt-2">
                                    <span className="text-[#475569] font-semibold uppercase tracking-wider text-[10px] font-label-caps">Temporary Password</span>
                                    <span className="font-mono text-[#181d16] font-bold text-xs select-all">{params.password}</span>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-[#64748B]">
                              <Sparkles className="w-3 h-3 text-[#00450e]" />
                              <span>The candidate can log in directly using this link without setting a password.</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {(displayVerification.type === "employment" || displayVerification.type === "education") && (
                        <div className="p-4 bg-[#f0f5ea]/40 border border-[#eaf0e4] rounded-2xl flex items-center justify-between gap-3 text-left">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-[#181d16]">
                              {displayVerification.type === "employment" ? "Candidate Employment Details" : "Candidate Education Details"}
                            </span>
                            <span className="text-[11px] text-[#475569] font-medium mt-0.5">
                              {(displayVerification.type === "employment" ? displayVerification.employmentDataSubmitted : displayVerification.educationDataSubmitted)
                                ? "Verification details have been submitted."
                                : "Candidate verification details not yet submitted."}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="text-left">
                        <span className="font-label-caps text-[#475569] text-[10px] uppercase font-bold tracking-wider block mb-1">
                          Verification Findings &amp; Summary
                        </span>
                        <p className="p-4 bg-[#f0f5ea]/10 border border-[#f0f5ea] rounded-xl text-[#181d16] leading-relaxed text-xs font-semibold">
                          {displayVerification.reportDetails ||
                            "This verification is currently in progress. Standard validation is being conducted by the verification officer. If additional paperwork is required, you will be notified."}
                        </p>
                      </div>
                    </>
                  )}

                  {displayVerification.notes && (
                    <div className="pt-2">
                      <span className="font-label-caps text-[#475569] text-[10px] uppercase font-bold tracking-wider block mb-1">Status Notes</span>
                      <p className="text-secondary italic pl-3 border-l-2 border-[#eaf0e4] text-xs font-semibold">
                        {displayVerification.notes}
                      </p>
                    </div>
                  )}

                  {displayVerification.type === "court_record" && displayVerification.courtRecordStatus === "needs_admin_retry" && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mt-2 flex flex-col gap-2 shadow-2xs">
                      <span className="font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>In Progress</span>
                      </span>
                      <p className="leading-relaxed font-semibold">
                        This verification is being reviewed by our internal team. No action is required from your end. It will be completed within 12 hours.
                      </p>
                    </div>
                  )}

                  {displayVerification.status === "Needs Attention" && displayVerification.type !== "court_record" && (
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
     
                <div className="mt-8 flex justify-end gap-3 border-t border-[#f0f5ea]/40 pt-5">
                  <button
                    onClick={() => {
                      setSelectedVerification(null);
                      setSelectedDetail(null);
                    }}
                    className="px-5 py-2.5 border border-[#f0f5ea] hover:bg-[#f6fbf0] rounded-xl font-semibold text-xs text-[#334155] cursor-pointer bg-white"
                  >
                    Close
                  </button>
                  {((displayVerification.status === "Completed" || displayVerification.status === "Verified" || displayVerification.status === "Needs Attention" || displayVerification.status === "Discrepancy") && ((displayVerification.type as string) === "court_record" || (displayVerification.type as string) === "interpol" || (displayVerification.type as string) === "rednotice_worldwide" || (displayVerification.type as string) === "saflii_court" || (displayVerification.type as string) === "saps_wanted" || (displayVerification.type as string) === "uk_court" || (displayVerification.type as string) === "malaysia_court" || (displayVerification.type as string) === "singapore_court" || (displayVerification.type as string) === "philippines_court" || (displayVerification.type as string) === "passport" || displayVerification.sendToCustomer)) && (
                    <button
                      onClick={() => {
                        const reportPath = (displayVerification.type as string) === "court_record"
                          ? `/client/court-record-report?id=${displayVerification.id}`
                          : (displayVerification.type as string) === "interpol"
                          ? `/client/interpol-report?id=${displayVerification.id}`
                          : (displayVerification.type as string) === "rednotice_worldwide"
                          ? `/client/rednotice-worldwide-report?id=${displayVerification.id}`
                          : (displayVerification.type as string) === "saflii_court"
                          ? `/client/saflii-court-report?id=${displayVerification.id}`
                          : (displayVerification.type as string) === "saps_wanted"
                          ? `/client/saps-wanted-report?id=${displayVerification.id}`
                          : (displayVerification.type as string) === "uk_court"
                          ? `/client/uk-court-report?id=${displayVerification.id}`
                          : (displayVerification.type as string) === "malaysia_court"
                          ? `/client/malaysia-court-report?id=${displayVerification.id}`
                          : (displayVerification.type as string) === "singapore_court"
                          ? `/client/singapore-court-report?id=${displayVerification.id}`
                          : (displayVerification.type as string) === "philippines_court"
                          ? `/client/philippines-court-report?id=${displayVerification.id}`
                          : (displayVerification.type as string) === "passport"
                          ? `/client/passport-report?id=${displayVerification.id}`
                          : (displayVerification.type as string) === "digital_address"
                          ? `/client/digital-address-report?id=${displayVerification.id}`
                          : (displayVerification.type as string) === "employment"
                          ? `/client/employment-report?id=${displayVerification.id}`
                          : (displayVerification.type as string) === "education"
                          ? `/client/education-report?id=${displayVerification.id}`
                          : `/client/report?id=${displayVerification.id}`;
                        window.open(reportPath, "_blank");
                        setSelectedVerification(null);
                        setSelectedDetail(null);
                      }}
                      className="px-5 py-2.5 bg-[#181d16] text-white rounded-xl font-semibold hover:bg-[#1E293B] flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
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
        <div className="fixed inset-0 bg-slate-900/15 backdrop-blur-xs overflow-y-auto flex justify-center p-4 z-[99999] animate-fade-in">
          <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative my-auto animate-fade-in">
            <button
              onClick={() => setBillingHistoryOpen(false)}
              className="absolute right-4 top-4 p-2 hover:bg-[#f0f5ea]/40 transition-colors rounded-xl text-[#181d16] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
 
            <h3 className="font-semibold text-lg text-[#181d16] mb-1">Billing &amp; Invoice History</h3>
            <p className="text-secondary text-xs mb-6 font-medium text-slate-500">
              Full log of all monthly statements issued to {clientCompany}.
            </p>
 
            <div className="overflow-x-auto border border-[#f0f5ea]/65 rounded-2xl shadow-2xs">
              <table className="w-full text-left font-body-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#f0f5ea] bg-[#f0f5ea]/20 text-[#181d16] font-bold text-xs">
                    <th className="py-2.5 px-4 font-label-caps uppercase tracking-wider">INVOICE ID</th>
                    <th className="py-2.5 px-4 font-label-caps uppercase tracking-wider">DATE GENERATED</th>
                    <th className="py-2.5 px-4 font-label-caps uppercase tracking-wider">DUE DATE</th>
                    <th className="py-2.5 px-4 font-label-caps uppercase tracking-wider">AMOUNT</th>
                    <th className="py-2.5 px-4 font-label-caps text-right uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f5ea]/40 bg-white">
                  {clientInvoices.map((inv) => (
                    <tr
                      key={inv._id || inv.id}
                      onClick={() => {
                        setBillingHistoryOpen(false);
                        handleInitiatePayment(inv);
                      }}
                      className="hover:bg-[#f0f5ea]/15 transition-all cursor-pointer group/row"
                    >
                      <td className="py-3 px-4 font-bold text-[#181d16] text-xs group-hover/row:text-[#00450e] group-hover/row:underline transition-colors">{inv.id}</td>
                      <td className="py-3 px-4 text-[#475569] text-xs font-semibold">{inv.date}</td>
                      <td className="py-3 px-4 text-[#475569] text-xs font-semibold">{inv.dueDate}</td>
                      <td className="py-3 px-4 text-[#181d16] font-bold text-xs">${inv.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span
                            className={`inline-block font-bold px-2 py-0.5 rounded border text-[9px] uppercase tracking-wider ${
                              inv.status === "Paid"
                                ? "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                                : inv.status === "Pending"
                                ? "bg-[#FFF4CC]/40 text-[#805b00] border-[#FFF4CC]"
                                : inv.status === "Overdue"
                                ? "bg-red-50 text-red-800 border border-red-200"
                                : "bg-slate-50 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {inv.status}
                          </span>
                          <span className="text-[10px] font-bold text-[#0ea5e9] opacity-0 group-hover/row:opacity-100 transition-opacity">View Details &rarr;</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
 
            <div className="mt-8 flex justify-end border-t border-[#f0f5ea]/40 pt-5">
              <button
                onClick={() => setBillingHistoryOpen(false)}
                className="px-5 py-2.5 bg-[#181d16] text-white hover:bg-[#1E293B] rounded-xl font-semibold cursor-pointer text-xs shadow-xs border-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {activeInvoice && (
        <div className="fixed inset-0 bg-slate-900/15 backdrop-blur-xs overflow-y-auto flex justify-center p-4 z-[99999] animate-fade-in">
          <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative my-auto animate-fade-in">
            <button
              onClick={() => {
                if (!paymentProcessing && !paymentSuccess && !modalClosing) {
                  handleCloseInvoiceModal();
                }
              }}
              disabled={paymentProcessing || paymentSuccess || modalClosing}
              className="absolute right-4 top-4 p-2 hover:bg-[#f0f5ea]/40 rounded-xl text-[#181d16] disabled:opacity-50 cursor-pointer border-none bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>
 
            {modalClosing ? (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in min-h-[300px]">
                <div className="w-10 h-10 border-4 border-[#00450e] border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="font-semibold text-sm text-[#181d16]">Closing Invoice Details...</h3>
                <p className="text-secondary text-[10px] mt-1 text-slate-500 font-medium">Please wait a moment</p>
              </div>
            ) : paymentSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-[#E6F8F3] border border-[#A3EAD6] rounded-full flex items-center justify-center text-[#00684A] mb-4 animate-bounce-subtle">
                  <CheckCircle className="w-8 h-8 text-[#00a877]" />
                </div>
                <h3 className="font-semibold text-lg text-[#181d16]">Proof Uploaded Successfully</h3>
                <p className="text-secondary text-xs mt-2 font-semibold">
                  Your payment proof has been uploaded.
                </p>
                <p className="text-secondary text-xs mt-1 font-semibold">
                  Invoice <strong className="text-[#181d16] font-bold">{activeInvoice.id}</strong> is now <strong className="text-[#805b00] font-bold">Pending</strong> approval from our administrator.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="text-left border-b border-[#f0f5ea]/40 pb-3">
                  <h3 className="font-semibold text-lg text-[#181d16]">Invoice Statement</h3>
                  <p className="text-secondary text-xs mt-1 font-medium text-slate-500">
                    Detailed billing information and payment options.
                  </p>
                </div>
 
                {/* Detailed Invoice Info */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-[#f0f5ea]/10 p-4 rounded-2xl border border-[#eaf0e4]/60 text-xs text-left">
                  <div>
                    <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">INVOICE ID</span>
                    <span className="text-[#181d16] font-bold font-mono">{activeInvoice.id}</span>
                  </div>
                  <div>
                    <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">BILLING PERIOD</span>
                    <span className="text-[#181d16] font-bold">
                      {(() => {
                        const { month, year } = getInvoiceBillingPeriod(activeInvoice);
                        return month ? `${month} ${year}` : "N/A";
                      })()}
                    </span>
                  </div>
                  <div className="border-t border-[#f0f5ea]/40 pt-2 mt-1">
                    <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">DATE ISSUED</span>
                    <span className="text-[#181d16] font-semibold">{activeInvoice.date}</span>
                  </div>
                  <div className="border-t border-[#f0f5ea]/40 pt-2 mt-1">
                    <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">DUE DATE</span>
                    <span className="text-[#181d16] font-semibold">{activeInvoice.dueDate}</span>
                  </div>
                  <div className="col-span-2 border-t border-[#f0f5ea]/40 pt-2 mt-1 flex justify-between items-baseline">
                    <div>
                      <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">AMOUNT DUE</span>
                      <span className="text-xl font-extrabold text-[#181d16] font-mono">{getCurrencySymbol(activeInvoice.currency || organisation?.currency)}{activeInvoice.amount.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">STATUS</span>
                      <span
                        className={`inline-block font-bold px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider ${
                          activeInvoice.status === "Paid"
                            ? "bg-[#E6F8F3] text-[#00684A] border-[#A3EAD6]"
                            : activeInvoice.status === "Pending"
                            ? "bg-[#FFF4CC]/40 text-[#805b00] border-[#FFF4CC]"
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
                  className="w-full py-2.5 bg-[#eaf0e4]/40 text-[#181d16] hover:bg-[#eaf0e4]/70 font-bold text-xs rounded-xl border border-[#eaf0e4] transition-all flex justify-center items-center gap-2 cursor-pointer shadow-3xs"
                >
                  <Download className="w-4 h-4 text-[#181d16]" />
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
                    <div className="mt-4 p-4 bg-white border border-[#f0f5ea]/60 rounded-2xl text-left flex flex-col gap-3">
                      <span className="font-label-caps text-[#475569] text-[10px] font-bold tracking-wider uppercase block border-b border-[#f0f5ea]/30 pb-2 mb-1 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">history</span>
                        <span>Invoice Activity History</span>
                      </span>

                      <div className="relative border-l border-[#f0f5ea] pl-5 ml-2.5 flex flex-col gap-4">
                        {sorted.map((act, index) => {
                          let icon = (
                            <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-xs">
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
                                    <p className="text-xs text-rose-700 italic">"{act.note}"</p>
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
                  <>
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
                    <div className="flex border-b border-[#f0f5ea]">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("wire")}
                        className={`flex-1 py-2.5 font-bold text-xs transition-all border-b-2 text-center flex justify-center items-center gap-1.5 cursor-pointer ${
                          paymentMethod === "wire"
                            ? "border-[#181d16] text-[#181d16]"
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
                          <span className="bg-[#f0f5ea]/50 text-[#181d16] text-[8px] uppercase px-1.5 py-0.5 rounded font-extrabold">Soon</span>
                        </span>
                      </button>
                    </div>
 
                    {/* Tab Contents */}
                    {paymentMethod === "wire" && (
                      <div className="flex flex-col gap-4 animate-fade-in text-left">
                        <p className="text-secondary text-[11px] leading-relaxed font-medium text-slate-500">
                          Please transfer the exact amount due to the bank details below. Use the copy buttons for quick transfer input.
                        </p>

                        {organisation && organisation.bankName ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 bg-[#f0f5ea]/10 p-4 rounded-2xl border border-[#eaf0e4]">
                            {/* Bank Name */}
                            <div className="flex justify-between items-center text-xs">
                              <div>
                                <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">BANK NAME</span>
                                <span className="text-[#181d16] font-bold">{organisation.bankName}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(organisation.bankName || "", "bankName")}
                                className="text-[10px] text-[#181d16] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                              >
                                {copiedField === "bankName" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedField === "bankName" ? "Copied" : "Copy"}</span>
                              </button>
                            </div>

                            {/* Account Number */}
                            {organisation.accountNumber && (
                              <div className="flex justify-between items-center text-xs">
                                <div>
                                  <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">ACCOUNT NUMBER</span>
                                  <span className="text-[#181d16] font-mono font-bold">{organisation.accountNumber}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(organisation.accountNumber || "", "accountNumber")}
                                  className="text-[10px] text-[#181d16] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedField === "accountNumber" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedField === "accountNumber" ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                            )}

                            {/* IFSC Code */}
                            {organisation.ifscCode && (
                              <div className="flex justify-between items-center text-xs border-t sm:border-t-0 border-[#f0f5ea]/65 pt-2.5 sm:pt-0">
                                <div>
                                  <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">IFSC CODE</span>
                                  <span className="text-[#181d16] font-mono font-bold">{organisation.ifscCode}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(organisation.ifscCode || "", "ifscCode")}
                                  className="text-[10px] text-[#181d16] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedField === "ifscCode" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedField === "ifscCode" ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                            )}

                            {/* UPI ID */}
                            {organisation.upiId && (
                              <div className="flex justify-between items-center text-xs border-t sm:border-t-0 border-[#f0f5ea]/65 pt-2.5 sm:pt-0">
                                <div>
                                  <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">UPI ID</span>
                                  <span className="text-[#181d16] font-mono font-bold">{organisation.upiId}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(organisation.upiId || "", "upiId")}
                                  className="text-[10px] text-[#181d16] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedField === "upiId" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedField === "upiId" ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                            )}

                            {/* Payment Notes */}
                            {organisation.paymentNotes && (
                              <div className="col-span-1 sm:col-span-2 border-t border-[#f0f5ea]/65 pt-2.5">
                                <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block mb-0.5">PAYMENT NOTES</span>
                                <p className="text-[10px] text-[#475569] italic leading-relaxed">
                                  {organisation.paymentNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-[#f6fbf0] p-4 rounded-xl border border-[#f0f5ea] text-center flex flex-col gap-2 justify-center py-6 text-secondary">
                            <Lock className="w-6 h-6 text-slate-400 mx-auto" />
                            <p className="text-xs font-semibold">No bank details have been configured for your organisation.</p>
                            <p className="text-[10px] opacity-80 font-medium">Please contact the system administrator to set up payment options.</p>
                          </div>
                        )}
 
                        {/* Payment Proof Upload Section */}
                        <div className="mt-3 border-t border-[#f0f5ea]/60 pt-3 flex flex-col gap-2">
                          <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">UPLOAD PAYMENT PROOF SCREENSHOT</span>
                          
                          {!proofFile ? (
                            <label className="border-2 border-dashed border-[#f0f5ea] hover:border-[#181d16]/50 bg-[#f6fbf0] hover:bg-[#f0f5ea]/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                              <UploadCloud className="w-8 h-8 text-slate-400 animate-pulse" />
                              <span className="text-xs text-[#181d16] font-bold">Click to upload payment proof</span>
                              <span className="text-[10px] text-secondary">PNG, JPG or PDF up to 2MB</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </label>
                          ) : (
                            <div className="bg-[#f0f5ea]/10 border border-[#f0f5ea] rounded-2xl p-4 flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 max-w-[80%]">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-[#181d16] font-bold truncate" title={proofFileName}>
                                    {proofFileName}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProofFile(null);
                                    setProofFileName("");
                                  }}
                                  className="text-[11px] text-red-650 hover:underline cursor-pointer flex items-center gap-1 font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              </div>
 
                              {proofFile.startsWith("data:image/") && (
                                <div className="w-full h-40 rounded-xl overflow-hidden border border-[#f0f5ea]/50 flex items-center justify-center bg-black/5 animate-fade-in">
                                  <img src={proofFile} alt="Payment proof preview" className="w-full h-full object-contain" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Optional Client Note input (only shown once proofFile is uploaded) */}
                          {proofFile && (
                            <div className="flex flex-col gap-1.5 mt-2 animate-fade-in text-left">
                              <span className="text-[#475569] font-label-caps text-[9px] font-bold tracking-wider block">ADD A NOTE FOR OUR ADMINISTRATOR</span>
                              <textarea
                                value={clientNote}
                                onChange={(e) => setClientNote(e.target.value)}
                                placeholder="e.g. Transaction Reference, Bank branch, or transfer notes..."
                                rows={2}
                                className="w-full border border-[#eaf0e4]/70 rounded-xl p-3 text-xs text-slate-800 bg-white focus:outline-none focus:ring-4 focus:ring-[#f0f5ea]/10 focus:border-[#eaf0e4] transition-all resize-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
 
                    {/* Actions */}
                    <div className="mt-4 flex justify-end gap-3 border-t border-[#f0f5ea]/60 pt-4">
                      <button
                        type="button"
                        onClick={handleCloseInvoiceModal}
                        disabled={paymentProcessing}
                        className="px-5 py-2.5 border border-[#f0f5ea] hover:bg-[#f6fbf0] rounded-xl font-semibold text-[#334155] cursor-pointer text-xs disabled:opacity-50 bg-white"
                      >
                        Cancel
                      </button>
                      {paymentMethod === "wire" && organisation && organisation.bankName && (
                        <button
                          type="button"
                          onClick={handleConfirmPayment}
                          disabled={paymentProcessing || !proofFile}
                          className="px-5 py-2.5 bg-[#181d16] text-[#ffffff] rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50 min-w-[130px] justify-center shadow-xs border-none"
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
                  </>
                )}
 
                {/* Pending State Banner */}
                {activeInvoice.status === "Pending" && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left flex flex-col gap-2 mt-2">
                    <span className="font-bold text-[#E65100] text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-[#F57C00]" />
                      <span>Payment Proof Under Review</span>
                    </span>
                    <p className="text-[11px] text-[#BF360C] leading-relaxed font-semibold">
                      We have received your transaction proof. Our administrator will verify the receipt details. Once verified, your status will update to Paid.
                    </p>
                    {activeInvoice.clientNote && (
                      <div className="mt-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/15 text-xs text-left">
                        <span className="font-label-caps text-[#E65100] text-[9px] uppercase tracking-wider font-bold block mb-1">Your Note to Admin</span>
                        <p className="text-slate-800 font-medium italic">{activeInvoice.clientNote}</p>
                      </div>
                    )}
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleCloseInvoiceModal}
                        className="px-5 py-2 bg-[#181d16] hover:bg-[#1E293B] text-white rounded-xl font-semibold text-xs cursor-pointer border-none"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
 
                {/* Paid State Banner */}
                {activeInvoice.status === "Paid" && (
                  <div className="p-4 bg-[#E6F8F3] border border-[#A3EAD6] rounded-2xl text-left flex flex-col gap-2 mt-2">
                    <span className="font-bold text-[#00684A] text-xs flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-[#00a877]" />
                      <span>Invoice Settled</span>
                    </span>
                    <p className="text-[11px] text-[#00684A]/90 leading-relaxed font-semibold">
                      This invoice statement has been fully paid and closed. Thank you!
                    </p>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleCloseInvoiceModal}
                        className="px-5 py-2 bg-[#181d16] hover:bg-[#1E293B] text-white rounded-xl font-semibold text-xs cursor-pointer border-none"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {activeFillModal && (
        <CandidateFillModal
          isOpen={activeFillModal.isOpen}
          onClose={() => setActiveFillModal(null)}
          verificationId={activeFillModal.id}
          verificationType={activeFillModal.type}
          candidateName={activeFillModal.name}
          initialData={activeFillModal.initialData}
          onSuccess={() => {
            refreshData();
          }}
        />
      )}
    </>
  );
}
