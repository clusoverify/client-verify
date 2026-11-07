/**
 * Cloudflare D1 & R2 Shared Client Module for Cluso Infolink
 *
 * Target Database: cluso_verify (25a6cd38-46c3-47ab-8f06-756940ab3f65)
 * Account ID: 0851f9cef2be46ddf76f2e44d5b24b3f
 *
 * NOTE: getCloudflareConfig() is a function (not a const) so that env vars are
 * read lazily at call-time — after Next.js / Node has loaded .env.local — rather
 * than at module-import time when process.env may still be empty.
 */

export function getCloudflareConfig() {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
    d1DatabaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || "",
    apiToken: process.env.CLOUDFLARE_API_TOKEN || "",
    r2: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || "",
    },
  };
}

/** @deprecated Use getCloudflareConfig() instead. Kept for backward compatibility. */
export const CLOUDFLARE_CONFIG = new Proxy({} as ReturnType<typeof getCloudflareConfig>, {
  get(_target, prop: string) {
    const cfg = getCloudflareConfig();
    return cfg[prop as keyof typeof cfg];
  },
});

/**
 * Execute a SQL query directly against the remote Cloudflare D1 database.
 */
export async function queryD1<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const { accountId, d1DatabaseId, apiToken } = getCloudflareConfig();
  if (!accountId || !d1DatabaseId || !apiToken) {
    throw new Error(
      "Missing Cloudflare D1 environment variables. Please add CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN in your Vercel Project Settings."
    );
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${d1DatabaseId}/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare D1 Query Failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(`D1 Error: ${JSON.stringify(json.errors)}`);
  }

  const firstResult = json.result?.[0];
  return (firstResult?.results || []) as T[];
}

/**
 * Execute multiple batch statements against Cloudflare D1.
 */
export async function batchD1(statements: { sql: string; params?: any[] }[]): Promise<any> {
  const { accountId, d1DatabaseId, apiToken } = getCloudflareConfig();
  if (!accountId || !d1DatabaseId || !apiToken) {
    throw new Error(
      "Missing Cloudflare D1 environment variables. Please add CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN in your Vercel Project Settings."
    );
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${d1DatabaseId}/query`;

  // D1 API accepts raw SQL containing multiple statements or individual execution
  const sql = statements.map(s => s.sql.trim().endsWith(";") ? s.sql : `${s.sql};`).join("\n");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare D1 Batch Failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  return json.result;
}
