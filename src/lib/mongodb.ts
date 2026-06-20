import { MongoClient, Db } from "mongodb";
import bcrypt from "bcryptjs";
import dns from "dns";
import { validateEnvironment } from "./envGuard";

// Use Google DNS to resolve MongoDB Atlas SRV records
// (the default local DNS may not support SRV lookups)
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
  // Ignore — some serverless runtimes don't support dns.setServers
}


let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
let seeded = false;
let envValidated = false;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const uri = process.env.MONGODB_URI || "";
  if (!uri) {
    throw new Error("Please add your MongoDB URI to .env.local");
  }
  if (!client) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  const connectedClient = await clientPromise!;
  const db = connectedClient.db("clusoverify");

  // Validate environment on first connection
  if (!envValidated) {
    validateEnvironment();
    envValidated = true;
  }

  // Run automatic seeding only in development with explicit opt-in
  if (!seeded) {
    if (process.env.NODE_ENV !== "production" && process.env.ALLOW_SEEDING === "true") {
      await seedDatabase(db);
    }
    seeded = true;
  }

  return { client: connectedClient, db };
}

export async function disconnectFromDatabase(): Promise<void> {
  if (client) {
    try {
      await client.close();
    } catch (e) {
      console.error("[MongoDB] Error closing connection:", e);
    }
  }
  client = null;
  clientPromise = null;
  seeded = false;
  envValidated = false;
}



async function seedDatabase(db: Db) {
  try {
    // Check if database is already seeded by checking users count
    const existingUsersCount = await db.collection("users").countDocuments();
    if (existingUsersCount > 0) {
      return;
    }

    const hashedAdminPassword = bcrypt.hashSync("Cluso@2026", 10);
    await db.collection("users").insertMany([
      {
        email: "admin@cluso.in",
        password: hashedAdminPassword,
        fullName: "Admin User",
        role: "admin",
        orgName: "Cluso",
        createdAt: new Date()
      },
      {
        email: "pkumar@cluso.in",
        password: hashedAdminPassword,
        fullName: "P Kumar",
        role: "admin",
        orgName: "Cluso",
        createdAt: new Date()
      },
      {
        email: "indiaops@cluso.in",
        password: hashedAdminPassword,
        fullName: "India Ops",
        role: "admin",
        orgName: "Cluso",
        createdAt: new Date()
      }
    ]);
  } catch (error) {
    console.error("Seeding error in MongoDB:", error);
  }
}
