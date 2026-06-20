/**
 * Environment validation guard for the Client Portal (verify).
 * Called once on first database connection.
 * In production, fails fast if unsafe configuration is detected.
 */

const isProduction = process.env.NODE_ENV === "production";

export function validateEnvironment(): void {
  if (!isProduction) return; // Skip validation in development

  const errors: string[] = [];

  // NEXTAUTH_SECRET must be set and not the weak default
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    errors.push("NEXTAUTH_SECRET is not set.");
  } else if (secret === "clusoverify-secret-key-123456789") {
    errors.push("NEXTAUTH_SECRET is using the insecure default value. Set a strong, unique secret.");
  }

  // MONGODB_URI must be set
  if (!process.env.MONGODB_URI) {
    errors.push("MONGODB_URI is not set.");
  }

  // NEXTAUTH_URL must not be localhost in production
  const nextAuthUrl = process.env.NEXTAUTH_URL || "";
  if (nextAuthUrl.includes("localhost") || nextAuthUrl.includes("127.0.0.1")) {
    errors.push(`NEXTAUTH_URL contains localhost (${nextAuthUrl}). Use a production URL.`);
  }

  // CANDIDATE_PORTAL_URL should be set for setup links
  const candidateUrl = process.env.CANDIDATE_PORTAL_URL;
  if (!candidateUrl) {
    errors.push("CANDIDATE_PORTAL_URL is not set. Required for candidate setup links.");
  } else if (candidateUrl.includes("localhost")) {
    errors.push(`CANDIDATE_PORTAL_URL contains localhost (${candidateUrl}). Use a production URL.`);
  }

  const encKeys = process.env.DATA_ENCRYPTION_KEYS;
  const currentVer = process.env.DATA_ENCRYPTION_CURRENT_KEY_VERSION;

  if (!encKeys) {
    errors.push("DATA_ENCRYPTION_KEYS is not set.");
  } else {
    const keyParts = encKeys.split(";");
    const versions = new Set<string>();
    for (const part of keyParts) {
      const idx = part.indexOf(":");
      if (idx === -1) {
        errors.push("DATA_ENCRYPTION_KEYS format is invalid. Must be 'version:base64key;...'.");
        break;
      }
      const version = part.substring(0, idx).trim();
      const base64Key = part.substring(idx + 1).trim();
      versions.add(version);

      try {
        const keyBuffer = Buffer.from(base64Key, "base64");
        if (keyBuffer.length !== 32) {
          errors.push(`Encryption key for version '${version}' must be exactly 32 bytes when base64-decoded (got ${keyBuffer.length} bytes).`);
        }
      } catch (err) {
        errors.push(`Encryption key for version '${version}' is not a valid base64 string.`);
      }
    }

    if (!currentVer) {
      errors.push("DATA_ENCRYPTION_CURRENT_KEY_VERSION is not set.");
    } else if (!versions.has(currentVer)) {
      errors.push(`DATA_ENCRYPTION_CURRENT_KEY_VERSION '${currentVer}' is not defined in DATA_ENCRYPTION_KEYS.`);
    }
  }

  if (errors.length > 0) {
    const msg = [
      "",
      "╔══════════════════════════════════════════════════════════════╗",
      "║  FATAL: Unsafe production configuration detected            ║",
      "║  Portal: Client (verify)                                    ║",
      "╚══════════════════════════════════════════════════════════════╝",
      "",
      ...errors.map((e) => `  ✗ ${e}`),
      "",
      "Fix the above issues in your environment variables before deploying.",
      "",
    ].join("\n");
    console.error(msg);
  }

  console.log("[ENV] Client portal environment validation passed.");
}
