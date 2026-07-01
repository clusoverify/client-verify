import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  requireRole,
  isErrorResponse,
} from "src/lib/apiAuth";
import { connectToDatabase } from "src/lib/mongodb";
import bcrypt from "bcryptjs";
import { getClientIp, getUserAgent, logAuditEvent } from "shared/audit";
import { checkRateLimit, RATE_LIMITS } from "shared/rateLimit";

export async function POST(req: NextRequest) {
  try {
    // ── Auth: require authenticated client session ──
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { user } = authResult;

    const roleError = requireRole(user, ["client", "org_owner"]);
    if (roleError) return roleError;

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required password fields" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const email = user.email;

    if (!email) {
      return NextResponse.json({ error: "No email associated with session" }, { status: 400 });
    }

    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Rate Limit: 5 attempts per 15 minutes per key
    const rateLimitKey = `password_change:${ip}:${email.toLowerCase().trim()}`;
    const limitCheck = await checkRateLimit(db, rateLimitKey, RATE_LIMITS.PASSWORD_CHANGE.maxAttempts, RATE_LIMITS.PASSWORD_CHANGE.windowMs);
    if (!limitCheck.allowed) {
      await logAuditEvent(db, {
        actorUserId: user.id,
        actorEmail: email,
        actorRole: user.role,
        portal: "client",
        action: "rate_limit_hit",
        outcome: "failure",
        reason: "Password change rate limit exceeded",
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Too many password change attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((limitCheck.retryAfterMs || 0) / 1000).toString(),
          },
        }
      );
    }

    const dbUser = await db.collection("users").findOne({ email: email.toLowerCase().trim() });
    if (!dbUser) {
      await logAuditEvent(db, {
        actorUserId: user.id,
        actorEmail: email,
        actorRole: user.role,
        portal: "client",
        action: "password_change_failure",
        outcome: "failure",
        reason: "User not found in DB",
        ip,
        userAgent,
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPasswordValid = bcrypt.compareSync(currentPassword, dbUser.password);
    if (!isPasswordValid) {
      await logAuditEvent(db, {
        actorUserId: user.id,
        actorEmail: email,
        actorRole: user.role,
        portal: "client",
        action: "password_change_failure",
        outcome: "failure",
        reason: "Incorrect current password",
        ip,
        userAgent,
      });
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    }

    const newHashedPassword = bcrypt.hashSync(newPassword, 10);
    await db.collection("users").updateOne(
      { email: email.toLowerCase().trim() },
      { $set: { password: newHashedPassword } }
    );

    await logAuditEvent(db, {
      actorUserId: user.id,
      actorEmail: email,
      actorRole: user.role,
      portal: "client",
      action: "password_change_success",
      outcome: "success",
      ip,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[AUTH] Change password error:", error.message);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
