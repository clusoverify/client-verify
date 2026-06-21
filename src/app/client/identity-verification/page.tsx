"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  UserPlus
} from "lucide-react";

export default function IdentityVerification() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { addVerification, settings } = usePortal();

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  
  const isAdmin = profile?.role === "admin" || profile?.org_name?.toLowerCase() === "cluso" || profile?.org_name?.toLowerCase() === "admin";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!candidateName.trim()) {
      setErrorMsg("Candidate Name is required");
      return;
    }
    if (!candidateEmail.trim()) {
      setErrorMsg("Candidate Email is required");
      return;
    }
    if (!orgName.trim()) {
      setErrorMsg("Requesting ORG Name is required");
      return;
    }

    try {
      const res = await addVerification(candidateName, candidateEmail, orgName);
      if (res && res.success) {
        setSuccessMsg("Verification request initiated successfully!");
        setCreatedCredentials({
          name: candidateName,
          email: candidateEmail.toLowerCase().trim(),
          setupUrl: res.setupUrl
        });
        setCandidateName("");
        setCandidateEmail("");
        setOrgName(isAdmin ? "" : (profile?.org_name || ""));
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
  };

  return (
    <div className="flex flex-col gap-6 pt-4 animate-fade-in pb-12">
      <div className="flex flex-col gap-1 border-b border-[#D4F6FF] pb-5 mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#1E3A5F] bg-[#D4F6FF]/60 px-2.5 py-1 rounded-full w-fit uppercase tracking-wider font-label-caps border border-[#C6E7FF]/60">
          <Sparkles className="w-3.5 h-3.5 text-[#0F172A]" />
          <span>Quick verification</span>
        </div>
        <h2 className="font-display-lg text-primary font-bold tracking-tight text-3xl mt-2 text-[#0F172A]">Candidate Verification</h2>
        <p className="text-secondary mt-1 text-sm">Initiate a new identity verification request for a candidate.</p>
      </div>

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
      <div className="bg-white border border-[#C6E7FF] rounded-3xl p-8 max-w-2xl shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C6E7FF] via-[#FFDDAE] to-[#D4F6FF]"></div>
        
        {/* Subtle decorative background shapes */}
        <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-[#D4F6FF]/35 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-[#FFDDAE]/20 rounded-full blur-2xl pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-2 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-[#D4F6FF]/40 rounded-xl border border-[#C6E7FF]/60">
              <UserPlus className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <h3 className="font-semibold text-[#0F172A] text-lg">Verify Details</h3>
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
              className="border border-[#C6E7FF] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all bg-[#FBFBFB]/50 placeholder-slate-400 font-semibold"
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
              className="border border-[#C6E7FF] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all bg-[#FBFBFB]/50 placeholder-slate-400 font-semibold"
              placeholder="Enter the candidate email ID"
            />
          </div>

          {/* Requesting ORG Name Field */}
          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-[#475569] text-xs font-semibold uppercase tracking-wider" htmlFor="org-name">
              {isAdmin ? "Target Client ORG Name" : "Requesting ORG Name"}
            </label>
            <input
              id="org-name"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              autoComplete="off"
              disabled={!isAdmin}
              className={`border border-[#C6E7FF] rounded-xl p-3.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all bg-[#FBFBFB]/50 placeholder-slate-400 font-semibold ${
                !isAdmin ? "bg-slate-100/60 text-slate-500 cursor-not-allowed border-slate-200" : ""
              }`}
              placeholder={isAdmin ? "Enter target client organization name (e.g., TCS)" : "Enter the organization name requiring the verification"}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 border border-[#C6E7FF] rounded-xl font-semibold text-sm text-[#334155] hover:bg-[#FBFBFB] hover:text-[#0F172A] transition-all cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#0F172A] text-white hover:bg-[#1E293B] active:scale-95 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm group"
            >
              <span>Create Request</span>
              <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Credentials Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#C6E7FF] rounded-3xl p-8 max-w-lg w-full shadow-2xl relative animate-scale-up">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-[#E6F8F3] border border-[#A3EAD6] rounded-full flex items-center justify-center text-[#00684A] mb-2 animate-bounce-subtle">
                <CheckCircle className="w-8 h-8 text-[#00a877]" />
              </div>
              <h3 className="font-headline-md text-[#0F172A] font-bold text-xl">Request Initiated!</h3>
              <p className="font-body-sm text-[#475569] leading-relaxed">
                A verification request has been successfully created for <strong className="text-[#0F172A] font-bold">{createdCredentials.name}</strong>.
              </p>

              {/* Credentials Box */}
              <div className="w-full mt-4 p-5 bg-[#D4F6FF]/25 border border-[#C6E7FF] rounded-2xl text-left flex flex-col gap-3 relative overflow-hidden shadow-2xs">
                <div className="absolute right-3 top-3">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#0F172A] bg-white border border-[#C6E7FF] px-2 py-0.5 rounded">
                    Direct Login Link
                  </span>
                </div>
                
                {createdCredentials.setupUrl ? (
                  <div className="flex flex-col gap-1 pt-3">
                    <span className="font-label-caps text-[#334155] text-[10px] uppercase font-semibold tracking-wider">Candidate Direct Login Link</span>
                    <p className="text-[11px] text-[#475569] leading-relaxed mb-2">
                      Share this direct login link with the candidate. Credentials are embedded and will pre-fill automatically.
                    </p>
                    <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-[#C6E7FF]/60 gap-3 mt-1 shadow-2xs">
                      <span className="font-mono text-xs text-[#0F172A] truncate max-w-[65%]" title={createdCredentials.setupUrl}>
                        {createdCredentials.setupUrl}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(createdCredentials.setupUrl || "");
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
                      const params = getUrlParams(createdCredentials.setupUrl);
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
                  className="flex-1 py-3 border border-[#C6E7FF] rounded-xl font-semibold text-xs text-[#334155] hover:bg-[#FBFBFB] transition-colors cursor-pointer bg-white"
                >
                  Create Another
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedCredentials(null);
                    router.push("/client/summary");
                  }}
                  className="flex-1 py-3 bg-[#0F172A] text-white rounded-xl font-semibold text-xs hover:bg-[#1E293B] transition-all cursor-pointer shadow-sm"
                >
                  Go to Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
