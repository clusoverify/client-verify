"use client";

import React, { useState } from "react";
import {
  Key,
  Copy,
  Check,
  Code,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Send,
  Terminal,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import OzcluLogo from "../components/OzcluLogo";

interface EndpointDoc {
  id: string;
  category: "verify" | "retrieve";
  method: "GET" | "POST";
  path: string;
  name: string;
  description: string;
  requestBody?: Record<string, any>;
  queryParams?: Record<string, string>;
  responseExample: Record<string, any>;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    id: "identity",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/identity",
    name: "Identity Verification",
    description: "Initiates an Aadhaar/DigiLocker identity check. Automatically generates a candidate setup URL for DigiLocker consent.",
    requestBody: {
      candidateName: "Rahul Sharma",
      candidateEmail: "rahul.sharma@example.com",
      requestingOrgName: "Acme Corp Ltd"
    },
    responseExample: {
      success: true,
      requestId: "ACM040926-0001",
      status: "processing",
      candidateSetupUrl: "https://candidate.verify.clusoinfolink.com/?email=rahul.sharma%40example.com&password=Cluso%40...",
      message: "Identity verification request created successfully."
    }
  },
  {
    id: "court-record",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/court-record",
    name: "Court Record Check",
    description: "Searches eCourts district and high court records across provided residential addresses.",
    requestBody: {
      candidateName: "Amit Kumar",
      candidateDob: "1994-05-12",
      candidateFatherName: "Ramesh Kumar",
      candidateMotherName: "Sunita Kumar",
      gender: "Male",
      addresses: [
        { address: "Flat 402, Green Glen", city: "Bengaluru", state: "Karnataka", country: "India" }
      ]
    },
    responseExample: {
      success: true,
      requestId: "CRT040926-0001",
      status: "processing",
      message: "Court record verification created and queued for automated district court search."
    }
  },
  {
    id: "interpol",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/interpol",
    name: "Interpol Red Notice Check",
    description: "Instant check against the global Interpol Red Notice repository.",
    requestBody: {
      candidateName: "David Miller",
      candidateDob: "1988-11-23",
      birthCity: "London"
    },
    responseExample: {
      success: true,
      requestId: "INT040926-0001",
      status: "Completed",
      hasRecords: false,
      matchesFound: 0
    }
  },
  {
    id: "rednotice",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/rednotice",
    name: "Red Notice Worldwide",
    description: "Comprehensive worldwide criminal notice lookup across all Interpol jurisdictions.",
    requestBody: {
      candidateName: "Carlos Silva",
      candidateDob: "1982-04-15",
      birthCity: "Sao Paulo"
    },
    responseExample: {
      success: true,
      requestId: "RNW040926-0001",
      status: "Completed",
      hasRecords: false,
      matches: []
    }
  },
  {
    id: "passport",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/passport",
    name: "Passport Status Check",
    description: "Tracks passport application and validity using the official Passport Seva portal.",
    requestBody: {
      fileNumber: "BO1078292837261",
      dateOfBirth: "1996-08-20"
    },
    responseExample: {
      success: true,
      requestId: "PSP040926-0001",
      status: "Completed",
      passportData: {
        fileNumber: "BO1078292837261",
        statusMessage: "Passport has been dispatched via Speed Post."
      }
    }
  },
  {
    id: "employment",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/employment",
    name: "Employment Verification",
    description: "Queues professional background and past employment verification checks.",
    requestBody: {
      candidateName: "Sneha Patel",
      email: "sneha.p@example.com",
      mobile: "+919876543210",
      employments: [
        { companyName: "Tech Mahindra", position: "Software Engineer", joiningYear: "2021", leavingYear: "2024" }
      ]
    },
    responseExample: {
      success: true,
      requestId: "EMP040926-0001",
      status: "processing",
      itemCount: 1
    }
  },
  {
    id: "education",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/education",
    name: "Education Verification",
    description: "Queues academic qualification and degree certificate verification with university registries.",
    requestBody: {
      candidateName: "Sneha Patel",
      email: "sneha.p@example.com",
      educationList: [
        { boardUniversity: "University of Delhi", courseName: "Bachelor of Technology", passingYear: "2021", rollNumber: "DTU-2017-094" }
      ]
    },
    responseExample: {
      success: true,
      requestId: "EDU040926-0001",
      status: "processing",
      itemCount: 1
    }
  },
  {
    id: "digital-address",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/digital-address",
    name: "Digital Address Verification",
    description: "GPS-tagged candidate digital address verification via mobile geo-verification link.",
    requestBody: {
      candidateName: "Priya Sharma",
      candidateEmail: "priya.s@example.com",
      address: "124 Park Avenue, Sector 14, Gurugram, Haryana"
    },
    responseExample: {
      success: true,
      requestId: "DAV040926-0001",
      status: "processing",
      candidateSetupUrl: "https://candidate.verify.clusoinfolink.com/?email=priya.s%40example.com..."
    }
  },
  {
    id: "saflii-court",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/saflii-court",
    name: "SAFLII South African Court Check",
    description: "Searches South African High Courts, Supreme Court of Appeal, and Constitutional Court via SAFLII.",
    requestBody: {
      candidateName: "Johan Van Der Merwe",
      candidateDob: "1985-02-17",
      birthCity: "Cape Town"
    },
    responseExample: {
      success: true,
      requestId: "SAF040926-0001",
      status: "processing",
      message: "SAFLII Court check initiated. Results will be available via the status endpoint."
    }
  },
  {
    id: "saps-wanted",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/saps-wanted",
    name: "SAPS Wanted Persons Check",
    description: "Instant screening against South African Police Service (SAPS) Wanted Persons registry.",
    requestBody: {
      candidateName: "Sipho Ndlovu",
      candidateDob: "1990-07-22"
    },
    responseExample: {
      success: true,
      requestId: "SAP040926-0001",
      status: "Completed",
      hasRecords: false,
      sapsWantedStatus: "completed"
    }
  },
  {
    id: "uk-court",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/uk-court",
    name: "UK Court Check",
    description: "Searches HM Courts & Tribunals Judiciary judgments across England, Wales, Scotland, and Northern Ireland.",
    requestBody: {
      candidateName: "James Arthur Davies",
      candidateDob: "1983-09-14"
    },
    responseExample: {
      success: true,
      requestId: "UKC040926-0001",
      status: "processing",
      message: "UK Court check initiated. Results will be available via the status endpoint."
    }
  },
  {
    id: "malaysia-court",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/malaysia-court",
    name: "Malaysia Court Check",
    description: "Searches Mahkamah Persekutuan Malaysia eJudgment portal across civil, criminal, and appellate categories.",
    requestBody: {
      candidateName: "Tan Wei Meng",
      candidateDob: "1991-03-05"
    },
    responseExample: {
      success: true,
      requestId: "MYC040926-0001",
      status: "processing",
      message: "Malaysia Court check initiated. Results will be available via the status endpoint."
    }
  },
  {
    id: "philippines-court",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/philippines-court",
    name: "Philippines Court of Appeals Check",
    description: "Searches Court of Appeals case records across CA Manila, CA Visayas, and CA Mindanao stations.",
    requestBody: {
      candidateName: "Juan Dela Cruz",
      candidateDob: "1990-06-15",
      station: "all",
      caseNo: ""
    },
    responseExample: {
      success: true,
      requestId: "PHC070926-0001",
      status: "processing",
      message: "Philippines Court of Appeals check initiated. Results will be available via the status endpoint."
    }
  },
  {
    id: "singapore-court",
    category: "verify",
    method: "POST",
    path: "/api/v1/external/verify/singapore-court",
    name: "Singapore Court Check",
    description: "Searches Singapore Judiciary hearing lists & judgments across Supreme Court, State Courts, and Family Justice Courts.",
    requestBody: {
      candidateName: "Tan Wei Lin",
      court: "Supreme Court",
      hearingType: "",
      judgeName: "",
      lawFirm: ""
    },
    responseExample: {
      success: true,
      requestId: "SGC070926-0001",
      status: "processing",
      message: "Singapore Court check initiated. Results will be available via the status endpoint."
    }
  },
  {
    id: "status",
    category: "retrieve",
    method: "GET",
    path: "/api/v1/external/status/{requestId}",
    name: "Check Verification Status",
    description: "Returns the current progress, lifecycle status, and sub-status details for a verification request.",
    responseExample: {
      success: true,
      requestId: "ACM040926-0001",
      candidateName: "Rahul Sharma",
      type: "identity",
      status: "Completed",
      createdAt: "2026-09-04T10:15:00.000Z",
      completedAt: "2026-09-04T10:18:22.000Z",
      progress: {
        subStatus: "completed",
        onboardingStatus: "completed"
      }
    }
  },
  {
    id: "report",
    category: "retrieve",
    method: "GET",
    path: "/api/v1/external/report/{requestId}",
    name: "Download Completed Report (JSON)",
    description: "Fetches full sanitized verification report data once the check has reached Completed status.",
    responseExample: {
      success: true,
      requestId: "ACM040926-0001",
      type: "identity",
      status: "Completed",
      candidateName: "Rahul Sharma",
      report: {
        id: "ACM040926-0001",
        name: "Rahul Sharma",
        email: "rahul.sharma@example.com",
        date: "Sep 04, 2026",
        status: "Completed",
        digilockerStatus: "verified",
        digilockerAadhaar: "XXXXXXXX9481",
        digilockerPan: "XXXXX4829X",
        hasPhoto: true
      },
      reportUrl: "https://verify.clusoinfolink.com/client/report/ACM040926-0001",
      pdfUrl: "https://verify.clusoinfolink.com/api/v1/external/report/ACM040926-0001/pdf"
    }
  },
  {
    id: "pdf-report",
    category: "retrieve",
    method: "GET",
    path: "/api/v1/external/report/{requestId}/pdf",
    name: "Download Report as PDF (HTML)",
    description: "Download the completed verification report as a print-ready self-contained HTML document.",
    responseExample: {
      contentType: "text/html; charset=utf-8",
      contentDisposition: "attachment; filename=\"report-ACM040926-0001.html\"",
      body: "<!DOCTYPE html><html>... (full printable report) ...</html>"
    }
  },
  {
    id: "list",
    category: "retrieve",
    method: "GET",
    path: "/api/v1/external/list?page=1&limit=20&status=Completed",
    name: "List Organisation Verifications",
    description: "Returns a paginated list of all verification checks created by your organisation.",
    queryParams: {
      page: "Page number (default: 1)",
      limit: "Items per page, 1 to 100 (default: 20)",
      status: "Optional filter by status (Completed, Processing)",
      type: "Optional filter by check type (identity, court_record, ...)"
    },
    responseExample: {
      success: true,
      page: 1,
      limit: 20,
      total: 42,
      totalPages: 3,
      verifications: [
        {
          id: "ACM040926-0001",
          name: "Rahul Sharma",
          status: "Completed",
          type: "identity",
          date: "Sep 04, 2026"
        }
      ]
    }
  }
];

export default function ApiDocsPage() {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>("identity");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedEndpoint = ENDPOINTS.find((e) => e.id === selectedEndpointId) || ENDPOINTS[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <OzcluLogo size="md" />
          </Link>
          <div className="h-5 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-200">REST API Reference</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              v1.0.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/client/api-settings"
            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            Get API Keys
          </Link>
        </div>
      </header>

      {/* Main Layout: Sidebar + Documentation Body */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar */}
        <aside className="w-full lg:w-72 border-r border-slate-800/80 p-5 space-y-6 shrink-0">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>Getting Started</span>
            </div>
            <div className="space-y-1 text-xs">
              <a
                href="#authentication"
                className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                Authentication
              </a>
              <a
                href="#rate-limits"
                className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                Rate Limits & Errors
              </a>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span>Trigger Verifications</span>
            </div>
            <div className="space-y-0.5">
              {ENDPOINTS.filter((e) => e.category === "verify").map((e) => {
                const isSelected = selectedEndpointId === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEndpointId(e.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary/20 text-primary border border-primary/30 font-semibold"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }`}
                  >
                    <span>{e.name}</span>
                    <span className="text-[9px] font-mono font-bold text-blue-400">POST</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Status & Reports</span>
            </div>
            <div className="space-y-0.5">
              {ENDPOINTS.filter((e) => e.category === "retrieve").map((e) => {
                const isSelected = selectedEndpointId === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEndpointId(e.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary/20 text-primary border border-primary/30 font-semibold"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }`}
                  >
                    <span>{e.name}</span>
                    <span className="text-[9px] font-mono font-bold text-emerald-400">GET</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 p-6 lg:p-10 space-y-10 overflow-y-auto">
          {/* Intro & Auth Guide */}
          <section id="authentication" className="space-y-4 pb-8 border-b border-slate-800">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Cluso Infolink Verify REST API</h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
              Integrate background verifications directly into your web applications, applicant tracking systems (ATS), or HR platforms.
              Authenticate your requests using API keys issued by your organization owner or administrator.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                  <Key className="w-4 h-4" />
                  <span>Authentication Header</span>
                </div>
                <p className="text-xs text-slate-400">
                  Pass your API key in every HTTP request using the standard HTTP <code className="text-slate-200 font-mono">Authorization</code> header:
                </p>
                <div className="bg-black/60 rounded-xl p-3 font-mono text-xs text-emerald-400 border border-slate-800">
                  Authorization: Bearer sk_live_your_api_key_here
                </div>
              </div>

              <div id="rate-limits" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
                  <Terminal className="w-4 h-4" />
                  <span>Rate Limiting & Headers</span>
                </div>
                <p className="text-xs text-slate-400">
                  Default limit is <strong>100 requests per minute</strong> per key. Inspect responses for headers:
                </p>
                <div className="bg-black/60 rounded-xl p-3 font-mono text-xs text-purple-300 border border-slate-800 space-y-0.5">
                  <div>X-RateLimit-Limit: 100</div>
                  <div>X-RateLimit-Remaining: 98</div>
                  <div>X-RateLimit-Reset: 1725450000</div>
                </div>
              </div>
            </div>
          </section>

          {/* Active Endpoint Documentation */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider ${
                      selectedEndpoint.method === "POST"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <h2 className="text-xl font-bold text-white">{selectedEndpoint.name}</h2>
                </div>
                <p className="text-sm text-slate-400 mt-2">{selectedEndpoint.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="font-mono text-xs bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200">
                  {selectedEndpoint.path}
                </div>
                <button
                  onClick={() => handleCopy(selectedEndpoint.path, "path")}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Path"
                >
                  {copiedId === "path" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Request Body / Query Params */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {selectedEndpoint.requestBody ? "JSON Request Body" : "Query Parameters"}
                  </span>
                  {selectedEndpoint.requestBody && (
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedEndpoint.requestBody, null, 2), "req")}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {copiedId === "req" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Request</span>
                    </button>
                  )}
                </div>

                {selectedEndpoint.requestBody ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner">
                    <pre>{JSON.stringify(selectedEndpoint.requestBody, null, 2)}</pre>
                  </div>
                ) : selectedEndpoint.queryParams ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                    {Object.entries(selectedEndpoint.queryParams).map(([param, desc]) => (
                      <div key={param} className="flex items-start gap-2 border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                        <code className="font-mono text-primary font-semibold">{param}</code>
                        <span className="text-slate-400">{desc}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400">
                    No request body required. Pass the requestId in the URL path.
                  </div>
                )}
              </div>

              {/* Response Example */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span>Response (200 OK)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedEndpoint.responseExample, null, 2), "res")}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    {copiedId === "res" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Response</span>
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner">
                  <pre>{JSON.stringify(selectedEndpoint.responseExample, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* Example cURL Generator */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span>cURL Command</span>
                </div>
                <button
                  onClick={() => {
                    const curl =
                      selectedEndpoint.method === "POST"
                        ? `curl -X POST https://verify.clusoinfolink.com${selectedEndpoint.path} \\\n  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(selectedEndpoint.requestBody || {})}'`
                        : `curl -X GET https://verify.clusoinfolink.com${selectedEndpoint.path} \\\n  -H "Authorization: Bearer sk_live_YOUR_API_KEY"`;
                    handleCopy(curl, "curl");
                  }}
                  className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === "curl" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy cURL</span>
                </button>
              </div>

              <div className="bg-black/70 rounded-xl p-3.5 font-mono text-xs text-slate-200 overflow-x-auto border border-slate-800">
                <pre>
                  {selectedEndpoint.method === "POST"
                    ? `curl -X POST https://verify.clusoinfolink.com${selectedEndpoint.path} \\\n  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(selectedEndpoint.requestBody || {}, null, 2)}'`
                    : `curl -X GET https://verify.clusoinfolink.com${selectedEndpoint.path} \\\n  -H "Authorization: Bearer sk_live_YOUR_API_KEY"`}
                </pre>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
