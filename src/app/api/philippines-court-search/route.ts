import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, isErrorResponse } from "src/lib/apiAuth";
import { connectToDatabase } from "src/lib/mongodb";
import { isRecordFullNameMatch } from "src/lib/nameMatching";

/**
 * POST /api/philippines-court-search
 *
 * Live search gateway querying the official Court of Appeals of the Philippines Portal
 * (https://services.ca.judiciary.gov.ph/faces/pages/HomePage.xhtml)
 * across CA Manila, CA Visayas, and CA Mindanao stations.
 *
 * Body: {
 *   verificationId: string;
 *   candidateName: string;         // Party name or search keyword
 *   caseNo?: string;               // Optional specific Case No
 *   station?: string;              // "all" | "mnl" | "ceb" | "cdo"
 * }
 */

const CA_BASE_URL = "https://services.ca.judiciary.gov.ph/faces/pages/HomePage.xhtml";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2_000;
const REQUEST_TIMEOUT_MS = 30_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ParsedPhilippinesCourtRecord {
  no: number;
  caseNo: string;
  station: string;
  stationCode?: string;
  caseTitle: string;
  parties: string[];
  decisionStatus: string;
  hasDecision: boolean;
  statusCategory: string;
}

function cleanHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Execute search for a single station on the Court of Appeals portal
 */
async function searchStation(query: string, stationCode: string): Promise<ParsedPhilippinesCourtRecord[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Step 1: Initial GET to get cookies and ViewState
    const getRes = await fetch(CA_BASE_URL, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    if (!getRes.ok) {
      throw new Error(`Failed to load CA portal HomePage: HTTP ${getRes.status}`);
    }

    const getHtml = await getRes.text();
    const cookies = getRes.headers.get("set-cookie") || "";
    const viewStateMatch = getHtml.match(/name="javax\.faces\.ViewState"[^>]*value="([^"]+)"/);

    if (!viewStateMatch) {
      throw new Error("Could not extract javax.faces.ViewState token from CA portal.");
    }
    const viewState = viewStateMatch[1];

    // Step 2: POST form submission with station and search query
    const params = new URLSearchParams();
    params.append("searching", "searching");
    params.append("searching:radio-id", stationCode);
    params.append("searching:dt-search-0", query);
    params.append("searching:search-button", "");
    params.append("javax.faces.ViewState", viewState);

    const postRes = await fetch(CA_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cookie": cookies,
        "Referer": CA_BASE_URL,
        "Origin": "https://services.ca.judiciary.gov.ph",
      },
      body: params.toString(),
      redirect: "follow",
      signal: controller.signal,
    });

    if (!postRes.ok) {
      throw new Error(`CA portal search returned HTTP ${postRes.status}`);
    }

    const html = await postRes.text();
    clearTimeout(timer);

    // If it did not redirect to Results.xhtml or doesn't have table rows, it's clean (0 results)
    if (!html.includes("<tr class=\"modernTable") && !html.includes("class=\"modernTable")) {
      return [];
    }

    // Parse records from HTML table
    const rowMatches = html.match(/<tr class="modernTable(?:Odd|Even)Row">[\s\S]*?<\/tr>/g) || [];
    const results: ParsedPhilippinesCourtRecord[] = [];

    rowMatches.forEach((rowHtml, idx) => {
      const caseNoMatch = rowHtml.match(/<span style="font-weight: bold; color:green">([\s\S]*?)<\/span>/);
      const caseNo = cleanHtml(caseNoMatch ? caseNoMatch[1] : "");

      const stationMatch = rowHtml.match(/<center>([A-Z\s]+)<\/center>/);
      const station = cleanHtml(stationMatch ? stationMatch[1] : stationCode.toUpperCase());

      const titleMatch = rowHtml.match(/<h1>Case Title<\/h1>\s*<p>([\s\S]*?)<\/p>/);
      const caseTitle = cleanHtml(titleMatch ? titleMatch[1] : "");

      const decisionMatch = rowHtml.match(/<h1>Decision<\/h1>\s*<h6>([\s\S]*?)<\/h6>/);
      const decisionStatus = cleanHtml(decisionMatch ? decisionMatch[1] : "PENDING / ONGOING");

      // Extract parties from caseTitle (standard format "PLAINTIFF VS. DEFENDANT")
      const parties = caseTitle
        .split(/\bVS\.?\b|\bV\.?\b/i)
        .map((p) => cleanHtml(p))
        .filter(Boolean);

      const hasDecision = /DECISION|RESOLUTION|PROMULGATED|DISPOSED/i.test(decisionStatus);

      if (caseNo || caseTitle) {
        results.push({
          no: idx + 1,
          caseNo: caseNo || `CA-${stationCode.toUpperCase()}-${idx + 1}`,
          station: station || (stationCode === "mnl" ? "MANILA" : stationCode === "ceb" ? "VISAYAS" : "MINDANAO"),
          stationCode,
          caseTitle,
          parties,
          decisionStatus: decisionStatus || "RECORD FOUND",
          hasDecision,
          statusCategory: hasDecision ? "With Decision" : "Pending / Active",
        });
      }
    });

    return results;
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Query portal with automatic retries
 */
async function queryPhilippinesCourtPortal(query: string, station: string): Promise<ParsedPhilippinesCourtRecord[]> {
  const stationCodes = station === "all" || !station ? ["mnl", "ceb", "cdo"] : [station];
  const allResults: ParsedPhilippinesCourtRecord[] = [];
  const seenCaseNos = new Set<string>();

  for (const stCode of stationCodes) {
    let attempts = 0;
    let success = false;
    let lastError: any = null;

    while (attempts < MAX_RETRIES && !success) {
      attempts++;
      try {
        const stationResults = await searchStation(query, stCode);
        for (const item of stationResults) {
          const key = `${item.stationCode}-${item.caseNo}`;
          if (!seenCaseNos.has(key)) {
            seenCaseNos.add(key);
            allResults.push(item);
          }
        }
        success = true;
      } catch (err: any) {
        lastError = err;
        console.warn(`[philippines-court-search] Attempt ${attempts} failed for station ${stCode}:`, err.message);
        if (attempts < MAX_RETRIES) {
          await delay(RETRY_DELAY_MS * attempts);
        }
      }
    }

    if (!success && lastError && stationCodes.length === 1) {
      throw lastError;
    }
  }

  // Re-number results
  return allResults.map((r, i) => ({ ...r, no: i + 1 }));
}

export async function POST(req: NextRequest) {
  try {
    const internalApiKey = req.headers.get("x-internal-api-key");
    const isInternalCall = internalApiKey && internalApiKey === process.env.NEXTAUTH_SECRET;

    if (!isInternalCall) {
      const authResult = await requireAuth();
      if (isErrorResponse(authResult)) return authResult;
      const { user } = authResult;

      const roleError = requireRole(user, ["client", "verifier", "admin"]);
      if (roleError) return roleError;
    }

    const body = await req.json().catch(() => ({}));
    const { verificationId, candidateName, caseNo, station } = body;

    if (!verificationId) {
      return NextResponse.json(
        { error: "Missing required field: verificationId" },
        { status: 400 }
      );
    }

    const searchTerm = (caseNo || candidateName || "").trim();

    if (!searchTerm) {
      return NextResponse.json(
        { error: "A candidate name, party name, or case number is required for the court search." },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Mark search in progress
    await db.collection("verifications").updateOne(
      { id: verificationId },
      {
        $set: {
          philippinesCourtStatus: "searching",
          philippinesCourtSearchInitiatedAt: new Date().toISOString(),
        },
      }
    );

    let records: ParsedPhilippinesCourtRecord[] = [];
    try {
      records = await queryPhilippinesCourtPortal(searchTerm, station || "all");
    } catch (searchError: any) {
      console.error("[philippines-court-search] Live query error:", searchError);
      await db.collection("verifications").updateOne(
        { id: verificationId },
        {
          $set: {
            philippinesCourtStatus: "error",
            philippinesCourtError: searchError.message || "Failed to query the Court of Appeals portal.",
            philippinesCourtCompletedAt: new Date().toISOString(),
          },
        }
      );
      return NextResponse.json(
        {
          error: "Failed to connect to the Court of Appeals of the Philippines portal. Please try again.",
          details: searchError.message,
        },
        { status: 502 }
      );
    }

    // Filter records strictly by candidate full name matching actual parties or case title
    const matchedRecords = caseNo && String(caseNo).trim()
      ? records
      : records.filter((r) =>
          isRecordFullNameMatch(String(candidateName || searchTerm).trim(), [
            r.caseTitle,
            r.parties,
          ])
        );

    // Re-number matched records
    const finalRecords = matchedRecords.map((r, i) => ({ ...r, no: i + 1 }));
    const hasRecords = finalRecords.length > 0;
    const completedAt = new Date().toISOString();

    await db.collection("verifications").updateOne(
      { id: verificationId },
      {
        $set: {
          philippinesCourtStatus: "completed",
          philippinesCourtHasRecords: hasRecords,
          philippinesCourtResults: finalRecords,
          philippinesCourtTotalResults: finalRecords.length,
          philippinesCourtCompletedAt: completedAt,
          status: hasRecords ? "Needs Attention" : "Completed",
        },
      }
    );

    return NextResponse.json({
      success: true,
      hasRecords,
      totalResults: finalRecords.length,
      stationSearched: station || "all",
      results: finalRecords,
      completedAt,
    });
  } catch (error: any) {
    console.error("[philippines-court-search] Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
