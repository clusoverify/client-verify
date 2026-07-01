"use client";

import React, { useState, useEffect } from "react";
import { usePortal } from "src/context/PortalContext";
import { useAuth } from "src/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Users, 
  UserPlus, 
  Key, 
  Mail, 
  Briefcase, 
  CheckCircle, 
  AlertCircle, 
  ShieldAlert,
  ChevronRight,
  Power,
  PowerOff
} from "lucide-react";

export default function ManageVerifiersPage() {
  const { verifiers, organisation, inviteVerifier, updateVerifierStatus } = usePortal();
  const { profile, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [inviting, setInviting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Auto-redirect if not org_owner
  useEffect(() => {
    if (!isLoading && isAuthenticated && profile?.role !== "org_owner") {
      router.push("/client/identity-verification");
    }
  }, [isLoading, isAuthenticated, profile, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#134074] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading settings...</span>
        </div>
      </div>
    );
  }

  if (profile?.role !== "org_owner") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-white border border-slate-100 rounded-3xl max-w-lg mx-auto mt-10">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-900">Access Denied</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Only organisation owners have permissions to manage verifiers and compliance analysts for this account.
        </p>
      </div>
    );
  }

  const maxVerifiers = organisation?.maxVerifiers ?? 5;
  const activeCount = verifiers.filter(v => v.status === "Active").length;
  const slotsRemaining = Math.max(0, maxVerifiers - activeCount);

  const handleToggleStatus = async (v: any) => {
    setTogglingId(v.id);
    const newStatus = v.status === "Active" ? "Inactive" : "Active";
    try {
      await updateVerifierStatus(v.id, newStatus);
    } catch (err) {
      console.error("Failed toggling verifier:", err);
    }
    setTogglingId(null);
  };

  const handleGeneratePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%^&*";
    let pw = "";
    for (let i = 0; i < 16; i++) {
      pw += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(pw);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!name.trim()) return setFormError("Verifier full name is required");
    if (!email.trim() || !email.includes("@")) return setFormError("Please enter a valid email address");
    if (!password.trim() || password.length < 6) return setFormError("Temporary password must be at least 6 characters");

    setInviting(true);
    try {
      await inviteVerifier(name.trim(), email.toLowerCase().trim(), profile.org_name, password, designation.trim());
      setFormSuccess(`Successfully created verifier login for ${name}!`);
      setName("");
      setEmail("");
      setDesignation("");
      setPassword("");
    } catch (err: any) {
      setFormError(err.message || "Failed to invite verifier. Limit may have been reached.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto flex flex-col gap-8">
      {/* Header section */}
      <div className="flex flex-col gap-1.5 text-left">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Users className="w-7 h-7 text-[#134074]" />
          <span>Manage Team Logins</span>
        </h1>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Configure verifiers and compliance analyst accounts assigned to work under {profile.org_name}.
        </p>
      </div>

      {/* Slots details banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-5 text-left">
          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-extrabold block mb-1">Max Verifiers Limit</span>
          <span className="text-2xl font-black text-slate-800">{maxVerifiers}</span>
        </div>
        <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-5 text-left">
          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-extrabold block mb-1">Active Accounts</span>
          <span className="text-2xl font-black text-slate-800">{activeCount}</span>
        </div>
        <div className={`border rounded-2xl p-5 text-left transition-all duration-300 ${
          slotsRemaining === 0 
            ? "bg-rose-500/5 border-rose-500/15" 
            : "bg-[#C6E7FF]/10 border-[#C6E7FF]/20"
        }`}>
          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-extrabold block mb-1">Slots Remaining</span>
          <span className={`text-2xl font-black ${slotsRemaining === 0 ? "text-rose-600" : "text-[#134074]"}`}>
            {slotsRemaining}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Column: List of verifiers */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white border border-[#C6E7FF]/30 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-sm text-[#134074] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Team Accounts</span>
            </h3>

            {verifiers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                <Users className="w-10 h-10 opacity-30 stroke-1" />
                <p className="text-xs font-semibold">No verifier accounts created yet.</p>
                <p className="text-[10px] text-slate-400">Use the form to create logins for your analysts.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {verifiers.map((v, idx) => (
                  <div key={v.id || idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 bg-slate-100 text-[#134074] font-extrabold text-sm rounded-full flex items-center justify-center shrink-0">
                        {v.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="font-bold text-sm text-slate-900 leading-tight truncate">{v.name}</p>
                        <p className="text-xs text-slate-450 font-medium truncate mt-0.5">{v.designation || "Compliance Analyst"}</p>
                        <p className="font-mono text-[10px] text-slate-400 mt-1 truncate">{v.email}</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {/* Activate/Deactivate toggle — not shown for the owner */}
                      {!v.isOwner && (
                        <button
                          onClick={() => handleToggleStatus(v)}
                          disabled={togglingId === v.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all duration-200 disabled:opacity-50 ${
                            v.status === "Active"
                              ? "bg-rose-500/5 text-rose-600 border-rose-500/15 hover:bg-rose-500/10"
                              : "bg-emerald-500/5 text-emerald-600 border-emerald-500/15 hover:bg-emerald-500/10"
                          }`}
                          title={v.status === "Active" ? "Deactivate this verifier" : "Activate this verifier"}
                        >
                          {togglingId === v.id ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : v.status === "Active" ? (
                            <PowerOff className="w-3 h-3" />
                          ) : (
                            <Power className="w-3 h-3" />
                          )}
                          <span>{v.status === "Active" ? "Deactivate" : "Activate"}</span>
                        </button>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                        v.status === "Active" 
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/15" 
                          : "bg-amber-500/10 text-amber-700 border-amber-500/15"
                      }`}>
                        {v.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invite Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#C6E7FF]/30 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-sm text-[#134074] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-slate-400" />
              <span>Create Verifier login</span>
            </h3>

            {formSuccess && (
              <div className="bg-emerald-500/5 text-emerald-600 border border-emerald-500/15 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="bg-rose-500/5 text-rose-600 border border-rose-500/15 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {slotsRemaining === 0 ? (
              <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex flex-col gap-2 text-left">
                <h4 className="font-bold text-xs text-amber-850 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Active Limit Reached</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  Your organisation has reached the maximum of <strong className="text-slate-800 font-extrabold">{maxVerifiers} active verifiers</strong>. Deactivate an existing verifier to free up a slot, or contact your account manager at Cluso Infolink to increase capacity.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-slate-500 uppercase tracking-wider text-[9px] font-bold">Verifier Full Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g. Jane Smith" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 font-body-sm text-slate-800 bg-white focus:outline-none focus:ring-4 focus:ring-[#C6E7FF]/30 focus:border-[#134074] transition-all placeholder-slate-400 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-slate-500 uppercase tracking-wider text-[9px] font-bold">Login Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      placeholder="e.g. jane@company.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 font-body-sm text-slate-800 bg-white focus:outline-none focus:ring-4 focus:ring-[#C6E7FF]/30 focus:border-[#134074] transition-all placeholder-slate-400 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-slate-500 uppercase tracking-wider text-[9px] font-bold">Job Title / Designation</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g. Verification Lead" 
                      value={designation} 
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 font-body-sm text-slate-800 bg-white focus:outline-none focus:ring-4 focus:ring-[#C6E7FF]/30 focus:border-[#134074] transition-all placeholder-slate-400 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-label-caps text-slate-500 uppercase tracking-wider text-[9px] font-bold">Password</label>
                    <button 
                      type="button" 
                      onClick={handleGeneratePassword} 
                      className="text-[10px] text-[#0ea5e9] hover:underline font-bold cursor-pointer"
                    >
                      Generate password
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Set temporary password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 font-body-sm text-slate-800 bg-white focus:outline-none focus:ring-4 focus:ring-[#C6E7FF]/30 focus:border-[#134074] transition-all placeholder-slate-400 text-xs"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={inviting}
                  className="mt-2 w-full py-3 bg-[#134074] text-white hover:bg-[#0F172A] font-bold text-xs rounded-xl shadow-xs transition-colors flex justify-center items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {inviting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Create Verifier login</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
