"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { usePortal } from "src/context/PortalContext";
import { useAuth } from "src/context/AuthContext";
import {
  CheckCircle,
  AlertCircle,
  Send,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  UserPlus,
  X,
  Scale,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  Building,
  ChevronDown,
  UploadCloud,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Briefcase,
  GraduationCap,
  Globe,
  FileEdit,
  FileCheck,
  Loader2,
  Search,
} from "lucide-react";
import { INDIAN_STATES } from "src/lib/courts-mapping";
import { Country, State, City } from "country-state-city";
import CandidateFillModal from "src/app/components/CandidateFillModal";
import CourtPersonalDetailsFields, { CourtAddressItem } from "src/app/components/CourtPersonalDetailsFields";

type ServiceType = "identity" | "court_record" | "employment" | "education" | "interpol" | "passport" | "digital_address" | "rednotice_worldwide" | "saflii_court" | "saps_wanted" | "uk_court" | "malaysia_court" | "singapore_court" | "philippines_court";

const formatSetupUrl = (url?: string) => {
  if (!url) return "";
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && (url.includes("localhost") || url.includes("127.0.0.1"))) {
    const candidateDomain = process.env.NEXT_PUBLIC_CANDIDATE_PORTAL_URL || "https://candidate.verify.clusoinfolink.com";
    return url.replace(/^https?:\/\/[^\/]+/, candidateDomain);
  }
  return url;
};

/** Portaled success modal — always renders at document.body so fixed positioning is correct */
function SuccessModal({ crCreatedId, crCandidateName, onCreateAnother, onGoToSummary }: {
  crCreatedId: string;
  crCandidateName: string;
  onCreateAnother: () => void;
  onGoToSummary: () => void;
}) {
  useEffect(() => {
    // Scroll the page to top so the modal is fully visible
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Prevent background scrolling
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-md flex items-center justify-center px-3 sm:px-4 z-[99999] animate-fade-in overflow-y-auto">
      <div className="bg-white border border-[#eaf0e4] rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
        <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#E6F8F3] border border-[#A3EAD6] rounded-full flex items-center justify-center text-[#00684A] mb-1 sm:mb-2 animate-bounce-subtle">
            <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-[#00a877]" />
          </div>
          <h3 className="font-headline-md text-[#181d16] font-bold text-lg sm:text-xl">Search Initiated!</h3>
          <p className="font-body-sm text-[#475569] leading-relaxed text-xs sm:text-sm">
            Court record search has been started for <strong className="text-[#181d16] font-bold">{crCandidateName || "the candidate"}</strong>.
            The search is running in the background and will complete in 1–3 minutes.
          </p>

          <div className="w-full mt-1 sm:mt-2 p-3 sm:p-4 bg-[#f0f5ea]/25 border border-[#eaf0e4] rounded-xl sm:rounded-2xl text-left flex flex-col gap-2 shadow-2xs">
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-[#475569] font-semibold">Verification ID</span>
              <span className="font-mono text-[#181d16] font-bold">{crCreatedId}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-[#475569] font-semibold">Status</span>
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                Processing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#64748B]">
            <Sparkles className="w-3 h-3 text-[#00450e] shrink-0" />
            <span>You can check the results in Order Summary once the search completes.</span>
          </div>

          <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 w-full">
            <button
              type="button"
              onClick={onCreateAnother}
              className="flex-1 py-2.5 sm:py-3 border border-[#eaf0e4] rounded-xl font-semibold text-[11px] sm:text-xs text-[#334155] hover:bg-[#f6fbf0] transition-colors cursor-pointer bg-white"
            >
              Create Another
            </button>
            <button
              type="button"
              onClick={onGoToSummary}
              className="flex-1 py-2.5 sm:py-3 bg-[#181d16] text-white rounded-xl font-semibold text-[11px] sm:text-xs hover:bg-[#1E293B] transition-all cursor-pointer shadow-sm"
            >
              Go to Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterpolSearchLoadingModal({
  candidateName,
  timeRemaining,
  progress,
  stageIndex,
}: {
  candidateName: string;
  timeRemaining: number;
  progress: number;
  stageIndex: number;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const stages = [
    { title: "Initiating Secure Gateway", desc: "Connecting to Interpol NCB Global Gateway SSL Network..." },
    { title: "Member Bureau Scan", desc: "Querying 195+ Interpol National Central Bureau (NCB) databases..." },
    { title: "Red Notices Cross-Check", desc: "Cross-referencing Global Red Notices (Wanted Persons) database..." },
    { title: "Yellow Notices & SLTD Check", desc: "Scanning Yellow Notices (Missing Persons) & Stolen Travel Documents..." },
    { title: "Biometric & Risk Analysis", desc: "Evaluating candidate biometrics & birth city match probability..." },
    { title: "Certificate Generation", desc: "Finalizing Interpol security audit log & compliance certificate..." },
  ];

  const currentStage = stages[Math.min(stageIndex, stages.length - 1)];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col items-center text-center gap-6 animate-scale-in">
        
        {/* Glowing Background Radial */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        {/* Top Animated Radar Spinner */}
        <div className="relative flex items-center justify-center w-24 h-24 my-1">
          <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping opacity-75"></div>
          <div className="absolute inset-2 rounded-full border border-indigo-500/40 animate-pulse"></div>
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 text-white relative z-10">
            <Globe className="w-10 h-10 animate-spin" style={{ animationDuration: "6s" }} />
          </div>
        </div>

        {/* Header Text */}
        <div className="flex flex-col items-center gap-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            Interpol Global Database Check
          </div>
          <h3 className="font-extrabold text-white text-xl tracking-tight mt-1">
            Searching Interpol Databases...
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Candidate: <strong className="text-slate-200">{candidateName}</strong>
          </p>
        </div>

        {/* Progress Bar & Countdown */}
        <div className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-3 text-left relative z-10">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px]">
              Stage {stageIndex + 1} of 6: {currentStage.title}
            </span>
            <span className="font-mono font-bold text-slate-300">
              {timeRemaining}s remaining
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400 rounded-full transition-all duration-300 ease-out shadow-sm shadow-blue-500/50"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="text-[11px] text-slate-300 font-semibold leading-relaxed">
            {currentStage.desc}
          </p>
        </div>

        {/* Realtime Terminal Log Box */}
        <div className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-left font-mono text-[10.5px] text-slate-400 flex flex-col gap-1.5 h-20 overflow-hidden relative z-10 shadow-inner">
          <div className="flex items-center gap-1.5 text-slate-500 text-[9px] uppercase tracking-wider font-bold border-b border-slate-800/80 pb-1 mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>LIVE INTERPOL VERIFICATION LOG</span>
          </div>
          <div className="text-emerald-400 truncate">
            &gt; TLS 1.3 SECURE SESSION CONNECTED [INTERPOL NCB]
          </div>
          <div className="text-blue-300 truncate">
            &gt; {currentStage.desc}
          </div>
        </div>

        <p className="text-[10.5px] text-slate-500 font-medium">
          Please wait while the official international database search completes (59s). Do not close or refresh this tab.
        </p>
      </div>
    </div>
  );
}

function InterpolSuccessModal({ interpolCreatedId, candidateName, hasRecords, onCreateAnother, onGoToSummary }: {
  interpolCreatedId: string;
  candidateName: string;
  hasRecords: boolean;
  onCreateAnother: () => void;
  onGoToSummary: () => void;
}) {
  const [reportTimer, setReportTimer] = useState(10);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.style.overflow = "hidden";

    const interval = setInterval(() => {
      setReportTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-999 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl relative flex flex-col items-center gap-6 animate-scale-in">
        <div className={`relative w-20 h-20 flex items-center justify-center rounded-full border-2 ${
          hasRecords 
            ? "bg-rose-50 border-rose-200 text-rose-600" 
            : "bg-emerald-50 border-emerald-200 text-emerald-600"
        }`}>
          {hasRecords ? (
            <svg className="w-10 h-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.952 11.952 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )}
        </div>

        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-xl font-extrabold text-slate-800">
            {hasRecords ? "Attention Required" : "Verification Completed"}
          </h2>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-xs">
            Interpol database search completed for <strong className="text-slate-800">{candidateName}</strong>.
          </p>
          <div className={`mt-2 py-2 px-4 rounded-xl text-xs font-bold border ${
            hasRecords 
              ? "bg-rose-50 text-rose-700 border-rose-200" 
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}>
            {hasRecords ? "Potential matches or similarities found." : "0 records found. Clean record verified."}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            disabled={reportTimer > 0}
            onClick={() => {
              if (reportTimer === 0) {
                window.open(`/client/interpol-report?id=${interpolCreatedId}`, "_blank");
              }
            }}
            className={`w-full py-3 font-bold rounded-xl transition-all text-xs inline-flex items-center justify-center gap-1.5 ${
              reportTimer > 0
                ? "bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200"
                : "bg-[#181d16] hover:bg-[#1E293B] text-white cursor-pointer shadow-xs"
            }`}
          >
            {reportTimer > 0 ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>
                  {reportTimer >= 7
                    ? "Step 1/3: Scanning Interpol NCB..."
                    : reportTimer >= 3
                    ? "Step 2/3: Cross-Checking Notices..."
                    : "Step 3/3: Generating Certificate..."} ({reportTimer}s)
                </span>
              </>
            ) : (
              <>
                <span>View Verification Report</span>
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCreateAnother}
              className="py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white"
            >
              Check Another
            </button>
            <button
              onClick={onGoToSummary}
              className="py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white"
            >
              Summary Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RednoticeWorldwideSuccessModal({ rnwCreatedId, candidateName, hasRecords, onCreateAnother, onGoToSummary }: {
  rnwCreatedId: string;
  candidateName: string;
  hasRecords: boolean;
  onCreateAnother: () => void;
  onGoToSummary: () => void;
}) {
  const [reportTimer, setReportTimer] = useState(6);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.style.overflow = "hidden";
    const timer = setInterval(() => {
      setReportTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      document.body.style.overflow = "";
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-md flex items-center justify-center px-4 z-[99999] animate-fade-in">
      <div className="bg-white border border-[#eaf0e4] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-scale-up flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center text-rose-600 mb-1 animate-bounce-subtle">
          <Globe className="w-8 h-8 text-rose-600" />
        </div>
        
        <div>
          <h3 className="font-bold text-slate-800 text-lg sm:text-xl">Red Notice Worldwide Check Initiated!</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global search across all 196 member countries completed for <strong className="text-slate-800 font-bold">{candidateName}</strong>.
          </p>
          <div className={`mt-2 py-2 px-4 rounded-xl text-xs font-bold border ${
            hasRecords 
              ? "bg-rose-50 text-rose-700 border-rose-200" 
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}>
            {hasRecords ? "Potential similarity matches found in global Red Notice database." : "0 active notices found. Clean worldwide record verified."}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            disabled={reportTimer > 0}
            onClick={() => {
              if (reportTimer === 0) {
                window.open(`/client/rednotice-worldwide-report?id=${rnwCreatedId}`, "_blank");
              }
            }}
            className={`w-full py-3 font-bold rounded-xl transition-all text-xs inline-flex items-center justify-center gap-1.5 ${
              reportTimer > 0
                ? "bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200"
                : "bg-[#181d16] hover:bg-[#1E293B] text-white cursor-pointer shadow-xs"
            }`}
          >
            {reportTimer > 0 ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                <span>
                  {reportTimer >= 4
                    ? "Step 1/2: Querying Global Red Notices..."
                    : "Step 2/2: Generating Verification Certificate..."} ({reportTimer}s)
                </span>
              </>
            ) : (
              <>
                <span>View Worldwide Verification Report</span>
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCreateAnother}
              className="py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white"
            >
              Check Another
            </button>
            <button
              onClick={onGoToSummary}
              className="py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white"
            >
              Summary Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SafliiCourtSuccessModal({ sacCreatedId, sacCandidateName, onCreateAnother, onGoToSummary }: {
  sacCreatedId: string;
  sacCandidateName: string;
  onCreateAnother: () => void;
  onGoToSummary: () => void;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-md flex items-center justify-center px-3 sm:px-4 z-[99999] animate-fade-in overflow-y-auto">
      <div className="bg-white border border-[#eaf0e4] rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
        <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#E6F8F3] border border-[#A3EAD6] rounded-full flex items-center justify-center text-[#00684A] mb-1 sm:mb-2 animate-bounce-subtle">
            <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-[#00a877]" />
          </div>
          <h3 className="font-headline-md text-[#181d16] font-bold text-lg sm:text-xl">Search Initiated!</h3>
          <p className="font-body-sm text-[#475569] leading-relaxed text-xs sm:text-sm">
            South African court record search has been started for <strong className="text-[#181d16] font-bold">{sacCandidateName || "the candidate"}</strong>.
            The search is running in the background and will complete shortly.
          </p>

          <div className="w-full mt-1 sm:mt-2 p-3 sm:p-4 bg-[#f0f5ea]/25 border border-[#eaf0e4] rounded-xl sm:rounded-2xl text-left flex flex-col gap-2 shadow-2xs">
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-[#475569] font-semibold">Verification ID</span>
              <span className="font-mono text-[#181d16] font-bold">{sacCreatedId}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-[#475569] font-semibold">Status</span>
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                Processing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#64748B]">
            <Sparkles className="w-3 h-3 text-[#00450e] shrink-0" />
            <span>You can review the official SA court report immediately or track in Order Summary.</span>
          </div>

          <div className="flex flex-col gap-2.5 w-full mt-1">
            <button
              onClick={() => {
                window.open(`/client/saflii-court-report?id=${sacCreatedId}`, "_blank");
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-900 to-slate-900 hover:from-emerald-950 hover:to-slate-950 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span>View Official SA Court Report</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
              <button
                type="button"
                onClick={onCreateAnother}
                className="py-2.5 sm:py-3 border border-[#eaf0e4] rounded-xl font-semibold text-[11px] sm:text-xs text-[#334155] hover:bg-[#f6fbf0] transition-colors cursor-pointer bg-white"
              >
                Create Another
              </button>
              <button
                type="button"
                onClick={onGoToSummary}
                className="py-2.5 sm:py-3 bg-[#181d16] text-white rounded-xl font-semibold text-[11px] sm:text-xs hover:bg-[#1E293B] transition-all cursor-pointer shadow-sm"
              >
                Go to Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UkCourtSuccessModal({
  ukcCreatedId,
  ukcCandidateName,
  onCreateAnother,
  onGoToSummary,
}: {
  ukcCreatedId: string;
  ukcCandidateName: string;
  onCreateAnother: () => void;
  onGoToSummary: () => void;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-md flex items-center justify-center px-3 sm:px-4 z-[99999] animate-fade-in overflow-y-auto">
      <div className="bg-white border border-[#eaf0e4] rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
        <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 border border-indigo-200 rounded-full flex items-center justify-center text-indigo-700 mb-1 sm:mb-2 animate-bounce-subtle">
            <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-700" />
          </div>
          <h3 className="font-headline-md text-[#181d16] font-bold text-lg sm:text-xl">UK Court Search Initiated!</h3>
          <p className="font-body-sm text-[#475569] leading-relaxed text-xs sm:text-sm">
            Courts and Tribunals Judiciary search has been initiated for <strong className="text-[#181d16] font-bold">{ukcCandidateName || "the candidate"}</strong>.
            The search is querying the official UK judgments database in the background.
          </p>

          <div className="w-full mt-1 sm:mt-2 p-3 sm:p-4 bg-[#f0f5ea]/25 border border-[#eaf0e4] rounded-xl sm:rounded-2xl text-left flex flex-col gap-2 shadow-2xs">
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-[#475569] font-semibold">Verification ID</span>
              <span className="font-mono text-[#181d16] font-bold">{ukcCreatedId}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-[#475569] font-semibold">Status</span>
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                Processing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#64748B]">
            <Sparkles className="w-3 h-3 text-[#00450e] shrink-0" />
            <span>You can review the official judgments report certificate immediately or track in Order Summary.</span>
          </div>

          <div className="flex flex-col gap-2.5 w-full mt-1">
            <button
              onClick={() => {
                window.open(`/client/uk-court-report?id=${ukcCreatedId}`, "_blank");
              }}
              className="w-full py-3 bg-gradient-to-r from-indigo-900 to-slate-900 hover:from-indigo-950 hover:to-slate-950 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span>View Official UK Court Report</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
              <button
                type="button"
                onClick={onCreateAnother}
                className="py-2.5 sm:py-3 border border-[#eaf0e4] rounded-xl font-semibold text-[11px] sm:text-xs text-[#334155] hover:bg-[#f6fbf0] transition-colors cursor-pointer bg-white"
              >
                Check Another
              </button>
              <button
                type="button"
                onClick={onGoToSummary}
                className="py-2.5 sm:py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white"
              >
                Go to Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MalaysiaCourtSuccessModal({
  mycCreatedId,
  mycCandidateName,
  onCreateAnother,
  onGoToSummary,
}: {
  mycCreatedId: string;
  mycCandidateName: string;
  onCreateAnother: () => void;
  onGoToSummary: () => void;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-md flex items-center justify-center px-3 sm:px-4 z-[99999] animate-fade-in overflow-y-auto">
      <div className="bg-white border border-[#eaf0e4] rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
        <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-700 mb-1 sm:mb-2 animate-bounce-subtle">
            <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-700" />
          </div>
          <h3 className="font-headline-md text-[#181d16] font-bold text-lg sm:text-xl">Malaysia Court Search Initiated!</h3>
          <p className="font-body-sm text-[#475569] leading-relaxed text-xs sm:text-sm">
            Portal eJudgment search has been initiated for <strong className="text-[#181d16] font-bold">{mycCandidateName || "the candidate"}</strong>.
            The search is querying the official Mahkamah Persekutuan Malaysia database in the background.
          </p>

          <div className="w-full mt-1 sm:mt-2 p-3 sm:p-4 bg-[#f0f5ea]/25 border border-[#eaf0e4] rounded-xl sm:rounded-2xl text-left flex flex-col gap-2 shadow-2xs">
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-[#475569] font-semibold">Verification ID</span>
              <span className="font-mono text-[#181d16] font-bold">{mycCreatedId}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-[#475569] font-semibold">Status</span>
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                Processing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#64748B]">
            <Sparkles className="w-3 h-3 text-[#00450e] shrink-0" />
            <span>You can review the official judgments report certificate immediately or track in Order Summary.</span>
          </div>

          <div className="flex flex-col gap-2.5 w-full mt-1">
            <button
              onClick={() => {
                window.open(`/client/malaysia-court-report?id=${mycCreatedId}`, "_blank");
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 hover:from-emerald-900 hover:to-slate-950 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span>View Official Malaysia Court Report</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
              <button
                type="button"
                onClick={onCreateAnother}
                className="py-2.5 sm:py-3 border border-[#eaf0e4] rounded-xl font-semibold text-[11px] sm:text-xs text-[#334155] hover:bg-[#f6fbf0] transition-colors cursor-pointer bg-white"
              >
                Check Another
              </button>
              <button
                type="button"
                onClick={onGoToSummary}
                className="py-2.5 sm:py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white"
              >
                Go to Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SingaporeCourtSuccessModal({
  sgcCreatedId,
  sgcCandidateName,
  onCreateAnother,
  onGoToSummary,
}: {
  sgcCreatedId: string;
  sgcCandidateName: string;
  onCreateAnother: () => void;
  onGoToSummary: () => void;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-md flex items-center justify-center px-3 sm:px-4 z-[99999] animate-fade-in overflow-y-auto">
      <div className="bg-white border border-[#eaf0e4] rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
        <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center text-rose-700 mb-1 sm:mb-2 animate-bounce-subtle">
            <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-rose-700" />
          </div>
          <h3 className="font-headline-md text-[#181d16] font-bold text-lg sm:text-xl">Singapore Court Search Initiated!</h3>
          <p className="font-body-sm text-[#475569] leading-relaxed text-xs sm:text-sm">
            Singapore judicial hearing registries search has been initiated for <strong className="text-[#181d16] font-bold">{sgcCandidateName || "the candidate"}</strong>.
            Querying State Courts and Supreme Court registries in the background.
          </p>

          <div className="w-full mt-1 sm:mt-2 p-3 sm:p-4 bg-[#f0f5ea]/25 border border-[#eaf0e4] rounded-xl sm:rounded-2xl text-left flex flex-col gap-2 shadow-2xs">
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-[#475569] font-semibold">Verification ID</span>
              <span className="font-mono text-[#181d16] font-bold">{sgcCreatedId}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-[#475569] font-semibold">Status</span>
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                Processing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#64748B]">
            <Sparkles className="w-3 h-3 text-[#00450e] shrink-0" />
            <span>You can review the official Singapore court report certificate immediately or track in Order Summary.</span>
          </div>

          <div className="flex flex-col gap-2.5 w-full mt-1">
            <button
              onClick={() => {
                window.open(`/client/singapore-court-report?id=${sgcCreatedId}`, "_blank");
              }}
              className="w-full py-3 bg-gradient-to-r from-rose-900 to-slate-900 hover:from-rose-950 hover:to-slate-950 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span>View Official Singapore Court Report</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
              <button
                type="button"
                onClick={onCreateAnother}
                className="py-2.5 sm:py-3 border border-[#eaf0e4] rounded-xl font-semibold text-[11px] sm:text-xs text-[#334155] hover:bg-[#f6fbf0] transition-colors cursor-pointer bg-white"
              >
                Check Another
              </button>
              <button
                type="button"
                onClick={onGoToSummary}
                className="py-2.5 sm:py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white"
              >
                Go to Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhilippinesCourtSuccessModal({
  phcCreatedId,
  phcCandidateName,
  onCreateAnother,
  onGoToSummary,
}: {
  phcCreatedId: string;
  phcCandidateName: string;
  onCreateAnother: () => void;
  onGoToSummary: () => void;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-md flex items-center justify-center px-3 sm:px-4 z-[99999] animate-fade-in overflow-y-auto">
      <div className="bg-white border border-[#eaf0e4] rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
        <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-amber-700 mb-1 sm:mb-2 animate-bounce-subtle">
            <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-amber-700" />
          </div>
          <h3 className="font-headline-md text-[#181d16] font-bold text-lg sm:text-xl">Philippines Court Search Initiated!</h3>
          <p className="font-body-sm text-[#475569] leading-relaxed text-xs sm:text-sm">
            Philippines judicial case docket check has been initiated for <strong className="text-[#181d16] font-bold">{phcCandidateName || "the candidate"}</strong>.
            Querying Supreme Court and Regional Trial Court records across target provinces.
          </p>

          <div className="w-full mt-1 sm:mt-2 p-3 sm:p-4 bg-[#f0f5ea]/25 border border-[#eaf0e4] rounded-xl sm:rounded-2xl text-left flex flex-col gap-2 shadow-2xs">
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-[#475569] font-semibold">Verification ID</span>
              <span className="font-mono text-[#181d16] font-bold">{phcCreatedId}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-[#475569] font-semibold">Status</span>
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                Processing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#64748B]">
            <Sparkles className="w-3 h-3 text-[#00450e] shrink-0" />
            <span>You can review the official Philippines court report certificate immediately or track in Order Summary.</span>
          </div>

          <div className="flex flex-col gap-2.5 w-full mt-1">
            <button
              onClick={() => {
                window.open(`/client/philippines-court-report?id=${phcCreatedId}`, "_blank");
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-900 to-slate-900 hover:from-amber-950 hover:to-slate-950 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span>View Official Philippines Court Report</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
              <button
                type="button"
                onClick={onCreateAnother}
                className="py-2.5 sm:py-3 border border-[#eaf0e4] rounded-xl font-semibold text-[11px] sm:text-xs text-[#334155] hover:bg-[#f6fbf0] transition-colors cursor-pointer bg-white"
              >
                Check Another
              </button>
              <button
                type="button"
                onClick={onGoToSummary}
                className="py-2.5 sm:py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white"
              >
                Go to Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SapsWantedSuccessModal({
  sapsCreatedId,
  candidateName,
  isHalted,
  hasRecords,
  onCreateAnother,
  onGoToSummary,
}: {
  sapsCreatedId: string;
  candidateName: string;
  isHalted: boolean;
  hasRecords: boolean;
  onCreateAnother: () => void;
  onGoToSummary: () => void;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-md flex items-center justify-center px-4 z-[99999] animate-fade-in">
      <div className="bg-white border border-[#eaf0e4] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-scale-up flex flex-col items-center text-center gap-4">
        {isHalted ? (
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 mb-1 animate-bounce-subtle">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 mb-1 animate-bounce-subtle">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
        )}

        <div>
          <h3 className="font-bold text-slate-800 text-lg sm:text-xl">
            {isHalted ? "Verification Flagged for Review" : "SAPS Wanted Check Completed!"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            South African Police Service wanted check processed for{" "}
            <strong className="text-slate-800 font-bold">{candidateName}</strong>.
          </p>

          <div
            className={`mt-3 py-2.5 px-4 rounded-xl text-xs font-bold border leading-relaxed ${
              isHalted
                ? "bg-amber-50 text-amber-900 border-amber-200 text-left"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {isHalted ? (
              <div className="flex flex-col gap-1">
                <span className="font-extrabold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  Halted — Verifying with attorney
                </span>
                <span className="font-normal text-[11px] text-amber-900/80 leading-normal">
                  A similarity match was detected on the SAPS Wanted registry. In accordance with legal review policy, automatic release is halted while our attorney verifies the identification. Once resolved by admin, the finalized report will be released.
                </span>
              </div>
            ) : (
              "No record matches found in South African Police Service (SAPS) Wanted Persons database. Clean record verified."
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-full mt-1">
          {!isHalted ? (
            <button
              onClick={() => {
                window.open(`/client/saps-wanted-report?id=${sapsCreatedId}`, "_blank");
              }}
              className="w-full py-3 font-bold rounded-xl transition-all text-xs inline-flex items-center justify-center gap-1.5 bg-[#181d16] hover:bg-[#1E293B] text-white cursor-pointer shadow-xs"
            >
              <span>View Official SAPS Report</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onGoToSummary}
              className="w-full py-3 font-bold rounded-xl transition-all text-xs inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs"
            >
              <span>Go to Order Summary (Track Status)</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCreateAnother}
              className="py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white"
            >
              Check Another
            </button>
            <button
              onClick={onGoToSummary}
              className="py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white"
            >
              Go to Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PassportSuccessModal({ passportCreatedId, candidateName, statusMessage, onCreateAnother, onGoToSummary }: {
  passportCreatedId: string;
  candidateName: string;
  statusMessage?: string;
  onCreateAnother: () => void;
  onGoToSummary: () => void;
}) {
  const [reportTimer, setReportTimer] = useState(5);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.style.overflow = "hidden";

    const interval = setInterval(() => {
      setReportTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl relative flex flex-col items-center gap-6 animate-scale-in">
        <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-2 bg-emerald-50 border-emerald-200 text-emerald-600">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.952 11.952 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-xl font-extrabold text-slate-800">
            Passport Verification Completed
          </h2>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-xs">
            Official Passport Seva status retrieved for <strong className="text-slate-800">{candidateName}</strong>.
          </p>
          <div className="mt-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 leading-snug">
            {statusMessage || "Status Retrieved & Saved to Database"}
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            Verification ID: {passportCreatedId}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            disabled={reportTimer > 0}
            onClick={() => {
              if (reportTimer === 0) {
                window.open(`/client/passport-report?id=${passportCreatedId}`, "_blank");
              }
            }}
            className={`w-full py-3 font-bold rounded-xl transition-all text-xs inline-flex items-center justify-center gap-1.5 ${
              reportTimer > 0
                ? "bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200"
                : "bg-[#181d16] hover:bg-[#1E293B] text-white cursor-pointer shadow-xs"
            }`}
          >
            {reportTimer > 0 ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                <span>
                  {reportTimer >= 4
                    ? "Step 1/3: Connecting Registry..."
                    : reportTimer >= 2
                    ? "Step 2/3: Auditing Database..."
                    : "Step 3/3: Generating Certificate..."} ({reportTimer}s)
                </span>
              </>
            ) : (
              <>
                <span>View Verification Report</span>
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCreateAnother}
              className="py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white"
            >
              Check Another
            </button>
            <button
              onClick={onGoToSummary}
              className="py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs bg-white"
            >
              Order Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowIllustration({ activeService }: { activeService: ServiceType }) {
  let primaryColor = "#4f46e5";
  let secondaryColor = "#10b981";
  let dbLabel = "Data Registries";
  let clientLabel = "Initiate Request";
  let candidateLabel = "Candidate Input";
  
  if (activeService === "identity") {
    primaryColor = "#059669";
    secondaryColor = "#10b981";
    dbLabel = "DigiLocker / UIDAI";
    clientLabel = "Initiate Request";
    candidateLabel = "OTP Consent";
  } else if (activeService === "court_record") {
    primaryColor = "#d97706";
    secondaryColor = "#f59e0b";
    dbLabel = "eCourts Database";
    clientLabel = "Initiate Request";
    candidateLabel = "Address Records";
  } else if (activeService === "employment") {
    primaryColor = "#2563eb";
    secondaryColor = "#3b82f6";
    dbLabel = "Employer Inquiries";
    clientLabel = "Initiate Request";
    candidateLabel = "Tenure Details";
  } else if (activeService === "education") {
    primaryColor = "#7c3aed";
    secondaryColor = "#8b5cf6";
    dbLabel = "Registrar Records";
    clientLabel = "Initiate Request";
    candidateLabel = "Degree Uploads";
  } else if (activeService === "interpol") {
    primaryColor = "#1d4ed8";
    secondaryColor = "#4f46e5";
    dbLabel = "Red & Yellow DB";
    clientLabel = "Initiate Search";
    candidateLabel = "Notice Match Check";
  } else if (activeService === "rednotice_worldwide") {
    primaryColor = "#e11d48";
    secondaryColor = "#be123c";
    dbLabel = "Global Red Notices";
    clientLabel = "Initiate Search";
    candidateLabel = "Global Match Check";
  } else if (activeService === "passport") {
    primaryColor = "#dc2626";
    secondaryColor = "#ef4444";
    dbLabel = "Passport Registry";
    clientLabel = "Initiate Lookup";
    candidateLabel = "File Number & DOB";
  } else if (activeService === "digital_address") {
    primaryColor = "#0891b2";
    secondaryColor = "#06b6d4";
    dbLabel = "Geo-Tagged DB";
    clientLabel = "Initiate Request";
    candidateLabel = "Photo & Location";
  } else if (activeService === "saps_wanted") {
    primaryColor = "#1e3a8a";
    secondaryColor = "#2563eb";
    dbLabel = "SAPS Police DB";
    clientLabel = "Initiate Check";
    candidateLabel = "SAPS Crime Registry";
  } else if (activeService === "saflii_court") {
    primaryColor = "#047857";
    secondaryColor = "#10b981";
    dbLabel = "SAFLII Registry";
    clientLabel = "Initiate Search";
    candidateLabel = "Target Provinces";
  } else if (activeService === "uk_court") {
    primaryColor = "#312e81";
    secondaryColor = "#4f46e5";
    dbLabel = "Judiciary UK DB";
    clientLabel = "Initiate Check";
    candidateLabel = "UK Judgments DB";
  } else if (activeService === "malaysia_court") {
    primaryColor = "#065f46";
    secondaryColor = "#059669";
    dbLabel = "Portal eJudgment";
    clientLabel = "Initiate Search";
    candidateLabel = "MY Court Records";
  } else if (activeService === "singapore_court") {
    primaryColor = "#be123c";
    secondaryColor = "#fb7185";
    dbLabel = "SG Courts Hearing";
    clientLabel = "Initiate Search";
    candidateLabel = "Hearing & Addresses";
  } else if (activeService === "philippines_court") {
    primaryColor = "#b45309";
    secondaryColor = "#f59e0b";
    dbLabel = "PH Court Docket";
    clientLabel = "Initiate Search";
    candidateLabel = "Station & Provinces";
  }

  return (
    <div className="w-full flex justify-center py-6 sm:py-8 bg-slate-50 border border-slate-100 rounded-3xl mb-1 relative overflow-hidden group items-center">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-200/15 rounded-full blur-2xl pointer-events-none" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flowDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .flow-line {
          stroke-dasharray: 6 4;
          animation: flowDash 0.9s linear infinite;
        }
        @keyframes rotateOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateOrbitRev {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .orbit-ring {
          transform-origin: 200px 130px;
          animation: rotateOrbit 20s linear infinite;
        }
        .orbit-ring-rev {
          transform-origin: 200px 130px;
          animation: rotateOrbitRev 15s linear infinite;
        }
        @keyframes pulseGlow {
          0%, 100% {
            filter: drop-shadow(0 0 2px var(--glow-color, rgba(79, 70, 229, 0.35)));
          }
          50% {
            filter: drop-shadow(0 0 8px var(--glow-color, rgba(79, 70, 229, 0.7)));
          }
        }
        .pulse-shield {
          animation: pulseGlow 2.5s ease-in-out infinite;
        }
      `}} />

      <svg 
        width="100%" 
        height="240" 
        viewBox="0 0 400 260" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="max-w-[380px] select-none"
        style={{ '--glow-color': primaryColor } as any}
      >
        <defs>
          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.05" />
          </filter>
        </defs>

        {/* Dynamic Curved Flow Paths */}
        {/* Flow 1: Client Card -> Candidate Card */}
        <path d="M 145 60 C 180 35, 220 35, 255 60" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 145 60 C 180 35, 220 35, 255 60" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" className="flow-line" />

        {/* Flow 2: Candidate Card -> Central Engine */}
        <path d="M 275 90 C 260 108, 245 120, 225 125" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 275 90 C 260 108, 245 120, 225 125" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" className="flow-line" />

        {/* Flow 3: Central Engine -> DB cylinder */}
        <path d="M 225 137 C 240 150, 250 165, 265 180" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 225 137 C 240 150, 250 165, 265 180" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" className="flow-line" />

        {/* Flow 4: DB cylinder -> Central Engine */}
        <path d="M 260 195 C 240 195, 220 180, 200 155" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 260 195 C 240 195, 220 180, 200 155" stroke={secondaryColor} strokeWidth="2.2" strokeLinecap="round" className="flow-line" style={{ animationDirection: 'reverse' }} />

        {/* Flow 5: Central Engine -> Report Badge */}
        <path d="M 175 137 C 160 150, 150 165, 135 180" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 175 137 C 160 150, 150 165, 135 180" stroke={secondaryColor} strokeWidth="2.2" strokeLinecap="round" className="flow-line" style={{ animationDirection: 'reverse' }} />

        {/* Flow 6: Report Badge -> Client Card */}
        <path d="M 85 175 C 70 145, 70 118, 85 95" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 85 175 C 70 145, 70 118, 85 95" stroke={secondaryColor} strokeWidth="2.2" strokeLinecap="round" className="flow-line" style={{ animationDirection: 'reverse' }} />

        {/* Node 1: Client Card (Top Left) */}
        <g transform="translate(25, 25)" filter="url(#cardShadow)">
          <rect width="120" height="70" rx="16" fill="white" stroke="#f1f5f9" strokeWidth="1.5" />
          <circle cx="60" cy="26" r="11" fill="#eff6ff" />
          <path d="M 55 24 L 59 28 L 66 21" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="52" y="11" width="16" height="3" rx="1.5" fill={primaryColor} opacity="0.4" />
          <text x="60" y="54" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="extrabold" fontFamily="sans-serif">{clientLabel}</text>
        </g>

        {/* Node 2: Candidate Card (Top Right) */}
        <g transform="translate(255, 25)" filter="url(#cardShadow)">
          <rect width="120" height="70" rx="16" fill="white" stroke="#f1f5f9" strokeWidth="1.5" />
          <circle cx="60" cy="26" r="11" fill="#f0fdf4" />
          <circle cx="60" cy="23" r="4.5" fill={primaryColor} />
          <path d="M 52 33 C 52 29.5, 68 29.5, 68 33 Z" fill={primaryColor} />
          <rect x="52" y="11" width="16" height="3" rx="1.5" fill={primaryColor} opacity="0.4" />
          <text x="60" y="54" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="extrabold" fontFamily="sans-serif">{candidateLabel}</text>
        </g>

        {/* Node 3: Central Engine Hub */}
        <g>
          {/* Rotating Dotted Outer Ring */}
          <circle cx="200" cy="130" r="42" stroke={primaryColor} strokeWidth="1.5" strokeDasharray="5 7" opacity="0.3" className="orbit-ring" />
          {/* Rotating Dotted Inner Ring */}
          <circle cx="200" cy="130" r="32" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="3 5" opacity="0.25" className="orbit-ring-rev" />
          {/* Glowing Base */}
          <circle cx="200" cy="130" r="24" fill="white" stroke="#f1f5f9" strokeWidth="1" filter="url(#cardShadow)" />
          {/* Glowing Shield */}
          <g className="pulse-shield" transform="translate(186, 116)">
            <path d="M 14 0 C 23 2, 25 5, 25 12 C 25 21, 14 27, 14 27 C 14 27, 3 21, 3 12 C 3 5, 5 2, 14 0 Z" fill={primaryColor} />
            <path d="M 10 13 L 13 16 L 19 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>

        {/* Node 4: DB Cylinders (Bottom Right) */}
        <g transform="translate(255, 165)" filter="url(#cardShadow)">
          <rect width="120" height="70" rx="16" fill="white" stroke="#f1f5f9" strokeWidth="1.5" />
          <circle cx="60" cy="26" r="11" fill="#faf5ff" />
          {/* Stacked database disks */}
          <ellipse cx="60" cy="21" rx="7" ry="2.2" fill="none" stroke={primaryColor} strokeWidth="1.5" />
          <path d="M 53 21 L 53 26 A 7 2.2 0 0 0 67 26 L 67 21" fill="none" stroke={primaryColor} strokeWidth="1.5" />
          <path d="M 53 26 L 53 31 A 7 2.2 0 0 0 67 31 L 67 26" fill="none" stroke={primaryColor} strokeWidth="1.5" />
          <circle cx="60" cy="26" r="1.5" fill="#10b981" />
          <text x="60" y="54" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="extrabold" fontFamily="sans-serif">{dbLabel}</text>
        </g>

        {/* Node 5: Success Report Card (Bottom Left) */}
        <g transform="translate(25, 165)" filter="url(#cardShadow)">
          <rect width="120" height="70" rx="16" fill="white" stroke="#f1f5f9" strokeWidth="1.5" />
          <circle cx="60" cy="26" r="11" fill="#fff7ed" />
          {/* File checklist report icon */}
          <path d="M 56 19 L 64 19 L 64 33 L 56 33 Z" fill="none" stroke={secondaryColor} strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="59" y1="24" x2="62" y2="24" stroke={secondaryColor} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="59" y1="28" x2="61" y2="28" stroke={secondaryColor} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="65" cy="31" r="3" fill="#10b981" />
          <path d="M 64 31 L 65 32 L 66.5 30" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          <text x="60" y="54" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="extrabold" fontFamily="sans-serif">Verified Report</text>
        </g>
      </svg>
    </div>
  );
}
function FlowDiagram({ title, activeService }: { title: string; activeService: ServiceType }) {
  let colorTheme = "linear-gradient(to right, #4f46e5, #6366f1)";
  if (activeService === "identity") colorTheme = "linear-gradient(to right, #059669, #10b981)";
  else if (activeService === "court_record") colorTheme = "linear-gradient(to right, #d97706, #f59e0b)";
  else if (activeService === "employment") colorTheme = "linear-gradient(to right, #2563eb, #3b82f6)";
  else if (activeService === "education") colorTheme = "linear-gradient(to right, #7c3aed, #8b5cf6)";
  else if (activeService === "interpol") colorTheme = "linear-gradient(to right, #1d4ed8, #4f46e5)";
  else if (activeService === "passport") colorTheme = "linear-gradient(to right, #4338ca, #6366f1)";
  else if (activeService === "digital_address") colorTheme = "linear-gradient(to right, #0891b2, #06b6d4)";
  else if (activeService === "saps_wanted") colorTheme = "linear-gradient(to right, #1e3a8a, #2563eb)";
  else if (activeService === "saflii_court") colorTheme = "linear-gradient(to right, #047857, #10b981)";
  else if (activeService === "uk_court") colorTheme = "linear-gradient(to right, #312e81, #4f46e5)";
  else if (activeService === "malaysia_court") colorTheme = "linear-gradient(to right, #065f46, #059669)";
  else if (activeService === "singapore_court") colorTheme = "linear-gradient(to right, #be123c, #fb7185)";
  else if (activeService === "philippines_court") colorTheme = "linear-gradient(to right, #b45309, #f59e0b)";

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md w-full">
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: colorTheme }}></div>
      <div className="flex flex-col gap-4 mt-1">
        <div>
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-700 animate-pulse" />
            <span>{title}</span>
          </h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">
            Visual data-flow path from input to verified verification report.
          </p>
        </div>

        {/* Dynamic Modern Vector Data Flow Illustration */}
        <FlowIllustration activeService={activeService} />
      </div>
    </div>
  );
}

export default function IdentityVerification() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { addVerification, addEmploymentVerification, addEducationVerification, addCourtRecordVerification, addInterpolVerification, addRednoticeWorldwideVerification, addSafliiCourtVerification, addSapsWantedVerification, addUkCourtVerification, addMalaysiaCourtVerification, addSingaporeCourtVerification, addPhilippinesCourtVerification, addPassportVerification, addDigitalAddressVerification, settings, removeRecentRequestingOrg, organisation } = usePortal();

  const [activeFillModal, setActiveFillModal] = useState<{
    isOpen: boolean;
    id: string;
    type: "employment" | "education";
    name?: string;
    initialData?: any;
  } | null>(null);

  // ─── Interpol Check States ───
  const [interpolCandidateName, setInterpolCandidateName] = useState("");
  const [interpolCandidateDob, setInterpolCandidateDob] = useState("");
  const [interpolBirthCity, setInterpolBirthCity] = useState("");
  const [interpolRequestingOrgName, setInterpolRequestingOrgName] = useState("");
  const [interpolShowOrgDropdown, setInterpolShowOrgDropdown] = useState(false);
  const [interpolSuccessMsg, setInterpolSuccessMsg] = useState("");
  const [interpolErrorMsg, setInterpolErrorMsg] = useState("");
  const [interpolSubmitting, setInterpolSubmitting] = useState(false);
  const [interpolCreatedId, setInterpolCreatedId] = useState<string | null>(null);
  const [interpolIdProofFile, setInterpolIdProofFile] = useState<string | null>(null);
  const [interpolIdProofFileName, setInterpolIdProofFileName] = useState("");

  // ─── Red Notice Worldwide Check States ───
  const [rnwCandidateName, setRnwCandidateName] = useState("");
  const [rnwCandidateDob, setRnwCandidateDob] = useState("");
  const [rnwBirthCity, setRnwBirthCity] = useState("");
  const [rnwRequestingOrgName, setRnwRequestingOrgName] = useState("");
  const [rnwShowOrgDropdown, setRnwShowOrgDropdown] = useState(false);
  const [rnwSuccessMsg, setRnwSuccessMsg] = useState("");
  const [rnwErrorMsg, setRnwErrorMsg] = useState("");
  const [rnwSubmitting, setRnwSubmitting] = useState(false);
  const [rnwCreatedId, setRnwCreatedId] = useState<string | null>(null);
  const [rnwIdProofFile, setRnwIdProofFile] = useState<string | null>(null);
  const [rnwIdProofFileName, setRnwIdProofFileName] = useState("");

  // ─── South African Court Check States ───
  const [sacCandidateName, setSacCandidateName] = useState("");
  const [sacCandidateDob, setSacCandidateDob] = useState("");
  const [sacBirthCity, setSacBirthCity] = useState("");
  const [sacFatherName, setSacFatherName] = useState("");
  const [sacMotherName, setSacMotherName] = useState("");
  const [sacGender, setSacGender] = useState("Not required");
  const [sacIsMarried, setSacIsMarried] = useState(false);
  const [sacHusbandName, setSacHusbandName] = useState("");
  const [sacIdProofType, setSacIdProofType] = useState("");
  const [sacIdProofNumber, setSacIdProofNumber] = useState("");
  const [sacAddresses, setSacAddresses] = useState<CourtAddressItem[]>([
    { address: "", city: "", state: "", stateCode: "", districtCode: "", country: "South Africa", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }
  ]);
  const [sacRequestingOrgName, setSacRequestingOrgName] = useState("");
  const [sacShowOrgDropdown, setSacShowOrgDropdown] = useState(false);
  const [sacSuccessMsg, setSacSuccessMsg] = useState("");
  const [sacErrorMsg, setSacErrorMsg] = useState("");
  const [sacSubmitting, setSacSubmitting] = useState(false);
  const [sacCreatedId, setSacCreatedId] = useState<string | null>(null);
  const [sacIdProofFile, setSacIdProofFile] = useState<string | null>(null);
  const [sacIdProofFileName, setSacIdProofFileName] = useState("");

  // ─── SAPS Wanted Check States ───
  const [sapsCandidateName, setSapsCandidateName] = useState("");
  const [sapsCandidateForename, setSapsCandidateForename] = useState("");
  const [sapsCandidateSurname, setSapsCandidateSurname] = useState("");
  const [sapsCandidateDob, setSapsCandidateDob] = useState("");
  const [sapsCandidateIdNumber, setSapsCandidateIdNumber] = useState("");
  const [sapsProvinceCity, setSapsProvinceCity] = useState("");
  const [sapsRequestingOrgName, setSapsRequestingOrgName] = useState("");
  const [sapsShowOrgDropdown, setSapsShowOrgDropdown] = useState(false);
  const [sapsSuccessMsg, setSapsSuccessMsg] = useState("");
  const [sapsErrorMsg, setSapsErrorMsg] = useState("");
  const [sapsSubmitting, setSapsSubmitting] = useState(false);
  const [sapsCreatedId, setSapsCreatedId] = useState<string | null>(null);
  const [sapsIsHalted, setSapsIsHalted] = useState(false);
  const [sapsHasRecords, setSapsHasRecords] = useState(false);
  const [sapsIdProofFile, setSapsIdProofFile] = useState<string | null>(null);
  const [sapsIdProofFileName, setSapsIdProofFileName] = useState("");

  // ─── UK Court Check States ───
  const [ukcCandidateName, setUkcCandidateName] = useState("");
  const [ukcCandidateDob, setUkcCandidateDob] = useState("");
  const [ukcBirthCity, setUkcBirthCity] = useState("");
  const [ukcFatherName, setUkcFatherName] = useState("");
  const [ukcMotherName, setUkcMotherName] = useState("");
  const [ukcGender, setUkcGender] = useState("Not required");
  const [ukcIsMarried, setUkcIsMarried] = useState(false);
  const [ukcHusbandName, setUkcHusbandName] = useState("");
  const [ukcIdProofType, setUkcIdProofType] = useState("");
  const [ukcIdProofNumber, setUkcIdProofNumber] = useState("");
  const [ukcAddresses, setUkcAddresses] = useState<CourtAddressItem[]>([
    { address: "", city: "", state: "", stateCode: "", districtCode: "", country: "United Kingdom", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }
  ]);
  const [ukcJudgmentType, setUkcJudgmentType] = useState("");
  const [ukcJurisdiction, setUkcJurisdiction] = useState("All UK Jurisdictions");
  const [ukcRequestingOrgName, setUkcRequestingOrgName] = useState("");
  const [ukcShowOrgDropdown, setUkcShowOrgDropdown] = useState(false);
  const [ukcSuccessMsg, setUkcSuccessMsg] = useState("");
  const [ukcErrorMsg, setUkcErrorMsg] = useState("");
  const [ukcSubmitting, setUkcSubmitting] = useState(false);
  const [ukcCreatedId, setUkcCreatedId] = useState<string | null>(null);
  const [ukcIdProofFile, setUkcIdProofFile] = useState<string | null>(null);
  const [ukcIdProofFileName, setUkcIdProofFileName] = useState("");

  // ─── Malaysia Court Check States ───
  const [mycCandidateName, setMycCandidateName] = useState("");
  const [mycCandidateDob, setMycCandidateDob] = useState("");
  const [mycFatherName, setMycFatherName] = useState("");
  const [mycMotherName, setMycMotherName] = useState("");
  const [mycGender, setMycGender] = useState("Not required");
  const [mycIsMarried, setMycIsMarried] = useState(false);
  const [mycHusbandName, setMycHusbandName] = useState("");
  const [mycIdProofType, setMycIdProofType] = useState("");
  const [mycIdProofNumber, setMycIdProofNumber] = useState("");
  const [mycAddresses, setMycAddresses] = useState<CourtAddressItem[]>([
    { address: "", city: "", state: "", stateCode: "", districtCode: "", country: "Malaysia", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }
  ]);
  const [mycCourtCategory, setMycCourtCategory] = useState("");
  const [mycCourtLocation, setMycCourtLocation] = useState("");
  const [mycCaseType, setMycCaseType] = useState("");
  const [mycDateOfDecisionFrom, setMycDateOfDecisionFrom] = useState("");
  const [mycDateOfDecisionTo, setMycDateOfDecisionTo] = useState("");
  const [mycDateOfAPFrom, setMycDateOfAPFrom] = useState("");
  const [mycDateOfAPTo, setMycDateOfAPTo] = useState("");
  const [mycJudgeName, setMycJudgeName] = useState("");
  const [mycRequestingOrgName, setMycRequestingOrgName] = useState("");
  const [mycShowOrgDropdown, setMycShowOrgDropdown] = useState(false);
  const [mycSuccessMsg, setMycSuccessMsg] = useState("");
  const [mycErrorMsg, setMycErrorMsg] = useState("");
  const [mycSubmitting, setMycSubmitting] = useState(false);
  const [mycCreatedId, setMycCreatedId] = useState<string | null>(null);
  const [mycIdProofFile, setMycIdProofFile] = useState<string | null>(null);
  const [mycIdProofFileName, setMycIdProofFileName] = useState("");

  // ─── Singapore Court Check States ───
  const [sgcCandidateName, setSgcCandidateName] = useState("");
  const [sgcCandidateDob, setSgcCandidateDob] = useState("");
  const [sgcFatherName, setSgcFatherName] = useState("");
  const [sgcMotherName, setSgcMotherName] = useState("");
  const [sgcGender, setSgcGender] = useState("Not required");
  const [sgcIsMarried, setSgcIsMarried] = useState(false);
  const [sgcHusbandName, setSgcHusbandName] = useState("");
  const [sgcIdProofType, setSgcIdProofType] = useState("");
  const [sgcIdProofNumber, setSgcIdProofNumber] = useState("");
  const [sgcAddresses, setSgcAddresses] = useState<CourtAddressItem[]>([
    { address: "", city: "", state: "", stateCode: "", districtCode: "", country: "Singapore", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }
  ]);
  const [sgcCourt, setSgcCourt] = useState("");
  const [sgcHearingType, setSgcHearingType] = useState("");
  const [sgcStartDate, setSgcStartDate] = useState("");
  const [sgcEndDate, setSgcEndDate] = useState("");
  const [sgcJudgeName, setSgcJudgeName] = useState("");
  const [sgcLawFirm, setSgcLawFirm] = useState("");
  const [sgcRequestingOrgName, setSgcRequestingOrgName] = useState("");
  const [sgcShowOrgDropdown, setSgcShowOrgDropdown] = useState(false);
  const [sgcSuccessMsg, setSgcSuccessMsg] = useState("");
  const [sgcErrorMsg, setSgcErrorMsg] = useState("");
  const [sgcSubmitting, setSgcSubmitting] = useState(false);
  const [sgcCreatedId, setSgcCreatedId] = useState<string | null>(null);
  const [sgcIdProofFile, setSgcIdProofFile] = useState<string | null>(null);
  const [sgcIdProofFileName, setSgcIdProofFileName] = useState("");

  // ─── Philippines Court Check States ───
  const [phcCandidateName, setPhcCandidateName] = useState("");
  const [phcCandidateDob, setPhcCandidateDob] = useState("");
  const [phcFatherName, setPhcFatherName] = useState("");
  const [phcMotherName, setPhcMotherName] = useState("");
  const [phcGender, setPhcGender] = useState("Not required");
  const [phcIsMarried, setPhcIsMarried] = useState(false);
  const [phcHusbandName, setPhcHusbandName] = useState("");
  const [phcIdProofType, setPhcIdProofType] = useState("");
  const [phcIdProofNumber, setPhcIdProofNumber] = useState("");
  const [phcAddresses, setPhcAddresses] = useState<CourtAddressItem[]>([
    { address: "", city: "", state: "", stateCode: "", districtCode: "", country: "Philippines", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }
  ]);
  const [phcPartyName, setPhcPartyName] = useState("");
  const [phcCaseNo, setPhcCaseNo] = useState("");
  const [phcStation, setPhcStation] = useState("");
  const [phcRequestingOrgName, setPhcRequestingOrgName] = useState("");
  const [phcShowOrgDropdown, setPhcShowOrgDropdown] = useState(false);
  const [phcSuccessMsg, setPhcSuccessMsg] = useState("");
  const [phcErrorMsg, setPhcErrorMsg] = useState("");
  const [phcSubmitting, setPhcSubmitting] = useState(false);
  const [phcCreatedId, setPhcCreatedId] = useState<string | null>(null);
  const [phcIdProofFile, setPhcIdProofFile] = useState<string | null>(null);
  const [phcIdProofFileName, setPhcIdProofFileName] = useState("");

  // ─── Interpol 59-Second Loading Screen States ───
  const [interpolLoadingProgress, setInterpolLoadingProgress] = useState(0);
  const [interpolLoadingStage, setInterpolLoadingStage] = useState(0);
  const [interpolTimeRemaining, setInterpolTimeRemaining] = useState(59);

  // Service active switches based on admin config
  const identityEnabled = organisation?.identityEnabled !== false;
  const courtRecordEnabled = organisation?.courtRecordEnabled !== false;
  const employmentEnabled = true; // always enabled for now
  const educationEnabled = true; // always enabled for now

  // ─── Passport Check States ───
  const [passportFileNumber, setPassportFileNumber] = useState("");
  const [passportDob, setPassportDob] = useState("");
  const [passportRequestingOrgName, setPassportRequestingOrgName] = useState("");
  const [passportShowOrgDropdown, setPassportShowOrgDropdown] = useState(false);
  const [passportSubmitting, setPassportSubmitting] = useState(false);
  const [passportCreatedId, setPassportCreatedId] = useState<string | null>(null);
  const [passportCreatedData, setPassportCreatedData] = useState<any>(null);
  const [passportErrorMsg, setPassportErrorMsg] = useState<string | null>(null);
  const [passportSuccessMsg, setPassportSuccessMsg] = useState("");
  const [passportIdProofFile, setPassportIdProofFile] = useState<string | null>(null);
  const [passportIdProofFileName, setPassportIdProofFileName] = useState("");
  // ─── Passport 15-Second Loading Screen States ───
  const [passportLoadingProgress, setPassportLoadingProgress] = useState(0);
  const [passportLoadingStage, setPassportLoadingStage] = useState(0);
  const [passportTimeRemaining, setPassportTimeRemaining] = useState(15);
  const [showPassportLoadingModal, setShowPassportLoadingModal] = useState(false);

  // ─── Digital Address Verification States ───
  const [davCandidateName, setDavCandidateName] = useState("");
  const [davCandidateEmail, setDavCandidateEmail] = useState("");
  const [davCandidateAddress, setDavCandidateAddress] = useState("");
  const [davRequestingOrgName, setDavRequestingOrgName] = useState("");
  const [davShowOrgDropdown, setDavShowOrgDropdown] = useState(false);
  const [davSubmitting, setDavSubmitting] = useState(false);
  const [davErrorMsg, setDavErrorMsg] = useState("");
  const [davSuccessMsg, setDavSuccessMsg] = useState("");
  const [davCreatedCredentials, setDavCreatedCredentials] = useState<{
    id?: string;
    name: string;
    email: string;
    setupUrl?: string;
  } | null>(null);
  const [davCopiedUrl, setDavCopiedUrl] = useState(false);


  // Service selector state
  const [activeService, setActiveService] = useState<ServiceType>("identity");
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const serviceParam = searchParams.get("service") || searchParams.get("serviceId") || searchParams.get("type");
    if (serviceParam && [
      "identity", "court_record", "employment", "education", "interpol",
      "passport", "digital_address", "rednotice_worldwide", "saflii_court",
      "saps_wanted", "uk_court", "malaysia_court", "singapore_court", "philippines_court"
    ].includes(serviceParam)) {
      setActiveService(serviceParam as ServiceType);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (!identityEnabled && activeService === "identity" && courtRecordEnabled) {
      setActiveService("court_record");
    } else if (!courtRecordEnabled && activeService === "court_record" && identityEnabled) {
      setActiveService("identity");
    }
  }, [identityEnabled, courtRecordEnabled, activeService]);

  // ─── Employment Check States ───
  const [empCandidateName, setEmpCandidateName] = useState("");
  const [empCandidateMobile, setEmpCandidateMobile] = useState("");
  const [empCandidateEmail, setEmpCandidateEmail] = useState("");
  const [empRequestingOrgName, setEmpRequestingOrgName] = useState("");
  const [empSkipCandidateLogin, setEmpSkipCandidateLogin] = useState(false);
  const [empShowOrgDropdown, setEmpShowOrgDropdown] = useState(false);
  const [empSuccessMsg, setEmpSuccessMsg] = useState("");
  const [empErrorMsg, setEmpErrorMsg] = useState("");
  const [empCreatedCredentials, setEmpCreatedCredentials] = useState<{
    id?: string;
    name: string;
    email: string;
    setupUrl?: string;
    skipCandidateLogin?: boolean;
  } | null>(null);
  const [empCopiedUrl, setEmpCopiedUrl] = useState(false);
  const [empSubmitting, setEmpSubmitting] = useState(false);

  const SUPPORTED_COUNTRIES = [
    { code: "India", label: "India", flag: "🇮🇳", defaultRate: 5 },
    { code: "Singapore", label: "Singapore", flag: "🇸🇬", defaultRate: 15 },
    { code: "Malaysia", label: "Malaysia", flag: "🇲🇾", defaultRate: 12 },
    { code: "Philippines", label: "Philippines", flag: "🇵🇭", defaultRate: 10 },
    { code: "UAE", label: "UAE", flag: "🇦🇪", defaultRate: 20 }
  ];

  const getEmpCountryRate = (countryCode: string) => {
    return (organisation as any)?.employmentRates?.[countryCode] ?? (SUPPORTED_COUNTRIES.find(c => c.code === countryCode)?.defaultRate || 5);
  };
  const getEduCountryRate = (countryCode: string) => {
    return (organisation as any)?.educationRates?.[countryCode] ?? (SUPPORTED_COUNTRIES.find(c => c.code === countryCode)?.defaultRate || 5);
  };

  // Dynamic multi-employment items (each item has its own country)
  const [empItems, setEmpItems] = useState<Array<{ id: string; companyName: string; position: string; joiningYear: string; leavingYear: string; employeeCode: string; country: string }>>([
    { id: "emp-1", companyName: "", position: "", joiningYear: "", leavingYear: "", employeeCode: "", country: "India" }
  ]);

  const addEmpItem = () => {
    setEmpItems(prev => [...prev, { id: `emp-${Date.now()}`, companyName: "", position: "", joiningYear: "", leavingYear: "", employeeCode: "", country: "India" }]);
  };

  // Compute total employment price across all items (each with its own country rate)
  const empTotalPrice = empItems.reduce((sum, item) => sum + getEmpCountryRate(item.country), 0);

  const removeEmpItem = (id: string) => {
    if (empItems.length <= 1) return;
    setEmpItems(prev => prev.filter(item => item.id !== id));
  };

  const updateEmpItem = (id: string, field: string, value: string) => {
    setEmpItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // ─── Education Check States ───
  const [eduCandidateName, setEduCandidateName] = useState("");
  const [eduCandidateMobile, setEduCandidateMobile] = useState("");
  const [eduCandidateEmail, setEduCandidateEmail] = useState("");
  const [eduRequestingOrgName, setEduRequestingOrgName] = useState("");
  const [eduSkipCandidateLogin, setEduSkipCandidateLogin] = useState(true);
  const [eduShowOrgDropdown, setEduShowOrgDropdown] = useState(false);
  const [eduSuccessMsg, setEduSuccessMsg] = useState("");
  const [eduErrorMsg, setEduErrorMsg] = useState("");
  const [eduCreatedCredentials, setEduCreatedCredentials] = useState<{
    id?: string;
    name: string;
    email: string;
    setupUrl?: string;
    skipCandidateLogin?: boolean;
  } | null>(null);
  const [eduCopiedUrl, setEduCopiedUrl] = useState(false);
  const [eduSubmitting, setEduSubmitting] = useState(false);

  // Dynamic multi-education items (each item has its own country)
  const [eduItems, setEduItems] = useState<Array<{ id: string; boardUniversity: string; courseName: string; passingYear: string; rollNumber: string; country: string }>>([
    { id: "edu-1", boardUniversity: "", courseName: "", passingYear: "", rollNumber: "", country: "India" }
  ]);

  const addEduItem = () => {
    setEduItems(prev => [...prev, { id: `edu-${Date.now()}`, boardUniversity: "", courseName: "", passingYear: "", rollNumber: "", country: "India" }]);
  };

  // Compute total education price across all items (each with its own country rate)
  const eduTotalPrice = eduItems.reduce((sum, item) => sum + getEduCountryRate(item.country), 0);

  const removeEduItem = (id: string) => {
    if (eduItems.length <= 1) return;
    setEduItems(prev => prev.filter(item => item.id !== id));
  };

  const updateEduItem = (id: string, field: string, value: string) => {
    setEduItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const recentOrgs = settings?.recentRequestingOrgs || [];

  const empFilteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(empRequestingOrgName.toLowerCase())
  );

  const eduFilteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(eduRequestingOrgName.toLowerCase())
  );

  const interpolFilteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(interpolRequestingOrgName.toLowerCase())
  );

  const rnwFilteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(rnwRequestingOrgName.toLowerCase())
  );

  const passportFilteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(passportRequestingOrgName.toLowerCase())
  );

  const davFilteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(davRequestingOrgName.toLowerCase())
  );

  const sacFilteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(sacRequestingOrgName.toLowerCase())
  );

  const ukcFilteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(ukcRequestingOrgName.toLowerCase())
  );

  const mycFilteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(mycRequestingOrgName.toLowerCase())
  );

  const sgcFilteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(sgcRequestingOrgName.toLowerCase())
  );

  const phcFilteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(phcRequestingOrgName.toLowerCase())
  );

  // ─── Identity Check States (existing) ───
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [requestingOrgName, setRequestingOrgName] = useState("");
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const isAdmin = profile?.role === "admin" || profile?.org_name?.toLowerCase() === "clusoinfolink" || profile?.org_name?.toLowerCase() === "ozclu" || profile?.org_name?.toLowerCase() === "admin";

  React.useEffect(() => {
    if (!isAdmin && profile?.org_name) {
      setOrgName(profile.org_name);
    }
  }, [profile, isAdmin]);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    setupUrl?: string;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const filteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(requestingOrgName.toLowerCase())
  );

  // ─── Court Record Check States ───
  const currentYear = new Date().getFullYear();
  const [crCandidateName, setCrCandidateName] = useState("");
  const [crCandidateDob, setCrCandidateDob] = useState("");
  const [crFatherName, setCrFatherName] = useState("");
  const [crMotherName, setCrMotherName] = useState("");
  const [crIsMarried, setCrIsMarried] = useState(false);
  const [crGender, setCrGender] = useState("Not required");
  const [crHusbandName, setCrHusbandName] = useState("");
  const [crRequestingOrgName, setCrRequestingOrgName] = useState("");
  const [crShowOrgDropdown, setCrShowOrgDropdown] = useState(false);
  const [crIdProofType, setCrIdProofType] = useState("");
  const [crIdProofNumber, setCrIdProofNumber] = useState("");
  const [crIdProofFile, setCrIdProofFile] = useState<string | null>(null);
  const [crIdProofFileName, setCrIdProofFileName] = useState("");
  const [crAddresses, setCrAddresses] = useState<
    Array<{ address: string; city: string; state: string; stateCode: string; districtCode: string; country: string; fromYear: number; toYear: number }>
  >([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "India", fromYear: currentYear - 2, toYear: currentYear }]);
  const [crSuccessMsg, setCrSuccessMsg] = useState("");
  const [crErrorMsg, setCrErrorMsg] = useState("");
  const [crCreatedId, setCrCreatedId] = useState<string | null>(null);
  const [crSubmitting, setCrSubmitting] = useState(false);

  // District dropdowns state: stateCode -> { loading, districts[] }
  const [districtsCache, setDistrictsCache] = useState<
    Record<string, { loading: boolean; districts: Array<{ value: string; name: string }> }>
  >({});

  const crFilteredOrgs = recentOrgs.filter(org =>
    org.toLowerCase().includes(crRequestingOrgName.toLowerCase())
  );

  // Sorted states for dropdown
  const sortedStates = [...INDIAN_STATES].sort((a, b) => a.name.localeCompare(b.name));

  // Fetch districts for a state code
  const fetchDistrictsForState = async (stateCode: string) => {
    if (!stateCode) return;
    // Skip if already loaded or loading
    if (districtsCache[stateCode]?.districts?.length > 0 || districtsCache[stateCode]?.loading) return;

    setDistrictsCache((prev) => ({
      ...prev,
      [stateCode]: { loading: true, districts: [] },
    }));

    try {
      const res = await fetch(`/api/ecourts-districts?state_code=${stateCode}`);
      const data = await res.json();
      if (data.success && data.districts) {
        setDistrictsCache((prev) => ({
          ...prev,
          [stateCode]: { loading: false, districts: data.districts },
        }));
      } else {
        setDistrictsCache((prev) => ({
          ...prev,
          [stateCode]: { loading: false, districts: [] },
        }));
      }
    } catch (err) {
      console.error("Failed to fetch districts:", err);
      setDistrictsCache((prev) => ({
        ...prev,
        [stateCode]: { loading: false, districts: [] },
      }));
    }
  };

  // ─── Identity Check Handlers (existing) ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const isSettingsIncomplete = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsIncomplete) {
      setErrorMsg("Please complete your profile settings (First Name, Last Name, Address, City, and Postal Code) before creating requests.");
      return;
    }

    if (!candidateName.trim()) {
      setErrorMsg("Candidate Name is required");
      return;
    }
    if (!candidateEmail.trim()) {
      setErrorMsg("Candidate Email is required");
      return;
    }
    if (!orgName.trim()) {
      setErrorMsg("Organisation Name is required");
      return;
    }
    if (!requestingOrgName.trim()) {
      setErrorMsg("Requesting ORG Name is required");
      return;
    }

    try {
      const res = await addVerification(candidateName, candidateEmail, orgName, requestingOrgName);
      if (res && res.success) {
        setSuccessMsg("Verification request initiated successfully!");
        setCreatedCredentials({
          name: candidateName,
          email: candidateEmail.toLowerCase().trim(),
          setupUrl: res.setupUrl
        });
        setCandidateName("");
        setCandidateEmail("");
        setRequestingOrgName("");
      } else {
        setErrorMsg("Failed to initiate verification request");
      }
    } catch (err: any) {
      setErrorMsg("Failed to initiate verification request");
    }
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

  const handleCancel = () => {
    setCandidateName("");
    setCandidateEmail("");
    setOrgName(isAdmin ? "" : (profile?.org_name || ""));
    setRequestingOrgName("");
  };

  // ─── Employment Check Handlers ───
  const handleEmploymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpErrorMsg("");
    setEmpSuccessMsg("");

    const isSettingsIncomplete = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsIncomplete) {
      setEmpErrorMsg("Please complete your profile settings before creating requests.");
      return;
    }

    if (!empCandidateName.trim()) {
      setEmpErrorMsg("Candidate Full Name is required");
      return;
    }
    if (!empSkipCandidateLogin && !empCandidateEmail.trim()) {
      setEmpErrorMsg("Candidate Email is required");
      return;
    }
    if (!empRequestingOrgName.trim()) {
      setEmpErrorMsg("Requesting ORG Name is required");
      return;
    }

    setEmpSubmitting(true);
    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);
      const res = await addEmploymentVerification(
        empCandidateName.trim(),
        empCandidateMobile.trim(),
        empCandidateEmail.trim(),
        effectiveOrgName,
        empRequestingOrgName.trim(),
        empSkipCandidateLogin,
        empItems.map(i => ({ companyName: i.companyName.trim(), position: i.position.trim(), joiningYear: i.joiningYear.trim(), leavingYear: i.leavingYear.trim(), employeeCode: i.employeeCode.trim(), country: i.country }))
      );
      if (res && res.success) {
        setEmpSuccessMsg("Employment verification request initiated successfully!");
        setEmpCreatedCredentials({
          id: res.id,
          name: empCandidateName,
          email: empCandidateEmail.toLowerCase().trim(),
          setupUrl: res.setupUrl,
          skipCandidateLogin: empSkipCandidateLogin
        });
        setEmpCandidateName("");
        setEmpCandidateMobile("");
        setEmpCandidateEmail("");
        setEmpRequestingOrgName("");
        setEmpSkipCandidateLogin(false);
        setEmpItems([{ id: "emp-1", companyName: "", position: "", joiningYear: "", leavingYear: "", employeeCode: "", country: "India" }]);
      } else {
        setEmpErrorMsg("Failed to initiate employment verification request");
      }
    } catch (err: any) {
      setEmpErrorMsg("Failed to initiate employment verification request");
    } finally {
      setEmpSubmitting(false);
    }
  };

  const handleEmploymentCancel = () => {
    setEmpCandidateName("");
    setEmpCandidateMobile("");
    setEmpCandidateEmail("");
    setEmpRequestingOrgName("");
    setEmpSkipCandidateLogin(false);
    setEmpItems([{ id: "emp-1", companyName: "", position: "", joiningYear: "", leavingYear: "", employeeCode: "", country: "India" }]);
    setEmpErrorMsg("");
    setEmpSuccessMsg("");
  };

  // ─── Education Check Handlers ───
  const handleEducationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEduErrorMsg("");
    setEduSuccessMsg("");

    const isSettingsIncomplete = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsIncomplete) {
      setEduErrorMsg("Please complete your profile settings before creating requests.");
      return;
    }

    if (!eduCandidateName.trim()) {
      setEduErrorMsg("Candidate Full Name is required");
      return;
    }
    if (!eduSkipCandidateLogin && !eduCandidateEmail.trim()) {
      setEduErrorMsg("Candidate Email is required");
      return;
    }
    if (!eduRequestingOrgName.trim()) {
      setEduErrorMsg("Requesting ORG Name is required");
      return;
    }

    setEduSubmitting(true);
    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);
      const res = await addEducationVerification(
        eduCandidateName.trim(),
        eduCandidateMobile.trim(),
        eduCandidateEmail.trim(),
        effectiveOrgName,
        eduRequestingOrgName.trim(),
        eduSkipCandidateLogin,
        eduItems.map(i => ({ boardUniversity: i.boardUniversity.trim(), courseName: i.courseName.trim(), passingYear: i.passingYear.trim(), rollNumber: i.rollNumber.trim(), country: i.country }))
      );
      if (res && res.success) {
        setEduSuccessMsg("Education verification request initiated successfully!");
        setEduCreatedCredentials({
          id: res.id,
          name: eduCandidateName,
          email: eduCandidateEmail.toLowerCase().trim(),
          setupUrl: res.setupUrl,
          skipCandidateLogin: eduSkipCandidateLogin
        });
        setEduCandidateName("");
        setEduCandidateMobile("");
        setEduCandidateEmail("");
        setEduRequestingOrgName("");
        setEduSkipCandidateLogin(true);
        setEduItems([{ id: "edu-1", boardUniversity: "", courseName: "", passingYear: "", rollNumber: "", country: "India" }]);
      } else {
        setEduErrorMsg("Failed to initiate education verification request");
      }
    } catch (err: any) {
      setEduErrorMsg("Failed to initiate education verification request");
    } finally {
      setEduSubmitting(false);
    }
  };

  const handleEducationCancel = () => {
    setEduCandidateName("");
    setEduCandidateMobile("");
    setEduCandidateEmail("");
    setEduRequestingOrgName("");
    setEduSkipCandidateLogin(true);
    setEduItems([{ id: "edu-1", boardUniversity: "", courseName: "", passingYear: "", rollNumber: "", country: "India" }]);
    setEduErrorMsg("");
    setEduSuccessMsg("");
  };

  // ─── Court Record Check Handlers ───
  const addAddress = () => {
    setCrAddresses((prev) => [...prev, { address: "", city: "", state: "", stateCode: "", districtCode: "", country: "India", fromYear: currentYear - 2, toYear: currentYear }]);
  };

  const removeAddress = (index: number) => {
    if (crAddresses.length <= 1) return;
    setCrAddresses((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAddress = (index: number, field: keyof typeof crAddresses[0], value: string) => {
    setCrAddresses((prev) =>
      prev.map((addr, i) => (i === index ? { ...addr, [field]: value } : addr))
    );
  };

  const handleCourtRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCrErrorMsg("");
    setCrSuccessMsg("");
    setCrCreatedId(null);

    const isSettingsIncomplete = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsIncomplete) {
      setCrErrorMsg("Please complete your profile settings before creating requests.");
      return;
    }

    if (!crCandidateName.trim()) {
      setCrErrorMsg("Candidate Full Name is required");
      return;
    }
    if (!crCandidateDob) {
      setCrErrorMsg("Candidate Date of Birth is required");
      return;
    }
    if (!crFatherName.trim()) {
      setCrErrorMsg("Father's Name is required");
      return;
    }
    if (crGender === "Female" && crIsMarried && !crHusbandName.trim()) {
      setCrErrorMsg("Husband's Name is required when the candidate is married");
      return;
    }

    // Validate addresses
    for (let i = 0; i < crAddresses.length; i++) {
      if (!crAddresses[i].state) {
        setCrErrorMsg(`Address ${i + 1}: State is required`);
        return;
      }
      if (!crAddresses[i].city.trim()) {
        setCrErrorMsg(`Address ${i + 1}: District is required`);
        return;
      }
      if (crAddresses[i].fromYear > crAddresses[i].toYear) {
        setCrErrorMsg(`Address ${i + 1}: "From Year" must be before or equal to "To Year"`);
        return;
      }
      if (crAddresses[i].toYear - crAddresses[i].fromYear + 1 > 3) {
        setCrErrorMsg(`Address ${i + 1}: Maximum 3-year search span allowed per address`);
        return;
      }
    }

    if (!crRequestingOrgName.trim()) {
      setCrErrorMsg("Requesting ORG Name is required");
      return;
    }

    setCrSubmitting(true);

    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);

      const res = await addCourtRecordVerification({
        candidateName: crCandidateName.trim(),
        candidateDob: crCandidateDob,
        candidateFatherName: crFatherName.trim(),
        candidateMotherName: crMotherName.trim(),
        candidateIsMarried: crIsMarried,
        candidateHusbandName: (crGender === "Female" && crIsMarried) ? crHusbandName.trim() : undefined,
        gender: crGender !== "Not required" ? crGender : undefined,
        idProofType: crIdProofType || undefined,
        idProofNumber: crIdProofNumber.trim() || undefined,
        idProofFile: crIdProofFile || undefined,
        addresses: crAddresses.map(addr => ({
          ...addr,
          state: addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : addr.state,
          stateCode: addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : addr.stateCode,
          city: addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : addr.city,
          districtCode: addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : addr.districtCode
        })),
        orgName: effectiveOrgName,
        requestingOrgName: crRequestingOrgName.trim(),
      });

      if (res && res.success) {
        setCrSuccessMsg("Court record verification initiated! Search is running in the background.");
        setCrCreatedId(res.id);
        setCrCandidateName("");
        setCrCandidateDob("");
        setCrFatherName("");
        setCrMotherName("");
        setCrIsMarried(false);
        setCrGender("Not required");
        setCrHusbandName("");
        setCrIdProofType("");
        setCrIdProofNumber("");
        setCrIdProofFile(null);
        setCrIdProofFileName("");
        setCrAddresses([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "India", fromYear: currentYear - 2, toYear: currentYear }]);
        setCrRequestingOrgName("");
      } else {
        setCrErrorMsg("Failed to initiate court record verification");
      }
    } catch (err: any) {
      setCrErrorMsg("Failed to initiate court record verification");
    } finally {
      setCrSubmitting(false);
    }
  };

  const handleCourtRecordCancel = () => {
    setCrCandidateName("");
    setCrCandidateDob("");
    setCrFatherName("");
    setCrMotherName("");
    setCrIsMarried(false);
    setCrGender("Not required");
    setCrHusbandName("");
    setCrIdProofType("");
    setCrIdProofNumber("");
    setCrIdProofFile(null);
    setCrIdProofFileName("");
    setCrAddresses([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "India", fromYear: currentYear - 2, toYear: currentYear }]);
    setCrRequestingOrgName("");
    setCrErrorMsg("");
    setCrSuccessMsg("");
    setCrCreatedId(null);
  };

  // ─── Interpol Check Handlers ───
  const handleInterpolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInterpolErrorMsg("");
    setInterpolSuccessMsg("");

    const isSettingsIncomplete = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsIncomplete) {
      setInterpolErrorMsg("Please complete your profile settings before creating requests.");
      return;
    }

    if (!interpolCandidateName.trim()) {
      setInterpolErrorMsg("Candidate Full Name is required");
      return;
    }
    if (!interpolCandidateDob.trim()) {
      setInterpolErrorMsg("Candidate Date of Birth is required");
      return;
    }
    if (!interpolRequestingOrgName.trim()) {
      setInterpolErrorMsg("Requesting ORG Name is required");
      return;
    }

    setInterpolSubmitting(true);
    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);
      const res = await addInterpolVerification({
        candidateName: interpolCandidateName.trim(),
        candidateDob: interpolCandidateDob.trim(),
        birthCity: interpolBirthCity.trim(),
        orgName: effectiveOrgName,
        requestingOrgName: interpolRequestingOrgName.trim(),
        idProofFile: interpolIdProofFile,
        idProofFileName: interpolIdProofFileName,
      });

      if (res && res.success) {
        setInterpolSuccessMsg(res.interpolHasRecords ? "Potential similarity match(es) found." : "Interpol database check completed successfully!");
        setInterpolCreatedId(res.id);
        setInterpolIdProofFile(null);
        setInterpolIdProofFileName("");
      } else {
        setInterpolErrorMsg(res?.error || "Failed to run Interpol database check");
      }
    } catch (err: any) {
      setInterpolErrorMsg(err?.message || "Failed to run Interpol database check");
    } finally {
      setInterpolSubmitting(false);
    }
  };

  const handleInterpolCancel = () => {
    setInterpolCandidateName("");
    setInterpolCandidateDob("");
    setInterpolBirthCity("");
    setInterpolRequestingOrgName("");
    setInterpolErrorMsg("");
    setInterpolSuccessMsg("");
    setInterpolCreatedId(null);
    setInterpolIdProofFile(null);
    setInterpolIdProofFileName("");
  };

  // ─── Red Notice Worldwide Check Handlers ───
  const handleRednoticeWorldwideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRnwErrorMsg("");
    setRnwSuccessMsg("");

    const isSettingsIncomplete = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsIncomplete) {
      setRnwErrorMsg("Please complete your profile settings before creating requests.");
      return;
    }

    if (!rnwCandidateName.trim()) {
      setRnwErrorMsg("Candidate Full Name is required");
      return;
    }
    if (!rnwCandidateDob.trim()) {
      setRnwErrorMsg("Candidate Date of Birth is required");
      return;
    }
    if (!rnwRequestingOrgName.trim()) {
      setRnwErrorMsg("Requesting ORG Name is required");
      return;
    }

    setRnwSubmitting(true);
    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);
      const res = await addRednoticeWorldwideVerification({
        candidateName: rnwCandidateName.trim(),
        candidateDob: rnwCandidateDob.trim(),
        birthCity: rnwBirthCity.trim(),
        orgName: effectiveOrgName,
        requestingOrgName: rnwRequestingOrgName.trim(),
        idProofFile: rnwIdProofFile,
        idProofFileName: rnwIdProofFileName,
      });

      if (res && res.success) {
        setRnwSuccessMsg(res.rednoticeWorldwideHasRecords ? "Potential similarity match(es) found." : "Worldwide Red Notice check completed successfully!");
        setRnwCreatedId(res.id);
        setRnwIdProofFile(null);
        setRnwIdProofFileName("");
      } else {
        setRnwErrorMsg(res?.error || "Failed to run Worldwide Red Notice database check");
      }
    } catch (err: any) {
      setRnwErrorMsg(err?.message || "Failed to run Worldwide Red Notice database check");
    } finally {
      setRnwSubmitting(false);
    }
  };

  const handleRednoticeWorldwideCancel = () => {
    setRnwCandidateName("");
    setRnwCandidateDob("");
    setRnwBirthCity("");
    setRnwRequestingOrgName("");
    setRnwErrorMsg("");
    setRnwSuccessMsg("");
    setRnwCreatedId(null);
    setRnwIdProofFile(null);
    setRnwIdProofFileName("");
  };

  // ─── South African Court Check Handlers ───
  const handleSafliiCourtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSacErrorMsg("");
    setSacSuccessMsg("");

    const isSettingsIncomplete = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsIncomplete) {
      setSacErrorMsg("Please complete your profile settings before creating requests.");
      return;
    }

    if (!sacCandidateName.trim()) {
      setSacErrorMsg("Candidate Full Name is required");
      return;
    }

    if (sacGender === "Female" && sacIsMarried && !sacHusbandName.trim()) {
      setSacErrorMsg("Husband's Name is required when the candidate is married");
      return;
    }

    if (!sacAddresses || sacAddresses.length === 0) {
      setSacErrorMsg("Please provide at least one address / target province");
      return;
    }

    for (let i = 0; i < sacAddresses.length; i++) {
      if (!sacAddresses[i].state) {
        setSacErrorMsg(`Address ${i + 1}: State / Province is required`);
        return;
      }
      if (!sacAddresses[i].city.trim()) {
        setSacErrorMsg(`Address ${i + 1}: District / City is required`);
        return;
      }
      if (sacAddresses[i].fromYear > sacAddresses[i].toYear) {
        setSacErrorMsg(`Address ${i + 1}: "From Year" must be before or equal to "To Year"`);
        return;
      }
      if (sacAddresses[i].toYear - sacAddresses[i].fromYear + 1 > 3) {
        setSacErrorMsg(`Address ${i + 1}: Maximum 3-year search span allowed per address`);
        return;
      }
    }

    if (!sacRequestingOrgName.trim()) {
      setSacErrorMsg("Requesting ORG Name is required");
      return;
    }

    setSacSubmitting(true);
    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);
      const res = await addSafliiCourtVerification({
        candidateName: sacCandidateName.trim(),
        candidateDob: sacCandidateDob.trim(),
        birthCity: sacBirthCity.trim(),
        province: sacAddresses[0]?.state || "South Africa",
        candidateFatherName: sacFatherName.trim(),
        candidateMotherName: sacMotherName.trim(),
        candidateIsMarried: sacIsMarried,
        candidateHusbandName: (sacGender === "Female" && sacIsMarried) ? sacHusbandName.trim() : undefined,
        gender: sacGender !== "Not required" ? sacGender : undefined,
        idProofType: sacIdProofType || undefined,
        idProofNumber: sacIdProofNumber.trim() || undefined,
        addresses: sacAddresses.map(addr => ({
          ...addr,
          state: addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : addr.state,
          stateCode: addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : addr.stateCode,
          city: addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : addr.city,
          districtCode: addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : addr.districtCode
        })),
        orgName: effectiveOrgName,
        requestingOrgName: sacRequestingOrgName.trim(),
        idProofFile: sacIdProofFile,
        idProofFileName: sacIdProofFileName,
      });

      if (res && res.success) {
        setSacSuccessMsg("SA court record search initiated! Search is running in the background.");
        setSacCreatedId(res.id);
        setSacCandidateName("");
        setSacCandidateDob("");
        setSacBirthCity("");
        setSacFatherName("");
        setSacMotherName("");
        setSacGender("Not required");
        setSacIsMarried(false);
        setSacHusbandName("");
        setSacIdProofType("");
        setSacIdProofNumber("");
        setSacAddresses([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "South Africa", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }]);
        setSacRequestingOrgName("");
        setSacIdProofFile(null);
        setSacIdProofFileName("");
      } else {
        setSacErrorMsg(res?.error || "Failed to run South African Court database check");
      }
    } catch (err: any) {
      setSacErrorMsg(err?.message || "Failed to run South African Court database check");
    } finally {
      setSacSubmitting(false);
    }
  };

  const handleSafliiCourtCancel = () => {
    setSacCandidateName("");
    setSacCandidateDob("");
    setSacBirthCity("");
    setSacFatherName("");
    setSacMotherName("");
    setSacGender("Not required");
    setSacIsMarried(false);
    setSacHusbandName("");
    setSacIdProofType("");
    setSacIdProofNumber("");
    setSacAddresses([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "South Africa", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }]);
    setSacRequestingOrgName("");
    setSacErrorMsg("");
    setSacSuccessMsg("");
    setSacCreatedId(null);
    setSacIdProofFile(null);
    setSacIdProofFileName("");
  };

  // ─── SAPS Wanted Check Handlers ───
  const handleSapsWantedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSapsErrorMsg("");
    setSapsSuccessMsg("");

    const isSettingsIncomplete = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsIncomplete) {
      setSapsErrorMsg("Please complete your profile settings before creating requests.");
      return;
    }

    const resolvedName = sapsCandidateName.trim() || `${sapsCandidateForename.trim()} ${sapsCandidateSurname.trim()}`.trim();
    if (!resolvedName) {
      setSapsErrorMsg("Candidate Name (or Forename and Surname) is required.");
      return;
    }
    if (!sapsRequestingOrgName.trim()) {
      setSapsErrorMsg("Requesting ORG Name is required.");
      return;
    }

    setSapsSubmitting(true);
    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);
      const res = await addSapsWantedVerification({
        candidateName: resolvedName,
        candidateForename: sapsCandidateForename.trim(),
        candidateSurname: sapsCandidateSurname.trim(),
        candidateDob: sapsCandidateDob.trim(),
        candidateIdNumber: sapsCandidateIdNumber.trim(),
        provinceCity: sapsProvinceCity.trim(),
        orgName: effectiveOrgName,
        requestingOrgName: sapsRequestingOrgName.trim(),
        idProofFile: sapsIdProofFile,
        idProofFileName: sapsIdProofFileName,
      });

      if (res && res.success) {
        setSapsCreatedId(res.id);
        setSapsIsHalted(res.status === "Halted");
        setSapsHasRecords(!!res.sapsWantedHasRecords);
        setSapsSuccessMsg(
          res.status === "Halted"
            ? "Potential match found — verification halted pending attorney review."
            : "SAPS Wanted check completed successfully! Clean record verified."
        );
        setSapsCandidateName("");
        setSapsCandidateForename("");
        setSapsCandidateSurname("");
        setSapsCandidateDob("");
        setSapsCandidateIdNumber("");
        setSapsProvinceCity("");
        setSapsRequestingOrgName("");
        setSapsIdProofFile(null);
        setSapsIdProofFileName("");
      } else {
        setSapsErrorMsg(res?.error || "Failed to submit SAPS Wanted check");
      }
    } catch (err: any) {
      setSapsErrorMsg(err?.message || "Failed to submit SAPS Wanted check");
    } finally {
      setSapsSubmitting(false);
    }
  };

  const handleSapsWantedCancel = () => {
    setSapsCandidateName("");
    setSapsCandidateForename("");
    setSapsCandidateSurname("");
    setSapsCandidateDob("");
    setSapsCandidateIdNumber("");
    setSapsProvinceCity("");
    setSapsRequestingOrgName("");
    setSapsIdProofFile(null);
    setSapsIdProofFileName("");
    setSapsErrorMsg("");
    setSapsSuccessMsg("");
  };

  // ─── UK Court Check Handlers ───
  const handleUkCourtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUkcErrorMsg("");
    setUkcSuccessMsg("");

    const isSettingsIncomplete = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsIncomplete) {
      setUkcErrorMsg("Please complete your profile settings before creating requests.");
      return;
    }

    if (!ukcCandidateName.trim()) {
      setUkcErrorMsg("Candidate Full Name is required.");
      return;
    }

    if (ukcGender === "Female" && ukcIsMarried && !ukcHusbandName.trim()) {
      setUkcErrorMsg("Husband's Name is required when the candidate is married");
      return;
    }

    if (!ukcAddresses || ukcAddresses.length === 0) {
      setUkcErrorMsg("Please provide at least one address / target province");
      return;
    }

    for (let i = 0; i < ukcAddresses.length; i++) {
      if (!ukcAddresses[i].state) {
        setUkcErrorMsg(`Address ${i + 1}: State / Jurisdiction is required`);
        return;
      }
      if (!ukcAddresses[i].city.trim()) {
        setUkcErrorMsg(`Address ${i + 1}: City / District is required`);
        return;
      }
      if (ukcAddresses[i].fromYear > ukcAddresses[i].toYear) {
        setUkcErrorMsg(`Address ${i + 1}: "From Year" must be before or equal to "To Year"`);
        return;
      }
      if (ukcAddresses[i].toYear - ukcAddresses[i].fromYear + 1 > 3) {
        setUkcErrorMsg(`Address ${i + 1}: Maximum 3-year search span allowed per address`);
        return;
      }
    }

    if (!ukcRequestingOrgName.trim()) {
      setUkcErrorMsg("Requesting ORG Name is required.");
      return;
    }

    setUkcSubmitting(true);
    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);
      const res = await addUkCourtVerification({
        candidateName: ukcCandidateName.trim(),
        candidateDob: ukcCandidateDob.trim(),
        birthCity: ukcBirthCity.trim(),
        candidateFatherName: ukcFatherName.trim(),
        candidateMotherName: ukcMotherName.trim(),
        candidateIsMarried: ukcIsMarried,
        candidateHusbandName: (ukcGender === "Female" && ukcIsMarried) ? ukcHusbandName.trim() : undefined,
        gender: ukcGender !== "Not required" ? ukcGender : undefined,
        idProofType: ukcIdProofType || undefined,
        idProofNumber: ukcIdProofNumber.trim() || undefined,
        judgmentType: ukcJudgmentType.trim(),
        jurisdiction: ukcJurisdiction.trim() || "All UK Jurisdictions",
        addresses: ukcAddresses.map(addr => ({
          ...addr,
          state: addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : addr.state,
          stateCode: addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : addr.stateCode,
          city: addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : addr.city,
          districtCode: addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : addr.districtCode
        })),
        orgName: effectiveOrgName,
        requestingOrgName: ukcRequestingOrgName.trim(),
        idProofFile: ukcIdProofFile,
        idProofFileName: ukcIdProofFileName,
      });

      if (res && res.success) {
        setUkcSuccessMsg("UK Court check initiated! Searching Courts and Tribunals Judiciary database...");
        setUkcCreatedId(res.id);
        setUkcCandidateName("");
        setUkcCandidateDob("");
        setUkcBirthCity("");
        setUkcFatherName("");
        setUkcMotherName("");
        setUkcGender("Not required");
        setUkcIsMarried(false);
        setUkcHusbandName("");
        setUkcIdProofType("");
        setUkcIdProofNumber("");
        setUkcAddresses([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "United Kingdom", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }]);
        setUkcJudgmentType("");
        setUkcJurisdiction("All UK Jurisdictions");
        setUkcRequestingOrgName("");
        setUkcIdProofFile(null);
        setUkcIdProofFileName("");
      } else {
        setUkcErrorMsg(res?.error || "Failed to submit UK Court check");
      }
    } catch (err: any) {
      setUkcErrorMsg(err?.message || "Failed to submit UK Court check");
    } finally {
      setUkcSubmitting(false);
    }
  };

  const handleUkCourtCancel = () => {
    setUkcCandidateName("");
    setUkcCandidateDob("");
    setUkcBirthCity("");
    setUkcFatherName("");
    setUkcMotherName("");
    setUkcGender("Not required");
    setUkcIsMarried(false);
    setUkcHusbandName("");
    setUkcIdProofType("");
    setUkcIdProofNumber("");
    setUkcAddresses([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "United Kingdom", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }]);
    setUkcJudgmentType("");
    setUkcJurisdiction("All UK Jurisdictions");
    setUkcRequestingOrgName("");
    setUkcIdProofFile(null);
    setUkcIdProofFileName("");
    setUkcErrorMsg("");
    setUkcSuccessMsg("");
  };

  // ─── Malaysia Court Check Handlers ───
  const handleMalaysiaCourtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMycErrorMsg("");
    setMycSuccessMsg("");

    const isSettingsIncomplete = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsIncomplete) {
      setMycErrorMsg("Please complete your profile settings before creating requests.");
      return;
    }

    if (!mycCandidateName.trim()) {
      setMycErrorMsg("General Search query (Candidate Name / Parties / Case No) is required.");
      return;
    }

    if (mycGender === "Female" && mycIsMarried && !mycHusbandName.trim()) {
      setMycErrorMsg("Husband's Name is required when the candidate is married");
      return;
    }

    if (!mycAddresses || mycAddresses.length === 0) {
      setMycErrorMsg("Please provide at least one address / target state");
      return;
    }

    for (let i = 0; i < mycAddresses.length; i++) {
      if (!mycAddresses[i].state) {
        setMycErrorMsg(`Address ${i + 1}: State / Territory is required`);
        return;
      }
      if (!mycAddresses[i].city.trim()) {
        setMycErrorMsg(`Address ${i + 1}: District / City is required`);
        return;
      }
      if (mycAddresses[i].fromYear > mycAddresses[i].toYear) {
        setMycErrorMsg(`Address ${i + 1}: "From Year" must be before or equal to "To Year"`);
        return;
      }
      if (mycAddresses[i].toYear - mycAddresses[i].fromYear + 1 > 3) {
        setMycErrorMsg(`Address ${i + 1}: Maximum 3-year search span allowed per address`);
        return;
      }
    }

    if (!mycRequestingOrgName.trim()) {
      setMycErrorMsg("Requesting ORG Name is required.");
      return;
    }

    setMycSubmitting(true);
    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);
      const res = await addMalaysiaCourtVerification({
        candidateName: mycCandidateName.trim(),
        candidateDob: mycCandidateDob.trim(),
        candidateFatherName: mycFatherName.trim(),
        candidateMotherName: mycMotherName.trim(),
        candidateIsMarried: mycIsMarried,
        candidateHusbandName: (mycGender === "Female" && mycIsMarried) ? mycHusbandName.trim() : undefined,
        gender: mycGender !== "Not required" ? mycGender : undefined,
        idProofType: mycIdProofType || undefined,
        idProofNumber: mycIdProofNumber.trim() || undefined,
        courtCategory: mycCourtCategory.trim(),
        courtLocation: mycCourtLocation.trim(),
        caseType: mycCaseType.trim(),
        dateOfDecisionFrom: mycDateOfDecisionFrom.trim(),
        dateOfDecisionTo: mycDateOfDecisionTo.trim(),
        dateOfAPFrom: mycDateOfAPFrom.trim(),
        dateOfAPTo: mycDateOfAPTo.trim(),
        judgeName: mycJudgeName.trim(),
        addresses: mycAddresses.map(addr => ({
          ...addr,
          state: addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : addr.state,
          stateCode: addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : addr.stateCode,
          city: addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : addr.city,
          districtCode: addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : addr.districtCode
        })),
        orgName: effectiveOrgName,
        requestingOrgName: mycRequestingOrgName.trim(),
        idProofFile: mycIdProofFile,
        idProofFileName: mycIdProofFileName,
      });

      if (res && res.success) {
        setMycSuccessMsg("Malaysia Court check initiated! Querying Portal eJudgment Kehakiman...");
        setMycCreatedId(res.id);
        setMycCandidateName("");
        setMycCandidateDob("");
        setMycFatherName("");
        setMycMotherName("");
        setMycGender("Not required");
        setMycIsMarried(false);
        setMycHusbandName("");
        setMycIdProofType("");
        setMycIdProofNumber("");
        setMycAddresses([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "Malaysia", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }]);
        setMycCourtCategory("");
        setMycCourtLocation("");
        setMycCaseType("");
        setMycDateOfDecisionFrom("");
        setMycDateOfDecisionTo("");
        setMycDateOfAPFrom("");
        setMycDateOfAPTo("");
        setMycJudgeName("");
        setMycRequestingOrgName("");
        setMycIdProofFile(null);
        setMycIdProofFileName("");
      } else {
        setMycErrorMsg(res?.error || "Failed to submit Malaysia Court check");
      }
    } catch (err: any) {
      setMycErrorMsg(err?.message || "Failed to submit Malaysia Court check");
    } finally {
      setMycSubmitting(false);
    }
  };

  const handleMalaysiaCourtCancel = () => {
    setMycCandidateName("");
    setMycCandidateDob("");
    setMycFatherName("");
    setMycMotherName("");
    setMycGender("Not required");
    setMycIsMarried(false);
    setMycHusbandName("");
    setMycIdProofType("");
    setMycIdProofNumber("");
    setMycAddresses([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "Malaysia", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }]);
    setMycCourtCategory("");
    setMycCourtLocation("");
    setMycCaseType("");
    setMycDateOfDecisionFrom("");
    setMycDateOfDecisionTo("");
    setMycDateOfAPFrom("");
    setMycDateOfAPTo("");
    setMycJudgeName("");
    setMycRequestingOrgName("");
    setMycIdProofFile(null);
    setMycIdProofFileName("");
    setMycErrorMsg("");
    setMycSuccessMsg("");
  };

  // ─── Singapore Court Check Handlers ───
  const handleSingaporeCourtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSgcErrorMsg("");
    setSgcSuccessMsg("");

    const isSettingsIncomplete = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsIncomplete) {
      setSgcErrorMsg("Please complete your profile settings before creating requests.");
      return;
    }

    if (!sgcCandidateName.trim()) {
      setSgcErrorMsg("Candidate Full Name is required.");
      return;
    }

    if (sgcGender === "Female" && sgcIsMarried && !sgcHusbandName.trim()) {
      setSgcErrorMsg("Husband's Name is required when the candidate is married");
      return;
    }

    if (!sgcAddresses || sgcAddresses.length === 0) {
      setSgcErrorMsg("Please provide at least one address / target district");
      return;
    }

    for (let i = 0; i < sgcAddresses.length; i++) {
      if (!sgcAddresses[i].state) {
        setSgcErrorMsg(`Address ${i + 1}: Region / Division is required`);
        return;
      }
      if (!sgcAddresses[i].city.trim()) {
        setSgcErrorMsg(`Address ${i + 1}: District / Town is required`);
        return;
      }
      if (sgcAddresses[i].fromYear > sgcAddresses[i].toYear) {
        setSgcErrorMsg(`Address ${i + 1}: "From Year" must be before or equal to "To Year"`);
        return;
      }
      if (sgcAddresses[i].toYear - sgcAddresses[i].fromYear + 1 > 3) {
        setSgcErrorMsg(`Address ${i + 1}: Maximum 3-year search span allowed per address`);
        return;
      }
    }

    if (!sgcRequestingOrgName.trim()) {
      setSgcErrorMsg("Requesting ORG Name is required.");
      return;
    }

    setSgcSubmitting(true);
    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);
      const res = await addSingaporeCourtVerification({
        candidateName: sgcCandidateName.trim(),
        candidateDob: sgcCandidateDob.trim(),
        candidateFatherName: sgcFatherName.trim(),
        candidateMotherName: sgcMotherName.trim(),
        candidateIsMarried: sgcIsMarried,
        candidateHusbandName: (sgcGender === "Female" && sgcIsMarried) ? sgcHusbandName.trim() : undefined,
        gender: sgcGender !== "Not required" ? sgcGender : undefined,
        idProofType: sgcIdProofType || undefined,
        idProofNumber: sgcIdProofNumber.trim() || undefined,
        court: sgcCourt.trim(),
        hearingType: sgcHearingType.trim(),
        startDate: sgcStartDate.trim(),
        endDate: sgcEndDate.trim(),
        judgeName: sgcJudgeName.trim(),
        lawFirm: sgcLawFirm.trim(),
        addresses: sgcAddresses.map(addr => ({
          ...addr,
          state: addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : addr.state,
          stateCode: addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : addr.stateCode,
          city: addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : addr.city,
          districtCode: addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : addr.districtCode
        })),
        orgName: effectiveOrgName,
        requestingOrgName: sgcRequestingOrgName.trim(),
        idProofFile: sgcIdProofFile,
        idProofFileName: sgcIdProofFileName,
      });

      if (res && res.success) {
        setSgcSuccessMsg("Singapore Court check initiated! Querying Singapore Court hearing lists...");
        setSgcCreatedId(res.id);
        setSgcCandidateName("");
        setSgcCandidateDob("");
        setSgcFatherName("");
        setSgcMotherName("");
        setSgcGender("Not required");
        setSgcIsMarried(false);
        setSgcHusbandName("");
        setSgcIdProofType("");
        setSgcIdProofNumber("");
        setSgcAddresses([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "Singapore", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }]);
        setSgcCourt("");
        setSgcHearingType("");
        setSgcStartDate("");
        setSgcEndDate("");
        setSgcJudgeName("");
        setSgcLawFirm("");
        setSgcRequestingOrgName("");
        setSgcIdProofFile(null);
        setSgcIdProofFileName("");
      } else {
        setSgcErrorMsg(res?.error || "Failed to submit Singapore Court check");
      }
    } catch (err: any) {
      setSgcErrorMsg(err?.message || "Failed to submit Singapore Court check");
    } finally {
      setSgcSubmitting(false);
    }
  };

  const handleSingaporeCourtCancel = () => {
    setSgcCandidateName("");
    setSgcCandidateDob("");
    setSgcFatherName("");
    setSgcMotherName("");
    setSgcGender("Not required");
    setSgcIsMarried(false);
    setSgcHusbandName("");
    setSgcIdProofType("");
    setSgcIdProofNumber("");
    setSgcAddresses([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "Singapore", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }]);
    setSgcCourt("");
    setSgcHearingType("");
    setSgcStartDate("");
    setSgcEndDate("");
    setSgcJudgeName("");
    setSgcLawFirm("");
    setSgcRequestingOrgName("");
    setSgcIdProofFile(null);
    setSgcIdProofFileName("");
    setSgcErrorMsg("");
    setSgcSuccessMsg("");
  };

  // ─── Philippines Court Check Handlers ───
  const handlePhilippinesCourtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhcErrorMsg("");
    setPhcSuccessMsg("");

    const isSettingsIncomplete = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsIncomplete) {
      setPhcErrorMsg("Please complete your profile settings before creating requests.");
      return;
    }

    if (!phcCandidateName.trim()) {
      setPhcErrorMsg("Candidate / Party Full Name is required.");
      return;
    }

    if (phcGender === "Female" && phcIsMarried && !phcHusbandName.trim()) {
      setPhcErrorMsg("Husband's Name is required when the candidate is married");
      return;
    }

    if (!phcAddresses || phcAddresses.length === 0) {
      setPhcErrorMsg("Please provide at least one address / target province");
      return;
    }

    for (let i = 0; i < phcAddresses.length; i++) {
      if (!phcAddresses[i].state) {
        setPhcErrorMsg(`Address ${i + 1}: State / Province is required`);
        return;
      }
      if (!phcAddresses[i].city.trim()) {
        setPhcErrorMsg(`Address ${i + 1}: District / City is required`);
        return;
      }
      if (phcAddresses[i].fromYear > phcAddresses[i].toYear) {
        setPhcErrorMsg(`Address ${i + 1}: "From Year" must be before or equal to "To Year"`);
        return;
      }
      if (phcAddresses[i].toYear - phcAddresses[i].fromYear + 1 > 3) {
        setPhcErrorMsg(`Address ${i + 1}: Maximum 3-year search span allowed per address`);
        return;
      }
    }

    if (!phcRequestingOrgName.trim()) {
      setPhcErrorMsg("Requesting ORG Name is required.");
      return;
    }

    setPhcSubmitting(true);
    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);
      const res = await addPhilippinesCourtVerification({
        candidateName: phcCandidateName.trim(),
        candidateDob: phcCandidateDob.trim(),
        candidateFatherName: phcFatherName.trim(),
        candidateMotherName: phcMotherName.trim(),
        candidateIsMarried: phcIsMarried,
        candidateHusbandName: (phcGender === "Female" && phcIsMarried) ? phcHusbandName.trim() : undefined,
        gender: phcGender !== "Not required" ? phcGender : undefined,
        idProofType: phcIdProofType || undefined,
        idProofNumber: phcIdProofNumber.trim() || undefined,
        partyName: phcPartyName.trim() || phcCandidateName.trim(),
        caseNo: phcCaseNo.trim(),
        station: phcStation.trim(),
        addresses: phcAddresses.map(addr => ({
          ...addr,
          state: addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : addr.state,
          stateCode: addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : addr.stateCode,
          city: addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : addr.city,
          districtCode: addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : addr.districtCode
        })),
        orgName: effectiveOrgName,
        requestingOrgName: phcRequestingOrgName.trim(),
        idProofFile: phcIdProofFile,
        idProofFileName: phcIdProofFileName,
      });

      if (res && res.success) {
        setPhcSuccessMsg("Philippines Court check initiated! Querying Philippine judicial case dockets...");
        setPhcCreatedId(res.id);
        setPhcCandidateName("");
        setPhcCandidateDob("");
        setPhcFatherName("");
        setPhcMotherName("");
        setPhcGender("Not required");
        setPhcIsMarried(false);
        setPhcHusbandName("");
        setPhcIdProofType("");
        setPhcIdProofNumber("");
        setPhcAddresses([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "Philippines", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }]);
        setPhcPartyName("");
        setPhcCaseNo("");
        setPhcStation("");
        setPhcRequestingOrgName("");
        setPhcIdProofFile(null);
        setPhcIdProofFileName("");
      } else {
        setPhcErrorMsg(res?.error || "Failed to submit Philippines Court check");
      }
    } catch (err: any) {
      setPhcErrorMsg(err?.message || "Failed to submit Philippines Court check");
    } finally {
      setPhcSubmitting(false);
    }
  };

  const handlePhilippinesCourtCancel = () => {
    setPhcCandidateName("");
    setPhcCandidateDob("");
    setPhcFatherName("");
    setPhcMotherName("");
    setPhcGender("Not required");
    setPhcIsMarried(false);
    setPhcHusbandName("");
    setPhcIdProofType("");
    setPhcIdProofNumber("");
    setPhcAddresses([{ address: "", city: "", state: "", stateCode: "", districtCode: "", country: "Philippines", fromYear: new Date().getFullYear() - 2, toYear: new Date().getFullYear() }]);
    setPhcPartyName("");
    setPhcCaseNo("");
    setPhcStation("");
    setPhcRequestingOrgName("");
    setPhcIdProofFile(null);
    setPhcIdProofFileName("");
    setPhcErrorMsg("");
    setPhcSuccessMsg("");
  };

  // ─── Passport Check Handlers ───
  const handlePassportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassportErrorMsg(null);
    setPassportSuccessMsg("");

    if (!passportFileNumber.trim() || !passportDob) {
      setPassportErrorMsg("Please enter both Passport File Number and Date of Birth.");
      return;
    }

    if (!passportRequestingOrgName.trim()) {
      setPassportErrorMsg("Requesting ORG Name is required.");
      return;
    }

    setPassportSubmitting(true);
    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);
      const res = await addPassportVerification({
        fileNumber: passportFileNumber.trim(),
        dateOfBirth: passportDob,
        orgName: effectiveOrgName,
        requestingOrgName: passportRequestingOrgName.trim(),
        idProofFile: passportIdProofFile,
        idProofFileName: passportIdProofFileName,
      });

      if (res && res.success) {
        setPassportCreatedId(res.id);
        setPassportCreatedData(res.passportData);
        setPassportSuccessMsg("Passport verification completed successfully!");
        setPassportIdProofFile(null);
        setPassportIdProofFileName("");
      } else {
        setPassportErrorMsg(res?.error || "Failed to query Passport Seva portal.");
      }
    } catch (err: any) {
      setPassportErrorMsg(err.message || "An error occurred while tracking passport status.");
    } finally {
      setPassportSubmitting(false);
    }
  };

  const handlePassportCancel = () => {
    setPassportFileNumber("");
    setPassportDob("");
    setPassportRequestingOrgName("");
    setPassportErrorMsg(null);
    setPassportSuccessMsg("");
    setPassportCreatedId(null);
    setPassportCreatedData(null);
    setPassportIdProofFile(null);
    setPassportIdProofFileName("");
  };

  // ─── Digital Address Verification Handlers ───
  const handleDigitalAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDavErrorMsg("");
    setDavSuccessMsg("");

    const isSettingsInc = !settings ||
      !settings.contactFirstName?.trim() ||
      !settings.contactLastName?.trim() ||
      !settings.address?.trim() ||
      !settings.city?.trim() ||
      !settings.postalCode?.trim();

    if (isSettingsInc) {
      setDavErrorMsg("Please complete your profile settings before creating requests.");
      return;
    }

    if (!davCandidateName.trim()) {
      setDavErrorMsg("Candidate Name is required");
      return;
    }
    if (!davCandidateEmail.trim()) {
      setDavErrorMsg("Candidate Email is required");
      return;
    }
    if (!davCandidateAddress.trim()) {
      setDavErrorMsg("Candidate Address is required");
      return;
    }
    if (!davRequestingOrgName.trim()) {
      setDavErrorMsg("Requesting ORG Name is required");
      return;
    }

    setDavSubmitting(true);
    try {
      const effectiveOrgName = isAdmin ? (orgName || profile?.org_name || "Cluso Infolink") : (profile?.org_name || orgName);
      const res = await addDigitalAddressVerification({
        candidateName: davCandidateName.trim(),
        candidateEmail: davCandidateEmail.trim(),
        candidateAddress: davCandidateAddress.trim(),
        orgName: effectiveOrgName,
        requestingOrgName: davRequestingOrgName.trim(),
      });

      if (res && res.success) {
        setDavSuccessMsg("Digital address verification request created successfully!");
        setDavCreatedCredentials({
          id: res.id,
          name: davCandidateName,
          email: davCandidateEmail.toLowerCase().trim(),
          setupUrl: res.setupUrl,
        });
        setDavCandidateName("");
        setDavCandidateEmail("");
        setDavCandidateAddress("");
        setDavRequestingOrgName("");
      } else {
        setDavErrorMsg(res?.error || "Failed to create digital address verification request");
      }
    } catch (err: any) {
      setDavErrorMsg(err?.message || "Failed to create digital address verification request");
    } finally {
      setDavSubmitting(false);
    }
  };

  const handleDigitalAddressCancel = () => {
    setDavCandidateName("");
    setDavCandidateEmail("");
    setDavCandidateAddress("");
    setDavRequestingOrgName("");
    setDavErrorMsg("");
    setDavSuccessMsg("");
    setDavCreatedCredentials(null);
    setDavCopiedUrl(false);
  };

  const isSettingsIncomplete = !settings ||
    !settings.contactFirstName?.trim() ||
    !settings.contactLastName?.trim() ||
    !settings.address?.trim() ||
    !settings.city?.trim() ||
    !settings.postalCode?.trim();

  return (
    <div className="flex flex-col gap-6 pt-4 animate-fade-in pb-12">
      <div className="flex flex-col gap-1 border-b border-[#f0f5ea] pb-5 mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#00450e] bg-[#f0f5ea]/60 px-2.5 py-1 rounded-full w-fit uppercase tracking-wider font-label-caps border border-[#eaf0e4]/60">
          <Sparkles className="w-3.5 h-3.5 text-[#181d16]" />
          <span>Quick verification</span>
        </div>
        <h2 className="font-display-lg text-primary font-bold tracking-tight text-3xl mt-2 text-[#181d16]">Candidate Verification</h2>
        <p className="text-secondary mt-1 text-sm">Select a verification service and initiate a new request.</p>
      </div>

      {/* Service Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 w-full">
        {identityEnabled && (
          <button
            type="button"
            onClick={() => setActiveService("identity")}
            className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
              activeService === "identity"
                ? "border-[#181d16] bg-white shadow-md"
                : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-all ${
              activeService === "identity"
                ? "bg-[#181d16] text-white"
                : "bg-[#f0f5ea]/60 text-[#00450e] group-hover:bg-[#e0e8d8]"
            }`}>
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className={`font-semibold text-sm ${activeService === "identity" ? "text-[#181d16]" : "text-[#475569]"}`}>
                Identity Check
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">DigiLocker verified identity</div>
            </div>
          </button>
        )}

        {courtRecordEnabled && (
          <button
            type="button"
            onClick={() => setActiveService("court_record")}
            className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
              activeService === "court_record"
                ? "border-[#181d16] bg-white shadow-md"
                : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-all ${
              activeService === "court_record"
                ? "bg-[#181d16] text-white"
                : "bg-[#f0f5ea]/60 text-[#00450e] group-hover:bg-[#e0e8d8]"
            }`}>
              <Scale className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className={`font-semibold text-sm ${activeService === "court_record" ? "text-[#181d16]" : "text-[#475569]"}`}>
                Court Record Check
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">eCourts India search</div>
            </div>
          </button>
        )}

        {employmentEnabled && (
          <button
            type="button"
            onClick={() => setActiveService("employment")}
            className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
              activeService === "employment"
                ? "border-[#181d16] bg-white shadow-md"
                : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-all ${
              activeService === "employment"
                ? "bg-[#181d16] text-white"
                : "bg-[#f0f5ea]/60 text-[#00450e] group-hover:bg-[#e0e8d8]"
            }`}>
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className={`font-semibold text-sm ${activeService === "employment" ? "text-[#181d16]" : "text-[#475569]"}`}>
                Employment Verification
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">Verify past employment</div>
            </div>
          </button>
        )}

        {educationEnabled && (
          <button
            type="button"
            onClick={() => setActiveService("education")}
            className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
              activeService === "education"
                ? "border-[#181d16] bg-white shadow-md"
                : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-all ${
              activeService === "education"
                ? "bg-[#181d16] text-white"
                : "bg-[#f0f5ea]/60 text-[#00450e] group-hover:bg-[#e0e8d8]"
            }`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className={`font-semibold text-sm ${activeService === "education" ? "text-[#181d16]" : "text-[#475569]"}`}>
                Education Verification
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">Verify degree & credentials</div>
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveService("interpol")}
          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
            activeService === "interpol"
              ? "border-[#181d16] bg-white shadow-md"
              : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
          }`}
        >
          <div className={`p-2.5 rounded-xl transition-all ${
            activeService === "interpol"
              ? "bg-[#181d16] text-white"
              : "bg-[#f0f5ea]/60 text-[#00450e] group-hover:bg-[#e0e8d8]"
          }`}>
            <Globe className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className={`font-semibold text-sm ${activeService === "interpol" ? "text-[#181d16]" : "text-[#475569]"}`}>
              Interpol Check
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Red, Yellow, CBI Check</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveService("rednotice_worldwide")}
          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
            activeService === "rednotice_worldwide"
              ? "border-[#181d16] bg-white shadow-md"
              : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
          }`}
        >
          <div className={`p-2.5 rounded-xl transition-all ${
            activeService === "rednotice_worldwide"
              ? "bg-[#181d16] text-white"
              : "bg-rose-50 text-rose-700 group-hover:bg-rose-100"
          }`}>
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-left">
            <div className={`font-semibold text-sm ${activeService === "rednotice_worldwide" ? "text-[#181d16]" : "text-[#475569]"}`}>
              Red Notice Worldwide
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Global Red Notices DB</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveService("passport")}
          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
            activeService === "passport"
              ? "border-[#181d16] bg-white shadow-md"
              : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
          }`}
        >
          <div className={`p-2.5 rounded-xl transition-all ${
            activeService === "passport"
              ? "bg-[#181d16] text-white"
              : "bg-[#f0f5ea]/60 text-[#00450e] group-hover:bg-[#e0e8d8]"
          }`}>
            <FileCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className={`font-semibold text-sm ${activeService === "passport" ? "text-[#181d16]" : "text-[#475569]"}`}>
              Passport Check
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Passport Seva status</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveService("digital_address")}
          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
            activeService === "digital_address"
              ? "border-[#181d16] bg-white shadow-md"
              : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
          }`}
        >
          <div className={`p-2.5 rounded-xl transition-all ${
            activeService === "digital_address"
              ? "bg-[#181d16] text-white"
              : "bg-[#f0f5ea]/60 text-[#00450e] group-hover:bg-[#e0e8d8]"
          }`}>
            <MapPin className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className={`font-semibold text-sm ${activeService === "digital_address" ? "text-[#181d16]" : "text-[#475569]"}`}>
              Digital Address
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Geo-tagged photo verify</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveService("saflii_court")}
          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
            activeService === "saflii_court"
              ? "border-[#181d16] bg-white shadow-md"
              : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
          }`}
        >
          <div className={`p-2.5 rounded-xl transition-all ${
            activeService === "saflii_court"
              ? "bg-[#181d16] text-white"
              : "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100"
          }`}>
            <Scale className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className={`font-semibold text-sm ${activeService === "saflii_court" ? "text-[#181d16]" : "text-[#475569]"}`}>
              SA Court Check
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Southern Africa Courts</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveService("saps_wanted")}
          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
            activeService === "saps_wanted"
              ? "border-[#181d16] bg-white shadow-md"
              : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
          }`}
        >
          <div className={`p-2.5 rounded-xl transition-all ${
            activeService === "saps_wanted"
              ? "bg-[#181d16] text-white"
              : "bg-blue-50 text-blue-800 group-hover:bg-blue-100"
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className={`font-semibold text-sm ${activeService === "saps_wanted" ? "text-[#181d16]" : "text-[#475569]"}`}>
              SAPS Wanted
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">South Africa Police Registry</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveService("uk_court")}
          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
            activeService === "uk_court"
              ? "border-[#181d16] bg-white shadow-md"
              : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
          }`}
        >
          <div className={`p-2.5 rounded-xl transition-all ${
            activeService === "uk_court"
              ? "bg-[#181d16] text-white"
              : "bg-indigo-50 text-indigo-800 group-hover:bg-indigo-100"
          }`}>
            <Scale className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-left">
            <div className={`font-semibold text-sm ${activeService === "uk_court" ? "text-[#181d16]" : "text-[#475569]"}`}>
              UK Court Check
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Judiciary of England & Wales</div>
          </div>
        </button>

        <button
          type="button"
          id="tab-malaysia-court"
          onClick={() => setActiveService("malaysia_court")}
          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
            activeService === "malaysia_court"
              ? "border-[#181d16] bg-white shadow-md"
              : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
          }`}
        >
          <div className={`p-2.5 rounded-xl transition-all ${
            activeService === "malaysia_court"
              ? "bg-[#181d16] text-white"
              : "bg-emerald-50 text-emerald-800 group-hover:bg-emerald-100"
          }`}>
            <Scale className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-left">
            <div className={`font-semibold text-sm ${activeService === "malaysia_court" ? "text-[#181d16]" : "text-[#475569]"}`}>
              Malaysia Court Check
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Portal eJudgment Kehakiman</div>
          </div>
        </button>

        <button
          type="button"
          id="tab-singapore-court"
          onClick={() => setActiveService("singapore_court")}
          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
            activeService === "singapore_court"
              ? "border-[#181d16] bg-white shadow-md"
              : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
          }`}
        >
          <div className={`p-2.5 rounded-xl transition-all ${
            activeService === "singapore_court"
              ? "bg-[#181d16] text-white"
              : "bg-rose-50 text-rose-800 group-hover:bg-rose-100"
          }`}>
            <Scale className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-left">
            <div className={`font-semibold text-sm ${activeService === "singapore_court" ? "text-[#181d16]" : "text-[#475569]"}`}>
              Singapore Court Check
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">State & Supreme Courts</div>
          </div>
        </button>

        <button
          type="button"
          id="tab-philippines-court"
          onClick={() => setActiveService("philippines_court")}
          className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
            activeService === "philippines_court"
              ? "border-[#181d16] bg-white shadow-md"
              : "border-[#eaf0e4] bg-[#f6fbf0]/50 hover:border-[#d0dbc6] hover:bg-white/80"
          }`}
        >
          <div className={`p-2.5 rounded-xl transition-all ${
            activeService === "philippines_court"
              ? "bg-[#181d16] text-white"
              : "bg-amber-50 text-amber-800 group-hover:bg-amber-100"
          }`}>
            <Scale className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-left">
            <div className={`font-semibold text-sm ${activeService === "philippines_court" ? "text-[#181d16]" : "text-[#475569]"}`}>
              Philippines Court Check
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Supreme & Regional Trial Courts</div>
          </div>
        </button>

        {!identityEnabled && !courtRecordEnabled && !employmentEnabled && !educationEnabled && activeService !== "interpol" && (
          <div className="flex-1 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-rose-800">All verification services are currently deactivated by the administrator.</p>
          </div>
        )}
      </div>



      {/* ═══════════════════════════════════════════════════ */}
      {/* IDENTITY CHECK FORM (existing functionality) */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "identity" && identityEnabled && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Form Alerts */}
            {successMsg && !createdCredentials && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Form Card */}
            <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 w-full">
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#eaf0e4] via-[#FFF4CC] to-[#f0f5ea]"></div>

            {/* Subtle decorative background shapes */}
            <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-[#f0f5ea]/35 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-12 -top-12 w-32 h-32 bg-[#FFF4CC]/20 rounded-full blur-2xl pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-[#f0f5ea]/40 rounded-xl border border-[#eaf0e4]/60">
                  <UserPlus className="w-5 h-5 text-[#00450e]" />
                </div>
                <h3 className="font-semibold text-[#181d16] text-lg">Identity Check</h3>
              </div>

              {/* Candidate Name Field */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="candidate-name">
                  Candidate Name
                </label>
                <input
                  id="candidate-name"
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  autoComplete="off"
                  disabled={isSettingsIncomplete}
                  className={`border border-[#eaf0e4] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold ${
                    isSettingsIncomplete ? "bg-slate-100/60 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                  }`}
                  placeholder="Enter the candidate name"
                />
              </div>

              {/* Candidate Email ID Field */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="candidate-email">
                  Candidate Email ID
                </label>
                <input
                  id="candidate-email"
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  autoComplete="off"
                  disabled={isSettingsIncomplete}
                  className={`border border-[#eaf0e4] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold ${
                    isSettingsIncomplete ? "bg-slate-100/60 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                  }`}
                  placeholder="Enter the candidate email ID"
                />
              </div>

              {/* Requesting ORG Name Field */}
              <div className="flex flex-col gap-2 relative">
                <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="org-name">
                  {isAdmin ? "Target Client ORG Name" : "Requesting ORG Name"}
                </label>
                <div className="relative">
                  <input
                    id="org-name"
                    type="text"
                    value={requestingOrgName}
                    onChange={(e) => {
                      setRequestingOrgName(e.target.value);
                      setShowOrgDropdown(true);
                    }}
                    onFocus={() => setShowOrgDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setShowOrgDropdown(false), 200);
                    }}
                    autoComplete="off"
                    disabled={isSettingsIncomplete}
                    className={`w-full border border-[#eaf0e4] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold ${
                      isSettingsIncomplete ? "bg-slate-100/60 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                    }`}
                    placeholder={isAdmin ? "Enter target client organization name (e.g., TCS)" : "Enter the organization name requiring the verification"}
                  />

                  {showOrgDropdown && filteredOrgs.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-[#eaf0e4] rounded-xl shadow-lg z-30 overflow-hidden max-h-48 overflow-y-auto animate-fade-in">
                      <div className="p-1 flex flex-col gap-1 font-body-sm">
                        {filteredOrgs.map((org) => (
                          <div
                            key={org}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-[#f0f5ea]/35 text-[#181d16] font-semibold cursor-pointer group/item"
                            onMouseDown={() => {
                              setRequestingOrgName(org);
                              setShowOrgDropdown(false);
                            }}
                          >
                            <span className="flex-1 text-left">{org}</span>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (typeof removeRecentRequestingOrg === 'function') removeRecentRequestingOrg(org);
                              }}
                              title="Remove from history"
                              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-650 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSettingsIncomplete}
                  className={`px-6 py-3 border border-[#eaf0e4] rounded-xl font-semibold text-sm text-[#334155] hover:bg-[#f6fbf0] hover:text-[#181d16] transition-all bg-white ${
                    isSettingsIncomplete ? "opacity-50 cursor-not-allowed hover:bg-white hover:text-[#334155]" : "cursor-pointer"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettingsIncomplete}
                  className={`px-6 py-3 bg-[#181d16] text-white hover:bg-[#1E293B] active:scale-95 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm group ${
                    isSettingsIncomplete ? "opacity-50 cursor-not-allowed hover:bg-[#181d16] active:scale-100" : "cursor-pointer"
                  }`}
                >
                  <span>Create Request</span>
                  <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Credentials Modal */}
          {createdCredentials && (
            <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in">
              <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-[#E6F8F3] border border-[#A3EAD6] rounded-full flex items-center justify-center text-[#00684A] mb-2 animate-bounce-subtle">
                    <CheckCircle className="w-8 h-8 text-[#00a877]" />
                  </div>
                  <h3 className="font-headline-md text-[#181d16] font-bold text-xl">Request Initiated!</h3>
                  <p className="font-body-sm text-[#475569] leading-relaxed">
                    A verification request has been successfully created for <strong className="text-[#181d16] font-bold">{createdCredentials.name}</strong>.
                  </p>

                  {/* Credentials Box */}
                  <div className="w-full mt-4 p-5 bg-[#f0f5ea]/25 border border-[#eaf0e4] rounded-2xl text-left flex flex-col gap-3 relative overflow-hidden shadow-2xs">
                    <div className="absolute right-3 top-3">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-[#181d16] bg-white border border-[#eaf0e4] px-2 py-0.5 rounded">
                        Direct Login Link
                      </span>
                    </div>

                    {createdCredentials.setupUrl ? (
                      <div className="flex flex-col gap-1 pt-3">
                        <span className="font-label-caps text-[#334155] text-[10px] uppercase font-semibold tracking-wider">Candidate Direct Login Link</span>
                        <p className="text-[11px] text-[#475569] leading-relaxed mb-2">
                          Share this direct login link with the candidate. Credentials are embedded and will pre-fill automatically.
                        </p>
                            <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-[#eaf0e4]/60 gap-3 mt-1 shadow-2xs">
                              {(() => {
                                const formattedUrl = formatSetupUrl(createdCredentials.setupUrl);
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
                            </div>

                        {/* Pre-filled credentials detail */}
                        {(() => {
                          const params = getUrlParams(createdCredentials.setupUrl);
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
                    ) : (
                      <div className="text-xs text-[#475569] pt-3">Login link generation failed. Please try again.</div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedCredentials(null);
                        setSuccessMsg("");
                      }}
                      className="flex-1 py-3 border border-[#eaf0e4] rounded-xl font-semibold text-xs text-[#334155] hover:bg-[#f6fbf0] transition-colors cursor-pointer bg-white"
                    >
                      Create Another
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedCredentials(null);
                        router.push("/client/summary");
                      }}
                      className="flex-1 py-3 bg-[#181d16] text-white rounded-xl font-semibold text-xs hover:bg-[#1E293B] transition-all cursor-pointer shadow-sm"
                    >
                      Go to Summary
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
          
          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram 
              title="Identity Check Data Flow" 
              activeService="identity" 
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* COURT RECORD CHECK FORM (new) */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "court_record" && courtRecordEnabled && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Form Alerts */}
            {crSuccessMsg && !crCreatedId && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{crSuccessMsg}</span>
              </div>
            )}

            {crErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{crErrorMsg}</span>
              </div>
            )}

            {/* Court Record Form Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full">
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-green-500"></div>

            {/* Subtle decorative background shapes */}
            <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-[#f0f5ea]/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-12 -top-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <form onSubmit={handleCourtRecordSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl shadow-md shadow-emerald-600/10 text-white">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">Court Record Check</h3>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">eCourts India Database Search</p>
                </div>
              </div>

              {/* Candidate Full Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5" htmlFor="cr-candidate-name">
                  Candidate Full Name
                </label>
                <input
                  id="cr-candidate-name"
                  type="text"
                  value={crCandidateName}
                  onChange={(e) => setCrCandidateName(e.target.value)}
                  autoComplete="off"
                  disabled={isSettingsIncomplete}
                  className={`border border-slate-300 rounded-xl p-3.5 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white placeholder-slate-400 font-semibold shadow-2xs ${
                    isSettingsIncomplete ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                  }`}
                  placeholder="Enter candidate's full legal name"
                />
              </div>

              {/* Candidate DOB */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5" htmlFor="cr-candidate-dob">
                  Candidate Date of Birth
                </label>
                <div className="relative">
                  <input
                    id="cr-candidate-dob"
                    type="date"
                    value={crCandidateDob}
                    onChange={(e) => setCrCandidateDob(e.target.value)}
                    onFocus={() => {
                      if (!crCandidateDob) {
                        setCrCandidateDob("2000-01-01");
                      }
                    }}
                    onClick={() => {
                      if (!crCandidateDob) {
                        setCrCandidateDob("2000-01-01");
                      }
                    }}
                    disabled={isSettingsIncomplete}
                    className={`w-full border border-slate-300 rounded-xl p-3.5 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white placeholder-slate-400 font-semibold shadow-2xs ${
                      isSettingsIncomplete ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                    }`}
                  />
                </div>
                {crCandidateDob && (() => {
                  const dob = new Date(crCandidateDob);
                  const today = new Date();
                  if (isNaN(dob.getTime()) || dob > today) return null;
                  let years = today.getFullYear() - dob.getFullYear();
                  let months = today.getMonth() - dob.getMonth();
                  if (today.getDate() < dob.getDate()) months--;
                  if (months < 0) { years--; months += 12; }
                  return (
                    <p className="text-xs font-semibold text-slate-500 mt-1.5 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Age: <span className="font-bold text-slate-700">{years} year{years !== 1 ? "s" : ""}{months > 0 ? `, ${months} month${months !== 1 ? "s" : ""}` : ""}</span>
                    </p>
                  );
                })()}
              </div>

              {/* ID Proof Section */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    ID Proof (Optional)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* ID Type Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider" htmlFor="cr-id-proof-type">
                      ID Type
                    </label>
                    <div className="relative">
                      <select
                        id="cr-id-proof-type"
                        value={crIdProofType}
                        onChange={(e) => {
                          setCrIdProofType(e.target.value);
                          if (!e.target.value) {
                            setCrIdProofNumber("");
                            setCrIdProofFile(null);
                            setCrIdProofFileName("");
                          }
                        }}
                        disabled={isSettingsIncomplete}
                        className={`w-full border border-slate-300 rounded-xl p-3 pr-8 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white font-semibold text-sm appearance-none ${
                          isSettingsIncomplete ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : "cursor-pointer"
                        } ${!crIdProofType ? "text-slate-400" : ""}`}
                      >
                        <option value="">Select ID type</option>
                        <option value="Driving Licence">Driving Licence</option>
                        <option value="Passport">Passport</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* ID Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider" htmlFor="cr-id-proof-number">
                      ID Number
                    </label>
                    <input
                      id="cr-id-proof-number"
                      type="text"
                      value={crIdProofNumber}
                      onChange={(e) => setCrIdProofNumber(e.target.value)}
                      autoComplete="off"
                      disabled={isSettingsIncomplete || !crIdProofType}
                      className={`border border-slate-300 rounded-xl p-3 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white placeholder-slate-400 font-semibold text-sm shadow-2xs ${
                        isSettingsIncomplete || !crIdProofType ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                      }`}
                      placeholder={crIdProofType ? `Enter ${crIdProofType} number` : "Select ID type first"}
                    />
                  </div>
                </div>

                {/* File Upload */}
                {crIdProofType && (
                  <div className="flex flex-col gap-1.5 animate-fade-in">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Upload {crIdProofType} (PDF, JPG, PNG)
                    </label>
                    {!crIdProofFile ? (
                      <label
                        className={`border-2 border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-all hover:border-emerald-400 hover:bg-emerald-50/30 ${
                          isSettingsIncomplete ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        }`}
                      >
                        <UploadCloud className="w-7 h-7 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Click to upload file</span>
                        <span className="text-[10px] text-slate-400">PDF, JPG, or PNG — Max 2MB</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          disabled={isSettingsIncomplete}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              setCrErrorMsg("File size must be under 2MB.");
                              return;
                            }
                            setCrIdProofFileName(file.name);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setCrIdProofFile(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    ) : (
                      <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">{crIdProofFileName}</span>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCrIdProofFile(null);
                            setCrIdProofFileName("");
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Family Details Section */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    Family Details
                  </span>
                </div>

                {/* Father's Name & Mother's Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider" htmlFor="cr-father-name">
                      Father's Name *
                    </label>
                    <input
                      id="cr-father-name"
                      type="text"
                      value={crFatherName}
                      onChange={(e) => setCrFatherName(e.target.value)}
                      autoComplete="off"
                      disabled={isSettingsIncomplete}
                      className={`border border-slate-300 rounded-xl p-3 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white placeholder-slate-400 font-semibold text-sm shadow-2xs ${
                        isSettingsIncomplete ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                      }`}
                      placeholder="Enter father's full name"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider" htmlFor="cr-mother-name">
                      Mother's Name
                    </label>
                    <input
                      id="cr-mother-name"
                      type="text"
                      value={crMotherName}
                      onChange={(e) => setCrMotherName(e.target.value)}
                      autoComplete="off"
                      disabled={isSettingsIncomplete}
                      className={`border border-slate-300 rounded-xl p-3 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white placeholder-slate-400 font-semibold text-sm shadow-2xs ${
                        isSettingsIncomplete ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                      }`}
                      placeholder="Enter mother's full name"
                    />
                  </div>
                </div>

                {/* Gender & Marital Status row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Gender dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider" htmlFor="cr-gender">
                      Gender
                    </label>
                    <div className="relative">
                      <select
                        id="cr-gender"
                        value={crGender}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCrGender(val);
                          if (val === "Male" || val === "Not required") {
                            setCrHusbandName("");
                          }
                        }}
                        disabled={isSettingsIncomplete}
                        className={`w-full border border-slate-300 rounded-xl p-3 pr-8 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white font-semibold text-sm appearance-none ${
                          isSettingsIncomplete ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : "cursor-pointer"
                        }`}
                      >
                        <option value="Not required">Not required</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Marital Status Toggle */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Marital Status
                    </label>
                    <div className="flex items-center gap-3 h-[46px]">
                      <button
                        type="button"
                        onClick={() => {
                          setCrIsMarried(!crIsMarried);
                          if (crIsMarried) setCrHusbandName("");
                        }}
                        disabled={isSettingsIncomplete}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                          isSettingsIncomplete ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        } ${
                          crIsMarried ? "bg-emerald-600" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                            crIsMarried ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className={`text-xs font-semibold ${
                        crIsMarried ? "text-emerald-800" : "text-slate-500"
                      }`}>
                        {crIsMarried ? "Married" : "Not Married"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Husband's Name (conditional) */}
                {crGender === "Female" && crIsMarried && (
                  <div className="flex flex-col gap-1.5 animate-fade-in">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider" htmlFor="cr-husband-name">
                      Husband's Name *
                    </label>
                    <input
                      id="cr-husband-name"
                      type="text"
                      value={crHusbandName}
                      onChange={(e) => setCrHusbandName(e.target.value)}
                      autoComplete="off"
                      disabled={isSettingsIncomplete}
                      className={`border border-slate-300 rounded-xl p-3 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white placeholder-slate-400 font-semibold text-sm shadow-2xs ${
                        isSettingsIncomplete ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                      }`}
                      placeholder="Enter husband's full name"
                    />
                  </div>
                )}
              </div>

              {/* Addresses Section */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    Addresses
                  </label>
                </div>

                {crAddresses.map((addr, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-slate-50/70 via-white to-emerald-50/10 relative group transition-all hover:border-emerald-300 hover:shadow-xs shadow-2xs"
                  >
                    {crAddresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAddress(index)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-55 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Remove address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200/50">
                        Address {index + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Address Line */}
                      <input
                        type="text"
                        value={addr.address}
                        onChange={(e) => updateAddress(index, "address", e.target.value)}
                        disabled={isSettingsIncomplete}
                        className={`border border-slate-300 rounded-xl p-3 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white placeholder-slate-400 font-semibold text-sm shadow-2xs ${
                          isSettingsIncomplete ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                        }`}
                        placeholder="Street address (optional)"
                      />

                      {/* State + District Row (cascading dropdowns) */}
                      {(() => {
                        const matchedCountryObj = Country.getAllCountries().find(c => c.name === addr.country);
                        const countryStates = matchedCountryObj 
                          ? State.getStatesOfCountry(matchedCountryObj.isoCode).sort((a, b) => a.name.localeCompare(b.name)) 
                          : [];
                        const matchedStateObj = countryStates.find(s => s.isoCode === addr.stateCode);
                        const countryStateCities = (matchedCountryObj && matchedStateObj)
                          ? City.getCitiesOfState(matchedCountryObj.isoCode, matchedStateObj.isoCode).sort((a, b) => a.name.localeCompare(b.name))
                          : [];

                        return (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              {/* State Select */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                                  State *
                                </label>
                                <div className="relative">
                                  <select
                                    value={addr.stateCode.startsWith("Other:") ? "Other" : addr.stateCode}
                                    onChange={(e) => {
                                      const selectedCode = e.target.value;
                                      const selectedState = addr.country === "India" 
                                        ? INDIAN_STATES.find((s) => s.code === selectedCode)
                                        : countryStates.find((s) => s.isoCode === selectedCode);
                                      
                                      setCrAddresses((prev) =>
                                        prev.map((a, i) =>
                                          i === index
                                            ? { ...a, state: selectedCode === "Other" ? "Other" : (selectedState?.name || ""), stateCode: selectedCode, city: "", districtCode: "" }
                                            : a
                                        )
                                      );
                                      if (addr.country === "India" && selectedCode) {
                                        fetchDistrictsForState(selectedCode);
                                      }
                                    }}
                                    disabled={isSettingsIncomplete || !addr.country}
                                    className={`w-full border border-slate-300 rounded-xl p-3 pr-8 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white font-semibold text-sm appearance-none ${
                                      isSettingsIncomplete || !addr.country ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : "cursor-pointer"
                                    } ${!addr.stateCode ? "text-slate-400" : ""}`}
                                  >
                                    <option value="">Select state</option>
                                    {addr.country === "India" ? (
                                      sortedStates.map((state) => (
                                        <option key={state.code} value={state.code}>
                                          {state.name}
                                        </option>
                                      ))
                                    ) : (
                                      countryStates.map((state) => (
                                        <option key={state.isoCode} value={state.isoCode}>
                                          {state.name}
                                        </option>
                                      ))
                                    )}
                                    {addr.country && (
                                      <option value="Other">Other / Enter Manually</option>
                                    )}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                    <ChevronDown className="w-4 h-4" />
                                  </div>
                                </div>
                                {(addr.stateCode === "Other" || addr.stateCode.startsWith("Other:")) && (
                                  <input
                                    type="text"
                                    value={addr.stateCode.startsWith("Other:") ? addr.stateCode.substring(6) : ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCrAddresses((prev) =>
                                        prev.map((a, i) =>
                                          i === index
                                            ? { ...a, state: val, stateCode: "Other:" + val }
                                            : a
                                        )
                                      );
                                    }}
                                    placeholder="Enter custom state name"
                                    className="border border-slate-300 rounded-xl p-3 mt-1.5 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white placeholder-slate-400 font-semibold text-sm shadow-2xs animate-fade-in"
                                  />
                                )}
                              </div>

                              {/* City/District Select */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                  District/City *
                                  {addr.country === "India" && addr.stateCode && districtsCache[addr.stateCode]?.loading && (
                                    <span className="inline-block w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                  )}
                                </label>
                                <div className="relative">
                                  <select
                                    value={addr.districtCode.startsWith("Other:") ? "Other" : addr.districtCode}
                                    onChange={(e) => {
                                      const selectedDistCode = e.target.value;
                                      const distEntry = addr.country === "India"
                                        ? districtsCache[addr.stateCode]?.districts?.find((d) => d.value === selectedDistCode)
                                        : countryStateCities.find((c) => c.name === selectedDistCode);
                                      const distName = selectedDistCode === "Other" ? "Other" : (distEntry?.name || selectedDistCode);
                                      
                                      setCrAddresses((prev) =>
                                        prev.map((a, i) =>
                                          i === index
                                            ? { ...a, city: distName, districtCode: selectedDistCode }
                                            : a
                                        )
                                      );
                                    }}
                                    disabled={isSettingsIncomplete || !addr.stateCode || (addr.country === "India" && districtsCache[addr.stateCode]?.loading)}
                                    className={`w-full border border-slate-300 rounded-xl p-3 pr-8 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white font-semibold text-sm appearance-none ${
                                      isSettingsIncomplete || !addr.stateCode || (addr.country === "India" && districtsCache[addr.stateCode]?.loading)
                                        ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80"
                                        : "cursor-pointer"
                                    } ${!addr.districtCode ? "text-slate-400" : ""}`}
                                  >
                                    <option value="">
                                      {addr.country === "India" && districtsCache[addr.stateCode]?.loading
                                        ? "Loading districts..."
                                        : !addr.stateCode
                                          ? "Select state first"
                                          : addr.country === "India" && districtsCache[addr.stateCode]?.districts?.length === 0
                                            ? "No districts found"
                                            : "Select district/city"}
                                    </option>
                                    {addr.country === "India" ? (
                                      (districtsCache[addr.stateCode]?.districts || []).map((dist) => (
                                        <option key={dist.value} value={dist.value}>
                                          {dist.name}
                                        </option>
                                      ))
                                    ) : (
                                      countryStateCities.map((city) => (
                                        <option key={city.name} value={city.name}>
                                          {city.name}
                                        </option>
                                      ))
                                    )}
                                    {addr.stateCode && (
                                      <option value="Other">Other / Enter Manually</option>
                                    )}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                    <ChevronDown className="w-4 h-4" />
                                  </div>
                                </div>
                                {(addr.districtCode === "Other" || addr.districtCode.startsWith("Other:")) && (
                                  <input
                                    type="text"
                                    value={addr.districtCode.startsWith("Other:") ? addr.districtCode.substring(6) : ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCrAddresses((prev) =>
                                        prev.map((a, i) =>
                                          i === index
                                            ? { ...a, city: val, districtCode: "Other:" + val }
                                            : a
                                        )
                                      );
                                    }}
                                    placeholder="Enter custom city name"
                                    className="border border-slate-300 rounded-xl p-3 mt-1.5 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white placeholder-slate-400 font-semibold text-sm shadow-2xs animate-fade-in"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Country Select */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                                Country *
                              </label>
                              <div className="relative">
                                <select
                                  value={addr.country}
                                  onChange={(e) => {
                                    const selectedCountry = e.target.value;
                                    setCrAddresses((prev) =>
                                      prev.map((a, i) =>
                                        i === index
                                          ? { ...a, country: selectedCountry, state: "", stateCode: "", city: "", districtCode: "" }
                                          : a
                                      )
                                    );
                                  }}
                                  disabled={isSettingsIncomplete}
                                  className={`w-full border border-slate-300 rounded-xl p-3 pr-8 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white font-semibold text-sm appearance-none ${
                                    isSettingsIncomplete ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : "cursor-pointer"
                                  }`}
                                >
                                  <option value="">Select country</option>
                                  {[...Country.getAllCountries()].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                                    <option key={c.isoCode} value={c.name}>{c.name}</option>
                                  ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {/* Year Range (FROM → TO) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                            From Year *
                          </label>
                          <div className="relative">
                            <select
                              value={addr.fromYear}
                              onChange={(e) => {
                                const newFrom = Number(e.target.value);
                                setCrAddresses((prev) =>
                                  prev.map((a, i) => {
                                    if (i !== index) return a;
                                    // Auto-adjust toYear if span would exceed 3 years
                                    const maxTo = Math.min(newFrom + 2, currentYear);
                                    return { ...a, fromYear: newFrom, toYear: a.toYear > maxTo ? maxTo : (a.toYear < newFrom ? newFrom : a.toYear) };
                                  })
                                );
                              }}
                              disabled={isSettingsIncomplete}
                              className={`w-full border border-slate-300 rounded-xl p-3 pr-8 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white font-semibold text-sm appearance-none ${
                                isSettingsIncomplete ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : "cursor-pointer"
                              }`}
                            >
                              {Array.from({ length: currentYear - 2015 + 1 }, (_, idx) => currentYear - idx).map((yr) => (
                                <option key={yr} value={yr}>{yr}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                            To Year *
                          </label>
                          <div className="relative">
                            <select
                              value={addr.toYear}
                              onChange={(e) => {
                                const newTo = Number(e.target.value);
                                setCrAddresses((prev) =>
                                  prev.map((a, i) => {
                                    if (i !== index) return a;
                                    // Auto-adjust fromYear if span would exceed 3 years
                                    const minFrom = Math.max(newTo - 2, 2015);
                                    return { ...a, toYear: newTo, fromYear: a.fromYear < minFrom ? minFrom : (a.fromYear > newTo ? newTo : a.fromYear) };
                                  })
                                );
                              }}
                              disabled={isSettingsIncomplete}
                              className={`w-full border border-slate-300 rounded-xl p-3 pr-8 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white font-semibold text-sm appearance-none ${
                                isSettingsIncomplete ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : "cursor-pointer"
                              }`}
                            >
                              {Array.from({ length: Math.min(3, currentYear - addr.fromYear + 1) }, (_, idx) => addr.fromYear + idx).map((yr) => (
                                <option key={yr} value={yr}>{yr}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Year range hint */}
                      <p className="text-[9px] text-[#94a3b8] font-medium -mt-1">
                        Max 3-year span per address · Searching {addr.fromYear} → {addr.toYear} ({addr.toYear - addr.fromYear + 1} year{addr.toYear - addr.fromYear + 1 !== 1 ? "s" : ""})
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={addAddress}
                    disabled={isSettingsIncomplete}
                    className={`px-3 py-1.5 border border-slate-300 text-xs font-bold text-slate-800 hover:text-emerald-800 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-lg flex items-center gap-1 transition-all shadow-2xs ${
                      isSettingsIncomplete ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-700" />
                    Add Address
                  </button>
                </div>
              </div>

              {/* Requesting ORG Name */}
              <div className="flex flex-col gap-2 relative">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="cr-org-name">
                  {isAdmin ? "Target Client ORG Name" : "Requesting ORG Name"}
                </label>
                <div className="relative">
                  <input
                    id="cr-org-name"
                    type="text"
                    value={crRequestingOrgName}
                    onChange={(e) => {
                      setCrRequestingOrgName(e.target.value);
                      setCrShowOrgDropdown(true);
                    }}
                    onFocus={() => setCrShowOrgDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setCrShowOrgDropdown(false), 200);
                    }}
                    autoComplete="off"
                    disabled={isSettingsIncomplete}
                    className={`w-full border border-slate-300 rounded-xl p-3.5 font-body-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 transition-all bg-white placeholder-slate-400 font-semibold shadow-2xs ${
                      isSettingsIncomplete ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                    }`}
                    placeholder="Enter the organization name requiring the verification"
                  />

                  {crShowOrgDropdown && crFilteredOrgs.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-[#eaf0e4] rounded-xl shadow-lg z-30 overflow-hidden max-h-48 overflow-y-auto animate-fade-in">
                      <div className="p-1 flex flex-col gap-1 font-body-sm">
                        {crFilteredOrgs.map((org) => (
                          <div
                            key={org}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-[#f0f5ea]/35 text-[#181d16] font-semibold cursor-pointer group/item"
                            onMouseDown={() => {
                              setCrRequestingOrgName(org);
                              setCrShowOrgDropdown(false);
                            }}
                          >
                            <span className="flex-1 text-left">{org}</span>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (typeof removeRecentRequestingOrg === 'function') removeRecentRequestingOrg(org);
                              }}
                              title="Remove from history"
                              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-650 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>


              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 justify-end border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={handleCourtRecordCancel}
                  disabled={isSettingsIncomplete || crSubmitting}
                  className={`px-6 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all bg-white shadow-2xs ${
                    isSettingsIncomplete || crSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettingsIncomplete || crSubmitting}
                  className={`px-6 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white hover:brightness-110 active:scale-95 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-md shadow-slate-950/10 group ${
                    isSettingsIncomplete || crSubmitting ? "opacity-50 cursor-not-allowed hover:brightness-100 active:scale-100 shadow-none" : "cursor-pointer"
                  }`}
                >
                  {crSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      <span>Initiating Search...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Verification</span>
                      <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          </div>
          
          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram 
              title="Court Record Search Data Flow" 
              activeService="court_record" 
            />
          </div>

          {/* Success Modal for Court Record — rendered via Portal to escape CSS transform ancestors */}
          {crCreatedId && typeof document !== "undefined" && createPortal(
            <SuccessModal
              crCreatedId={crCreatedId}
              crCandidateName={crCandidateName}
              onCreateAnother={() => { setCrCreatedId(null); setCrSuccessMsg(""); }}
              onGoToSummary={() => { setCrCreatedId(null); router.push("/client/summary"); }}
            />,
            document.body
          )}
        </div>
      )}
      {/* ═══════════════════════════════════════════════════ */}
      {/* EMPLOYMENT VERIFICATION FORM */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "employment" && employmentEnabled && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Form Alerts */}
            {empSuccessMsg && !empCreatedCredentials && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{empSuccessMsg}</span>
              </div>
            )}

            {empErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{empErrorMsg}</span>
              </div>
            )}

            {/* Employment Form Card */}
            <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 w-full">
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#eaf0e4] via-[#dbeafe] to-[#f0f5ea]"></div>

            {/* Subtle decorative background shapes */}
            <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-[#f0f5ea]/35 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-12 -top-12 w-32 h-32 bg-[#dbeafe]/20 rounded-full blur-2xl pointer-events-none"></div>

            <form onSubmit={handleEmploymentSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-[#f0f5ea]/40 rounded-xl border border-[#eaf0e4]/60">
                  <Briefcase className="w-5 h-5 text-[#00450e]" />
                </div>
                <h3 className="font-semibold text-[#181d16] text-lg">Employment Verification</h3>
              </div>

              {/* Candidate Full Name Field */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="emp-candidate-name">
                  Candidate Full Name
                </label>
                <input
                  id="emp-candidate-name"
                  type="text"
                  value={empCandidateName}
                  onChange={(e) => setEmpCandidateName(e.target.value)}
                  autoComplete="off"
                  disabled={isSettingsIncomplete}
                  className={`border border-[#eaf0e4] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold ${
                    isSettingsIncomplete ? "bg-slate-100/60 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                  }`}
                  placeholder="Enter the candidate's full name"
                />
              </div>

              {/* Candidate Mobile Number */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="emp-candidate-mobile">
                  Mobile Number
                </label>
                <input
                  id="emp-candidate-mobile"
                  type="tel"
                  value={empCandidateMobile}
                  onChange={(e) => setEmpCandidateMobile(e.target.value)}
                  autoComplete="off"
                  disabled={isSettingsIncomplete}
                  className={`border border-[#eaf0e4] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold ${
                    isSettingsIncomplete ? "bg-slate-100/60 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                  }`}
                  placeholder="Enter mobile number (e.g. +91 9876543210)"
                />
              </div>

              {/* Candidate Email */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="emp-candidate-email">
                  Email {empSkipCandidateLogin ? "(Optional)" : ""}
                </label>
                <input
                  id="emp-candidate-email"
                  type="email"
                  value={empCandidateEmail}
                  onChange={(e) => setEmpCandidateEmail(e.target.value)}
                  autoComplete="off"
                  disabled={isSettingsIncomplete}
                  className={`border border-[#eaf0e4] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold ${
                    isSettingsIncomplete ? "bg-slate-100/60 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                  }`}
                  placeholder="Enter the candidate email ID"
                />
              </div>

              {/* Requesting ORG Name */}
              <div className="flex flex-col gap-2 relative">
                <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="emp-org-name">
                  {isAdmin ? "Target Client ORG Name" : "Requesting ORG Name"}
                </label>
                <div className="relative">
                  <input
                    id="emp-org-name"
                    type="text"
                    value={empRequestingOrgName}
                    onChange={(e) => {
                      setEmpRequestingOrgName(e.target.value);
                      setEmpShowOrgDropdown(true);
                    }}
                    onFocus={() => setEmpShowOrgDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setEmpShowOrgDropdown(false), 200);
                    }}
                    autoComplete="off"
                    disabled={isSettingsIncomplete}
                    className={`w-full border border-[#eaf0e4] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold ${
                      isSettingsIncomplete ? "bg-slate-100/60 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                    }`}
                    placeholder={isAdmin ? "Enter target client organization name" : "Enter the organization name requiring the verification"}
                  />

                  {empShowOrgDropdown && empFilteredOrgs.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-[#eaf0e4] rounded-xl shadow-lg z-30 overflow-hidden max-h-48 overflow-y-auto animate-fade-in">
                      <div className="p-1 flex flex-col gap-1 font-body-sm">
                        {empFilteredOrgs.map((org) => (
                          <div
                            key={org}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-[#f0f5ea]/35 text-[#181d16] font-semibold cursor-pointer group/item"
                            onMouseDown={() => {
                              setEmpRequestingOrgName(org);
                              setEmpShowOrgDropdown(false);
                            }}
                          >
                            <span className="flex-1 text-left">{org}</span>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (typeof removeRecentRequestingOrg === 'function') removeRecentRequestingOrg(org);
                              }}
                              title="Remove from history"
                              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-650 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>



              {/* Skip Candidate Login Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#f8faf6] border border-[#eaf0e4] rounded-2xl transition-all hover:border-[#d0dbc6] shadow-2xs">
                <div className="flex flex-col gap-0.5 pr-4">
                  <label htmlFor="emp-skip-login" className="font-semibold text-xs text-[#181d16] cursor-pointer flex items-center gap-1.5">
                    <span>Don't involve candidate (Fill details yourself)</span>
                  </label>
                  <p className="text-[11px] text-[#64748B] font-medium leading-normal">
                    Enable this if you prefer to fill the verification details directly without creating a candidate login.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    id="emp-skip-login"
                    type="checkbox"
                    checked={empSkipCandidateLogin}
                    onChange={(e) => setEmpSkipCandidateLogin(e.target.checked)}
                    disabled={isSettingsIncomplete}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00450e]"></div>
                </label>
              </div>


              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 justify-end">
                <button
                  type="button"
                  onClick={handleEmploymentCancel}
                  disabled={isSettingsIncomplete || empSubmitting}
                  className={`px-6 py-3 border border-[#eaf0e4] rounded-xl font-semibold text-sm text-[#334155] hover:bg-[#f6fbf0] hover:text-[#181d16] transition-all bg-white ${
                    isSettingsIncomplete || empSubmitting ? "opacity-50 cursor-not-allowed hover:bg-white hover:text-[#334155]" : "cursor-pointer"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettingsIncomplete || empSubmitting}
                  className={`px-6 py-3 bg-[#181d16] text-white hover:bg-[#1E293B] active:scale-95 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm group ${
                    isSettingsIncomplete || empSubmitting ? "opacity-50 cursor-not-allowed hover:bg-[#181d16] active:scale-100" : "cursor-pointer"
                  }`}
                >
                  {empSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Request</span>
                      <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Credentials Modal */}
          {empCreatedCredentials && (
            <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in">
              <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-[#E6F8F3] border border-[#A3EAD6] rounded-full flex items-center justify-center text-[#00684A] mb-2 animate-bounce-subtle">
                    <Briefcase className="w-8 h-8 text-[#00a877]" />
                  </div>
                  <h3 className="font-headline-md text-[#181d16] font-bold text-xl">Employment Verification Initiated!</h3>
                  <p className="font-body-sm text-[#475569] leading-relaxed">
                    A verification request has been successfully created for <strong className="text-[#181d16] font-bold">{empCreatedCredentials.name}</strong>.
                  </p>

                  {/* Credentials / Direct Fill Box */}
                  <div className="w-full mt-4 p-5 bg-[#f0f5ea]/25 border border-[#eaf0e4] rounded-2xl text-left flex flex-col gap-3 relative overflow-hidden shadow-2xs">
                    {empCreatedCredentials.skipCandidateLogin || !empCreatedCredentials.setupUrl ? (
                      <div className="flex flex-col gap-1 py-1">
                        <div className="flex items-center gap-2 text-[#00450e] font-bold text-xs">
                          <CheckCircle className="w-4 h-4 text-[#00a877]" />
                          <span>Candidate Login Skipped</span>
                        </div>
                        <p className="text-[11px] text-[#475569] leading-relaxed mt-1 font-medium">
                          No candidate user account or direct login link was generated for this verification request. You can view or manage this request directly from the summary.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="absolute right-3 top-3">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-[#181d16] bg-white border border-[#eaf0e4] px-2 py-0.5 rounded">
                            Direct Login Link
                          </span>
                        </div>

                        {empCreatedCredentials.setupUrl ? (
                          <div className="flex flex-col gap-1 pt-3">
                            <span className="font-label-caps text-[#334155] text-[10px] uppercase font-semibold tracking-wider">Candidate Direct Login Link</span>
                            <p className="text-[11px] text-[#475569] leading-relaxed mb-2">
                              Share this link with the candidate. They will be able to log in and fill their employment details.
                            </p>
                            <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-[#eaf0e4]/60 gap-3 mt-1 shadow-2xs">
                              {(() => {
                                const formattedUrl = formatSetupUrl(empCreatedCredentials.setupUrl);
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
                                          setEmpCopiedUrl(true);
                                          setTimeout(() => setEmpCopiedUrl(false), 2000);
                                        }}
                                        className="text-xs px-3 py-1.5 bg-[#181d16] text-white rounded-lg font-semibold hover:bg-[#1E293B] transition-all flex items-center gap-1.5 cursor-pointer"
                                      >
                                        {empCopiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{empCopiedUrl ? "Copied" : "Copy"}</span>
                                      </button>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            {/* Pre-filled credentials detail */}
                            {(() => {
                              const params = getUrlParams(empCreatedCredentials.setupUrl);
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
                              <span>The candidate can log in and fill their employment details using this link.</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-[#475569] pt-3">Login link generation failed. Please try again.</div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        const cred = empCreatedCredentials;
                        setEmpCreatedCredentials(null);
                        setEmpSuccessMsg("");
                        if (cred?.id) {
                          setActiveFillModal({
                            isOpen: true,
                            id: cred.id,
                            type: "employment",
                            name: cred.name,
                            initialData: { employments: empItems, pastOrganisations: empItems }
                          });
                        } else {
                          router.push("/client/summary");
                        }
                      }}
                      className="flex-1 py-3 bg-[#00450e] text-white rounded-xl font-bold text-xs hover:bg-[#00330a] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <FileEdit className="w-4 h-4 text-emerald-300" />
                      <span>Fill Details Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmpCreatedCredentials(null);
                        setEmpSuccessMsg("");
                      }}
                      className="py-3 px-4 border border-[#eaf0e4] rounded-xl font-semibold text-xs text-[#334155] hover:bg-[#f6fbf0] transition-colors cursor-pointer bg-white"
                    >
                      Create Another
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmpCreatedCredentials(null);
                        router.push("/client/summary");
                      }}
                      className="py-3 px-4 bg-[#181d16] text-white rounded-xl font-semibold text-xs hover:bg-[#1E293B] transition-all cursor-pointer shadow-sm"
                    >
                      Go to Summary
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
          
          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram 
              title="Employment Verification Flow" 
              activeService="employment" 
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* EDUCATION VERIFICATION FORM */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "education" && educationEnabled && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Form Alerts */}
            {eduSuccessMsg && !eduCreatedCredentials && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{eduSuccessMsg}</span>
              </div>
            )}

            {eduErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{eduErrorMsg}</span>
              </div>
            )}

            {/* Education Form Card */}
            <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 w-full">
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-650 via-indigo-500 to-blue-500"></div>

            <form onSubmit={handleEducationSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-gradient-to-br from-purple-700 to-indigo-850 rounded-xl shadow-md text-white">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">Education Verification</h3>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Initiate Candidate Degree Verification</p>
                </div>
              </div>

              {/* Candidate Full Name */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="edu-candidate-name">
                  Candidate Full Name
                </label>
                <input
                  id="edu-candidate-name"
                  type="text"
                  value={eduCandidateName}
                  onChange={(e) => setEduCandidateName(e.target.value)}
                  autoComplete="off"
                  disabled={isSettingsIncomplete}
                  className={`border border-[#eaf0e4] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold ${
                    isSettingsIncomplete ? "bg-slate-100/60 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                  }`}
                  placeholder="Enter candidate's full legal name"
                />
              </div>

              {/* Candidate Mobile Number */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="edu-candidate-mobile">
                  Mobile Number
                </label>
                <input
                  id="edu-candidate-mobile"
                  type="tel"
                  value={eduCandidateMobile}
                  onChange={(e) => setEduCandidateMobile(e.target.value)}
                  autoComplete="off"
                  disabled={isSettingsIncomplete}
                  className={`border border-[#eaf0e4] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold ${
                    isSettingsIncomplete ? "bg-slate-100/60 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                  }`}
                  placeholder="Enter mobile number (e.g. +91 9876543210)"
                />
              </div>

              {/* Candidate Email */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="edu-candidate-email">
                  Email {eduSkipCandidateLogin ? "(Optional)" : ""}
                </label>
                <input
                  id="edu-candidate-email"
                  type="email"
                  value={eduCandidateEmail}
                  onChange={(e) => setEduCandidateEmail(e.target.value)}
                  autoComplete="off"
                  disabled={isSettingsIncomplete}
                  className={`border border-[#eaf0e4] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold ${
                    isSettingsIncomplete ? "bg-slate-100/60 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                  }`}
                  placeholder="Enter the candidate email ID"
                />
              </div>

              {/* Requesting ORG Name */}
              <div className="flex flex-col gap-2 relative">
                <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="edu-org-name">
                  {isAdmin ? "Target Client ORG Name" : "Requesting ORG Name"}
                </label>
                <div className="relative">
                  <input
                    id="edu-org-name"
                    type="text"
                    value={eduRequestingOrgName}
                    onChange={(e) => {
                      setEduRequestingOrgName(e.target.value);
                      setEduShowOrgDropdown(true);
                    }}
                    onFocus={() => setEduShowOrgDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setEduShowOrgDropdown(false), 200);
                    }}
                    autoComplete="off"
                    disabled={isSettingsIncomplete}
                    className={`w-full border border-[#eaf0e4] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold ${
                      isSettingsIncomplete ? "bg-slate-100/60 text-slate-500 cursor-not-allowed border-slate-200 opacity-80" : ""
                    }`}
                    placeholder={isAdmin ? "Enter target client organization name" : "Enter the organization name requiring the verification"}
                  />

                  {eduShowOrgDropdown && eduFilteredOrgs.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-[#eaf0e4] rounded-xl shadow-lg z-30 overflow-hidden max-h-48 overflow-y-auto animate-fade-in">
                      <div className="p-1 flex flex-col gap-1 font-body-sm">
                        {eduFilteredOrgs.map((org) => (
                          <div
                            key={org}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-[#f0f5ea]/35 text-[#181d16] font-semibold cursor-pointer group/item"
                            onMouseDown={() => {
                              setEduRequestingOrgName(org);
                              setEduShowOrgDropdown(false);
                            }}
                          >
                            <span className="flex-1 text-left">{org}</span>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (typeof removeRecentRequestingOrg === 'function') removeRecentRequestingOrg(org);
                              }}
                              title="Remove from history"
                              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-650 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>



              {/* Skip Candidate Login Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#f8faf6] border border-[#eaf0e4] rounded-2xl transition-all hover:border-[#d0dbc6] shadow-2xs">
                <div className="flex flex-col gap-0.5 pr-4">
                  <label htmlFor="edu-skip-login" className="font-semibold text-xs text-[#181d16] cursor-pointer flex items-center gap-1.5">
                    <span>Don't involve candidate (Fill details yourself)</span>
                  </label>
                  <p className="text-[11px] text-[#64748B] font-medium leading-normal">
                    Enable this if you prefer to fill the verification details directly without creating a candidate login.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    id="edu-skip-login"
                    type="checkbox"
                    checked={eduSkipCandidateLogin}
                    onChange={(e) => setEduSkipCandidateLogin(e.target.checked)}
                    disabled={isSettingsIncomplete}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00450e]"></div>
                </label>
              </div>


              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 justify-end">
                <button
                  type="button"
                  onClick={handleEducationCancel}
                  disabled={isSettingsIncomplete || eduSubmitting}
                  className={`px-6 py-3 border border-[#eaf0e4] rounded-xl font-semibold text-sm text-[#334155] hover:bg-[#f6fbf0] hover:text-[#181d16] transition-all bg-white ${
                    isSettingsIncomplete || eduSubmitting ? "opacity-50 cursor-not-allowed hover:bg-white hover:text-[#334155]" : "cursor-pointer"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettingsIncomplete || eduSubmitting}
                  className={`px-6 py-3 bg-[#181d16] text-white hover:bg-[#1E293B] active:scale-95 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm group ${
                    isSettingsIncomplete || eduSubmitting ? "opacity-50 cursor-not-allowed hover:bg-[#181d16] active:scale-100" : "cursor-pointer"
                  }`}
                >
                  {eduSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Request</span>
                      <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Credentials Modal */}
          {eduCreatedCredentials && (
            <div className="fixed inset-0 bg-slate-400/10 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in">
              <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-[#E6F8F3] border border-[#A3EAD6] rounded-full flex items-center justify-center text-[#00684A] mb-2 animate-bounce-subtle">
                    <GraduationCap className="w-8 h-8 text-[#00a877]" />
                  </div>
                  <h3 className="font-headline-md text-[#181d16] font-bold text-xl">Education Verification Initiated!</h3>
                  <p className="font-body-sm text-[#475569] leading-relaxed">
                    A verification request has been successfully created for <strong className="text-[#181d16] font-bold">{eduCreatedCredentials.name}</strong>.
                  </p>

                  {/* Credentials / Direct Fill Box */}
                  <div className="w-full mt-4 p-5 bg-[#f0f5ea]/25 border border-[#eaf0e4] rounded-2xl text-left flex flex-col gap-3 relative overflow-hidden shadow-2xs">
                    {eduCreatedCredentials.skipCandidateLogin || !eduCreatedCredentials.setupUrl ? (
                      <div className="flex flex-col gap-1 py-1">
                        <div className="flex items-center gap-2 text-[#00450e] font-bold text-xs">
                          <CheckCircle className="w-4 h-4 text-[#00a877]" />
                          <span>Candidate Login Skipped</span>
                        </div>
                        <p className="text-[11px] text-[#475569] leading-relaxed mt-1 font-medium">
                          No candidate user account or direct login link was generated for this verification request. You can view or manage this request directly from the summary.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="absolute right-3 top-3">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-[#181d16] bg-white border border-[#eaf0e4] px-2 py-0.5 rounded">
                            Direct Login Link
                          </span>
                        </div>

                        {eduCreatedCredentials.setupUrl ? (
                          <div className="flex flex-col gap-1 pt-3">
                            <span className="font-label-caps text-[#334155] text-[10px] uppercase font-semibold tracking-wider">Candidate Direct Login Link</span>
                            <p className="text-[11px] text-[#475569] leading-relaxed mb-2">
                              Share this link with the candidate. They will be able to log in and fill their education details.
                            </p>
                            <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-[#eaf0e4]/60 gap-3 mt-1 shadow-2xs">
                              {(() => {
                                const formattedUrl = formatSetupUrl(eduCreatedCredentials.setupUrl);
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
                                          setEduCopiedUrl(true);
                                          setTimeout(() => setEduCopiedUrl(false), 2000);
                                        }}
                                        className="text-xs px-3 py-1.5 bg-[#181d16] text-white rounded-lg font-semibold hover:bg-[#1E293B] transition-all flex items-center gap-1.5 cursor-pointer"
                                      >
                                        {eduCopiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{eduCopiedUrl ? "Copied" : "Copy"}</span>
                                      </button>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            {/* Pre-filled credentials detail */}
                            {(() => {
                              const params = getUrlParams(eduCreatedCredentials.setupUrl);
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
                              <span>The candidate can log in and fill their education details using this link.</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-[#475569] pt-3">Login link generation failed. Please try again.</div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        const cred = eduCreatedCredentials;
                        setEduCreatedCredentials(null);
                        setEduSuccessMsg("");
                        if (cred?.id) {
                          setActiveFillModal({
                            isOpen: true,
                            id: cred.id,
                            type: "education",
                            name: cred.name,
                            initialData: { educations: eduItems, educationList: eduItems }
                          });
                        } else {
                          router.push("/client/summary");
                        }
                      }}
                      className="flex-1 py-3 bg-[#00450e] text-white rounded-xl font-bold text-xs hover:bg-[#00330a] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <FileEdit className="w-4 h-4 text-emerald-300" />
                      <span>Fill Details Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEduCreatedCredentials(null);
                        setEduSuccessMsg("");
                      }}
                      className="py-3 px-4 border border-[#eaf0e4] rounded-xl font-semibold text-xs text-[#334155] hover:bg-[#f6fbf0] transition-colors cursor-pointer bg-white"
                    >
                      Create Another
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEduCreatedCredentials(null);
                        router.push("/client/summary");
                      }}
                      className="py-3 px-4 bg-[#181d16] text-white rounded-xl font-semibold text-xs hover:bg-[#1E293B] transition-all cursor-pointer shadow-sm"
                    >
                      Go to Summary
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
          
          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram 
              title="Education Verification Flow" 
              activeService="education" 
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* INTERPOL CHECK FORM */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "interpol" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Form Alerts */}
            {interpolSuccessMsg && !interpolCreatedId && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{interpolSuccessMsg}</span>
              </div>
            )}

            {interpolErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{interpolErrorMsg}</span>
              </div>
            )}

            {/* Interpol Form Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full">
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-500"></div>

            {/* Subtle decorative background shapes */}
            <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-blue-50/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-12 -top-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <form onSubmit={handleInterpolSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-xl shadow-md text-white">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">Interpol Database Check</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Query international notices and rewards database
                  </p>
                </div>
              </div>

              {/* Candidate Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                  <span>Candidate Full Name</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={interpolCandidateName}
                    onChange={(e) => setInterpolCandidateName(e.target.value)}
                    placeholder="Enter candidate's full name"
                    disabled={interpolSubmitting}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-hidden disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                  <span>Date of Birth</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={interpolCandidateDob}
                    onChange={(e) => setInterpolCandidateDob(e.target.value)}
                    disabled={interpolSubmitting}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-hidden disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              {/* Place of Birth City (Optional) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                  <span>Place of Birth (City)</span>
                  <span className="text-slate-400 font-bold">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={interpolBirthCity}
                    onChange={(e) => setInterpolBirthCity(e.target.value)}
                    placeholder="e.g. Silchar, Bishnupur, Mumbai"
                    disabled={interpolSubmitting}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-hidden disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Requesting ORG Name */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                  <span>Requesting ORG Name</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={interpolRequestingOrgName}
                  onChange={(e) => {
                    setInterpolRequestingOrgName(e.target.value);
                    setInterpolShowOrgDropdown(true);
                  }}
                  onFocus={() => setInterpolShowOrgDropdown(true)}
                  onBlur={() => setTimeout(() => setInterpolShowOrgDropdown(false), 200)}
                  placeholder="Type or select organization name"
                  disabled={interpolSubmitting}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-hidden disabled:opacity-60"
                  required
                />
                {interpolShowOrgDropdown && interpolFilteredOrgs.length > 0 && (
                  <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto">
                    {interpolFilteredOrgs.map((org, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInterpolRequestingOrgName(org);
                          setInterpolShowOrgDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-[#f6fbf0] transition-colors flex items-center justify-between group"
                      >
                        <span>{org}</span>
                        <Trash2
                          className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await removeRecentRequestingOrg(org);
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ID Attachment (Optional, Max 1MB) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center justify-between">
                  <span>ID Attachment (Optional)</span>
                  <span className="text-slate-400 font-semibold">(Max 1MB)</span>
                </label>
                {interpolIdProofFile ? (
                  <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 truncate">{interpolIdProofFileName || "ID_Proof.pdf"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setInterpolIdProofFile(null);
                        setInterpolIdProofFileName("");
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 bg-slate-50/50 hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">Upload ID Attachment (Optional, Max 1MB)</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          setInterpolErrorMsg("File size exceeds 1MB limit.");
                          return;
                        }
                        setInterpolIdProofFileName(file.name);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setInterpolIdProofFile(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={handleInterpolCancel}
                  disabled={interpolSubmitting}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-xs text-slate-700 transition-colors cursor-pointer bg-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={interpolSubmitting}
                  className="flex-1 py-3 bg-[#181d16] hover:bg-[#1E293B] text-white font-bold rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
                >
                  {interpolSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Querying DB...</span>
                    </>
                  ) : (
                    <>
                      <span>Check Database</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          </div>
          
          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram 
              title="Interpol Database Check Flow" 
              activeService="interpol" 
            />
          </div>

          {/* 59-Second Search Loading Screen for Interpol Check — rendered via Portal */}
          {interpolSubmitting && typeof document !== "undefined" && createPortal(
            <InterpolSearchLoadingModal
              candidateName={interpolCandidateName || "Candidate"}
              timeRemaining={interpolTimeRemaining}
              progress={interpolLoadingProgress}
              stageIndex={interpolLoadingStage}
            />,
            document.body
          )}

          {/* Success Modal for Interpol Check — rendered via Portal */}
          {interpolCreatedId && typeof document !== "undefined" && createPortal(
            <InterpolSuccessModal
              interpolCreatedId={interpolCreatedId}
              candidateName={interpolCandidateName || "Candidate"}
              hasRecords={interpolSuccessMsg.includes("match")}
              onCreateAnother={() => { setInterpolCreatedId(null); setInterpolSuccessMsg(""); }}
              onGoToSummary={() => { setInterpolCreatedId(null); router.push("/client/summary"); }}
            />,
            document.body
          )}


        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* RED NOTICE WORLDWIDE CHECK FORM */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "rednotice_worldwide" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Form Alerts */}
            {rnwSuccessMsg && !rnwCreatedId && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{rnwSuccessMsg}</span>
              </div>
            )}

            {rnwErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{rnwErrorMsg}</span>
              </div>
            )}

            {/* Red Notice Worldwide Form Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full">
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-700 via-red-600 to-amber-500"></div>

              {/* Subtle decorative background shapes */}
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-rose-50/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -left-12 -top-12 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <form onSubmit={handleRednoticeWorldwideSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-gradient-to-br from-rose-700 to-red-800 rounded-xl shadow-md text-white">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">Red Notice Worldwide Check</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Screen against active Interpol Red Notices across 196 member countries
                    </p>
                  </div>
                </div>

                {/* Candidate Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                    <span>Candidate Full Name</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={rnwCandidateName}
                      onChange={(e) => setRnwCandidateName(e.target.value)}
                      placeholder="Enter candidate's full name"
                      disabled={rnwSubmitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all outline-hidden disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                    <span>Date of Birth</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={rnwCandidateDob}
                      onChange={(e) => setRnwCandidateDob(e.target.value)}
                      disabled={rnwSubmitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all outline-hidden disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                {/* Place of Birth City/Country (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                    <span>Place / Country of Birth</span>
                    <span className="text-slate-400 font-bold">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={rnwBirthCity}
                      onChange={(e) => setRnwBirthCity(e.target.value)}
                      placeholder="e.g. Warsaw, Paris, New York, Tokyo"
                      disabled={rnwSubmitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all outline-hidden disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Requesting ORG Name */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                    <span>Requesting ORG Name</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={rnwRequestingOrgName}
                    onChange={(e) => {
                      setRnwRequestingOrgName(e.target.value);
                      setRnwShowOrgDropdown(true);
                    }}
                    onFocus={() => setRnwShowOrgDropdown(true)}
                    onBlur={() => setTimeout(() => setRnwShowOrgDropdown(false), 200)}
                    placeholder="Type or select organization name"
                    disabled={rnwSubmitting}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all outline-hidden disabled:opacity-60"
                    required
                  />
                  {rnwShowOrgDropdown && rnwFilteredOrgs.length > 0 && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto">
                      {rnwFilteredOrgs.map((org, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setRnwRequestingOrgName(org);
                            setRnwShowOrgDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-[#f6fbf0] transition-colors flex items-center justify-between group"
                        >
                          <span>{org}</span>
                          <Trash2
                            className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await removeRecentRequestingOrg(org);
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ID Attachment (Optional, Max 1MB) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center justify-between">
                    <span>ID Attachment (Optional)</span>
                    <span className="text-slate-400 font-semibold">(Max 1MB)</span>
                  </label>
                  {rnwIdProofFile ? (
                    <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">{rnwIdProofFileName || "ID_Proof.pdf"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRnwIdProofFile(null);
                          setRnwIdProofFileName("");
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="border border-dashed border-slate-300 hover:border-rose-500 rounded-xl p-3 bg-slate-50/50 hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer">
                      <UploadCloud className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">Upload ID Attachment (Optional, Max 1MB)</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            setRnwErrorMsg("File size exceeds 1MB limit.");
                            return;
                          }
                          setRnwIdProofFileName(file.name);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setRnwIdProofFile(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-4">
                  <button
                    type="button"
                    onClick={handleRednoticeWorldwideCancel}
                    disabled={rnwSubmitting}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-xs text-slate-700 transition-colors cursor-pointer bg-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rnwSubmitting}
                    className="flex-1 py-3 bg-[#181d16] hover:bg-[#1E293B] text-white font-bold rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
                  >
                    {rnwSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Querying Global DB...</span>
                      </>
                    ) : (
                      <>
                        <span>Check Worldwide DB</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram 
              title="Red Notice Worldwide Check Flow" 
              activeService="rednotice_worldwide" 
            />
          </div>

          {/* Success Modal for Red Notice Worldwide Check — rendered via Portal */}
          {rnwCreatedId && typeof document !== "undefined" && createPortal(
            <RednoticeWorldwideSuccessModal
              rnwCreatedId={rnwCreatedId}
              candidateName={rnwCandidateName || "Candidate"}
              hasRecords={rnwSuccessMsg.includes("match")}
              onCreateAnother={() => { setRnwCreatedId(null); setRnwSuccessMsg(""); }}
              onGoToSummary={() => { setRnwCreatedId(null); router.push("/client/summary"); }}
            />,
            document.body
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* SOUTH AFRICAN COURT CHECK FORM */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "saflii_court" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Form Alerts */}
            {sacSuccessMsg && !sacCreatedId && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{sacSuccessMsg}</span>
              </div>
            )}

            {sacErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{sacErrorMsg}</span>
              </div>
            )}

            {/* SA Court Check Form Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full">
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-700 via-green-600 to-teal-500"></div>

              {/* Subtle decorative background shapes */}
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-emerald-50/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -left-12 -top-12 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <form onSubmit={handleSafliiCourtSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-700 to-green-800 rounded-xl shadow-md text-white">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">South African Court Check</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Search court judgments across all South African provinces & judicial divisions
                    </p>
                  </div>
                </div>

                {/* Candidate & Address Details (Matching India / International standard) */}
                <CourtPersonalDetailsFields
                  candidateName={sacCandidateName}
                  setCandidateName={setSacCandidateName}
                  candidateDob={sacCandidateDob}
                  setCandidateDob={setSacCandidateDob}
                  idProofType={sacIdProofType}
                  setIdProofType={setSacIdProofType}
                  idProofNumber={sacIdProofNumber}
                  setIdProofNumber={setSacIdProofNumber}
                  idProofFile={sacIdProofFile}
                  setIdProofFile={setSacIdProofFile}
                  idProofFileName={sacIdProofFileName}
                  setIdProofFileName={setSacIdProofFileName}
                  fatherName={sacFatherName}
                  setFatherName={setSacFatherName}
                  motherName={sacMotherName}
                  setMotherName={setSacMotherName}
                  gender={sacGender}
                  setGender={setSacGender}
                  isMarried={sacIsMarried}
                  setIsMarried={setSacIsMarried}
                  husbandName={sacHusbandName}
                  setHusbandName={setSacHusbandName}
                  addresses={sacAddresses}
                  setAddresses={setSacAddresses}
                  defaultCountry="South Africa"
                  disabled={sacSubmitting}
                  onError={(msg) => setSacErrorMsg(msg)}
                  colorTheme="emerald"
                />

                {/* Requesting ORG Name */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                    <span>Requesting ORG Name</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={sacRequestingOrgName}
                    onChange={(e) => {
                      setSacRequestingOrgName(e.target.value);
                      setSacShowOrgDropdown(true);
                    }}
                    onFocus={() => setSacShowOrgDropdown(true)}
                    onBlur={() => setTimeout(() => setSacShowOrgDropdown(false), 200)}
                    placeholder="Enter the organization name requiring the verification"
                    disabled={sacSubmitting}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-hidden disabled:opacity-60"
                    required
                  />
                  {sacShowOrgDropdown && sacFilteredOrgs.length > 0 && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto">
                      {sacFilteredOrgs.map((org, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSacRequestingOrgName(org);
                            setSacShowOrgDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-[#f6fbf0] transition-colors flex items-center justify-between group"
                        >
                          <span>{org}</span>
                          <Trash2
                            className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await removeRecentRequestingOrg(org);
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>


                {/* Action Buttons */}
                <div className="flex gap-4 mt-2">
                  <button
                    type="button"
                    onClick={handleSafliiCourtCancel}
                    disabled={sacSubmitting}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-xs text-slate-700 transition-colors cursor-pointer bg-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sacSubmitting}
                    className="flex-1 py-3 bg-[#181d16] hover:bg-[#1E293B] text-white font-bold rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
                  >
                    {sacSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Searching SA Courts...</span>
                      </>
                    ) : (
                      <>
                        <span>Start Verification</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram 
              title="South African Court Check Flow" 
              activeService="saflii_court" 
            />
          </div>

          {/* Success Modal for SA Court Check — rendered via Portal */}
          {sacCreatedId && typeof document !== "undefined" && createPortal(
            <SafliiCourtSuccessModal
              sacCreatedId={sacCreatedId}
              sacCandidateName={sacCandidateName || "Candidate"}
              onCreateAnother={() => { setSacCreatedId(null); setSacSuccessMsg(""); }}
              onGoToSummary={() => { setSacCreatedId(null); router.push("/client/summary"); }}
            />,
            document.body
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* SOUTH AFRICAN POLICE SERVICE (SAPS) WANTED CHECK FORM */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "saps_wanted" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Form Alerts */}
            {sapsSuccessMsg && !sapsCreatedId && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{sapsSuccessMsg}</span>
              </div>
            )}

            {sapsErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{sapsErrorMsg}</span>
              </div>
            )}

            {/* SAPS Wanted Check Form Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full">
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-900 via-indigo-700 to-sky-600"></div>

              {/* Decorative background shapes */}
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-blue-50/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -left-12 -top-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <form onSubmit={handleSapsWantedSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-gradient-to-br from-blue-900 to-indigo-950 rounded-xl shadow-md text-white">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">SAPS Wanted Persons Check</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Verify candidates against the South African Police Service Wanted Registry
                    </p>
                  </div>
                </div>

                {/* Candidate Full Name / Forename & Surname */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                      <span>First / Given Names</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={sapsCandidateForename}
                      onChange={(e) => {
                        setSapsCandidateForename(e.target.value);
                        setSapsCandidateName(`${e.target.value} ${sapsCandidateSurname}`.trim());
                      }}
                      placeholder="e.g. Clarise"
                      disabled={sapsSubmitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-hidden disabled:opacity-60"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                      <span>Surname / Last Name</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={sapsCandidateSurname}
                      onChange={(e) => {
                        setSapsCandidateSurname(e.target.value);
                        setSapsCandidateName(`${sapsCandidateForename} ${e.target.value}`.trim());
                      }}
                      placeholder="e.g. Klue"
                      disabled={sapsSubmitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-hidden disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                {/* Candidate Full Name (Composite Preview) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center justify-between">
                    <span>Full Legal Name</span>
                    <span className="text-[9px] text-slate-400 font-normal">Auto-compiled</span>
                  </label>
                  <input
                    type="text"
                    value={sapsCandidateName}
                    onChange={(e) => setSapsCandidateName(e.target.value)}
                    placeholder="Candidate full legal name"
                    disabled={sapsSubmitting}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-hidden disabled:opacity-60"
                  />
                </div>

                {/* Date of Birth & SA ID Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                      <span>Date of Birth</span>
                      <span className="text-slate-400 font-bold">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={sapsCandidateDob}
                      onChange={(e) => setSapsCandidateDob(e.target.value)}
                      disabled={sapsSubmitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-hidden disabled:opacity-60"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                      <span>SA ID / Passport No.</span>
                      <span className="text-slate-400 font-bold">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={sapsCandidateIdNumber}
                      onChange={(e) => setSapsCandidateIdNumber(e.target.value)}
                      placeholder="e.g. 9508125023087"
                      disabled={sapsSubmitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-hidden disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Province / Region */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                    <span>Target Police Station / Province</span>
                    <span className="text-slate-400 font-bold">(Optional)</span>
                  </label>
                  <select
                    value={sapsProvinceCity}
                    onChange={(e) => setSapsProvinceCity(e.target.value)}
                    disabled={sapsSubmitting}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-hidden disabled:opacity-60"
                  >
                    <option value="">All Provinces (National Search)</option>
                    <option value="Western Cape">Western Cape (Cape Town, Milnerton, etc.)</option>
                    <option value="Gauteng">Gauteng (Johannesburg, Pretoria, etc.)</option>
                    <option value="KwaZulu-Natal">KwaZulu-Natal (Durban, Pietermaritzburg)</option>
                    <option value="Eastern Cape">Eastern Cape (Gqeberha, East London)</option>
                    <option value="Free State">Free State (Bloemfontein, Welkom)</option>
                    <option value="Limpopo">Limpopo (Polokwane)</option>
                    <option value="Mpumalanga">Mpumalanga (Mbombela, Nelspruit)</option>
                    <option value="North West">North West (Rustenburg, Mahikeng)</option>
                    <option value="Northern Cape">Northern Cape (Kimberley)</option>
                  </select>
                </div>

                {/* Requesting Organization Name */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                    <span>Requesting Organization Name</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={sapsRequestingOrgName}
                      onChange={(e) => {
                        setSapsRequestingOrgName(e.target.value);
                        setSapsShowOrgDropdown(true);
                      }}
                      onFocus={() => setSapsShowOrgDropdown(true)}
                      onBlur={() => setTimeout(() => setSapsShowOrgDropdown(false), 200)}
                      placeholder="e.g. Acme Corp SA / Standard Bank"
                      disabled={sapsSubmitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-hidden disabled:opacity-60"
                      required
                    />
                    {settings?.recentRequestingOrgs && settings.recentRequestingOrgs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSapsShowOrgDropdown(!sapsShowOrgDropdown)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {sapsShowOrgDropdown && settings?.recentRequestingOrgs && settings.recentRequestingOrgs.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {settings.recentRequestingOrgs.map((org: string, idx: number) => (
                        <div
                          key={idx}
                          onMouseDown={() => {
                            setSapsRequestingOrgName(org);
                            setSapsShowOrgDropdown(false);
                          }}
                          className="px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium flex items-center justify-between border-b border-slate-100 last:border-0"
                        >
                          <span>{org}</span>
                          <span className="text-[10px] text-slate-400">Recent</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ID Proof / Document Upload (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center justify-between">
                    <span>Identity Document / Verification Slip</span>
                    <span className="text-slate-400 font-bold">(Optional)</span>
                  </label>
                  <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 hover:bg-white transition-all">
                    <input
                      type="file"
                      id="sapsIdProofInput"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSapsIdProofFileName(file.name);
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setSapsIdProofFile(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label htmlFor="sapsIdProofInput" className="cursor-pointer flex flex-col items-center gap-1.5">
                      <UploadCloud className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">
                        {sapsIdProofFileName || "Upload ID Document / Passport (PDF or Image)"}
                      </span>
                      <span className="text-[10px] text-slate-400">Max size: 5MB</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSapsWantedCancel}
                      disabled={sapsSubmitting}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={sapsSubmitting}
                      className="flex-2 py-3 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {sapsSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Searching SAPS Registry...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Run SAPS Wanted Check</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram 
              title="South African Police Wanted Check Flow" 
              activeService="saps_wanted" 
            />
          </div>

          {/* Success Modal for SAPS Wanted Check */}
          {sapsCreatedId && typeof document !== "undefined" && createPortal(
            <SapsWantedSuccessModal
              sapsCreatedId={sapsCreatedId}
              candidateName={sapsCandidateName || `${sapsCandidateForename} ${sapsCandidateSurname}`.trim() || "Candidate"}
              isHalted={sapsIsHalted}
              hasRecords={sapsHasRecords}
              onCreateAnother={() => { setSapsCreatedId(null); setSapsSuccessMsg(""); setSapsIsHalted(false); }}
              onGoToSummary={() => { setSapsCreatedId(null); router.push("/client/summary"); }}
            />,
            document.body
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* UK COURT CHECK FORM */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "uk_court" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Form Alerts */}
            {ukcSuccessMsg && !ukcCreatedId && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{ukcSuccessMsg}</span>
              </div>
            )}

            {ukcErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{ukcErrorMsg}</span>
              </div>
            )}

            {/* UK Court Check Form Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full">
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-950 via-indigo-800 to-indigo-600"></div>

              {/* Decorative background shapes */}
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-indigo-50/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -left-12 -top-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <form onSubmit={handleUkCourtSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl shadow-md text-white">
                    <Scale className="w-5 h-5 text-indigo-200" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">UK Court Check</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Courts and Tribunals Judiciary of England & Wales (Judgments, Orders & Sentencing Remarks)
                    </p>
                  </div>
                </div>

                {/* Candidate & Address Details (Matching India / International standard) */}
                <CourtPersonalDetailsFields
                  candidateName={ukcCandidateName}
                  setCandidateName={setUkcCandidateName}
                  candidateDob={ukcCandidateDob}
                  setCandidateDob={setUkcCandidateDob}
                  idProofType={ukcIdProofType}
                  setIdProofType={setUkcIdProofType}
                  idProofNumber={ukcIdProofNumber}
                  setIdProofNumber={setUkcIdProofNumber}
                  idProofFile={ukcIdProofFile}
                  setIdProofFile={setUkcIdProofFile}
                  idProofFileName={ukcIdProofFileName}
                  setIdProofFileName={setUkcIdProofFileName}
                  fatherName={ukcFatherName}
                  setFatherName={setUkcFatherName}
                  motherName={ukcMotherName}
                  setMotherName={setUkcMotherName}
                  gender={ukcGender}
                  setGender={setUkcGender}
                  isMarried={ukcIsMarried}
                  setIsMarried={setUkcIsMarried}
                  husbandName={ukcHusbandName}
                  setHusbandName={setUkcHusbandName}
                  addresses={ukcAddresses}
                  setAddresses={setUkcAddresses}
                  defaultCountry="United Kingdom"
                  disabled={ukcSubmitting}
                  onError={(msg) => setUkcErrorMsg(msg)}
                  colorTheme="indigo"
                />


                {/* Requesting Organization Name */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                    <span>Requesting Organization Name</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={ukcRequestingOrgName}
                      onChange={(e) => {
                        setUkcRequestingOrgName(e.target.value);
                        setUkcShowOrgDropdown(true);
                      }}
                      onFocus={() => setUkcShowOrgDropdown(true)}
                      onBlur={() => setTimeout(() => setUkcShowOrgDropdown(false), 200)}
                      placeholder="Enter the organization name requiring the verification"
                      disabled={ukcSubmitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all outline-hidden disabled:opacity-60"
                      required
                    />
                    {settings?.recentRequestingOrgs && settings.recentRequestingOrgs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setUkcShowOrgDropdown(!ukcShowOrgDropdown)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {ukcShowOrgDropdown && ukcFilteredOrgs.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {ukcFilteredOrgs.map((org: string, idx: number) => (
                        <div
                          key={idx}
                          onMouseDown={() => {
                            setUkcRequestingOrgName(org);
                            setUkcShowOrgDropdown(false);
                          }}
                          className="px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium flex items-center justify-between border-b border-slate-100 last:border-0"
                        >
                          <span>{org}</span>
                          <span className="text-[10px] text-slate-400">Recent</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleUkCourtCancel}
                      disabled={ukcSubmitting}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={ukcSubmitting}
                      className="flex-2 py-3 bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 hover:from-black hover:to-indigo-950 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {ukcSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Searching UK Judiciary...</span>
                        </>
                      ) : (
                        <>
                          <Scale className="w-4 h-4 text-indigo-300" />
                          <span>Run UK Court Check</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram 
              title="UK Court Check Data Flow" 
              activeService="uk_court" 
            />
          </div>

          {/* Success Modal for UK Court Check — rendered via Portal */}
          {ukcCreatedId && typeof document !== "undefined" && createPortal(
            <UkCourtSuccessModal
              ukcCreatedId={ukcCreatedId}
              ukcCandidateName={ukcCandidateName || "Candidate"}
              onCreateAnother={() => { setUkcCreatedId(null); setUkcSuccessMsg(""); }}
              onGoToSummary={() => { setUkcCreatedId(null); router.push("/client/summary"); }}
            />,
            document.body
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* MALAYSIA COURT CHECK FORM (Portal eJudgment API)   */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "malaysia_court" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Form Alerts */}
            {mycSuccessMsg && !mycCreatedId && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{mycSuccessMsg}</span>
              </div>
            )}

            {mycErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{mycErrorMsg}</span>
              </div>
            )}

            {/* Malaysia Court Check Form Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full">
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-900 via-teal-800 to-amber-600"></div>

              {/* Decorative background shapes */}
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-emerald-50/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -left-12 -top-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <form onSubmit={handleMalaysiaCourtSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-800 to-slate-900 rounded-xl shadow-md text-white">
                    <Scale className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">Malaysia Court Check</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Mahkamah Persekutuan Malaysia • Portal eJudgment (Grounds of Judgment, Orders & Rulings)
                    </p>
                  </div>
                </div>

                {/* Candidate & Addresses Details */}
                <CourtPersonalDetailsFields
                  candidateName={mycCandidateName}
                  setCandidateName={setMycCandidateName}
                  candidateDob={mycCandidateDob}
                  setCandidateDob={setMycCandidateDob}
                  fatherName={mycFatherName}
                  setFatherName={setMycFatherName}
                  motherName={mycMotherName}
                  setMotherName={setMycMotherName}
                  idProofType={mycIdProofType}
                  setIdProofType={setMycIdProofType}
                  idProofNumber={mycIdProofNumber}
                  setIdProofNumber={setMycIdProofNumber}
                  idProofFileName={mycIdProofFileName}
                  setIdProofFileName={setMycIdProofFileName}
                  idProofFile={mycIdProofFile}
                  setIdProofFile={setMycIdProofFile}
                  gender={mycGender}
                  setGender={setMycGender}
                  isMarried={mycIsMarried}
                  setIsMarried={setMycIsMarried}
                  husbandName={mycHusbandName}
                  setHusbandName={setMycHusbandName}
                  addresses={mycAddresses}
                  setAddresses={setMycAddresses}
                  defaultCountry="Malaysia"
                  disabled={mycSubmitting}
                  onError={(msg) => setMycErrorMsg(msg)}
                  colorTheme="teal"
                />


                {/* Requesting Organization Name */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                    <span>Requesting Organization Name</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="myc-req-org"
                      value={mycRequestingOrgName}
                      onChange={(e) => {
                        setMycRequestingOrgName(e.target.value);
                        setMycShowOrgDropdown(true);
                      }}
                      onFocus={() => setMycShowOrgDropdown(true)}
                      onBlur={() => setTimeout(() => setMycShowOrgDropdown(false), 200)}
                      placeholder="e.g. Maybank Malaysia / Kuala Lumpur Holdings"
                      disabled={mycSubmitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-hidden disabled:opacity-60"
                      required
                    />
                    {settings?.recentRequestingOrgs && settings.recentRequestingOrgs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setMycShowOrgDropdown(!mycShowOrgDropdown)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {mycShowOrgDropdown && mycFilteredOrgs.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {mycFilteredOrgs.map((org: string, idx: number) => (
                        <div
                          key={idx}
                          onMouseDown={() => {
                            setMycRequestingOrgName(org);
                            setMycShowOrgDropdown(false);
                          }}
                          className="px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium flex items-center justify-between border-b border-slate-100 last:border-0"
                        >
                          <span>{org}</span>
                          <span className="text-[10px] text-slate-400">Recent</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>



                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleMalaysiaCourtCancel}
                      disabled={mycSubmitting}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      id="btn-submit-malaysia-court"
                      disabled={mycSubmitting}
                      className="flex-2 py-3 bg-gradient-to-r from-emerald-900 via-teal-800 to-slate-900 hover:from-black hover:to-emerald-950 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {mycSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Searching Portal eJudgment...</span>
                        </>
                      ) : (
                        <>
                          <Scale className="w-4 h-4 text-amber-300" />
                          <span>Run Malaysia Court Check</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram 
              title="Malaysia Court Check Data Flow" 
              activeService="malaysia_court" 
            />
          </div>

          {/* Success Modal for Malaysia Court Check — rendered via Portal */}
          {mycCreatedId && typeof document !== "undefined" && createPortal(
            <MalaysiaCourtSuccessModal
              mycCreatedId={mycCreatedId}
              mycCandidateName={mycCandidateName || "Candidate"}
              onCreateAnother={() => { setMycCreatedId(null); setMycSuccessMsg(""); }}
              onGoToSummary={() => { setMycCreatedId(null); router.push("/client/summary"); }}
            />,
            document.body
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* SINGAPORE COURT CHECK FORM                         */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "singapore_court" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Form Alerts */}
            {sgcSuccessMsg && !sgcCreatedId && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{sgcSuccessMsg}</span>
              </div>
            )}

            {sgcErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{sgcErrorMsg}</span>
              </div>
            )}

            {/* Singapore Court Check Form Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full">
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-900 via-rose-700 to-amber-600"></div>

              {/* Decorative background shapes */}
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-rose-50/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -left-12 -top-12 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <form onSubmit={handleSingaporeCourtSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-gradient-to-br from-rose-900 to-slate-900 rounded-xl shadow-md text-white">
                    <Scale className="w-5 h-5 text-rose-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">Singapore Court Check</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Singapore Judicial System • Supreme Court, State Courts & Family Justice Courts
                    </p>
                  </div>
                </div>

                {/* Candidate & Addresses */}
                <CourtPersonalDetailsFields
                  candidateName={sgcCandidateName}
                  setCandidateName={setSgcCandidateName}
                  candidateDob={sgcCandidateDob}
                  setCandidateDob={setSgcCandidateDob}
                  fatherName={sgcFatherName}
                  setFatherName={setSgcFatherName}
                  motherName={sgcMotherName}
                  setMotherName={setSgcMotherName}
                  idProofType={sgcIdProofType}
                  setIdProofType={setSgcIdProofType}
                  idProofNumber={sgcIdProofNumber}
                  setIdProofNumber={setSgcIdProofNumber}
                  idProofFileName={sgcIdProofFileName}
                  setIdProofFileName={setSgcIdProofFileName}
                  idProofFile={sgcIdProofFile}
                  setIdProofFile={setSgcIdProofFile}
                  gender={sgcGender}
                  setGender={setSgcGender}
                  isMarried={sgcIsMarried}
                  setIsMarried={setSgcIsMarried}
                  husbandName={sgcHusbandName}
                  setHusbandName={setSgcHusbandName}
                  addresses={sgcAddresses}
                  setAddresses={setSgcAddresses}
                  defaultCountry="Singapore"
                  disabled={sgcSubmitting}
                  onError={(msg) => setSgcErrorMsg(msg)}
                  colorTheme="rose"
                />


                {/* Requesting Organization Name */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                    <span>Requesting Organization Name</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={sgcRequestingOrgName}
                      onChange={(e) => {
                        setSgcRequestingOrgName(e.target.value);
                        setSgcShowOrgDropdown(true);
                      }}
                      onFocus={() => setSgcShowOrgDropdown(true)}
                      onBlur={() => setTimeout(() => setSgcShowOrgDropdown(false), 200)}
                      placeholder="Enter the organization name requiring the verification"
                      disabled={sgcSubmitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all outline-hidden disabled:opacity-60"
                      required
                    />
                    {settings?.recentRequestingOrgs && settings.recentRequestingOrgs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSgcShowOrgDropdown(!sgcShowOrgDropdown)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {sgcShowOrgDropdown && sgcFilteredOrgs.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {sgcFilteredOrgs.map((org: string, idx: number) => (
                        <div
                          key={idx}
                          onMouseDown={() => {
                            setSgcRequestingOrgName(org);
                            setSgcShowOrgDropdown(false);
                          }}
                          className="px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium flex items-center justify-between border-b border-slate-100 last:border-0"
                        >
                          <span>{org}</span>
                          <span className="text-[10px] text-slate-400">Recent</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSingaporeCourtCancel}
                      disabled={sgcSubmitting}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={sgcSubmitting}
                      className="flex-2 py-3 bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 hover:from-black hover:to-rose-950 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {sgcSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Searching Singapore Registries...</span>
                        </>
                      ) : (
                        <>
                          <Scale className="w-4 h-4 text-rose-300" />
                          <span>Run Singapore Court Check</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram 
              title="Singapore Court Check Data Flow" 
              activeService="singapore_court" 
            />
          </div>

          {/* Success Modal for Singapore Court Check — rendered via Portal */}
          {sgcCreatedId && typeof document !== "undefined" && createPortal(
            <SingaporeCourtSuccessModal
              sgcCreatedId={sgcCreatedId}
              sgcCandidateName={sgcCandidateName || "Candidate"}
              onCreateAnother={() => { setSgcCreatedId(null); setSgcSuccessMsg(""); }}
              onGoToSummary={() => { setSgcCreatedId(null); router.push("/client/summary"); }}
            />,
            document.body
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* PHILIPPINES COURT CHECK FORM                       */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "philippines_court" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Form Alerts */}
            {phcSuccessMsg && !phcCreatedId && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{phcSuccessMsg}</span>
              </div>
            )}

            {phcErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{phcErrorMsg}</span>
              </div>
            )}

            {/* Philippines Court Check Form Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full">
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-800 via-amber-600 to-orange-500"></div>

              {/* Decorative background shapes */}
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-amber-50/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -left-12 -top-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <form onSubmit={handlePhilippinesCourtSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-gradient-to-br from-amber-900 to-slate-900 rounded-xl shadow-md text-white">
                    <Scale className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">Philippines Court Check</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Judicial System of the Philippines • Supreme Court, Court of Appeals & Regional Trial Courts (RTC)
                    </p>
                  </div>
                </div>

                {/* Candidate & Addresses */}
                <CourtPersonalDetailsFields
                  candidateName={phcCandidateName}
                  setCandidateName={setPhcCandidateName}
                  candidateDob={phcCandidateDob}
                  setCandidateDob={setPhcCandidateDob}
                  fatherName={phcFatherName}
                  setFatherName={setPhcFatherName}
                  motherName={phcMotherName}
                  setMotherName={setPhcMotherName}
                  idProofType={phcIdProofType}
                  setIdProofType={setPhcIdProofType}
                  idProofNumber={phcIdProofNumber}
                  setIdProofNumber={setPhcIdProofNumber}
                  idProofFileName={phcIdProofFileName}
                  setIdProofFileName={setPhcIdProofFileName}
                  idProofFile={phcIdProofFile}
                  setIdProofFile={setPhcIdProofFile}
                  gender={phcGender}
                  setGender={setPhcGender}
                  isMarried={phcIsMarried}
                  setIsMarried={setPhcIsMarried}
                  husbandName={phcHusbandName}
                  setHusbandName={setPhcHusbandName}
                  addresses={phcAddresses}
                  setAddresses={setPhcAddresses}
                  defaultCountry="Philippines"
                  disabled={phcSubmitting}
                  onError={(msg) => setPhcErrorMsg(msg)}
                  colorTheme="amber"
                />


                {/* Requesting Organization Name */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-label-caps flex items-center gap-1">
                    <span>Requesting Organization Name</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phcRequestingOrgName}
                      onChange={(e) => {
                        setPhcRequestingOrgName(e.target.value);
                        setPhcShowOrgDropdown(true);
                      }}
                      onFocus={() => setPhcShowOrgDropdown(true)}
                      onBlur={() => setTimeout(() => setPhcShowOrgDropdown(false), 200)}
                      placeholder="Enter the organization name requiring the verification"
                      disabled={phcSubmitting}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all outline-hidden disabled:opacity-60"
                      required
                    />
                    {settings?.recentRequestingOrgs && settings.recentRequestingOrgs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPhcShowOrgDropdown(!phcShowOrgDropdown)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {phcShowOrgDropdown && phcFilteredOrgs.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {phcFilteredOrgs.map((org: string, idx: number) => (
                        <div
                          key={idx}
                          onMouseDown={() => {
                            setPhcRequestingOrgName(org);
                            setPhcShowOrgDropdown(false);
                          }}
                          className="px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium flex items-center justify-between border-b border-slate-100 last:border-0"
                        >
                          <span>{org}</span>
                          <span className="text-[10px] text-slate-400">Recent</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handlePhilippinesCourtCancel}
                      disabled={phcSubmitting}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={phcSubmitting}
                      className="flex-2 py-3 bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 hover:from-black hover:to-amber-950 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {phcSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Searching Philippines Registries...</span>
                        </>
                      ) : (
                        <>
                          <Scale className="w-4 h-4 text-amber-300" />
                          <span>Run Philippines Court Check</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram 
              title="Philippines Court Check Data Flow" 
              activeService="philippines_court" 
            />
          </div>

          {/* Success Modal for Philippines Court Check — rendered via Portal */}
          {phcCreatedId && typeof document !== "undefined" && createPortal(
            <PhilippinesCourtSuccessModal
              phcCreatedId={phcCreatedId}
              phcCandidateName={phcCandidateName || "Candidate"}
              onCreateAnother={() => { setPhcCreatedId(null); setPhcSuccessMsg(""); }}
              onGoToSummary={() => { setPhcCreatedId(null); router.push("/client/summary"); }}
            />,
            document.body
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* PASSPORT CHECK FORM */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "passport" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {passportErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{passportErrorMsg}</span>
              </div>
            )}

            {/* Form Card */}
            <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 w-full">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-600 to-red-800"></div>

              <form onSubmit={handlePassportSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-red-50 rounded-xl border border-red-100">
                    <FileCheck className="w-5 h-5 text-red-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#181d16] text-lg">Passport Verification Check</h3>
                    <p className="text-xs text-slate-500">Official Passport Registry lookup & DB audit</p>
                  </div>
                </div>

                {/* Passport File Number Field */}
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="passport-file-no">
                    Passport File Number
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      id="passport-file-no"
                      type="text"
                      value={passportFileNumber}
                      onChange={(e) => setPassportFileNumber(e.target.value.toUpperCase())}
                      autoComplete="off"
                      className="w-full border border-[#eaf0e4] rounded-xl pl-10 pr-3.5 py-3.5 font-mono text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-bold uppercase"
                      placeholder="123456789012345"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Enter 15-character alphanumeric File Number provided in acknowledgment slip.
                  </p>
                </div>

                {/* Date of Birth Field */}
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="passport-dob">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      id="passport-dob"
                      type="date"
                      value={passportDob}
                      onChange={(e) => setPassportDob(e.target.value)}
                      className="w-full border border-[#eaf0e4] rounded-xl pl-10 pr-3.5 py-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Format sent to API: <span className="font-mono font-bold text-indigo-700">DD/MM/YYYY</span>
                  </p>
                </div>

                {/* Requesting Organisation Field */}
                <div className="flex flex-col gap-2 relative">
                  <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="passport-req-org">
                    Requesting ORG Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      id="passport-req-org"
                      type="text"
                      value={passportRequestingOrgName}
                      onChange={(e) => {
                        setPassportRequestingOrgName(e.target.value);
                        setPassportShowOrgDropdown(true);
                      }}
                      onFocus={() => setPassportShowOrgDropdown(true)}
                      autoComplete="off"
                      className="w-full border border-[#eaf0e4] rounded-xl pl-10 pr-3.5 py-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold"
                      placeholder="e.g. Acme Corp"
                      required
                    />
                  </div>
                  {passportShowOrgDropdown && passportFilteredOrgs.length > 0 && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto">
                      {passportFilteredOrgs.map((org, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPassportRequestingOrgName(org);
                            setPassportShowOrgDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-[#f6fbf0] transition-colors flex items-center justify-between group"
                        >
                          <span>{org}</span>
                          <Trash2
                            className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await removeRecentRequestingOrg(org);
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ID Attachment (Optional - Passport, Max 1MB) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#475569] uppercase tracking-wider font-label-caps flex items-center justify-between">
                    <span>ID Attachment (Optional - Passport)</span>
                    <span className="text-slate-400 font-semibold">(Max 1MB)</span>
                  </label>
                  {passportIdProofFile ? (
                    <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">{passportIdProofFileName || "Passport_Copy.pdf"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPassportIdProofFile(null);
                          setPassportIdProofFileName("");
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="border border-dashed border-[#eaf0e4] hover:border-red-500 rounded-xl p-3.5 bg-[#f6fbf0]/50 hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer">
                      <UploadCloud className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">Upload Passport Copy / ID Attachment (Optional, Max 1MB)</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            setPassportErrorMsg("File size exceeds 1MB limit.");
                            return;
                          }
                          setPassportIdProofFileName(file.name);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPassportIdProofFile(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePassportCancel}
                    disabled={passportSubmitting}
                    className="py-3.5 px-5 border border-[#eaf0e4] hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-xs bg-white"
                  >
                    Clear
                  </button>

                  <button
                    type="submit"
                    disabled={passportSubmitting}
                    className="flex-1 bg-[#181d16] hover:bg-[#1E293B] text-white font-bold py-3.5 px-6 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 text-xs disabled:opacity-60"
                  >
                    {passportSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Executing Verification...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Run Passport Verification
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Workflow Diagram */}
          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram title="Passport Verification Workflow" activeService="passport" />
          </div>



          {/* Success Modal for Passport Check — rendered via Portal */}
          {passportCreatedId && typeof document !== "undefined" && createPortal(
            <PassportSuccessModal
              passportCreatedId={passportCreatedId}
              candidateName={passportCreatedData?.givenName && passportCreatedData?.givenName !== "—" ? `${passportCreatedData.givenName} ${passportCreatedData.surname || ""}` : passportFileNumber}
              statusMessage={passportCreatedData?.statusMessage}
              onCreateAnother={() => { setPassportCreatedId(null); setPassportCreatedData(null); setPassportSuccessMsg(""); }}
              onGoToSummary={() => { setPassportCreatedId(null); router.push("/client/summary"); }}
            />,
            document.body
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* DIGITAL ADDRESS VERIFICATION FORM */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeService === "digital_address" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full">
          <div className="lg:col-span-6 flex flex-col gap-6 w-full">
            {/* Alerts */}
            {davSuccessMsg && !davCreatedCredentials && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
                <span className="font-semibold">{davSuccessMsg}</span>
              </div>
            )}

            {davErrorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-2xl animate-fade-in shadow-2xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-semibold">{davErrorMsg}</span>
              </div>
            )}

            {/* Success Card with URL */}
            {davCreatedCredentials && (
              <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 shadow-sm relative overflow-hidden animate-fade-in w-full">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500"></div>
                <div className="flex flex-col gap-5 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E6F8F3] border border-[#A3EAD6] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-[#00a877]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#181d16] text-sm">Verification Request Created!</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Verification ID: <span className="font-mono font-bold">{davCreatedCredentials.id}</span></p>
                    </div>
                  </div>

                  <div className="bg-[#f6fbf0] border border-[#eaf0e4] rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Candidate</span>
                      <span className="text-[#181d16] font-bold">{davCreatedCredentials.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Email</span>
                      <span className="text-[#181d16] font-bold">{davCreatedCredentials.email}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Status</span>
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                        Awaiting Candidate
                      </span>
                    </div>
                  </div>

                  {davCreatedCredentials.setupUrl && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Candidate Verification URL</label>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={davCreatedCredentials.setupUrl}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-[11px] font-mono text-slate-600 bg-slate-50 truncate"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(davCreatedCredentials.setupUrl || "");
                            setDavCopiedUrl(true);
                            setTimeout(() => setDavCopiedUrl(false), 2000);
                          }}
                          className="px-3 py-2.5 bg-[#181d16] text-white rounded-lg text-[11px] font-bold hover:bg-[#1E293B] transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {davCopiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {davCopiedUrl ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Share this URL with the candidate. They will take geo-tagged photos for address verification.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => { setDavCreatedCredentials(null); setDavSuccessMsg(""); }}
                      className="flex-1 py-3 border border-[#eaf0e4] rounded-xl font-semibold text-xs text-slate-700 hover:bg-[#f6fbf0] transition-colors cursor-pointer bg-white"
                    >
                      Create Another
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDavCreatedCredentials(null); router.push("/client/summary"); }}
                      className="flex-1 py-3 bg-[#181d16] text-white rounded-xl font-semibold text-xs hover:bg-[#1E293B] transition-all cursor-pointer shadow-sm"
                    >
                      Go to Summary
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Form Card */}
            {!davCreatedCredentials && (
              <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 w-full">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500"></div>
                <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-cyan-50/35 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -left-12 -top-12 w-32 h-32 bg-teal-50/20 rounded-full blur-2xl pointer-events-none"></div>

                <form onSubmit={handleDigitalAddressSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-cyan-50 rounded-xl border border-cyan-100">
                      <MapPin className="w-5 h-5 text-cyan-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#181d16] text-lg">Digital Address Verification</h3>
                      <p className="text-xs text-slate-500">Geo-tagged photo verification at candidate&apos;s residing address</p>
                    </div>
                  </div>

                  {/* Candidate Name */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="dav-candidate-name">
                      Candidate Name
                    </label>
                    <div className="relative">
                      <UserPlus className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        id="dav-candidate-name"
                        type="text"
                        value={davCandidateName}
                        onChange={(e) => setDavCandidateName(e.target.value)}
                        autoComplete="off"
                        className="w-full border border-[#eaf0e4] rounded-xl pl-10 pr-3.5 py-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold"
                        placeholder="Enter the candidate name"
                        required
                      />
                    </div>
                  </div>

                  {/* Candidate Email */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="dav-candidate-email">
                      Candidate Email ID
                    </label>
                    <div className="relative">
                      <Send className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        id="dav-candidate-email"
                        type="email"
                        value={davCandidateEmail}
                        onChange={(e) => setDavCandidateEmail(e.target.value)}
                        autoComplete="off"
                        className="w-full border border-[#eaf0e4] rounded-xl pl-10 pr-3.5 py-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold"
                        placeholder="Enter the candidate email ID"
                        required
                      />
                    </div>
                  </div>

                  {/* Candidate Address */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="dav-candidate-address">
                      Address of Candidate
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <textarea
                        id="dav-candidate-address"
                        value={davCandidateAddress}
                        onChange={(e) => setDavCandidateAddress(e.target.value)}
                        autoComplete="off"
                        rows={3}
                        className="w-full border border-[#eaf0e4] rounded-xl pl-10 pr-3.5 py-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold resize-none"
                        placeholder="Enter the full residential address of the candidate"
                        required
                      />
                    </div>
                  </div>

                  {/* Requesting Organisation */}
                  <div className="flex flex-col gap-2 relative">
                    <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="dav-req-org">
                      Requesting ORG Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        id="dav-req-org"
                        type="text"
                        value={davRequestingOrgName}
                        onChange={(e) => {
                          setDavRequestingOrgName(e.target.value);
                          setDavShowOrgDropdown(true);
                        }}
                        onFocus={() => setDavShowOrgDropdown(true)}
                        autoComplete="off"
                        className="w-full border border-[#eaf0e4] rounded-xl pl-10 pr-3.5 py-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold"
                        placeholder="e.g. Acme Corp"
                        required
                      />
                    </div>
                    {davShowOrgDropdown && davFilteredOrgs.length > 0 && (
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto">
                        {davFilteredOrgs.map((org, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setDavRequestingOrgName(org);
                              setDavShowOrgDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-[#f6fbf0] transition-colors flex items-center justify-between group"
                          >
                            <span>{org}</span>
                            <Trash2
                              className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await removeRecentRequestingOrg(org);
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleDigitalAddressCancel}
                      disabled={davSubmitting}
                      className="py-3.5 px-5 border border-[#eaf0e4] hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-xs bg-white"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={davSubmitting}
                      className="flex-1 bg-[#181d16] hover:bg-[#1E293B] text-white font-bold py-3.5 px-6 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 text-xs disabled:opacity-60"
                    >
                      {davSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating Request...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Create Verification Request
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Workflow Diagram */}
          <div className="lg:col-span-6 w-full lg:sticky lg:top-24">
            <FlowDiagram title="Digital Address Verification Workflow" activeService="digital_address" />
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
            router.push("/client/summary");
          }}
        />
      )}
    </div>
  );
}

