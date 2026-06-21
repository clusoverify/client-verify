"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "src/context/AuthContext";

// Types
export interface Verification {
  id: string;
  name: string;
  email: string;
  orgName: string;
  date: string;
  status: "Completed" | "Processing" | "Needs Attention";
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
}

export interface Invoice {
  _id?: string;
  id: string;
  orgName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "Paid" | "Unpaid" | "Overdue" | "Pending";
  paymentProof?: string;
  paymentProofDate?: string;
}

export interface Verifier {
  id: string;
  name: string;
  email: string;
  org: string;
  status: "Active" | "Pending" | "Inactive";
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
}

export interface Organisation {
  id: string;
  name: string;
  paymentPlan: string;
  monthlyRate: number;
  billingDay: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  paymentNotes?: string;
  createdAt: string;
}

interface PortalContextType {
  verifications: Verification[];
  invoices: Invoice[];
  verifiers: Verifier[];
  settings: CompanySettings;
  organisation: Organisation | null;
  addVerification: (name: string, email: string, orgName: string) => Promise<any>;
  updateSettings: (newSettings: CompanySettings) => Promise<void>;
  inviteVerifier: (name: string, email: string, org: string) => Promise<void>;
  updateInvoiceStatus: (id: string, status: "Paid" | "Unpaid" | "Overdue" | "Pending") => Promise<void>;
  submitPaymentProof: (invoiceId: string, proofBase64: string) => Promise<void>;
  addInvoice: (orgName: string, amount: number, dueDate: string) => Promise<void>;
  assignVerifier: (verificationId: string, verifierName: string | null) => Promise<void>;
  updateVerificationStatus: (verificationId: string, status: "Completed" | "Processing" | "Needs Attention", notes?: string) => Promise<void>;
  fetchVerificationDetail: (id: string) => Promise<Verification>;
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
  tin: ""
};

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
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
          tin: data.settings.tin || ""
        });
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
    }
  }, [isAuthenticated]);

  const addVerification = async (name: string, email: string, orgName: string) => {
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

  const inviteVerifier = async (name: string, email: string, org: string, password?: string) => {
    const newId = `V-${Math.floor(100 + Math.random() * 900)}`;
    const newVerifier: Verifier = {
      id: newId,
      name,
      email,
      org,
      status: "Pending"
    };

    setVerifiers((prev) => [...prev, newVerifier]);

    try {
      await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "inviteVerifier", payload: { ...newVerifier, password } })
      });
    } catch (err) {
      console.error("Failed inviting verifier:", err);
    }
    fetchAllData();
  };

  const updateInvoiceStatus = async (id: string, status: "Paid" | "Unpaid" | "Overdue" | "Pending") => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status } : inv))
    );

    try {
      await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateInvoiceStatus", payload: { id, status } })
      });
    } catch (err) {
      console.error("Failed updating invoice status:", err);
    }
    fetchAllData();
  };

  const submitPaymentProof = async (invoiceId: string, proofBase64: string) => {
    const proofDate = new Date().toISOString();
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "Pending" as const, paymentProof: proofBase64, paymentProofDate: proofDate } : inv))
    );

    try {
      await fetch("/api/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitPaymentProof",
          payload: { id: invoiceId, paymentProof: proofBase64, paymentProofDate: proofDate }
        })
      });
    } catch (err) {
      console.error("Failed submitting payment proof:", err);
    }
    fetchAllData();
  };

  const addInvoice = async (orgName: string, amount: number, dueDate: string) => {
    const newId = `INV-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`;
    const newInvoice: Invoice = {
      id: newId,
      orgName,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      dueDate,
      amount,
      status: "Unpaid"
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

  return (
    <PortalContext.Provider
      value={{
        verifications,
        invoices,
        verifiers,
        settings,
        organisation,
        addVerification,
        updateSettings,
        inviteVerifier,
        updateInvoiceStatus,
        submitPaymentProof,
        addInvoice,
        assignVerifier,
        updateVerificationStatus,
        fetchVerificationDetail,
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
