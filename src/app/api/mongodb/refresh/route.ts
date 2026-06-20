import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "src/lib/apiAuth";
import { disconnectFromDatabase, connectToDatabase } from "src/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) {
      return authResult;
    }

    // Reset MongoDB connection cached client & promise
    await disconnectFromDatabase();

    // Attempt immediately to establish a fresh connection to verify correctness
    const { db } = await connectToDatabase();
    const pingResult = await db.command({ ping: 1 });

    return NextResponse.json({
      success: true,
      message: "MongoDB connection successfully refreshed and re-established.",
      ping: pingResult,
    });
  } catch (error: any) {
    console.error("[MongoDB Refresh API] Error resetting connection:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset and connect to MongoDB" },
      { status: 500 }
    );
  }
}
