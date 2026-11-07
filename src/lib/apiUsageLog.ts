/**
 * API Usage Logging Utility
 * 
 * Logs every external API call to the `api_usage_logs` collection
 * for billing and auditing purposes.
 */

type Db = any;

export interface ApiUsageLogEntry {
  orgId: string;
  orgName: string;
  apiKeyId: string;
  keySuffix: string;
  endpoint: string;
  checkType: string;
  method: string;
  statusCode: number;
  cost: number;
  currency: string;
  ipAddress: string;
  requestId: string;
  timestamp: Date;
  responseTimeMs: number;
  errorMessage?: string;
}

/**
 * Log an API usage event. Fire-and-forget — errors are caught and logged.
 */
export async function logApiUsage(db: Db, entry: ApiUsageLogEntry): Promise<void> {
  try {
    await db.collection("api_usage_logs").insertOne({
      ...entry,
      timestamp: entry.timestamp || new Date(),
    });
  } catch (error) {
    console.error("[API_USAGE] Failed to log API usage:", error);
  }
}

/**
 * Get usage summary for an organisation for a given month/year.
 * Returns total calls, total cost, and breakdown by check type.
 */
export async function getOrgUsageSummary(
  db: Db,
  orgId: string,
  month: number, // 0-indexed (January = 0)
  year: number
): Promise<{
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  totalCost: number;
  currency: string;
  byCheckType: Array<{
    checkType: string;
    calls: number;
    successCalls: number;
    cost: number;
  }>;
}> {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 1);

  const pipeline = [
    {
      $match: {
        orgId,
        timestamp: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: "$checkType",
        calls: { $sum: 1 },
        successCalls: {
          $sum: { $cond: [{ $lt: ["$statusCode", 400] }, 1, 0] },
        },
        cost: { $sum: "$cost" },
        currency: { $first: "$currency" },
      },
    },
    { $sort: { calls: -1 as const } },
  ];

  const results = await db.collection("api_usage_logs").aggregate(pipeline).toArray();

  const totalCalls = results.reduce((sum: number, r: any) => sum + r.calls, 0);
  const successCalls = results.reduce((sum: number, r: any) => sum + r.successCalls, 0);
  const totalCost = results.reduce((sum: number, r: any) => sum + r.cost, 0);
  const currency = results.length > 0 ? results[0].currency : "USD";

  return {
    totalCalls,
    successCalls,
    failedCalls: totalCalls - successCalls,
    totalCost,
    currency,
    byCheckType: results.map((r: any) => ({
      checkType: r._id,
      calls: r.calls,
      successCalls: r.successCalls,
      cost: r.cost,
    })),
  };
}

/**
 * Get global usage summary across all organisations (for admin dashboard).
 */
export async function getGlobalUsageSummary(
  db: Db,
  month: number,
  year: number
): Promise<{
  totalCalls: number;
  totalCost: number;
  byOrg: Array<{
    orgId: string;
    orgName: string;
    calls: number;
    cost: number;
    currency: string;
  }>;
}> {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 1);

  const pipeline = [
    {
      $match: {
        timestamp: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: { orgId: "$orgId", orgName: "$orgName" },
        calls: { $sum: 1 },
        cost: { $sum: "$cost" },
        currency: { $first: "$currency" },
      },
    },
    { $sort: { calls: -1 as const } },
  ];

  const results = await db.collection("api_usage_logs").aggregate(pipeline).toArray();

  return {
    totalCalls: results.reduce((sum: number, r: any) => sum + r.calls, 0),
    totalCost: results.reduce((sum: number, r: any) => sum + r.cost, 0),
    byOrg: results.map((r: any) => ({
      orgId: r._id.orgId,
      orgName: r._id.orgName,
      calls: r.calls,
      cost: r.cost,
      currency: r.currency,
    })),
  };
}

/**
 * Get recent API usage logs for an organisation (paginated).
 */
export async function getOrgUsageLogs(
  db: Db,
  orgId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ logs: any[]; total: number }> {
  const skip = (page - 1) * limit;
  const filter = { orgId };

  const [logs, total] = await Promise.all([
    db.collection("api_usage_logs")
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("api_usage_logs").countDocuments(filter),
  ]);

  return {
    logs: logs.map((l: any) => ({ ...l, _id: l._id.toString() })),
    total,
  };
}

/**
 * Get all usage logs across all orgs (for admin, paginated).
 */
export async function getAllUsageLogs(
  db: Db,
  page: number = 1,
  limit: number = 50,
  orgFilter?: string
): Promise<{ logs: any[]; total: number }> {
  const skip = (page - 1) * limit;
  const filter: any = {};
  if (orgFilter) filter.orgId = orgFilter;

  const [logs, total] = await Promise.all([
    db.collection("api_usage_logs")
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("api_usage_logs").countDocuments(filter),
  ]);

  return {
    logs: logs.map((l: any) => ({ ...l, _id: l._id.toString() })),
    total,
  };
}
