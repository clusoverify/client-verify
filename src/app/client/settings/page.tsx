"use client";

import React, { useState, useEffect } from "react";
import { usePortal } from "src/context/PortalContext";
import { 
  Building,
  User,
  Scale,
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Save,
  RotateCcw,
  FileText,
  Database
} from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings } = usePortal();

  // Company states
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Contact states
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Legal details
  const [cin, setCin] = useState("");
  const [lut, setLut] = useState("");
  const [tin, setTin] = useState("");

  // Billing
  const [billingOption, setBillingOption] = useState<"invoice" | "card">("invoice");

  // Passwords
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [saveAlert, setSaveAlert] = useState("");
  const [passwordAlert, setPasswordAlert] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // MongoDB connection state
  const [mongoAlert, setMongoAlert] = useState("");
  const [mongoError, setMongoError] = useState("");
  const [mongoLoading, setMongoLoading] = useState(false);

  // Load context settings into local state
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || "");
      setAddress(settings.address || "");
      setCity(settings.city || "");
      setPostalCode(settings.postalCode || "");
      setContactFirstName(settings.contactFirstName || "");
      setContactLastName(settings.contactLastName || "");
      setContactEmail(settings.contactEmail || "");
      setCin(settings.cin || "");
      setLut(settings.lut || "");
      setTin(settings.tin || "");
      setBillingOption(settings.billingOption || "invoice");
    }
  }, [settings]);

  const handleSaveAll = () => {
    setSaveAlert("");
    updateSettings({
      companyName,
      address,
      city,
      postalCode,
      contactFirstName,
      contactLastName,
      contactEmail,
      billingOption,
      cin,
      lut,
      tin,
    });
    setSaveAlert("All profile settings updated successfully!");
    setTimeout(() => setSaveAlert(""), 3000);
  };

  const handleDiscard = () => {
    // Reload state from settings context
    if (settings) {
      setCompanyName(settings.companyName || "");
      setAddress(settings.address || "");
      setCity(settings.city || "");
      setPostalCode(settings.postalCode || "");
      setContactFirstName(settings.contactFirstName || "");
      setContactLastName(settings.contactLastName || "");
      setContactEmail(settings.contactEmail || "");
      setCin(settings.cin || "");
      setLut(settings.lut || "");
      setTin(settings.tin || "");
      setBillingOption(settings.billingOption || "invoice");
      
      setSaveAlert("Changes discarded. Reloaded saved configuration.");
      setTimeout(() => setSaveAlert(""), 3000);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordAlert("");
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Current Password is required");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password.");
        return;
      }

      setPasswordAlert("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordAlert(""), 3000);
    } catch (err: any) {
      setPasswordError(err?.message || "An unexpected error occurred.");
    }
  };

  const handleRefreshMongo = async () => {
    setMongoAlert("");
    setMongoError("");
    setMongoLoading(true);
    try {
      const res = await fetch("/api/mongodb/refresh", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setMongoError(data.error || "Failed to refresh MongoDB connection");
      } else {
        setMongoAlert("MongoDB connection refreshed successfully!");
        setTimeout(() => setMongoAlert(""), 3000);
      }
    } catch (err: any) {
      setMongoError(err?.message || "An unexpected error occurred.");
    } finally {
      setMongoLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-4 animate-fade-in pb-12">
      <div className="flex flex-col gap-1 border-b border-[#D4F6FF] pb-5 mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#1E3A5F] bg-[#D4F6FF]/60 px-2.5 py-1 rounded-full w-fit uppercase tracking-wider font-label-caps border border-[#C6E7FF]/60">
          <Sparkles className="w-3.5 h-3.5 text-[#0F172A]" />
          <span>PORTAL CONFIGURATION</span>
        </div>
        <h2 className="font-display-lg text-[#0F172A] font-bold tracking-tight text-3xl mt-2">Settings &amp; Profile</h2>
        <p className="text-secondary mt-1 text-sm text-slate-500">Manage your company details and portal preferences.</p>
      </div>

      {saveAlert && (
        <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-5xl animate-fade-in shadow-2xs">
          <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
          <span className="font-semibold">{saveAlert}</span>
        </div>
      )}

      {/* Bento Grid Layout for Forms */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">
        {/* Left Column (Wider - Spans 2 columns on xl screens) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Company Profile Card */}
          <div className="bg-white border border-[#C6E7FF] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C6E7FF]"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#D4F6FF]/40 border border-[#C6E7FF]/60 rounded-2xl">
                <Building className="w-5 h-5 text-[#1E3A5F]" />
              </div>
              <h3 className="font-semibold text-lg text-[#0F172A]">Company Profile</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Registered Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Contact Person Card */}
          <div className="bg-white border border-[#C6E7FF] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C6E7FF]"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#D4F6FF]/40 border border-[#C6E7FF]/60 rounded-2xl">
                <User className="w-5 h-5 text-[#1E3A5F]" />
              </div>
              <h3 className="font-semibold text-lg text-[#0F172A]">Contact Person</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">First Name</label>
                <input
                  type="text"
                  value={contactFirstName}
                  onChange={(e) => setContactFirstName(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  value={contactLastName}
                  onChange={(e) => setContactLastName(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Email ID</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Legal Details Card */}
          <div className="bg-white border border-[#C6E7FF] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C6E7FF]"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#D4F6FF]/40 border border-[#C6E7FF]/60 rounded-2xl">
                <Scale className="w-5 h-5 text-[#1E3A5F]" />
              </div>
              <h3 className="font-semibold text-lg text-[#0F172A]">Legal Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">CIN (Corporate Identification Number)</label>
                <input
                  type="text"
                  placeholder="Enter CIN"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">LUT Entry</label>
                <input
                  type="text"
                  placeholder="Enter LUT"
                  value={lut}
                  onChange={(e) => setLut(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Tax Identification Number</label>
                <input
                  type="text"
                  placeholder="Enter TIN"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Narrower - Spans 1 column on xl screens) */}
        <div className="flex flex-col gap-6">
          
          {/* Billing Options Card */}
          <div className="bg-white border border-[#C6E7FF] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C6E7FF]"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#D4F6FF]/40 border border-[#C6E7FF]/60 rounded-2xl">
                <CreditCard className="w-5 h-5 text-[#1E3A5F]" />
              </div>
              <h3 className="font-semibold text-lg text-[#0F172A]">Billing Options</h3>
            </div>
            
            <div className="flex flex-col gap-4 relative z-10">
              {billingOption === "invoice" ? (
                <div className="border border-[#C6E7FF] bg-[#D4F6FF]/20 rounded-2xl p-5 flex items-start gap-3 shadow-2xs">
                  <FileText className="w-5 h-5 text-[#0F172A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-body-sm font-bold text-[#0F172A] block">Monthly Invoicing</span>
                    <span className="text-[#475569] text-xs mt-1 block leading-relaxed font-semibold">Receive a consolidated invoice at the end of each month.</span>
                  </div>
                </div>
              ) : (
                <div className="border border-[#C6E7FF] bg-[#D4F6FF]/20 rounded-2xl p-5 flex items-start gap-3 shadow-2xs">
                  <CreditCard className="w-5 h-5 text-[#0F172A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-body-sm font-bold text-[#0F172A] block">Credit Card</span>
                    <span className="text-[#475569] text-xs mt-1 block leading-relaxed font-semibold">Pay per transaction or auto-charge monthly.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Password Change Card */}
          <div className="bg-white border border-[#C6E7FF] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C6E7FF]"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#D4F6FF]/40 border border-[#C6E7FF]/60 rounded-2xl">
                <Lock className="w-5 h-5 text-[#1E3A5F]" />
              </div>
              <h3 className="font-semibold text-lg text-[#0F172A]">Security</h3>
            </div>
            
            {passwordAlert && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-3 text-xs mb-4 flex items-center gap-2 shadow-2xs">
                <CheckCircle className="w-4 h-4 text-[#00a877] shrink-0" />
                <span className="font-semibold">{passwordAlert}</span>
              </div>
            )}
            
            {passwordError && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-3 text-xs mb-4 flex items-center gap-2 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-semibold">{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4 text-left relative z-10">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#FBFBFB]/50 border border-[#C6E7FF] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#C6E7FF] focus:border-[#0F172A] transition-all font-semibold"
                />
              </div>
              <button
                type="submit"
                className="mt-4 w-full bg-[#0F172A] text-white font-bold text-xs py-3 px-4 rounded-xl hover:bg-[#1E293B] active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* MongoDB Connection Card */}
          <div className="bg-white border border-[#C6E7FF] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C6E7FF]"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#D4F6FF]/40 border border-[#C6E7FF]/60 rounded-2xl">
                <Database className="w-5 h-5 text-[#1E3A5F]" />
              </div>
              <h3 className="font-semibold text-lg text-[#0F172A]">Database Connection</h3>
            </div>
            
            {mongoAlert && (
              <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-3 text-xs mb-4 flex items-center gap-2 shadow-2xs">
                <CheckCircle className="w-4 h-4 text-[#00a877] shrink-0" />
                <span className="font-semibold">{mongoAlert}</span>
              </div>
            )}
            
            {mongoError && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-3 text-xs mb-4 flex items-center gap-2 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-semibold">{mongoError}</span>
              </div>
            )}

            <div className="flex flex-col gap-4 relative z-10 text-left">
              <p className="text-[#475569] text-xs leading-relaxed font-semibold">
                If the application experiences connection timeouts or issues communicating with MongoDB Atlas, you can reset the cached connection pool and re-establish a fresh connection.
              </p>
              <button
                onClick={handleRefreshMongo}
                disabled={mongoLoading}
                className="w-full bg-[#0F172A] text-white font-bold text-xs py-3 px-4 rounded-xl hover:bg-[#1E293B] active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {mongoLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>{mongoLoading ? "Refreshing..." : "Refresh MongoDB Connection"}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Global Save Action Footer */}
      <div className="mt-8 flex justify-end gap-3 border-t border-[#D4F6FF] pt-6 max-w-6xl">
        <button
          onClick={handleDiscard}
          className="bg-white text-[#334155] border border-[#C6E7FF] hover:bg-[#FBFBFB] font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Discard Changes</span>
        </button>
        <button
          onClick={handleSaveAll}
          className="bg-[#0F172A] text-white font-bold text-xs py-3 px-6 rounded-xl hover:bg-[#1E293B] active:scale-95 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save All Settings</span>
        </button>
      </div>
    </div>
  );
}
