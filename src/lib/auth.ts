import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "./mongodb";
import bcrypt from "bcryptjs";
import { logAuthEvent } from "shared/audit";
import { isAccountLocked, recordFailedLogin, resetLoginFailures } from "shared/rateLimit";

const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "production") {
  console.error(
    "\n[FATAL] NEXTAUTH_SECRET is not set!\n" +
    "NextAuth requires an explicit secret in production.\n" +
    "Set NEXTAUTH_SECRET in your Vercel Environment Variables and redeploy.\n"
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const { db } = await connectToDatabase();
        const email = credentials.email.toLowerCase().trim();

        // Extract IP and user-agent for audit/rate-limit
        const ip = (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim()
          || (req?.headers?.["x-real-ip"] as string)
          || "unknown";
        const userAgent = (req?.headers?.["user-agent"] as string) || "unknown";

        // Check account lockout
        const locked = await isAccountLocked(db, email);
        if (locked) {
          await logAuthEvent(db, {
            email,
            portal: "client",
            action: "login_lockout",
            outcome: "failure",
            reason: "Account temporarily locked due to too many failed attempts",
            ip,
            userAgent,
          });
          throw new Error("Account temporarily locked. Please try again later.");
        }

        const user = await db.collection("users").findOne({ email, isDeleted: { $ne: true } });

        if (!user) {
          await logAuthEvent(db, {
            email,
            portal: "client",
            action: "login_failure",
            outcome: "failure",
            reason: "User not found or deleted",
            ip,
            userAgent,
          });
          throw new Error("No user found with this email");
        }

        if (user.role === "client") {
          const orgName = user.orgName || "";
          const org = await db.collection("organisations").findOne({
            name: orgName,
            isDeleted: { $ne: true }
          });
          if (!org) {
            await logAuthEvent(db, {
              email,
              portal: "client",
              action: "login_failure",
              outcome: "failure",
              reason: "Organisation has been deleted",
              ip,
              userAgent,
              userId: user._id.toString(),
              role: user.role,
            });
            throw new Error("Your organisation account has been deleted.");
          }
          if (org.status === "Deactivated") {
            await logAuthEvent(db, {
              email,
              portal: "client",
              action: "login_failure",
              outcome: "failure",
              reason: "Organisation has been deactivated",
              ip,
              userAgent,
              userId: user._id.toString(),
              role: user.role,
            });
            throw new Error("Your organisation has been deactivated. Please contact support.");
          }
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          const { locked: nowLocked } = await recordFailedLogin(db, email);
          await logAuthEvent(db, {
            email,
            portal: "client",
            action: nowLocked ? "login_lockout" : "login_failure",
            outcome: "failure",
            reason: nowLocked ? "Account locked after too many failed attempts" : "Incorrect password",
            ip,
            userAgent,
            userId: user._id.toString(),
            role: user.role,
          });
          throw new Error("Incorrect password");
        }

        // Enforce client-only access — deny admin and candidate accounts
        if (user.role !== "client") {
          await logAuthEvent(db, {
            email,
            portal: "client",
            action: "login_failure",
            outcome: "failure",
            reason: `Role mismatch: ${user.role}`,
            ip,
            userAgent,
            userId: user._id.toString(),
            role: user.role,
          });
          throw new Error("Access denied. This portal is for client accounts only.");
        }

        // Successful login — reset failure counters
        await resetLoginFailures(db, email);

        await logAuthEvent(db, {
          email,
          portal: "client",
          action: "login_success",
          outcome: "success",
          ip,
          userAgent,
          userId: user._id.toString(),
          role: user.role,
        });

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.fullName,
          role: user.role,
          orgName: user.orgName || ""
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.orgName = (user as any).orgName;
        token.fullName = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).orgName = token.orgName;
        (session.user as any).fullName = token.fullName;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token.client`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET!,
  pages: {
    signIn: "/"
  }
};
