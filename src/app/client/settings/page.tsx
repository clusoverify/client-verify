"use client";

import React, { useState, useEffect } from "react";
import { usePortal } from "src/context/PortalContext";
import { getCurrencySymbol } from "src/lib/currencies";
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
  UploadCloud,
  Trash2,
  MessageSquare,
  Send,
  Clock,
  ShieldCheck,
  Tag,
  Layers,
  PlusCircle,
  DollarSign,
  HelpCircle,
  ChevronRight
} from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings, organisation, suggestions, submitSuggestion } = usePortal();

  // Company states
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [logo, setLogo] = useState("");

  // Contact states
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Legal details
  const [cin, setCin] = useState("");
  const [lut, setLut] = useState("");
  const [tin, setTin] = useState("");
  const [gstin, setGstin] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [billingSameAsCompany, setBillingSameAsCompany] = useState(true);
  const [billingAddress, setBillingAddress] = useState("");

  // Billing
  const [billingOption, setBillingOption] = useState<"invoice" | "card">("invoice");

  // Passwords
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Suggestion / Grievance form states
  const [reqType, setReqType] = useState<"enable_service" | "rate_query" | "suggestion" | "grievance">("enable_service");
  const [targetService, setTargetService] = useState("General");
  const [reqTitle, setReqTitle] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqSuccess, setReqSuccess] = useState("");
  const [reqError, setReqError] = useState("");

  // UI state
  const [saveAlert, setSaveAlert] = useState("");
  const [saveError, setSaveError] = useState("");
  const [passwordAlert, setPasswordAlert] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Country Rates collapse / expand states
  const [expandedEmpRates, setExpandedEmpRates] = useState(false);
  const [expandedEduRates, setExpandedEduRates] = useState(false);

  // Load context settings into local state
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || "");
      setAddress(settings.address || "");
      setCity(settings.city || "");
      setPostalCode(settings.postalCode || "");
      setLogo(settings.logo || "");
      setContactFirstName(settings.contactFirstName || "");
      setContactLastName(settings.contactLastName || "");
      setContactEmail(settings.contactEmail || "");
      setCin(settings.cin || "");
      setLut(settings.lut || "");
      setTin(settings.tin || "");
      setGstin(settings.gstin || "");
      setInvoiceEmail(settings.invoiceEmail || "");
      setBillingSameAsCompany(settings.billingSameAsCompany !== undefined ? settings.billingSameAsCompany : true);
      setBillingAddress(settings.billingAddress || "");
      setBillingOption(settings.billingOption || "invoice");
    }
  }, [settings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 204800) {
      setSaveError("Logo image size must be under 200KB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
      setSaveError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = () => {
    setSaveAlert("");
    setSaveError("");

    const missing = [];
    if (!contactFirstName.trim()) missing.push("First Name");
    if (!contactLastName.trim()) missing.push("Last Name");
    if (!address.trim()) missing.push("Registered Address");
    if (!city.trim()) missing.push("City");
    if (!postalCode.trim()) missing.push("Postal Code (Zipcode)");

    if (missing.length > 0) {
      setSaveError(`Please fill in all mandatory fields: ${missing.join(", ")}`);
      return;
    }

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
      gstin,
      invoiceEmail,
      billingSameAsCompany,
      billingAddress,
      logo,
    });
    setSaveAlert("All profile settings updated successfully!");
    setTimeout(() => setSaveAlert(""), 3000);
  };

  const handleDiscard = () => {
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
      setGstin(settings.gstin || "");
      setInvoiceEmail(settings.invoiceEmail || "");
      setBillingSameAsCompany(settings.billingSameAsCompany !== undefined ? settings.billingSameAsCompany : true);
      setBillingAddress(settings.billingAddress || "");
      setLogo(settings.logo || "");
      setBillingOption(settings.billingOption || "invoice");
      
      setSaveAlert("Changes discarded. Reloaded saved configuration.");
      setSaveError("");
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

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqSuccess("");
    setReqError("");

    if (!reqTitle.trim() || !reqMessage.trim()) {
      setReqError("Please provide a subject title and detailed message.");
      return;
    }

    setSubmittingReq(true);
    try {
      await submitSuggestion({
        type: reqType,
        title: reqTitle.trim(),
        message: reqMessage.trim(),
        targetService
      });
      setReqSuccess("Your request has been submitted to Admin! We will review and respond promptly.");
      setReqTitle("");
      setReqMessage("");
      setTimeout(() => setReqSuccess(""), 5000);
    } catch (err: any) {
      setReqError(err.message || "Failed to submit request to admin.");
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleQuickRequestService = (serviceKey: string, serviceTitle: string) => {
    setReqType("enable_service");
    setTargetService(serviceKey);
    setReqTitle(`Request enablement / rate review for ${serviceTitle}`);
    const el = document.getElementById("suggestion-box-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Service list with pricing, TAT & enablement status
  const serviceList = [
    {
      key: "identity",
      title: "Identity Verification",
      desc: "Aadhaar, PAN, Driving Licence & Passport check",
      rate: organisation?.identityRate ?? organisation?.monthlyRate ?? 10,
      enabled: organisation?.identityEnabled !== false,
      tat: organisation?.serviceTats?.identity || "24 Hours",
      icon: "badge"
    },
    {
      key: "court_record",
      title: "Court Record Search",
      desc: "Civil & Criminal court searches across eCourts network",
      rate: organisation?.courtRecordRate ?? organisation?.monthlyRate ?? 15,
      enabled: organisation?.courtRecordEnabled !== false,
      tat: organisation?.serviceTats?.court_record || "24 - 48 Hours",
      icon: "gavel"
    },
    {
      key: "employment",
      title: "Employment Verification",
      desc: "Work history, designation, CTC & manager reference validation",
      rate: organisation?.employmentRate ?? 5,
      enabled: organisation?.employmentEnabled !== false,
      tat: organisation?.serviceTats?.employment || "2 - 4 Business Days",
      icon: "work"
    },
    {
      key: "education",
      title: "Education Verification",
      desc: "University degree, roll number & institutional verification",
      rate: organisation?.educationRate ?? 5,
      enabled: organisation?.educationEnabled !== false,
      tat: organisation?.serviceTats?.education || "3 - 5 Business Days",
      icon: "school"
    },
    {
      key: "interpol",
      title: "Interpol & Global Watchlist",
      desc: "Screening against Interpol red notices & global crime watchlists",
      rate: organisation?.interpolRate ?? 10,
      enabled: organisation?.interpolEnabled !== false,
      tat: organisation?.serviceTats?.interpol || "24 Hours",
      icon: "travel_explore"
    },
    {
      key: "rednotice_worldwide",
      title: "Red Notice Worldwide",
      desc: "Worldwide screening across all Interpol member countries for active Red Notices",
      rate: organisation?.rednoticeWorldwideRate ?? 15,
      enabled: organisation?.rednoticeWorldwideEnabled !== false,
      tat: organisation?.serviceTats?.rednotice_worldwide || "24 Hours",
      icon: "public"
    },
    {
      key: "passport",
      title: "Passport Verification",
      desc: "Government database passport verification check",
      rate: organisation?.passportRate ?? 8,
      enabled: organisation?.passportEnabled !== false,
      tat: organisation?.serviceTats?.passport || "24 Hours",
      icon: "assignment_ind"
    },
    {
      key: "digital_address",
      title: "Digital Address Verification",
      desc: "Geo-tagged selfie & precise GPS location verification",
      rate: organisation?.digitalAddressRate ?? 5,
      enabled: organisation?.digitalAddressEnabled !== false,
      tat: organisation?.serviceTats?.digital_address || "24 - 48 Hours",
      icon: "location_on"
    },
    {
      key: "saflii_court",
      title: "South African Court Check",
      desc: "Search SAFLII database for court cases across Southern African jurisdictions",
      rate: organisation?.safliiCourtRate ?? 15,
      enabled: organisation?.safliiCourtEnabled !== false,
      tat: organisation?.serviceTats?.saflii_court || "24 Hours",
      icon: "gavel"
    },
    {
      key: "saps_wanted",
      title: "SAPS Wanted Check",
      desc: "South African Police Service crime stop wanted suspects registry",
      rate: (organisation as any)?.sapsWantedRate ?? 15,
      enabled: (organisation as any)?.sapsWantedEnabled !== false,
      tat: organisation?.serviceTats?.saps_wanted || "24 Hours",
      icon: "local_police"
    },
    {
      key: "uk_court",
      title: "UK Court Check",
      desc: "Official Courts and Tribunals Judiciary of England & Wales judgments & orders check",
      rate: organisation?.ukCourtRate ?? 25,
      enabled: organisation?.ukCourtEnabled !== false,
      tat: organisation?.serviceTats?.uk_court || "24 Hours",
      icon: "gavel"
    },
    {
      key: "malaysia_court",
      title: "Malaysia Court Check",
      desc: "Official Portal eJudgment Mahkamah Persekutuan Malaysia judgments & court orders check",
      rate: (organisation as any)?.malaysiaCourtRate ?? 20,
      enabled: (organisation as any)?.malaysiaCourtEnabled !== false,
      tat: organisation?.serviceTats?.malaysia_court || "24 Hours",
      icon: "gavel"
    },
    {
      key: "singapore_court",
      title: "Singapore Court Check",
      desc: "Official Singapore Judiciary (Supreme Court, State Courts & Family Justice Courts) hearing & case search",
      rate: (organisation as any)?.singaporeCourtRate ?? 20,
      enabled: (organisation as any)?.singaporeCourtEnabled !== false,
      tat: organisation?.serviceTats?.singapore_court || "24 Hours",
      icon: "gavel"
    },
    {
      key: "philippines_court",
      title: "Philippines Court Check",
      desc: "Official Court of Appeals of the Philippines (Case Status Inquiry System CSIS 3.0) case & decision search",
      rate: (organisation as any)?.philippinesCourtRate ?? 20,
      enabled: (organisation as any)?.philippinesCourtEnabled !== false,
      tat: organisation?.serviceTats?.philippines_court || "24 Hours",
      icon: "gavel"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Service Enabled":
      case "Resolved":
        return <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> {status}</span>;
      case "Under Review":
        return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full"><Clock className="w-3 h-3 animate-spin" /> Under Review</span>;
      case "Closed":
        return <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Closed</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-4 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-[#f0f5ea] pb-5 mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#00450e] bg-[#f0f5ea]/60 px-2.5 py-1 rounded-full w-fit uppercase tracking-wider font-label-caps border border-[#eaf0e4]/60">
          <Sparkles className="w-3.5 h-3.5 text-[#181d16]" />
          <span>PORTAL CONFIGURATION &amp; OFFERINGS</span>
        </div>
        <h2 className="font-display-lg text-[#181d16] font-bold tracking-tight text-3xl mt-2">Settings &amp; Profile</h2>
        <p className="text-secondary mt-1 text-sm text-slate-500">Manage company details, review decided service rates, and communicate directly with Admin.</p>
      </div>

      {saveAlert && (
        <div className="bg-[#E6F8F3] text-[#00684A] border border-[#A3EAD6] rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-6xl animate-fade-in shadow-2xs">
          <CheckCircle className="w-5 h-5 text-[#00a877] shrink-0" />
          <span className="font-semibold">{saveAlert}</span>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 font-body-sm flex items-center gap-3 max-w-6xl animate-fade-in shadow-2xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold">{saveError}</span>
        </div>
      )}

      {/* ── SECTION 1: Decided Service Rates & Active Offerings ── */}
      <div className="bg-white border border-[#eaf0e4] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden max-w-6xl transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00450e] via-[#016e1c] to-[#eaf0e4]"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#f0f5ea] border border-[#eaf0e4] rounded-2xl text-[#00450e]">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-[#181d16]">Decided Service Rates &amp; Offerings</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Custom rates and SLA Turn Around Times (TAT) agreed with Cluso Infolink.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-[#f6fbf0] border border-[#eaf0e4] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#00450e]">
              <ShieldCheck className="w-4 h-4 text-[#016e1c]" />
              <span>Organisation Plan: {organisation?.paymentPlan || "Standard Enterprise"}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#f0f5ea] border border-[#eaf0e4] px-3 py-1.5 rounded-full text-xs font-bold text-[#00450e]">
              <span className="material-symbols-outlined text-sm">currency_exchange</span>
              <span>Currency: {organisation?.currency || "USD"} ({getCurrencySymbol(organisation?.currency)})</span>
            </div>
          </div>
        </div>

        {/* Compact Table View for Decided Service Rates & Offerings */}
        <div className="overflow-hidden border border-slate-200/80 rounded-2xl bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f6fbf0]/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 font-extrabold">Service Offerings</th>
                  <th className="py-3 px-4 font-extrabold">Decided Rate</th>
                  <th className="py-3 px-4 font-extrabold">Status</th>
                  <th className="py-3 px-4 font-extrabold text-right">TAT (Turn Around Time)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {serviceList.map((svc) => (
                  <React.Fragment key={svc.key}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-lg text-[#00450e] p-1.5 bg-[#f0f5ea] rounded-lg shrink-0">
                            {svc.icon}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{svc.title}</span>
                            <span className="text-[11px] text-slate-400 font-medium block truncate max-w-xs">{svc.desc}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-sm font-extrabold text-[#00450e]">
                              {getCurrencySymbol(organisation?.currency)}{svc.rate.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal"> / check</span>
                          </div>
                          {(svc.key === "employment" || svc.key === "education") && (
                            <button
                              type="button"
                              onClick={() => {
                                if (svc.key === "employment") setExpandedEmpRates(!expandedEmpRates);
                                if (svc.key === "education") setExpandedEduRates(!expandedEduRates);
                              }}
                              className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-[#00450e] bg-[#f0f5ea] hover:bg-[#00450e] hover:text-white rounded-lg border border-[#eaf0e4] transition-all cursor-pointer shadow-2xs"
                            >
                              <span>Country Rates</span>
                              <span className="material-symbols-outlined text-[12px]">
                                {(svc.key === "employment" ? expandedEmpRates : expandedEduRates) ? "expand_less" : "expand_more"}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {svc.enabled ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f6fbf0] text-[#00450e] font-bold text-xs rounded-xl border border-[#eaf0e4]">
                          <Clock className="w-3.5 h-3.5 text-[#016e1c]" />
                          <span>{svc.tat}</span>
                        </span>
                      </td>
                    </tr>

                    {/* Collapsible Country Rates for Employment Verification */}
                    {svc.key === "employment" && expandedEmpRates && (
                      <tr className="bg-[#f0f5ea]/30 animate-fade-in">
                        <td colSpan={4} className="p-3 sm:p-4">
                          <div className="bg-white border border-[#eaf0e4] rounded-2xl p-3.5 shadow-2xs">
                            <div className="flex items-center justify-between mb-2.5 border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-[#00450e]">public</span>
                                <span className="text-xs font-extrabold text-[#00450e] uppercase tracking-wider">Employment Verification — Country Specific Rates</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">Custom agreed rates per country</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                              {["India", "Singapore", "Malaysia", "Philippines", "UAE", "Default"].map((country) => {
                                const defaultMap: Record<string, number> = { Singapore: 15, Malaysia: 12, Philippines: 10, UAE: 20, India: organisation?.employmentRate ?? 5, Default: organisation?.employmentRate ?? 5 };
                                const rateVal = organisation?.employmentRates?.[country] ?? defaultMap[country] ?? 5;
                                return (
                                  <div key={country} className="bg-[#f6fbf0] border border-[#eaf0e4] rounded-xl p-2 text-center flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-slate-600 block">{country}</span>
                                    <span className="text-xs font-extrabold text-[#00450e] mt-0.5">{getCurrencySymbol(organisation?.currency)}{Number(rateVal).toFixed(2)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Collapsible Country Rates for Education Verification */}
                    {svc.key === "education" && expandedEduRates && (
                      <tr className="bg-[#f0f5ea]/30 animate-fade-in">
                        <td colSpan={4} className="p-3 sm:p-4">
                          <div className="bg-white border border-[#eaf0e4] rounded-2xl p-3.5 shadow-2xs">
                            <div className="flex items-center justify-between mb-2.5 border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-[#00450e]">public</span>
                                <span className="text-xs font-extrabold text-[#00450e] uppercase tracking-wider">Education Verification — Country Specific Rates</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">Custom agreed rates per country</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                              {["India", "Singapore", "Malaysia", "Philippines", "UAE", "Default"].map((country) => {
                                const defaultMap: Record<string, number> = { Singapore: 15, Malaysia: 12, Philippines: 10, UAE: 20, India: organisation?.educationRate ?? 5, Default: organisation?.educationRate ?? 5 };
                                const rateVal = organisation?.educationRates?.[country] ?? defaultMap[country] ?? 5;
                                return (
                                  <div key={country} className="bg-[#f6fbf0] border border-[#eaf0e4] rounded-xl p-2 text-center flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-slate-600 block">{country}</span>
                                    <span className="text-xs font-extrabold text-[#00450e] mt-0.5">{getCurrencySymbol(organisation?.currency)}{Number(rateVal).toFixed(2)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout for Forms */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">
        {/* Left Column (Spans 2 columns on xl screens) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Company Profile Card */}
          <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#eaf0e4]"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#f0f5ea]/40 border border-[#eaf0e4]/60 rounded-2xl">
                <Building className="w-5 h-5 text-[#00450e]" />
              </div>
              <h3 className="font-semibold text-lg text-[#181d16]">Company Profile</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {/* Company Logo Upload Section */}
              <div className="flex flex-col gap-2 md:col-span-2 border-b border-dashed border-[#eaf0e4]/60 pb-6 mb-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Company Logo</label>
                <div className="flex flex-col sm:flex-row items-center gap-6 mt-1">
                  <div className="w-28 h-28 border border-[#eaf0e4] rounded-2xl bg-[#F8FAFC] flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {logo ? (
                      <img src={logo} alt="Company Logo Preview" className="object-contain w-full h-full p-2" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-450 p-2 text-center">
                        <Building className="w-8 h-8 opacity-40 mb-1" />
                        <span className="text-[10px] font-bold">No Logo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-2 text-left w-full">
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer bg-[#f0f5ea]/60 hover:bg-[#f0f5ea] border border-[#eaf0e4]/80 text-[#00450e] font-bold text-xs px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs">
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                      
                      {logo && (
                        <button
                          type="button"
                          onClick={() => setLogo("")}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                      Supports PNG, JPG, or JPEG. Maximum file size <strong className="text-slate-700">200KB</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  disabled
                  className="w-full bg-[#F1F5F9]/80 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-slate-500 cursor-not-allowed transition-all font-semibold opacity-75"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Registered Address <span className="text-red-500 font-bold">*</span></label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">City <span className="text-red-500 font-bold">*</span></label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Postal Code (Zipcode) <span className="text-red-500 font-bold">*</span></label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Contact Person Card */}
          <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#eaf0e4]"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#f0f5ea]/40 border border-[#eaf0e4]/60 rounded-2xl">
                <User className="w-5 h-5 text-[#00450e]" />
              </div>
              <h3 className="font-semibold text-lg text-[#181d16]">Contact Person</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">First Name <span className="text-red-500 font-bold">*</span></label>
                <input
                  type="text"
                  value={contactFirstName}
                  onChange={(e) => setContactFirstName(e.target.value)}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Last Name <span className="text-red-500 font-bold">*</span></label>
                <input
                  type="text"
                  value={contactLastName}
                  onChange={(e) => setContactLastName(e.target.value)}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Email ID</label>
                <input
                  type="email"
                  value={contactEmail}
                  disabled
                  className="w-full bg-[#F1F5F9]/80 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-slate-500 cursor-not-allowed transition-all font-semibold opacity-75"
                />
              </div>
            </div>
          </div>

          {/* Legal Details Card */}
          <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#eaf0e4]"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#f0f5ea]/40 border border-[#eaf0e4]/60 rounded-2xl">
                <Scale className="w-5 h-5 text-[#00450e]" />
              </div>
              <h3 className="font-semibold text-lg text-[#181d16]">Legal Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Employer Identification Number (EIN)</label>
                <input
                  type="text"
                  placeholder="e.g. 12-3456789"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">State of Incorporation</label>
                <input
                  type="text"
                  placeholder="e.g. Delaware"
                  value={lut}
                  onChange={(e) => setLut(e.target.value)}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">DUNS Number</label>
                <input
                  type="text"
                  placeholder="e.g. 12-345-6789"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">State Tax ID / Sales Tax ID</label>
                <input
                  type="text"
                  placeholder="e.g. 1234567-8"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Invoice Email</label>
                <input
                  type="email"
                  placeholder="Enter invoice billing email"
                  value={invoiceEmail}
                  onChange={(e) => setInvoiceEmail(e.target.value)}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Billing Address same as Company Address?</label>
                <select
                  value={billingSameAsCompany ? "yes" : "no"}
                  onChange={(e) => setBillingSameAsCompany(e.target.value === "yes")}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold cursor-pointer"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              {!billingSameAsCompany && (
                <div className="flex flex-col gap-2 md:col-span-2 animate-fade-in">
                  <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Billing Address</label>
                  <textarea
                    placeholder="Enter custom billing address"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold resize-none font-sans"
                  />
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Narrower - Spans 1 column on xl screens) */}
        <div className="flex flex-col gap-6">
          
          {/* Billing Options Card */}
          <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#eaf0e4]"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#f0f5ea]/40 border border-[#eaf0e4]/60 rounded-2xl">
                <CreditCard className="w-5 h-5 text-[#00450e]" />
              </div>
              <h3 className="font-semibold text-lg text-[#181d16]">Billing Options</h3>
            </div>
            
            <div className="flex flex-col gap-4 relative z-10">
              {billingOption === "invoice" ? (
                <div className="border border-[#eaf0e4] bg-[#f0f5ea]/20 rounded-2xl p-5 flex items-start gap-3 shadow-2xs">
                  <FileText className="w-5 h-5 text-[#181d16] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-body-sm font-bold text-[#181d16] block">Monthly Invoicing</span>
                    <span className="text-[#475569] text-xs mt-1 block leading-relaxed font-semibold">Receive a consolidated invoice at the end of each month.</span>
                  </div>
                </div>
              ) : (
                <div className="border border-[#eaf0e4] bg-[#f0f5ea]/20 rounded-2xl p-5 flex items-start gap-3 shadow-2xs">
                  <CreditCard className="w-5 h-5 text-[#181d16] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-body-sm font-bold text-[#181d16] block">Credit Card</span>
                    <span className="text-[#475569] text-xs mt-1 block leading-relaxed font-semibold">Pay per transaction or auto-charge monthly.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Password Change Card */}
          <div className="bg-white border border-[#eaf0e4] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#eaf0e4]"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#f0f5ea]/40 border border-[#eaf0e4]/60 rounded-2xl">
                <Lock className="w-5 h-5 text-[#00450e]" />
              </div>
              <h3 className="font-semibold text-lg text-[#181d16]">Security</h3>
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
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#f6fbf0]/50 border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-all font-semibold"
                />
              </div>
              <button
                type="submit"
                className="mt-4 w-full bg-[#181d16] text-white font-bold text-xs py-3 px-4 rounded-xl hover:bg-[#1E293B] active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                Update Password
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* ── SECTION 2: Suggestion, Service Request & Grievance Box ── */}
      <div id="suggestion-box-section" className="bg-white border border-[#eaf0e4] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden max-w-6xl mt-4">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#00450e]"></div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#f0f5ea] border border-[#eaf0e4] rounded-2xl text-[#00450e]">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-[#181d16]">Service Requests, Suggestions &amp; Grievance Box</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Need a new service enabled, custom rate revision, or have a grievance? Submit directly to Admin below.</p>
          </div>
        </div>

        {reqSuccess && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 text-xs font-semibold mb-6 flex items-center gap-3 animate-fade-in shadow-2xs">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{reqSuccess}</span>
          </div>
        )}

        {reqError && (
          <div className="bg-rose-50 text-rose-800 border border-rose-200 rounded-xl p-4 text-xs font-semibold mb-6 flex items-center gap-3 animate-fade-in shadow-2xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{reqError}</span>
          </div>
        )}

        {/* Submit Form */}
        <form onSubmit={handleSubmitSuggestion} className="bg-[#f6fbf0]/60 border border-[#eaf0e4] rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Request Type</label>
              <select
                value={reqType}
                onChange={(e: any) => setReqType(e.target.value)}
                className="w-full bg-white border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#00450e]/20"
              >
                <option value="enable_service">🚀 Enable New Service / Feature</option>
                <option value="rate_query">💲 Custom Service Rates / Pricing Inquiry</option>
                <option value="suggestion">💡 General Suggestion</option>
                <option value="grievance">⚠️ Grievance / Issue Ticket</option>
              </select>
            </div>

            <div>
              <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Target Service (Optional)</label>
              <select
                value={targetService}
                onChange={(e) => setTargetService(e.target.value)}
                className="w-full bg-white border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#00450e]/20"
              >
                <option value="General">General / Organization-Wide</option>
                <option value="identity">Identity Verification</option>
                <option value="court_record">Court Record Search</option>
                <option value="employment">Employment Verification</option>
                <option value="education">Education Verification</option>
                <option value="interpol">Interpol &amp; Watchlist</option>
                <option value="rednotice_worldwide">Red Notice Worldwide</option>
                <option value="passport">Passport Verification</option>
                <option value="digital_address">Digital Address Verification</option>
                <option value="saflii_court">South African Court Check</option>
                <option value="saps_wanted">SAPS Wanted Check</option>
                <option value="uk_court">UK Court Check</option>
                <option value="malaysia_court">Malaysia Court Check</option>
                <option value="singapore_court">Singapore Court Check</option>
                <option value="philippines_court">Philippines Court Check</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Subject / Request Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Briefly state your request or grievance (e.g. Request to enable Interpol check for our team)"
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                className="w-full bg-white border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#00450e]/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-label-caps text-[#475569] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Detailed Message <span className="text-red-500">*</span></label>
              <textarea
                rows={3}
                placeholder="Provide complete details, requirements, or any feedback for the Cluso Infolink Admin team..."
                value={reqMessage}
                onChange={(e) => setReqMessage(e.target.value)}
                className="w-full bg-white border border-[#eaf0e4] rounded-xl px-4 py-2.5 font-body-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#00450e]/20 font-sans resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingReq}
              className="bg-[#00450e] hover:bg-[#016e1c] text-white font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {submittingReq ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Submit Request to Admin</span>
            </button>
          </div>
        </form>

        {/* History of Submitted Requests */}
        <div>
          <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00450e]" />
            <span>Your Submitted Requests &amp; Admin Responses ({suggestions?.length || 0})</span>
          </h4>

          {(!suggestions || suggestions.length === 0) ? (
            <div className="text-center py-8 px-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">No requests submitted yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Use the form above if you need new services enabled or rate adjustments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((sug) => (
                <div key={sug.id} className="p-4 bg-white border border-slate-200 rounded-2xl transition-all hover:border-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#00450e]">{sug.id}</span>
                      <span className="text-xs font-extrabold text-slate-800">{sug.title}</span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                        {sug.type.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(sug.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                      </span>
                      {getStatusBadge(sug.status)}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
                    {sug.message}
                  </p>

                  {sug.adminReply && (
                    <div className="mt-3 p-3 bg-[#f0f5ea]/70 border border-[#eaf0e4] rounded-xl flex items-start gap-2.5">
                      <div className="p-1 bg-[#00450e] text-white rounded-lg shrink-0 mt-0.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-[#00450e] block">Admin Response:</span>
                        <p className="text-xs text-slate-800 font-medium mt-0.5">{sug.adminReply}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Global Save Action Footer */}
      <div className="mt-8 flex justify-end gap-3 border-t border-[#f0f5ea] pt-6 max-w-6xl">
        <button
          onClick={handleDiscard}
          className="bg-white text-[#334155] border border-[#eaf0e4] hover:bg-[#f6fbf0] font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Discard Changes</span>
        </button>
        <button
          onClick={handleSaveAll}
          className="bg-[#181d16] text-white font-bold text-xs py-3 px-6 rounded-xl hover:bg-[#1E293B] active:scale-95 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save All Settings</span>
        </button>
      </div>
    </div>
  );
}
