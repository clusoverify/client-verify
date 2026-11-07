"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePortal, ApiKey } from "src/context/PortalContext";
import { useAuth } from "src/context/AuthContext";
import {
  Key,
  Copy,
  Check,
  Code,
  Terminal,
  ExternalLink,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Activity,
  DollarSign,
  Globe,
  Sparkles,
  Layers,
  XCircle,
  Play,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck,
  Send,
  FileCode,
  ChevronRight,
} from "lucide-react";

interface EndpointDefinition {
  id: string;
  category: "verification" | "retrieval";
  name: string;
  method: "POST" | "GET";
  path: string;
  description: string;
  payload?: Record<string, any>;
  sampleResponse: Record<string, any>;
  notes?: string;
}

const ALL_API_ENDPOINTS: EndpointDefinition[] = [
  {
    id: "identity",
    category: "verification",
    name: "Identity & Candidate Setup",
    method: "POST",
    path: "/api/v1/external/verify/identity",
    description: "Initiates Aadhaar/DigiLocker identity check, creates candidate portal account, and returns candidate setup URL.",
    payload: {
      candidateName: "Jane Doe",
      candidateEmail: "jane.doe@example.com",
      requestingOrgName: "Acme Corp"
    },
    sampleResponse: {
      success: true,
      requestId: "INF040926-0001",
      status: "processing",
      candidateSetupUrl: "https://candidate.verify.clusoinfolink.com/?email=jane.doe%40example.com&password=Cluso%40...",
      message: "Identity verification request created successfully."
    },
    notes: "Returns candidateSetupUrl which you can deliver to candidate via SMS or email."
  },
  {
    id: "court-record",
    category: "verification",
    name: "Court Record (eCourts)",
    method: "POST",
    path: "/api/v1/external/verify/court-record",
    description: "Multi-address civil and criminal litigation search across Indian district and high courts.",
    payload: {
      candidateName: "Rajesh Kumar",
      candidateDob: "1992-05-14",
      fatherName: "Suresh Kumar",
      gender: "Male",
      addresses: [
        {
          address: "42 MG Road, Indiranagar",
          city: "Bengaluru",
          state: "Karnataka",
          district: "Bengaluru Urban",
          stateCode: "29",
          districtCode: "1"
        }
      ]
    },
    sampleResponse: {
      success: true,
      requestId: "CRT040926-0002",
      status: "processing",
      message: "Court record verification created. eCourts search initiated."
    },
    notes: "Requires candidateName and at least one address object with state and district."
  },
  {
    id: "passport",
    category: "verification",
    name: "Passport Status Check",
    method: "POST",
    path: "/api/v1/external/verify/passport",
    description: "Live validation of Indian passport file number and date of birth via official Passport Seva.",
    payload: {
      fileNumber: "BGO076543210924",
      dateOfBirth: "15/08/1990"
    },
    sampleResponse: {
      success: true,
      requestId: "PSP040926-0001",
      status: "completed",
      candidateName: "SURESH KUMAR",
      fileNumber: "BGO076543210924",
      passportStatus: "Passport has been delivered to applicant.",
      details: {
        typeOfApplication: "Normal",
        applicationReceivedDate: "12/05/2024",
        statusMessage: "Passport has been delivered to applicant."
      }
    },
    notes: "Synchronous check. Returns government dispatch status and applicant name immediately."
  },
  {
    id: "digital-address",
    category: "verification",
    name: "Digital Address Verification",
    method: "POST",
    path: "/api/v1/external/verify/digital-address",
    description: "GPS-tagged geo-selfie and doorstep verification for physical residential address confirmation.",
    payload: {
      candidateName: "Priya Sharma",
      candidateEmail: "priya.sharma@example.com",
      candidateAddress: "Flat 402, Sunrise Towers, HSR Layout, Bengaluru"
    },
    sampleResponse: {
      success: true,
      requestId: "DAV040926-0001",
      status: "processing",
      candidateSetupUrl: "https://candidate.verify.clusoinfolink.com/?email=priya.sharma%40example.com...",
      message: "Digital address verification created successfully."
    },
    notes: "Candidate opens candidateSetupUrl on mobile device to capture GPS geotagged photo proof."
  },
  {
    id: "interpol",
    category: "verification",
    name: "Interpol Wanted Notices",
    method: "POST",
    path: "/api/v1/external/verify/interpol",
    description: "Instant cross-reference against international Interpol wanted and missing persons database.",
    payload: {
      candidateName: "Vikram Singh",
      candidateDob: "1988-11-20",
      birthCity: "Mumbai"
    },
    sampleResponse: {
      success: true,
      requestId: "INT040926-0001",
      status: "completed",
      hasRecords: false,
      matchCount: 0,
      message: "No records found. Clean record."
    },
    notes: "Instant synchronous check. Returns matched notices and warrant charges if any."
  },
  {
    id: "rednotice",
    category: "verification",
    name: "Interpol Worldwide Red Notice",
    method: "POST",
    path: "/api/v1/external/verify/rednotice",
    description: "Global screening across 196 member countries for active international fugitive red notices.",
    payload: {
      candidateName: "Carlos Silva",
      candidateDob: "1982-04-15",
      birthCity: "Sao Paulo"
    },
    sampleResponse: {
      success: true,
      requestId: "RNW040926-0001",
      status: "completed",
      hasRecords: false,
      matchCount: 0,
      matches: []
    },
    notes: "Instant database check against 5,820+ worldwide red notice records."
  },
  {
    id: "saflii-court",
    category: "verification",
    name: "South African Court (SAFLII)",
    method: "POST",
    path: "/api/v1/external/verify/saflii-court",
    description: "Litigation & judgment checks across High Courts and Supreme Court of Appeal of South Africa.",
    payload: {
      candidateName: "Johan Van Der Merwe",
      candidateDob: "1985-02-17",
      birthCity: "Cape Town"
    },
    sampleResponse: {
      success: true,
      requestId: "SAF040926-0001",
      status: "processing",
      message: "SAFLII Court check initiated. Results will be available via the status endpoint."
    },
    notes: "Asynchronous scraper. Query status after 5-10 seconds to retrieve matching case citations."
  },
  {
    id: "saps-wanted",
    category: "verification",
    name: "SAPS Wanted Persons (South Africa)",
    method: "POST",
    path: "/api/v1/external/verify/saps-wanted",
    description: "National police wanted persons registry check for South Africa.",
    payload: {
      candidateName: "Sipho Ndlovu",
      candidateDob: "1990-07-22",
      candidateIdNumber: "9007225000081",
      provinceCity: "Gauteng"
    },
    sampleResponse: {
      success: true,
      requestId: "SAP040926-0001",
      status: "completed",
      hasRecords: false,
      matchCount: 0
    },
    notes: "Instant check. If potential match is detected, status marks 'halted' for legal review."
  },
  {
    id: "uk-court",
    category: "verification",
    name: "UK Court Records Check",
    method: "POST",
    path: "/api/v1/external/verify/uk-court",
    description: "Courts and Tribunals Judiciary of England & Wales official judgments and sentencing remarks.",
    payload: {
      candidateName: "James Arthur Davies",
      candidateDob: "1983-09-14",
      judgmentType: "Criminal",
      jurisdiction: "Crown Court"
    },
    sampleResponse: {
      success: true,
      requestId: "UKC040926-0001",
      status: "processing",
      message: "UK Court check initiated. Results will be available via the status endpoint."
    },
    notes: "Queries official judiciary portal for judgment transcripts and committals."
  },
  {
    id: "malaysia-court",
    category: "verification",
    name: "Malaysia Court Records Check",
    method: "POST",
    path: "/api/v1/external/verify/malaysia-court",
    description: "Official eJudgment portal of Mahkamah Persekutuan Malaysia litigation records.",
    payload: {
      candidateName: "Tan Wei Meng",
      candidateDob: "1991-03-05",
      courtCategory: "High Court",
      courtLocation: "Kuala Lumpur"
    },
    sampleResponse: {
      success: true,
      requestId: "MYC040926-0001",
      status: "processing",
      message: "Malaysia Court check initiated. Results will be available via the status endpoint."
    },
    notes: "Asynchronous search. Full case numbers and judgment PDFs returned when completed."
  },
  {
    id: "philippines-court",
    category: "verification",
    name: "Philippines Court of Appeals Check",
    method: "POST",
    path: "/api/v1/external/verify/philippines-court",
    description: "Live search across Court of Appeals stations: CA Manila, CA Visayas, and CA Mindanao.",
    payload: {
      candidateName: "Juan Dela Cruz",
      candidateDob: "1990-06-15",
      station: "all",
      caseNo: ""
    },
    sampleResponse: {
      success: true,
      requestId: "PHC070926-0001",
      status: "processing",
      message: "Philippines Court of Appeals check initiated. Results will be available via the status endpoint."
    },
    notes: "Searches all three CA stations by default. Set station to 'mnl', 'ceb', or 'cdo' to target one."
  },
  {
    id: "singapore-court",
    category: "verification",
    name: "Singapore Court Records Check",
    method: "POST",
    path: "/api/v1/external/verify/singapore-court",
    description: "Singapore Judiciary hearing list search across Supreme Court, State Courts, and Family Justice Courts.",
    payload: {
      candidateName: "Tan Wei Lin",
      court: "Supreme Court",
      hearingType: "",
      judgeName: "",
      lawFirm: ""
    },
    sampleResponse: {
      success: true,
      requestId: "SGC070926-0001",
      status: "processing",
      message: "Singapore Court check initiated. Results will be available via the status endpoint."
    },
    notes: "Optional filters: court ('Supreme Court', 'State Courts', 'Family Justice Courts'), judgeName, lawFirm."
  },
  {
    id: "employment",
    category: "verification",
    name: "Employment Verification",
    method: "POST",
    path: "/api/v1/external/verify/employment",
    description: "Previous employer background check with multi-tenure and designation validation.",
    payload: {
      candidateName: "Sneha Patel",
      email: "sneha.p@example.com",
      mobile: "+919876543210",
      skipCandidateLogin: true,
      employments: [
        {
          companyName: "Tech Mahindra",
          position: "Software Engineer",
          joiningYear: "2021",
          leavingYear: "2024",
          employeeCode: "TM-4412"
        }
      ]
    },
    sampleResponse: {
      success: true,
      requestId: "EMP040926-0001",
      status: "processing",
      itemCount: 1,
      message: "Employment verification created successfully."
    },
    notes: "Set skipCandidateLogin: true to provide employer records directly from your ATS/HRMS."
  },
  {
    id: "education",
    category: "verification",
    name: "Education Verification",
    method: "POST",
    path: "/api/v1/external/verify/education",
    description: "Academic qualification, university degree, roll number, and graduation credentials verification.",
    payload: {
      candidateName: "Sneha Patel",
      email: "sneha.p@example.com",
      skipCandidateLogin: true,
      educationList: [
        {
          boardUniversity: "University of Delhi",
          courseName: "Bachelor of Technology",
          passingYear: "2021",
          rollNumber: "DTU-2017-094"
        }
      ]
    },
    sampleResponse: {
      success: true,
      requestId: "EDU040926-0001",
      status: "processing",
      itemCount: 1,
      message: "Education verification created successfully."
    },
    notes: "Set skipCandidateLogin: true to inject university degrees directly."
  },
  {
    id: "status",
    category: "retrieval",
    name: "Check Request Status",
    method: "GET",
    path: "/api/v1/external/status/{requestId}",
    description: "Poll real-time processing status, sub-status, and timestamps for any verification check.",
    sampleResponse: {
      success: true,
      requestId: "ACM040926-0001",
      candidateName: "Jane Doe",
      type: "identity",
      status: "Completed",
      createdAt: "2026-09-04T10:15:00.000Z",
      completedAt: "2026-09-04T10:18:22.000Z",
      progress: {
        subStatus: "completed",
        onboardingStatus: "completed"
      }
    },
    notes: "Status polling is free of charge (cost: 0). Recommended interval: 5 to 10 seconds."
  },
  {
    id: "report",
    category: "retrieval",
    name: "Fetch Final Verification Report",
    method: "GET",
    path: "/api/v1/external/report/{requestId}",
    description: "Download the complete sanitized verification report JSON payload once check is completed.",
    sampleResponse: {
      success: true,
      requestId: "ACM040926-0001",
      type: "identity",
      status: "Completed",
      candidateName: "Jane Doe",
      report: {
        id: "ACM040926-0001",
        name: "Jane Doe",
        email: "jane.doe@example.com",
        status: "Completed",
        date: "Sep 04, 2026",
        source: "api"
      },
      reportUrl: "https://verify.clusoinfolink.com/client/report/ACM040926-0001",
      pdfUrl: "https://verify.clusoinfolink.com/api/v1/external/report/ACM040926-0001/pdf"
    },
    notes: "Returns 200 with status message if verification is still processing."
  },
  {
    id: "pdf-report",
    category: "retrieval",
    name: "Download Report as PDF (HTML)",
    method: "GET",
    path: "/api/v1/external/report/{requestId}/pdf",
    description: "Download the completed verification report as a print-ready self-contained HTML document.",
    sampleResponse: {
      contentType: "text/html; charset=utf-8",
      contentDisposition: "attachment; filename=\"report-ACM040926-0001.html\"",
      body: "<!DOCTYPE html><html>... (full self-contained report document) ...</html>"
    },
    notes: "Returns HTML with Content-Disposition: attachment. Open in browser and Ctrl+P to save as PDF."
  },
  {
    id: "list",
    category: "retrieval",
    name: "List Organisation Verifications",
    method: "GET",
    path: "/api/v1/external/list?page=1&limit=20&status=Completed",
    description: "Paginated list of verifications for your organisation with optional filters (page, limit, status, type).",
    sampleResponse: {
      success: true,
      page: 1,
      limit: 20,
      total: 42,
      totalPages: 3,
      verifications: [
        {
          id: "ACM040926-0001",
          name: "Jane Doe",
          type: "identity",
          status: "Completed",
          date: "Sep 04, 2026"
        }
      ]
    },
    notes: "Supports query parameters: page, limit (max 100), status, and type."
  }
];

export default function ApiSettingsPage() {
  const {
    apiKeys,
    apiUsage,
    generateApiKey,
    revokeApiKey,
    fetchApiUsage,
    organisation,
  } = usePortal();
  const { profile } = useAuth();

  // State management
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>("identity");
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "node" | "python">("curl");
  const [selectedView, setSelectedView] = useState<"request" | "response">("request");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "verification" | "retrieval">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [quickTestStatus, setQuickTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [quickTestResult, setQuickTestResult] = useState<any>(null);

  const isOwner = profile?.role === "org_owner";
  const currency = organisation?.currency || "USD";
  const currencySymbol = currency === "INR" ? "₹" : "$";

  useEffect(() => {
    fetchApiUsage();
  }, [fetchApiUsage]);

  const activeApiKeys = (apiKeys || []).filter((k: ApiKey) => k.status === "active");
  const activeEndpoint = ALL_API_ENDPOINTS.find((e) => e.id === selectedEndpointId) || ALL_API_ENDPOINTS[0];

  const filteredEndpoints = ALL_API_ENDPOINTS.filter((ep) => {
    if (categoryFilter !== "all" && ep.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return ep.name.toLowerCase().includes(q) || ep.path.toLowerCase().includes(q) || ep.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Handle Key Generation
  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      const res = await generateApiKey();
      if (res?.success && res.apiKey?.fullKey) {
        setNewlyCreatedKey(res.apiKey.fullKey);
        setShowNewKeyModal(true);
      } else if (res?.error) {
        alert(res.error);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to generate key");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Key Revocation
  const handleRevokeKey = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this secret API key? Any applications currently using this key will immediately fail authentication.")) {
      return;
    }
    setRevokingId(id);
    try {
      await revokeApiKey(id);
    } catch (err: any) {
      alert(err?.message || "Failed to revoke key");
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopyText = (text: string, type: "key" | "snippet") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  // Snippet Generators
  const getGeneratedCode = () => {
    const baseUrl = "https://verify.clusoinfolink.com";
    const sampleToken = activeApiKeys.length > 0
      ? `${activeApiKeys[0].keyPrefix || "sk_live_"}••••••••••••••••••••••••••••${activeApiKeys[0].keySuffix}`
      : "sk_live_YOUR_SECRET_KEY";

    if (codeLanguage === "curl") {
      if (activeEndpoint.method === "POST") {
        return `curl -X POST "${baseUrl}${activeEndpoint.path}" \\
  -H "Authorization: Bearer ${sampleToken}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(activeEndpoint.payload || {}, null, 2)}'`;
      } else {
        return `curl -X GET "${baseUrl}${activeEndpoint.path.replace("{requestId}", "ACM040926-0001")}" \\
  -H "Authorization: Bearer ${sampleToken}"`;
      }
    }

    if (codeLanguage === "node") {
      if (activeEndpoint.method === "POST") {
        return `// Node.js 18+ (fetch API)
const response = await fetch("${baseUrl}${activeEndpoint.path}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${sampleToken}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${JSON.stringify(activeEndpoint.payload || {}, null, 2)})
});

const data = await response.json();
console.log("Verification Response:", data);`;
      } else {
        return `// Node.js 18+ (fetch API)
const response = await fetch("${baseUrl}${activeEndpoint.path.replace("{requestId}", "ACM040926-0001")}", {
  method: "GET",
  headers: {
    "Authorization": "Bearer ${sampleToken}"
  }
});

const data = await response.json();
console.log("Result:", data);`;
      }
    }

    if (codeLanguage === "python") {
      if (activeEndpoint.method === "POST") {
        return `# Python 3 (requests)
import requests

url = "${baseUrl}${activeEndpoint.path}"
headers = {
    "Authorization": "Bearer ${sampleToken}",
    "Content-Type": "application/json"
}
payload = ${JSON.stringify(activeEndpoint.payload || {}, null, 4)}

response = requests.post(url, headers=headers, json=payload)
data = response.json()
print("Verification Response:", data)`;
      } else {
        return `# Python 3 (requests)
import requests

url = "${baseUrl}${activeEndpoint.path.replace("{requestId}", "ACM040926-0001")}"
headers = {
    "Authorization": "Bearer ${sampleToken}"
}

response = requests.get(url, headers=headers)
data = response.json()
print("Result:", data)`;
      }
    }

    return "";
  };

  // Quick Live Test Connection Handler
  const handleQuickTest = async () => {
    setQuickTestStatus("testing");
    setQuickTestResult(null);
    try {
      const res = await fetch("/api/v1/external/list?limit=1", {
        headers: {
          Authorization: `Bearer ${newlyCreatedKey || "sk_live_demo"}`,
        },
      });
      const data = await res.json();
      setQuickTestStatus(res.ok ? "success" : "error");
      setQuickTestResult(data);
    } catch (err: any) {
      setQuickTestStatus("error");
      setQuickTestResult({ error: err?.message || "Connection failed" });
    }
  };

  if (!isOwner) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Key className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Organisation Owner Permission Required</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Access to API connection credentials, secret tokens, and automated integration keys is restricted to organisation owners under <strong>{organisation?.name || "your organisation"}</strong>.
        </p>
        <Link
          href="/client/identity-verification"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
        >
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left pb-16 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO HEADER CARD
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#134074] text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REST API Integration Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            API Connection & Secret Key Gateway
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Seamlessly connect your ATS, HRMS, career portals, or external websites to Cluso Infolink Verify.
            Trigger background verifications and stream finalized reports programmatically via our secure TLS 1.3 REST API.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/api-docs"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all shadow-sm"
          >
            <Code className="w-4 h-4 text-emerald-400" />
            <span>Interactive REST Docs</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
          </Link>
          <button
            onClick={handleGenerateKey}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {isGenerating ? "Generating..." : "Generate New API Key"}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. LIVE KPI METRICS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Calls (This Month)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{apiUsage?.totalCalls || 0}</span>
            <span className="text-xs text-slate-400 font-medium">requests</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <span className="text-emerald-600 font-bold">{apiUsage?.successfulCalls || 0} passed</span>
            <span>•</span>
            <span className="text-rose-500 font-bold">{apiUsage?.failedCalls || 0} failed</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated API Charges</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">
              {currencySymbol}{(apiUsage?.totalCost || 0).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono font-semibold">{currency}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Billed on monthly organisation invoice
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Secret Keys</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{activeApiKeys.length}</span>
            <span className="text-xs text-slate-400">active tokens</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {(apiKeys || []).length} total generated
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Gateway Status</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-xs font-bold text-slate-900 truncate block">
              https://verify.clusoinfolink.com
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Production API Ready</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. 4-STEP API CONNECTION WORKFLOW
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <h3 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#134074]" />
          <span>4-Step API Connection Workflow</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between gap-3">
            <div>
              <div className="w-7 h-7 rounded-xl bg-[#134074] text-white flex items-center justify-center font-black text-xs mb-2">
                1
              </div>
              <h4 className="font-bold text-xs text-slate-900">Generate Secret Key</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Click "Generate New API Key". Copy the <code className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">sk_live_...</code> token immediately.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Store securely on your backend</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between gap-3">
            <div>
              <div className="w-7 h-7 rounded-xl bg-[#134074] text-white flex items-center justify-center font-black text-xs mb-2">
                2
              </div>
              <h4 className="font-bold text-xs text-slate-900">Set Auth Header</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Pass your bearer token in all HTTP requests to authenticate requests from your server:
              </p>
              <code className="block mt-2 font-mono text-[9px] bg-slate-200/70 text-slate-800 p-1.5 rounded-lg break-all">
                Authorization: Bearer sk_live_...
              </code>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">TLS / HTTPS mandatory</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between gap-3">
            <div>
              <div className="w-7 h-7 rounded-xl bg-[#134074] text-white flex items-center justify-center font-black text-xs mb-2">
                3
              </div>
              <h4 className="font-bold text-xs text-slate-900">Submit Verifications</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Send candidate data via POST JSON to the desired check endpoint:
              </p>
              <code className="block mt-2 font-mono text-[9px] bg-slate-200/70 text-slate-800 p-1.5 rounded-lg break-all">
                /api/v1/external/verify/identity
              </code>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">Returns requestId instantly</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between gap-3">
            <div>
              <div className="w-7 h-7 rounded-xl bg-[#134074] text-white flex items-center justify-center font-black text-xs mb-2">
                4
              </div>
              <h4 className="font-bold text-xs text-slate-900">Fetch Completed Report</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Query the status or fetch the finalized report (JSON or PDF) to display on your portal:
              </p>
              <code className="block mt-2 font-mono text-[9px] bg-slate-200/70 text-slate-800 p-1.5 rounded-lg break-all">
                /api/v1/external/report/&#123;requestId&#125;
              </code>
            </div>
            <span className="text-[10px] text-blue-700 font-semibold">Live JSON & PDF payload</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. SECRET API KEYS TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-700" />
              <span>Issued API Secret Keys</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Secret keys authenticate programmatic API requests sent from your external backend systems.
            </p>
          </div>
          <button
            onClick={handleGenerateKey}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#134074] text-white hover:bg-slate-800 transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isGenerating ? "Generating..." : "New API Key"}</span>
          </button>
        </div>

        {(apiKeys || []).length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Key className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No API keys created yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click the button below to generate your first secret API key and connect your external website or application.
            </p>
            <button
              onClick={handleGenerateKey}
              disabled={isGenerating}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-600 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate First Key</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Key Token</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Rate Limit</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Last Used</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(apiKeys || []).map((k: ApiKey) => {
                  const isActive = k.status === "active";
                  return (
                    <tr key={k._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs">
                        <span className="font-bold text-slate-900">
                          {k.keyPrefix || "sk_live_"}••••••••••••••••••••••••••••{k.keySuffix}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                        {k.rateLimit || 100} req/min
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {k.createdAt ? new Date(k.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Never"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isActive ? (
                          <button
                            onClick={() => handleRevokeKey(k._id)}
                            disabled={revokingId === k._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{revokingId === k._id ? "Revoking..." : "Revoke"}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Revoked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. DYNAMIC INTERACTIVE ENDPOINT VIEWER & EXAMPLES
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Card: Request Code Generator & Response Preview */}
        <div className="lg:col-span-7 bg-[#0b1329] text-white rounded-3xl p-6 shadow-xl space-y-4 border border-slate-800/80 flex flex-col justify-between">
          <div>
            {/* Header: Language Switcher + Mode Toggle + Copy */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-emerald-400 font-bold text-sm select-none">&gt;_</span>
                <h3 className="text-xs sm:text-sm font-bold tracking-wider text-slate-100 uppercase font-sans">
                  CODE & REQUEST BUILDER
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Language Switcher */}
                <div className="flex items-center bg-[#131d38] p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setCodeLanguage("curl"); setSelectedView("request"); }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      codeLanguage === "curl" && selectedView === "request"
                        ? "bg-emerald-500 text-slate-950 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCodeLanguage("node"); setSelectedView("request"); }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      codeLanguage === "node" && selectedView === "request"
                        ? "bg-emerald-500 text-slate-950 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Node.js
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCodeLanguage("python"); setSelectedView("request"); }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      codeLanguage === "python" && selectedView === "request"
                        ? "bg-emerald-500 text-slate-950 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Python
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedView("response")}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      selectedView === "response"
                        ? "bg-emerald-500 text-slate-950 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    200 OK
                  </button>
                </div>

                <button
                  onClick={() => handleCopyText(
                    selectedView === "request" ? getGeneratedCode() : JSON.stringify(activeEndpoint.sampleResponse, null, 2),
                    "snippet"
                  )}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl font-bold transition-all cursor-pointer shrink-0"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sub-bar showing active endpoint name & description */}
            <div className="flex items-center justify-between gap-2 mt-3 mb-2 px-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black font-mono ${
                  activeEndpoint.method === "POST"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                }`}>
                  {activeEndpoint.method}
                </span>
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {activeEndpoint.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[240px]">
                {activeEndpoint.path}
              </span>
            </div>

            {/* Code Terminal Box */}
            <div className="relative mt-2">
              <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto text-[#64f4c2] bg-[#070d1f] p-4 rounded-2xl border border-slate-800/90 max-h-[380px] select-all shadow-inner">
                {selectedView === "request" ? getGeneratedCode() : JSON.stringify(activeEndpoint.sampleResponse, null, 2)}
              </pre>
            </div>
          </div>

          {/* Context Footer */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
            <p className="leading-snug">
              Replace <code className="text-emerald-400 font-mono">sk_live_...</code> with your active secret key issued above.
            </p>
            <Link
              href="/api-docs"
              target="_blank"
              className="text-emerald-400 hover:underline inline-flex items-center gap-1 shrink-0 font-bold text-[10px]"
            >
              <span>Full Interactive Docs</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right Card: Primary API Endpoints Explorer (All 18) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#134074]" />
              <h3 className="text-xs sm:text-sm font-black tracking-wider text-slate-900 uppercase font-sans">
                ALL 18 REST ENDPOINTS
              </h3>
            </div>

            <Link
              href="/api-docs"
              target="_blank"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
            >
              <span>API Reference</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Category Filter & Search */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                  categoryFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                All (18)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("verification")}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                  categoryFilter === "verification" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Verify (14)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("retrieval")}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                  categoryFilter === "retrieval" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Reports (4)
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search endpoints by name or path..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Endpoints Scroll Area */}
          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
            {filteredEndpoints.map((ep) => {
              const isSelected = activeEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => setSelectedEndpointId(ep.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50/70 border-slate-200/60 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black ${
                          ep.method === "POST"
                            ? isSelected
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-emerald-100 text-emerald-800"
                            : isSelected
                            ? "bg-blue-400 text-slate-950"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                        {ep.name}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      {ep.description}
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono font-medium shrink-0 ${isSelected ? "text-emerald-400" : "text-slate-400"}`}>
                    {ep.category === "verification" ? "POST" : "GET"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. QUICK TEST CONNECTION CARD
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#134074] font-black text-xs uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Connection Diagnostics</span>
          </div>
          <h4 className="text-sm font-black text-slate-900">Want to test your API key right away?</h4>
          <p className="text-xs text-slate-500">
            Send a live ping to the <code className="font-mono text-[11px] bg-slate-200/80 px-1 py-0.5 rounded">GET /api/v1/external/list</code> endpoint to verify that your credentials work.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleQuickTest}
            disabled={quickTestStatus === "testing"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#134074] hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${quickTestStatus === "testing" ? "animate-spin" : ""}`} />
            <span>{quickTestStatus === "testing" ? "Testing..." : "Test Connection"}</span>
          </button>
        </div>
      </div>

      {quickTestResult && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 font-mono text-xs overflow-x-auto border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <span className="font-bold text-emerald-400">Response status: {quickTestStatus === "success" ? "200 OK" : "401 / Error"}</span>
            <button
              onClick={() => setQuickTestResult(null)}
              className="text-slate-400 hover:text-white text-[11px]"
            >
              Clear
            </button>
          </div>
          <pre>{JSON.stringify(quickTestResult, null, 2)}</pre>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. NEWLY GENERATED KEY MODAL
      ───────────────────────────────────────────────────────────── */}
      {showNewKeyModal && newlyCreatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-left">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">API Secret Key Generated</h3>
                <p className="text-xs text-slate-500 font-medium">Keep this secret token confidential</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
              <span className="leading-relaxed">
                <strong>Important:</strong> Copy and store this secret key in your environment variables now. For security reasons, <strong>we will never show this full key again</strong>. If you lose it, you must revoke it and generate a new key.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Full Secret API Token
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={newlyCreatedKey}
                  className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 select-all focus:outline-none"
                />
                <button
                  onClick={() => handleCopyText(newlyCreatedKey, "key")}
                  className="px-4 py-2.5 bg-emerald-700 text-white hover:bg-emerald-600 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Key</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setShowNewKeyModal(false);
                  setNewlyCreatedKey(null);
                }}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                I Have Stored My Key Safely
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
