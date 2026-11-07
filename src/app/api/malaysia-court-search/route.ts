import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, isErrorResponse } from "src/lib/apiAuth";
import { connectToDatabase } from "src/lib/mongodb";
import { isRecordFullNameMatch } from "src/lib/nameMatching";

/**
 * POST /api/malaysia-court-search
 *
 * Live search gateway querying the official Mahkamah Persekutuan Malaysia - Portal eJudgment
 * Web Service (https://ejudgment.kehakiman.gov.my/EJudgmentWeb/eJudgmentService.asmx/GetEJudgmentPortalSearchList)
 * for Grounds of Judgment (GOJ), rulings, orders, and court decisions.
 *
 * Body: {
 *   verificationId: string;
 *   candidateName: string;
 *   courtCategory?: string;       // "11" (Federal), "3" (Appeal), "2" (High), "10" (Sessions), "5" (Magistrate), "" (All)
 *   courtLocation?: string;       // Court location ID (e.g. "1" for Kangar, etc.)
 *   caseType?: string;            // Division ID (e.g. "2" for Criminal, "3" for Civil, etc.)
 *   dateOfDecisionFrom?: string;  // YYYY-MM-DD or DD/MM/YYYY
 *   dateOfDecisionTo?: string;    // YYYY-MM-DD or DD/MM/YYYY
 *   dateOfAPFrom?: string;        // GOJ filing date from
 *   dateOfAPTo?: string;          // GOJ filing date to
 *   judgeName?: string;
 * }
 */

const EJUDGMENT_API_URL =
  "https://ejudgment.kehakiman.gov.my/EJudgmentWeb/eJudgmentService.asmx/GetEJudgmentPortalSearchList";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2_000;
const REQUEST_TIMEOUT_MS = 20_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ParsedMalaysiaCourtRecord {
  no: number | string;
  caseNo: string;
  rawCaseNo: string;
  courtLevel?: string;
  parties: string;
  rawParties: string;
  keyword: string;
  dateOfResult: string;      // DD/MM/YYYY
  dateOfResultIso?: string;  // ISO 8601
  dateOfAP: string;          // DD/MM/YYYY
  dateOfAPIso?: string;      // ISO 8601
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
}

/**
 * Format .NET /Date(timestamp)/ to readable dates
 */
function parseDotNetDate(dotNetDateStr: string | null | undefined): { formatted: string; iso: string | null } {
  if (!dotNetDateStr) return { formatted: "-", iso: null };
  try {
    const match = dotNetDateStr.match(/\/Date\((\d+)\)\//);
    if (match) {
      const timestamp = parseInt(match[1], 10);
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return {
          formatted: `${day}/${month}/${year}`,
          iso: d.toISOString(),
        };
      }
    }
    // Fallback if already standard string
    const fallbackDate = new Date(dotNetDateStr);
    if (!isNaN(fallbackDate.getTime())) {
      const day = String(fallbackDate.getDate()).padStart(2, "0");
      const month = String(fallbackDate.getMonth() + 1).padStart(2, "0");
      const year = fallbackDate.getFullYear();
      return {
        formatted: `${day}/${month}/${year}`,
        iso: fallbackDate.toISOString(),
      };
    }
  } catch {
    // ignore
  }
  return { formatted: String(dotNetDateStr), iso: null };
}

/**
 * Clean HTML markup for parties, case numbers, and keywords
 */
function cleanHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

/**
 * Extract court level from CaseNo like "DA-44-25-04/2026<br />(Mahkamah Tinggi)"
 */
function extractCourtLevel(rawCaseNo: string): string {
  const match = rawCaseNo.match(/\(([^)]+)\)/);
  if (match) return match[1].trim();
  return "";
}

export async function POST(req: NextRequest) {
  try {
    // Auth check — allow internal server-to-server calls
    const internalApiKey = req.headers.get("x-internal-api-key");
    const isInternalCall = internalApiKey && internalApiKey === process.env.NEXTAUTH_SECRET;

    if (!isInternalCall) {
      const authResult = await requireAuth();
      if (isErrorResponse(authResult)) return authResult;
      const { user } = authResult;

      const roleError = requireRole(user, ["client", "org_owner", "admin"]);
      if (roleError) return roleError;
    }

    const body = await req.json();
    const {
      verificationId,
      candidateName,
      courtCategory,
      courtLocation,
      caseType,
      dateOfDecisionFrom,
      dateOfDecisionTo,
      dateOfAPFrom,
      dateOfAPTo,
      judgeName,
    } = body;

    if (!verificationId || !candidateName) {
      return NextResponse.json(
        { error: "Missing required fields: verificationId, candidateName" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Mark search in progress
    await db.collection("verifications").updateOne(
      { id: verificationId },
      {
        $set: {
          malaysiaCourtStatus: "searching",
          malaysiaCourtSearchStartedAt: new Date().toISOString(),
        },
      }
    );

    let lastError: Error | null = null;

    // Prepare search payload
    const searchPayload = {
      Param: {
        CourtCategory: courtCategory ? String(courtCategory).trim() : "",
        Court: courtLocation ? String(courtLocation).trim() : "",
        JurisdictionType: courtCategory && String(courtCategory).trim() !== "" ? String(courtCategory).trim() : "ALL",
        DateOfAPFrom: dateOfAPFrom ? String(dateOfAPFrom).trim() : "",
        DateOfAPTo: dateOfAPTo ? String(dateOfAPTo).trim() : "",
        DateOfResultFrom: dateOfDecisionFrom ? String(dateOfDecisionFrom).trim() : "",
        DateOfResultTo: dateOfDecisionTo ? String(dateOfDecisionTo).trim() : "",
        Search: candidateName ? String(candidateName).trim() : "",
        JudgeName: judgeName ? String(judgeName).trim() : "",
        CaseType: caseType ? String(caseType).trim() : "",
        CurrPage: 1,
        Ordering: "DATE_OF_AP_DESC",
      },
    };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`[MY-COURT] Retry attempt ${attempt}/${MAX_RETRIES} for ${verificationId}`);
          await delay(RETRY_DELAY_MS);
        }

        console.log(`[MY-COURT] Querying Portal eJudgment API gateway: ${EJUDGMENT_API_URL}`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const response = await fetch(EJUDGMENT_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Origin": "https://ejudgment.kehakiman.gov.my",
            "Referer": "https://ejudgment.kehakiman.gov.my/ejudgmentweb/searchpage.aspx?JurisdictionType=ALL",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          },
          body: JSON.stringify(searchPayload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`Portal eJudgment returned HTTP ${response.status}`);
        }

        const data = await response.json();
        const searchResult = data?.d;

        if (!searchResult) {
          throw new Error("Invalid response format from Portal eJudgment web service");
        }

        const totalCount = Number(searchResult.TOTAL_RECORD) || 0;
        const rawItems = Array.isArray(searchResult.ListOfSearchItem) ? searchResult.ListOfSearchItem : [];

        const records: ParsedMalaysiaCourtRecord[] = rawItems.map((item: any) => {
          const rawCaseNo = item.CaseNo || "";
          const cleanedCaseNo = cleanHtml(rawCaseNo).replace(/\n/g, " ");
          const courtLevel = extractCourtLevel(rawCaseNo);

          const { formatted: dateOfResultFormatted, iso: dateOfResultIso } = parseDotNetDate(item.DateOfResult);
          const { formatted: dateOfAPFormatted, iso: dateOfAPIso } = parseDotNetDate(item.DateOfAP);

          const rawParties = item.Parties || "";
          const cleanedParties = cleanHtml(rawParties);

          const documents = (Array.isArray(item.ListOfAPDoc) ? item.ListOfAPDoc : []).map((doc: any) => {
            const docId = doc.DocumentID || "";
            return {
              documentId: docId,
              docName: doc.APDocName || "Grounds of Judgment",
              preparedBy: doc.APPreparedBy || "",
              decisionCategory: doc.DecisionCategory || "",
              isExpunged: doc.IsExpunged === true,
              url: `https://efs.kehakiman.gov.my/EFSWeb/DocDownloader.aspx?DocumentID=${encodeURIComponent(
                docId
              )}&Inline=true`,
            };
          });

          return {
            no: item.RowNum || item.No || "",
            caseNo: cleanedCaseNo,
            rawCaseNo,
            courtLevel,
            parties: cleanedParties,
            rawParties,
            keyword: cleanHtml(item.KeyWord || ""),
            dateOfResult: dateOfResultFormatted,
            dateOfResultIso: dateOfResultIso || undefined,
            dateOfAP: dateOfAPFormatted,
            dateOfAPIso: dateOfAPIso || undefined,
            judge: item.Judge ? String(item.Judge).trim() : "",
            corumJudge: item.CorumJudge ? cleanHtml(item.CorumJudge) : undefined,
            eJudgUniqueID: item.eJudgUniqueID || undefined,
            documents,
          };
        });

        // If more records exist, fetch page 2 if needed (up to 40 records)
        if (totalCount > 20 && records.length === 20) {
          try {
            const p2Payload = {
              Param: {
                ...searchPayload.Param,
                CurrPage: 2,
              },
            };
            const p2Controller = new AbortController();
            const p2Timeout = setTimeout(() => p2Controller.abort(), 12_000);

            const p2Res = await fetch(EJUDGMENT_API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Origin": "https://ejudgment.kehakiman.gov.my",
                "Referer": "https://ejudgment.kehakiman.gov.my/ejudgmentweb/searchpage.aspx?JurisdictionType=ALL",
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              },
              body: JSON.stringify(p2Payload),
              signal: p2Controller.signal,
            });

            clearTimeout(p2Timeout);

            if (p2Res.ok) {
              const p2Data = await p2Res.json();
              const p2Items = Array.isArray(p2Data?.d?.ListOfSearchItem) ? p2Data.d.ListOfSearchItem : [];
              p2Items.forEach((item: any) => {
                const rawCaseNo = item.CaseNo || "";
                const cleanedCaseNo = cleanHtml(rawCaseNo).replace(/\n/g, " ");
                const courtLevel = extractCourtLevel(rawCaseNo);
                const { formatted: dateOfResultFormatted, iso: dateOfResultIso } = parseDotNetDate(item.DateOfResult);
                const { formatted: dateOfAPFormatted, iso: dateOfAPIso } = parseDotNetDate(item.DateOfAP);

                const documents = (Array.isArray(item.ListOfAPDoc) ? item.ListOfAPDoc : []).map((doc: any) => {
                  const docId = doc.DocumentID || "";
                  return {
                    documentId: docId,
                    docName: doc.APDocName || "Grounds of Judgment",
                    preparedBy: doc.APPreparedBy || "",
                    decisionCategory: doc.DecisionCategory || "",
                    isExpunged: doc.IsExpunged === true,
                    url: `https://efs.kehakiman.gov.my/EFSWeb/DocDownloader.aspx?DocumentID=${encodeURIComponent(
                      docId
                    )}&Inline=true`,
                  };
                });

                if (!records.some((r) => r.eJudgUniqueID === item.eJudgUniqueID && r.caseNo === cleanedCaseNo)) {
                  records.push({
                    no: item.RowNum || item.No || records.length + 1,
                    caseNo: cleanedCaseNo,
                    rawCaseNo,
                    courtLevel,
                    parties: cleanHtml(item.Parties || ""),
                    rawParties: item.Parties || "",
                    keyword: cleanHtml(item.KeyWord || ""),
                    dateOfResult: dateOfResultFormatted,
                    dateOfResultIso: dateOfResultIso || undefined,
                    dateOfAP: dateOfAPFormatted,
                    dateOfAPIso: dateOfAPIso || undefined,
                    judge: item.Judge ? String(item.Judge).trim() : "",
                    corumJudge: item.CorumJudge ? cleanHtml(item.CorumJudge) : undefined,
                    eJudgUniqueID: item.eJudgUniqueID || undefined,
                    documents,
                  });
                }
              });
            }
          } catch (p2Err: any) {
            console.warn(`[MY-COURT] Optional page 2 fetch skipped:`, p2Err.message);
          }
        }

        // Strictly filter raw results: only include records where candidate full name matches parties
        const matchedRecords = records.filter((rec) =>
          isRecordFullNameMatch(String(candidateName).trim(), [
            rec.parties,
            rec.rawParties,
          ])
        );

        // Re-number matched records
        const finalRecords = matchedRecords.map((r, i) => ({ ...r, no: i + 1 }));
        const hasRecords = finalRecords.length > 0;
        const malaysiaCourtSummary = hasRecords
          ? `${finalRecords.length} court judgment(s) matching candidate "${candidateName}" found in Portal eJudgment Malaysia`
          : `Verified Clear: Zero matching adverse court judgments or records identified in Portal eJudgment Malaysia for "${candidateName}"`;

        const updateDoc: Record<string, any> = {
          malaysiaCourtResults: finalRecords,
          malaysiaCourtSummary,
          malaysiaCourtStatus: "completed",
          malaysiaCourtHasRecords: hasRecords,
          malaysiaCourtTotalResults: finalRecords.length,
          malaysiaCourtTotalAvailable: finalRecords.length,
          malaysiaCourtCompletedAt: new Date().toISOString(),
          status: hasRecords ? "Needs Attention" : "Completed",
          notes: malaysiaCourtSummary,
          reportDetails: malaysiaCourtSummary,
        };

        const attemptLog = {
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
          verifier: "System (Portal eJudgment Gateway)",
          status: hasRecords ? "Discrepancy" : "Verified",
          notes: `${malaysiaCourtSummary} (Official eJudgment Kehakiman API Gateway)`,
        };

        await db.collection("verifications").updateOne(
          { id: verificationId },
          {
            $set: updateDoc,
            $push: { attempts: attemptLog as any },
          }
        );

        console.log(`[MY-COURT] Verification ${verificationId} completed: ${records.length} records found`);

        return NextResponse.json({
          success: true,
          totalCount: finalRecords.length,
          recordsReturned: finalRecords.length,
          hasRecords,
          summary: malaysiaCourtSummary,
          records: finalRecords,
        });
      } catch (err: any) {
        lastError = err;
        console.error(`[MY-COURT] Error on attempt ${attempt}:`, err.message);
      }
    }

    // All retries exhausted — mark as error (do NOT silently report as clean)
    const errorMessage = lastError?.message || "Unknown connectivity issue";
    const failSummary = `Malaysia Court search encountered an issue: ${errorMessage}. Unable to confirm clean record.`;
    await db.collection("verifications").updateOne(
      { id: verificationId },
      {
        $set: {
          malaysiaCourtStatus: "error",
          malaysiaCourtSummary: failSummary,
          malaysiaCourtResults: [],
          malaysiaCourtHasRecords: false,
          malaysiaCourtTotalResults: 0,
          malaysiaCourtTotalAvailable: 0,
          malaysiaCourtCompletedAt: new Date().toISOString(),
          status: "Halted",
          notes: failSummary,
          reportDetails: failSummary,
        },
        $push: {
          attempts: {
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
            verifier: "System (Portal eJudgment Gateway)",
            status: "Halted",
            notes: failSummary,
          } as any,
        },
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: `Search failed: ${errorMessage}`,
        summary: failSummary,
      },
      { status: 502 }
    );
  } catch (error: any) {
    console.error("[MY-COURT] Fatal search handler error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
