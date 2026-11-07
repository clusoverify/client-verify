"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "src/context/AuthContext";

// Types
export interface Verification {
  id: string;
  name: string;
  email: string;
  orgName: string;
  requestingOrgName?: string;
  date: string;
  status: "Completed" | "Processing" | "Needs Attention" | "Verified" | "Discrepancy" | "Halted";
  candidateForename?: string;
  candidateSurname?: string;
  candidateIdNumber?: string;
  provinceCity?: string;
  province?: string;
  verifier: string | null;
  reportDetails?: string;
  notes?: string;
  onboardingStatus?: string;
  digilockerStatus?: string;
  digilockerUsername?: string;
  digilockerName?: string;
  digilockerAge?: string;
  digilockerDob?: string;
  digilockerGender?: string;
  digilockerAadhaar?: string;
  digilockerPan?: string;
  digilockerDrivingLicence?: string;
  digilockerMobile?: string;
  digilockerEmail?: string;
  digilockerId?: string;
  digilockerReferenceKey?: string;
  digilockerPhoto?: string;
  digilockerDocuments?: any[];
  completedAt?: Date | string;
  setupUrl?: string;
  skipCandidateLogin?: boolean;
  createdAt?: string;
  country?: string;
  perCheckRate?: number;
  itemCount?: number;
  serviceCharge?: number;
  employments?: Array<{ companyName: string; position: string; joiningYear?: string; leavingYear?: string; employeeCode?: string }>;
  educationList?: Array<{ boardUniversity: string; courseName: string; passingYear?: string; rollNumber?: string }>;
  // Court Record Verification & Watchlist fields
  type?: "identity" | "court_record" | "employment" | "education" | "interpol" | "passport" | "digital_address" | "rednotice_worldwide" | "saflii_court" | "saps_wanted" | "uk_court" | "malaysia_court" | "singapore_court" | "philippines_court";
  source?: "portal" | "api";
  candidateDob?: string;
  birthCity?: string;
  interpolHasRecords?: boolean;
  interpolMatches?: any[];
  interpolCompletedAt?: string;
  rednoticeWorldwideHasRecords?: boolean;
  rednoticeWorldwideMatches?: any[];
  rednoticeWorldwideCompletedAt?: string;
  sapsWantedHasRecords?: boolean;
  sapsWantedMatches?: any[];
  sapsWantedStatus?: "verifying_with_attorney" | "cleared_by_attorney" | "confirmed_wanted" | "completed";
  sapsWantedCompletedAt?: string;
  attorneyResolution?: {
    verdict: "cleared" | "confirmed_wanted";
    notes: string;
    resolvedBy: string;
    resolvedAt: string;
  };
  safliiCourtHasRecords?: boolean;
  safliiCourtResults?: Array<{
    caseTitle: string;
    court: string;
    date: string;
    url: string;
    snippet: string;
    citation: string;
  }>;
  safliiCourtCompletedAt?: string;
  safliiCourtSummary?: string;
  safliiCourtStatus?: string;
  safliiCourtTotalResults?: number;
  ukCourtHasRecords?: boolean;
  ukCourtResults?: Array<{
    caseTitle: string;
    court: string;
    date: string;
    url: string;
    pills: string[];
    snippet?: string;
    judgmentType: string;
  }>;
  ukCourtCompletedAt?: string;
  ukCourtSummary?: string;
  ukCourtStatus?: string;
  ukCourtTotalResults?: number;
  ukCourtTotalAvailable?: number;
  malaysiaCourtHasRecords?: boolean;
  malaysiaCourtResults?: Array<{
    no: number | string;
    caseNo: string;
    rawCaseNo?: string;
    courtLevel?: string;
    parties: string;
    rawParties?: string;
    keyword: string;
    dateOfResult: string;
    dateOfResultIso?: string;
    dateOfAP: string;
    dateOfAPIso?: string;
    judge: string;
    corumJudge?: string;
    eJudgUniqueID?: string;
    documents: Array<{
      documentId: string;
      docName: string;
      preparedBy?: string;
      decisionCategory?: string;
      url: string;
      isExpunged?: boolean;
    }>;
  }>;
  malaysiaCourtCompletedAt?: string;
  malaysiaCourtSummary?: string;
  malaysiaCourtStatus?: string;
  malaysiaCourtTotalResults?: number;
  malaysiaCourtTotalAvailable?: number;
  singaporeCourtHasRecords?: boolean;
  singaporeCourtResults?: Array<{
    no: number | string;
    caseNo: string;
    hearingDate: string;
    hearingDateIso?: string;
    hearingType: string;
    title: string;
    venue: string;
    judge: string;
    detailUrl?: string;
    natureOfCase?: string;
    partiesSummary?: string;
    lastUpdated?: string;
  }>;
  singaporeCourtCompletedAt?: string;
  singaporeCourtSummary?: string;
  singaporeCourtStatus?: string;
  singaporeCourtTotalResults?: number;
  singaporeCourtTotalAvailable?: number;
  singaporeCourtSelectedCourt?: string;
  singaporeCourtSelectedHearingType?: string;
  singaporeCourtStartDate?: string;
  singaporeCourtEndDate?: string;
  philippinesCourtPartyName?: string;
  philippinesCourtCaseNo?: string;
  philippinesCourtStation?: string;
  philippinesCourtHasRecords?: boolean;
  philippinesCourtResults?: Array<{
    no: number;
    caseNo: string;
    station: string;
    stationCode?: string;
    caseTitle: string;
    parties: string[];
    decisionStatus: string;
    hasDecision: boolean;
    statusCategory: string;
  }>;
  philippinesCourtCompletedAt?: string;
  philippinesCourtSummary?: string;
  philippinesCourtStatus?: string;
  philippinesCourtTotalResults?: number;
  courtCategory?: string;
  courtLocation?: string;
  caseType?: string;
  dateOfDecisionFrom?: string;
  dateOfDecisionTo?: string;
  dateOfAPFrom?: string;
  dateOfAPTo?: string;
  judgeName?: string;
  candidateFatherName?: string;
  candidateMotherName?: string;
  candidateIsMarried?: boolean;
  candidateHusbandName?: string;
  gender?: string;
  idProofType?: string;
  idProofNumber?: string;
  hasIdProofFile?: boolean;
  idProofFile?: string;
  addresses?: Array<{ address: string; city: string; state: string; country: string }>;
  courtRecordResults?: Array<{
    addressIndex: number;
    address: string;
    city: string;
    state: string;
    stateCode: string;
    district: string;
    districtCode: string;
    complexSearches: Array<{
      complexName: string;
      complexCode: string;
      establishmentName?: string;
      establishmentCode?: string;
      casesFound: number;
      cases: Array<{
        caseNumber: string;
        petitioner: string;
        respondent: string;
        orderDate: string;
      }>;
      error?: string;
    }>;
  }>;
  courtRecordSummary?: string;
  courtRecordStatus?: string;
  courtRecordHasRecords?: boolean;
  courtRecordTotalCases?: number;
  courtRecordTotalComplexes?: number;
  courtRecordErrors?: string[];
  courtRecordProgress?: string;
  courtRecordSearchStartedAt?: string;
  courtRecordAdminReview?: boolean;
  attempts?: Array<{ date: string; verifier: string; status: string; notes?: string }>;
  // Employment Verification fields
  candidateMobile?: string;
  employmentData?: {
    country?: string;
    state?: string;
    city?: string;
    companyName?: string;
    addressLine1?: string;
    addressLine2?: string;
    companyTelephoneCode?: string;
    companyTelephone?: string;
    department?: string;
    position?: string;
    employmentPeriodFrom?: string;
    employmentPeriodTo?: string;
    employeeCode?: string;
    reportingManagerName?: string;
    reportingManagerDepartment?: string;
    reportingManagerContactCode?: string;
    reportingManagerContact?: string;
    reportingManagerEmail?: string;
    annualCTC?: string;
    employmentType?: string;
    agencyDetails?: string;
    reasonForLeaving?: string;
    remarks?: string;
  };
  employmentDataSubmitted?: boolean;
  employmentDataSubmittedAt?: string;
  employmentAttempts?: Array<{
    date: string;
    verificationMode: string;
    result: string;
    comment?: string;
    verifierNote?: string;
    respondentName?: string;
    respondentEmail?: string;
    respondentComment?: string;
    extraPayment?: boolean;
    markAsPaid?: boolean;
    askCustomerApproval?: boolean;
    screenshot?: string;
    sendEmail?: boolean;
    loggedBy?: string;
  }>;
  // Education Verification fields
  educationData?: {
    country?: string;
    degreeType?: string;
    courseName?: string;
    boardUniversity?: string;
    institutionName?: string;
    rollNumber?: string;
    passingYear?: string;
    certificateFile?: string;
    certificateFileName?: string;
  };
  educationDataSubmitted?: boolean;
  educationDataSubmittedAt?: string;
  educationAttempts?: Array<{
    date: string;
    verificationMode: string;
    result: string;
    comment?: string;
    verifierNote?: string;
    respondentName?: string;
    respondentEmail?: string;
    respondentComment?: string;
    extraPayment?: boolean;
    markAsPaid?: boolean;
    askCustomerApproval?: boolean;
    screenshot?: string;
    screenshotCaption?: string;
    caption?: string;
    sendEmail?: boolean;
    loggedBy?: string;
  }>;
  sendToCustomer?: boolean;
  // Digital Address Verification fields
  candidateAddress?: string;
  digitalAddressData?: {
    selfieImage?: string;
    selfieGeoLat?: number;
    selfieGeoLng?: number;
    selfieGeoAccuracy?: number;
    selfieTimestamp?: string;
    houseImage?: string;
    houseGeoLat?: number;
    houseGeoLng?: number;
    houseGeoAccuracy?: number;
    houseTimestamp?: string;
    consentGiven?: boolean;
    consentTimestamp?: string;
    deviceInfo?: string;
  };
  digitalAddressSubmitted?: boolean;
  digitalAddressSubmittedAt?: string;
}

export interface InvoiceActivity {
  id: string;
  type: "generated" | "submitted" | "approved" | "rejected" | "status_change";
  status?: "Paid" | "Unpaid" | "Overdue" | "Pending" | "Defaulted";
  timestamp: string;
  actor: string;
  note?: string;
  paymentProof?: string;
}

export interface Invoice {
  _id?: string;
  id: string;
  orgName: string;
  organisationId?: string;
  date: string;
  dueDate: string;
  amount: number;
  currency?: string;
  status: "Paid" | "Unpaid" | "Overdue" | "Pending";
  month?: string;
  year?: number;
  paymentProof?: string;
  paymentProofDate?: string;
  generationType?: "Auto" | "Manual";
  adminNote?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  clientNote?: string;
  approvedBy?: string;
  approvedDate?: string;
  activityLog?: InvoiceActivity[];
}

export interface Verifier {
  id: string;
  name: string;
  email: string;
  org: string;
  status: "Active" | "Pending" | "Inactive";
  designation?: string;
  isOwner?: boolean;
}

export interface CompanySettings {
  companyName: string;
  address: string;
  city: string;
  postalCode: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  billingOption: "invoice" | "card";
  cin: string;
  lut: string;
  tin: string;
  gstin: string;
  invoiceEmail: string;
  billingSameAsCompany: boolean;
  billingAddress: string;
  sac?: string;
  logo?: string;
  recentRequestingOrgs?: string[];
  sapsWantedEnabled?: boolean;
  sapsWantedRate?: number;
  ukCourtEnabled?: boolean;
  ukCourtRate?: number;
  malaysiaCourtEnabled?: boolean;
  malaysiaCourtRate?: number;
  singaporeCourtEnabled?: boolean;
  singaporeCourtRate?: number;
  philippinesCourtEnabled?: boolean;
  philippinesCourtRate?: number;
}

export interface Organisation {
  id: string;
  name: string;
  orgNumber?: number;
  paymentPlan: string;
  monthlyRate: number;
  currency?: string;
  billingDay: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  paymentNotes?: string;
  createdAt: string;
  maxVerifiers?: number;
  identityEnabled?: boolean;
  courtRecordEnabled?: boolean;
  employmentEnabled?: boolean;
  educationEnabled?: boolean;
  interpolEnabled?: boolean;
  passportEnabled?: boolean;
  rednoticeWorldwideEnabled?: boolean;
  identityRate?: number;
  courtRecordRate?: number;
  employmentRate?: number;
  educationRate?: number;
  interpolRate?: number;
  passportRate?: number;
  rednoticeWorldwideRate?: number;
  digitalAddressEnabled?: boolean;
  digitalAddressRate?: number;
  safliiCourtEnabled?: boolean;
  safliiCourtRate?: number;
  sapsWantedEnabled?: boolean;
  sapsWantedRate?: number;
  ukCourtEnabled?: boolean;
  ukCourtRate?: number;
  malaysiaCourtEnabled?: boolean;
  malaysiaCourtRate?: number;
  singaporeCourtEnabled?: boolean;
  singaporeCourtRate?: number;
  philippinesCourtEnabled?: boolean;
  philippinesCourtRate?: number;
  employmentRates?: Record<string, number>;
  educationRates?: Record<string, number>;
  serviceTats?: Record<string, string>;
  apiEnabled?: boolean;
}

export interface ApiKey {
  _id: string;
  orgId: string;
  orgName: string;
  keySuffix: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  status: "active" | "revoked";
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface ApiUsageSummary {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalCost: number;
  currency: string;
  breakdown: Record<string, { count: number; cost: number }>;
  recentLogs: Array<{
    _id: string;
    endpoint: string;
    checkType: string;
    method: string;
    statusCode: number;
    cost: number;
    timestamp: string | null;
    ipAddress?: string;
    responseTimeMs?: number;
  }>;
}

export interface ClientSuggestion {
  _id?: string;
  id: string;
  orgName: string;
  clientEmail: string;
  type: "enable_service" | "rate_query" | "suggestion" | "grievance";
  title: string;
  message: string;
  targetService?: string;
  status: "Pending" | "Under Review" | "Resolved" | "Service Enabled" | "Closed";
  adminReply?: string;
  createdAt: string;
  updatedAt?: string;
}

interface PortalContextType {
  verifications: Verification[];
  invoices: Invoice[];
  verifiers: Verifier[];
  apiKeys: ApiKey[];
  apiUsage: ApiUsageSummary | null;
  generateApiKey: () => Promise<any>;
  revokeApiKey: (apiKeyId: string) => Promise<void>;
  fetchApiUsage: () => Promise<void>;
  settings: CompanySettings;
  organisation: Organisation | null;
  ozcluSettings: CompanySettings | null;
  clusoSettings?: CompanySettings | null;
  suggestions: ClientSuggestion[];
  submitSuggestion: (params: { type: string; title: string; message: string; targetService?: string }) => Promise<any>;
  addInterpolVerification: (params: {
    candidateName: string;
    candidateDob: string;
    birthCity?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
  }) => Promise<any>;
  addRednoticeWorldwideVerification: (params: {
    candidateName: string;
    candidateDob: string;
    birthCity?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
  }) => Promise<any>;
  addSafliiCourtVerification: (params: {
    candidateName: string;
    candidateDob: string;
    birthCity?: string;
    province: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
    candidateFatherName?: string;
    candidateMotherName?: string;
    candidateIsMarried?: boolean;
    candidateHusbandName?: string;
    gender?: string;
    idProofType?: string;
    idProofNumber?: string;
    addresses?: Array<{ address: string; city: string; state: string; country: string; fromYear?: number; toYear?: number }>;
  }) => Promise<any>;
  addSapsWantedVerification: (params: {
    candidateName: string;
    candidateForename?: string;
    candidateSurname?: string;
    candidateDob: string;
    candidateIdNumber?: string;
    provinceCity?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
  }) => Promise<any>;
  addUkCourtVerification: (params: {
    candidateName: string;
    candidateDob?: string;
    birthCity?: string;
    judgmentType?: string;
    jurisdiction?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
    candidateFatherName?: string;
    candidateMotherName?: string;
    candidateIsMarried?: boolean;
    candidateHusbandName?: string;
    gender?: string;
    idProofType?: string;
    idProofNumber?: string;
    addresses?: Array<{ address: string; city: string; state: string; country: string; fromYear?: number; toYear?: number }>;
  }) => Promise<any>;
  addMalaysiaCourtVerification: (params: {
    candidateName: string;
    candidateDob?: string;
    courtCategory?: string;
    courtLocation?: string;
    caseType?: string;
    dateOfDecisionFrom?: string;
    dateOfDecisionTo?: string;
    dateOfAPFrom?: string;
    dateOfAPTo?: string;
    judgeName?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
    candidateFatherName?: string;
    candidateMotherName?: string;
    candidateIsMarried?: boolean;
    candidateHusbandName?: string;
    gender?: string;
    idProofType?: string;
    idProofNumber?: string;
    addresses?: Array<{ address: string; city: string; state: string; country: string; fromYear?: number; toYear?: number }>;
  }) => Promise<any>;
  addSingaporeCourtVerification: (params: {
    candidateName: string;
    candidateDob?: string;
    court?: string;
    hearingType?: string;
    startDate?: string;
    endDate?: string;
    judgeName?: string;
    lawFirm?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
    candidateFatherName?: string;
    candidateMotherName?: string;
    candidateIsMarried?: boolean;
    candidateHusbandName?: string;
    gender?: string;
    idProofType?: string;
    idProofNumber?: string;
    addresses?: Array<{ address: string; city: string; state: string; country: string; fromYear?: number; toYear?: number }>;
  }) => Promise<any>;
  addPhilippinesCourtVerification: (params: {
    candidateName: string;
    candidateDob?: string;
    partyName?: string;
    caseNo?: string;
    station?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
    candidateFatherName?: string;
    candidateMotherName?: string;
    candidateIsMarried?: boolean;
    candidateHusbandName?: string;
    gender?: string;
    idProofType?: string;
    idProofNumber?: string;
    addresses?: Array<{ address: string; city: string; state: string; country: string; fromYear?: number; toYear?: number }>;
  }) => Promise<any>;
  addPassportVerification: (params: {
    fileNumber: string;
    dateOfBirth: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
  }) => Promise<any>;
  addDigitalAddressVerification: (params: {
    candidateName: string;
    candidateEmail: string;
    candidateAddress: string;
    orgName: string;
    requestingOrgName: string;
  }) => Promise<any>;
  addVerification: (name: string, email: string, orgName: string, requestingOrgName?: string) => Promise<any>;
  addEmploymentVerification: (name: string, mobile: string, email: string, orgName: string, requestingOrgName?: string, skipCandidateLogin?: boolean, employments?: Array<{ companyName: string; position: string; joiningYear?: string; leavingYear?: string; employeeCode?: string; country?: string }>) => Promise<any>;
  addEducationVerification: (name: string, mobile: string, email: string, orgName: string, requestingOrgName?: string, skipCandidateLogin?: boolean, educationList?: Array<{ boardUniversity: string; courseName: string; passingYear?: string; rollNumber?: string; country?: string }>) => Promise<any>;
  submitEmploymentData: (verificationId: string, employmentData: any) => Promise<any>;
  submitEducationData: (verificationId: string, educationData: any) => Promise<any>;
  addCourtRecordVerification: (params: {
    candidateName: string;
    candidateDob: string;
    candidateFatherName: string;
    candidateMotherName: string;
    candidateIsMarried: boolean;
    candidateHusbandName?: string;
    gender?: string;
    idProofType?: string;
    idProofNumber?: string;
    idProofFile?: string;
    addresses: Array<{ address: string; city: string; state: string; country: string; fromYear?: number; toYear?: number }>;
    orgName: string;
    requestingOrgName: string;
  }) => Promise<any>;
  updateSettings: (newSettings: CompanySettings) => Promise<void>;
  inviteVerifier: (name: string, email: string, org: string, password?: string, designation?: string) => Promise<void>;
  updateVerifierStatus: (verifierId: string, status: "Active" | "Inactive") => Promise<void>;
  updateInvoiceStatus: (id: string, status: "Paid" | "Unpaid" | "Overdue" | "Pending", dbId?: string) => Promise<void>;
  submitPaymentProof: (invoiceId: string, proofBase64: string, invoiceDbId?: string, clientNote?: string) => Promise<void>;
  addInvoice: (orgName: string, amount: number, dueDate: string) => Promise<void>;
  assignVerifier: (verificationId: string, verifierName: string | null) => Promise<void>;
  updateVerificationStatus: (verificationId: string, status: "Completed" | "Processing" | "Needs Attention", notes?: string) => Promise<void>;
  fetchVerificationDetail: (id: string) => Promise<Verification>;

  refreshData: () => Promise<void>;
  removeRecentRequestingOrg: (orgName: string) => Promise<void>;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

// Default empty settings for fresh accounts
const defaultSettings: CompanySettings = {
  companyName: "",
  address: "",
  city: "",
  postalCode: "",
  contactFirstName: "",
  contactLastName: "",
  contactEmail: "",
  billingOption: "invoice",
  cin: "",
  lut: "",
  tin: "",
  gstin: "",
  invoiceEmail: "",
  billingSameAsCompany: true,
  billingAddress: "",
  sac: ""
};

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [ozcluSettings, setOzcluSettings] = useState<CompanySettings | null>(null);
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiUsage, setApiUsage] = useState<ApiUsageSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Sync / Fetch function from MongoDB API route
  const fetchAllData = async () => {
    try {
      const res = await fetch("/api/portal-data");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          await logout();
          return;
        }
        throw new Error("Failed to load dashboard data");
      }
      const data = await res.json();

      if (data.settings) {
        setSettings({
          companyName: data.settings.companyName,
          address: data.settings.address,
          city: data.settings.city,
          postalCode: data.settings.postalCode,
          contactFirstName: data.settings.contactFirstName,
          contactLastName: data.settings.contactLastName,
          contactEmail: data.settings.contactEmail,
          billingOption: data.settings.billingOption,
          cin: data.settings.cin || "",
          lut: data.settings.lut || "",
          tin: data.settings.tin || "",
          gstin: data.settings.gstin || "",
          invoiceEmail: data.settings.invoiceEmail || "",
          billingSameAsCompany: data.settings.billingSameAsCompany !== undefined ? data.settings.billingSameAsCompany : true,
          billingAddress: data.settings.billingAddress || "",
          sac: data.settings.sac || "",
          logo: data.settings.logo || "",
          recentRequestingOrgs: data.settings.recentRequestingOrgs || []
        });
      }

      if (data.ozcluSettings) {
        setOzcluSettings(data.ozcluSettings);
      } else {
        setOzcluSettings(null);
      }

      if (data.organisation) {
        setOrganisation(data.organisation);
      } else {
        setOrganisation(null);
      }

      if (data.verifications) {
        setVerifications(data.verifications);
      }

      if (data.invoices) {
        const formattedInvoices = data.invoices.map((inv: any) => ({
          ...inv,
          amount: parseFloat(inv.amount)
        }));
        setInvoices(formattedInvoices);
      }

      if (data.verifiers) {
        setVerifiers(data.verifiers);
      }

      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }

      if (data.apiKeys) {
        setApiKeys(data.apiKeys);
      }

      if (data.apiUsage) {
        setApiUsage(data.apiUsage);
      }
    } catch (err) {
      console.error("Error reading tables from API:", err);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    } else {
      setVerifications([]);
      setInvoices([]);
      setVerifiers([]);
      setSettings(defaultSettings);
      setOrganisation(null);
      setOzcluSettings(null);
      setApiKeys([]);
      setApiUsage(null);
    }
  }, [isAuthenticated]);

  const addVerification = async (name: string, email: string, orgName: string, requestingOrgName?: string) => {
    const cleanOrg = orgName.replace(/[^a-zA-Z]/g, "").slice(0, 3).padEnd(3, "X").toUpperCase();
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const dateStr = `${dd}${mm}${yy}`;
    const newId = `${cleanOrg}${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: Verification = {
      id: newId,
      name,
      email,
      orgName,
      requestingOrgName: requestingOrgName || orgName,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      status: "Processing",
      verifier: null,
      notes: "Awaiting verifier assignment."
    };

    setVerifications((prev) => [newRecord, ...prev]);

    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addVerification", payload: newRecord })
      });
      if (res.ok) {
        const data = await res.json();
        fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Failed inserting verification:", err);
    }
    fetchAllData();
    return null;
  };

  const updateSettings = async (newSettings: CompanySettings) => {
    setSettings(newSettings);
    try {
      await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateSettings", payload: newSettings })
      });
    } catch (err) {
      console.error("Failed updating settings:", err);
    }
    fetchAllData();
  };

  const inviteVerifier = async (name: string, email: string, org: string, password?: string, designation?: string) => {
    const newId = `V-${Math.floor(100 + Math.random() * 900)}`;
    const newVerifier: Verifier = {
      id: newId,
      name,
      email,
      org,
      designation: designation || undefined,
      status: "Pending"
    };

    setVerifiers((prev) => [...prev, newVerifier]);

    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "inviteVerifier", payload: { ...newVerifier, password } })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to invite verifier");
      }
    } catch (err) {
      console.error("Failed inviting verifier:", err);
      throw err;
    }
    fetchAllData();
  };

  const updateVerifierStatus = async (verifierId: string, status: "Active" | "Inactive") => {
    setVerifiers((prev) =>
      prev.map((v) => (v.id === verifierId ? { ...v, status } : v))
    );

    try {
      await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateVerifierStatus", payload: { verifierId, status } })
      });
    } catch (err) {
      console.error("Failed updating verifier status:", err);
    }
    fetchAllData();
  };

  const updateInvoiceStatus = async (id: string, status: "Paid" | "Unpaid" | "Overdue" | "Pending", dbId?: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status } : inv))
    );

    try {
      await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateInvoiceStatus", payload: { id, _id: dbId, status } })
      });
    } catch (err) {
      console.error("Failed updating invoice status:", err);
    }
    await fetchAllData();
  };

  const submitPaymentProof = async (invoiceId: string, proofBase64: string, invoiceDbId?: string, clientNote?: string) => {
    const proofDate = new Date().toISOString();
    const existing = invoices.find((inv) => inv.id === invoiceId);
    
    const baseLog: InvoiceActivity[] = existing?.activityLog || [
      {
        id: `act-${Date.now()}-gen`,
        type: "generated",
        timestamp: existing?.date || new Date(proofDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        actor: "System",
        note: "Invoice generated"
      }
    ];

    const newActivity: InvoiceActivity = {
      id: `act-${Date.now()}-sub`,
      type: "submitted",
      timestamp: proofDate,
      actor: existing?.orgName || "Client",
      note: clientNote || "",
      paymentProof: proofBase64
    };

    const updatedLog = [...baseLog, newActivity];

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "Pending" as const, paymentProof: proofBase64, paymentProofDate: proofDate, clientNote, activityLog: updatedLog } : inv))
    );

    try {
      await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitPaymentProof",
          payload: { id: invoiceId, _id: invoiceDbId, paymentProof: proofBase64, paymentProofDate: proofDate, clientNote, activityLog: updatedLog }
        })
      });
    } catch (err) {
      console.error("Failed submitting payment proof:", err);
    }
    await fetchAllData();
  };

  const addInvoice = async (orgName: string, amount: number, dueDate: string) => {
    // Build new invoice ID: INV-{orgNumber}-{orgPrefix}-{month}-{year}
    const orgNum = String(organisation?.orgNumber || 0).padStart(3, "0");
    const orgPrefix = orgName.replace(/\s+/g, "").substring(0, 3).toUpperCase();
    const now = new Date();
    const monthAbbr = now.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const yearStr = now.getFullYear();
    const newId = `INV-${orgNum}-${orgPrefix}-${monthAbbr}-${yearStr}`;
    const timestamp = new Date().toISOString();
    const newInvoice: Invoice = {
      id: newId,
      orgName,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      dueDate,
      amount,
      status: "Unpaid",
      generationType: "Manual",
      activityLog: [
        {
          id: `act-${Date.now()}-gen`,
          type: "generated",
          timestamp,
          actor: "System / Admin",
          note: "Invoice generated manually"
        }
      ]
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    try {
      await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addInvoice", payload: newInvoice })
      });
    } catch (err) {
      console.error("Failed adding invoice:", err);
    }
    fetchAllData();
  };

  const assignVerifier = async (verificationId: string, verifierName: string | null) => {
    setVerifications((prev) =>
      prev.map((v) => (v.id === verificationId ? { ...v, verifier: verifierName } : v))
    );

    try {
      await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assignVerifier", payload: { verificationId, verifierName } })
      });
    } catch (err) {
      console.error("Failed assigning verifier:", err);
    }
    fetchAllData();
  };

  const updateVerificationStatus = async (
    verificationId: string,
    status: "Completed" | "Processing" | "Needs Attention",
    notes?: string
  ) => {
    setVerifications((prev) =>
      prev.map((v) => {
        if (v.id === verificationId) {
          const reportDetails = status === "Completed"
            ? "Verification completed successfully. Standard identity checks, credential confirmation, and credit history assessment validated without discrepancy."
            : v.reportDetails;
          return {
            ...v,
            status,
            reportDetails,
            notes: notes || v.notes
          };
        }
        return v;
      })
    );

    try {
      const updateObj: any = { status };
      if (notes !== undefined) updateObj.notes = notes;
      if (status === "Completed") {
        updateObj.reportDetails = "Verification completed successfully. Standard identity checks, credential confirmation, and credit history assessment validated without discrepancy.";
      }

      await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateVerificationStatus", payload: { verificationId, ...updateObj } })
      });
    } catch (err) {
      console.error("Failed updating verification status:", err);
    }
    fetchAllData();
  };

  const fetchVerificationDetail = async (id: string): Promise<Verification> => {
    const res = await fetch(`/api/portal-data/verification-detail?id=${id}`);
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to load verification details");
    }
    const data = await res.json();
    return data.verification;
  };

  const removeRecentRequestingOrg = async (requestingOrgName: string) => {
    try {
      await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeRecentRequestingOrg", payload: { requestingOrgName } })
      });
      fetchAllData();
    } catch (err) {
      console.error("Failed removing recent requesting org:", err);
    }
  };

  const addCourtRecordVerification = async (params: {
    candidateName: string;
    candidateDob: string;
    candidateFatherName: string;
    candidateMotherName: string;
    candidateIsMarried: boolean;
    candidateHusbandName?: string;
    gender?: string;
    idProofType?: string;
    idProofNumber?: string;
    idProofFile?: string;
    addresses: Array<{ address: string; city: string; state: string; country: string; fromYear?: number; toYear?: number }>;
    orgName: string;
    requestingOrgName: string;
  }) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addCourtRecordVerification",
          payload: params,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Failed creating court record verification:", err);
    }
    fetchAllData();
    return null;
  };

  const addInterpolVerification = async (params: {
    candidateName: string;
    candidateDob: string;
    birthCity?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
  }) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addInterpolVerification",
          payload: params,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Failed creating interpol verification:", err);
    }
    fetchAllData();
    return null;
  };

  const addRednoticeWorldwideVerification = async (params: {
    candidateName: string;
    candidateDob: string;
    birthCity?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
  }) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addRednoticeWorldwideVerification",
          payload: params,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Failed creating Red Notice Worldwide verification:", err);
    }
    fetchAllData();
    return null;
  };

  const addSafliiCourtVerification = async (params: {
    candidateName: string;
    candidateDob: string;
    birthCity?: string;
    province: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
    candidateFatherName?: string;
    candidateMotherName?: string;
    candidateIsMarried?: boolean;
    candidateHusbandName?: string;
    gender?: string;
    idProofType?: string;
    idProofNumber?: string;
    addresses?: Array<{ address: string; city: string; state: string; country: string; fromYear?: number; toYear?: number }>;
  }) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addSafliiCourtVerification",
          payload: params,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Failed creating SAFLII court verification:", err);
    }
    fetchAllData();
    return null;
  };

  const addSapsWantedVerification = async (params: {
    candidateName: string;
    candidateForename?: string;
    candidateSurname?: string;
    candidateDob: string;
    candidateIdNumber?: string;
    provinceCity?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
  }) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addSapsWantedVerification",
          payload: params,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed creating SAPS Wanted verification");
      await fetchAllData();
      return data;
    } catch (err: any) {
      console.error("Failed creating SAPS Wanted verification:", err);
      throw err;
    }
  };

  const addUkCourtVerification = async (params: {
    candidateName: string;
    candidateDob?: string;
    birthCity?: string;
    judgmentType?: string;
    jurisdiction?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
    candidateFatherName?: string;
    candidateMotherName?: string;
    candidateIsMarried?: boolean;
    candidateHusbandName?: string;
    gender?: string;
    idProofType?: string;
    idProofNumber?: string;
    addresses?: Array<{ address: string; city: string; state: string; country: string; fromYear?: number; toYear?: number }>;
  }) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addUkCourtVerification",
          payload: params,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed creating UK Court verification");
       fetchAllData();
      return data;
    } catch (err: any) {
      console.error("Failed creating UK Court verification:", err);
      throw err;
    }
  };

  const addMalaysiaCourtVerification = async (params: {
    candidateName: string;
    candidateDob?: string;
    courtCategory?: string;
    courtLocation?: string;
    caseType?: string;
    dateOfDecisionFrom?: string;
    dateOfDecisionTo?: string;
    dateOfAPFrom?: string;
    dateOfAPTo?: string;
    judgeName?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
    candidateFatherName?: string;
    candidateMotherName?: string;
    candidateIsMarried?: boolean;
    candidateHusbandName?: string;
    gender?: string;
    idProofType?: string;
    idProofNumber?: string;
    addresses?: Array<{ address: string; city: string; state: string; country: string; fromYear?: number; toYear?: number }>;
  }) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addMalaysiaCourtVerification",
          payload: params,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed creating Malaysia Court verification");
      await fetchAllData();
      return data;
    } catch (err: any) {
      console.error("Failed creating Malaysia Court verification:", err);
      throw err;
    }
  };

  const addSingaporeCourtVerification = async (params: {
    candidateName: string;
    candidateDob?: string;
    court?: string;
    hearingType?: string;
    startDate?: string;
    endDate?: string;
    judgeName?: string;
    lawFirm?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
    candidateFatherName?: string;
    candidateMotherName?: string;
    candidateIsMarried?: boolean;
    candidateHusbandName?: string;
    gender?: string;
    idProofType?: string;
    idProofNumber?: string;
    addresses?: Array<{ address: string; city: string; state: string; country: string; fromYear?: number; toYear?: number }>;
  }) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addSingaporeCourtVerification",
          payload: params,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed creating Singapore Court verification");
      await fetchAllData();
      return data;
    } catch (err: any) {
      console.error("Failed creating Singapore Court verification:", err);
      throw err;
    }
  };

  const addPhilippinesCourtVerification = async (params: {
    candidateName: string;
    candidateDob?: string;
    partyName?: string;
    caseNo?: string;
    station?: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
    candidateFatherName?: string;
    candidateMotherName?: string;
    candidateIsMarried?: boolean;
    candidateHusbandName?: string;
    gender?: string;
    idProofType?: string;
    idProofNumber?: string;
    addresses?: Array<{ address: string; city: string; state: string; country: string; fromYear?: number; toYear?: number }>;
  }) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addPhilippinesCourtVerification",
          payload: params,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed creating Philippines Court verification");
      await fetchAllData();
      return data;
    } catch (err: any) {
      console.error("Failed creating Philippines Court verification:", err);
      throw err;
    }
  };

  const addPassportVerification = async (params: {
    fileNumber: string;
    dateOfBirth: string;
    orgName: string;
    requestingOrgName: string;
    idProofFile?: string | null;
    idProofFileName?: string;
  }) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addPassportVerification",
          payload: params,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchAllData();
        return data;
      } else {
        const errData = await res.json();
        return { success: false, error: errData.error || "Passport verification failed" };
      }
    } catch (err: any) {
      console.error("Failed creating passport verification:", err);
      return { success: false, error: err?.message || "Failed to connect to server" };
    }
  };

  const addEmploymentVerification = async (
    name: string,
    mobile: string,
    email: string,
    orgName: string,
    requestingOrgName?: string,
    skipCandidateLogin?: boolean,
    employments?: Array<{ companyName: string; position: string; joiningYear?: string; leavingYear?: string; employeeCode?: string; country?: string }>
  ) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addEmploymentVerification",
          payload: {
            name,
            mobile,
            email,
            orgName,
            requestingOrgName: requestingOrgName || orgName,
            skipCandidateLogin: !!skipCandidateLogin,
            employments: employments || []
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Failed creating employment verification:", err);
    }
    fetchAllData();
    return null;
  };

  const addEducationVerification = async (
    name: string,
    mobile: string,
    email: string,
    orgName: string,
    requestingOrgName?: string,
    skipCandidateLogin?: boolean,
    educationList?: Array<{ boardUniversity: string; courseName: string; passingYear?: string; rollNumber?: string; country?: string }>
  ) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addEducationVerification",
          payload: {
            name,
            mobile,
            email,
            orgName,
            requestingOrgName: requestingOrgName || orgName,
            skipCandidateLogin: !!skipCandidateLogin,
            educationList: educationList || []
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Failed creating education verification:", err);
    }
    fetchAllData();
    return null;
  };

  const submitEmploymentData = async (verificationId: string, employmentData: any) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitEmploymentData",
          payload: { verificationId, employmentData },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Failed submitting employment data:", err);
    }
    fetchAllData();
    return null;
  };

  const submitEducationData = async (verificationId: string, educationData: any) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitEducationData",
          payload: { verificationId, educationData },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Failed submitting education data:", err);
    }
    fetchAllData();
    return null;
  };

  const addDigitalAddressVerification = async (params: {
    candidateName: string;
    candidateEmail: string;
    candidateAddress: string;
    orgName: string;
    requestingOrgName: string;
  }) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addDigitalAddressVerification",
          payload: params,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        fetchAllData();
        return data;
      } else {
        const errData = await res.json();
        return { success: false, error: errData.error || "Digital address verification failed" };
      }
    } catch (err: any) {
      console.error("Failed creating digital address verification:", err);
      return { success: false, error: err?.message || "Failed to connect to server" };
    }
  };

  const submitSuggestion = async (params: { type: string; title: string; message: string; targetService?: string }) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submitSuggestion", payload: params })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit suggestion");
      await fetchAllData();
      return data;
    } catch (err: any) {
      console.error("Failed submitting suggestion:", err);
      throw err;
    }
  };

  const generateApiKey = async () => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateApiKey",
          payload: {},
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate API key");
      await fetchAllData();
      return data.apiKey;
    } catch (err: any) {
      console.error("Failed to generate API key:", err);
      throw err;
    }
  };

  const revokeApiKey = async (apiKeyId: string) => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revokeApiKey",
          payload: { apiKeyId },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke API key");
      await fetchAllData();
    } catch (err: any) {
      console.error("Failed to revoke API key:", err);
      throw err;
    }
  };

  const fetchApiUsage = async () => {
    try {
      const res = await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getApiUsage",
          payload: {},
        }),
      });
      const data = await res.json();
      if (res.ok && data.apiUsage) {
        setApiUsage(data.apiUsage);
      }
    } catch (err: any) {
      console.error("Failed to fetch API usage:", err);
    }
  };

  return (
    <PortalContext.Provider
      value={{
        verifications,
        invoices,
        verifiers,
        settings,
        organisation,
        ozcluSettings,
        clusoSettings: ozcluSettings,
        suggestions,
        apiKeys,
        apiUsage,
        generateApiKey,
        revokeApiKey,
        fetchApiUsage,
        submitSuggestion,
        addInterpolVerification,
        addRednoticeWorldwideVerification,
        addSafliiCourtVerification,
        addSapsWantedVerification,
        addUkCourtVerification,
        addMalaysiaCourtVerification,
        addSingaporeCourtVerification,
        addPhilippinesCourtVerification,
        addPassportVerification,
        addDigitalAddressVerification,
        addVerification,
        addEmploymentVerification,
        addEducationVerification,
        submitEmploymentData,
        submitEducationData,
        addCourtRecordVerification,
        updateSettings,
        inviteVerifier,
        updateVerifierStatus,
        updateInvoiceStatus,
        submitPaymentProof,
        addInvoice,
        assignVerifier,
        updateVerificationStatus,
        fetchVerificationDetail,

        refreshData: fetchAllData,
        removeRecentRequestingOrg,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error("usePortal must be used within a PortalProvider");
  }
  return context;
};
