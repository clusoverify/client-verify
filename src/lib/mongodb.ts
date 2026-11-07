/**
 * Cloudflare D1 Database Connector for verify (Client Portal)
 * Connects to remote D1 Database: cluso_verify (25a6cd38-46c3-47ab-8f06-756940ab3f65)
 */

import { connectToD1Database, D1Database, ObjectId } from "shared/d1Database";
import { validateEnvironment } from "./envGuard";

export { ObjectId };

let envValidated = false;

export async function connectToDatabase(): Promise<{ client: any; db: D1Database }> {
  const { db } = await connectToD1Database();

  if (!envValidated) {
    validateEnvironment();
    envValidated = true;
  }

  return { client: null, db };
}

export async function disconnectFromDatabase(): Promise<void> {
  // Cloudflare D1 uses stateless HTTP API / edge bindings
}
