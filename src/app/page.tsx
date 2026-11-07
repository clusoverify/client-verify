"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "src/context/AuthContext";
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle 
} from "lucide-react";
import OzcluLogo from "./components/OzcluLogo";

export default function ClientLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/client/identity-verification");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await login(email, password);
      router.push("/client/identity-verification");
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-on-background items-center justify-center">
        <div className="animate-pulse font-body-sm text-secondary font-semibold">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f6fbf0] text-[#181d16]">
      {/* Top Header */}
      <header className="h-16 border-b border-[#f0f5ea] bg-white flex justify-between items-center px-8 z-10 shadow-2xs">
        <div className="flex items-center gap-2">
          <Link href="/" className="block transition-transform duration-300 hover:scale-[1.03] select-none">
            <OzcluLogo size="md" />
          </Link>
        </div>
        <div>
          <span className="font-label-caps text-[#00450e] uppercase tracking-wider text-xs font-bold">Client Link</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Background Decorative Blur */}
        <div className="absolute -right-32 top-10 w-96 h-96 bg-[#eaf0e4]/20 opacity-40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-32 bottom-10 w-96 h-96 bg-[#f0f5ea]/30 opacity-40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-white border border-[#eaf0e4] rounded-3xl p-8 shadow-sm z-10 transition-all duration-300 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#eaf0e4] to-[#f0f5ea]"></div>

          <div className="text-center mb-8 relative z-10 flex flex-col items-center">
            <div className="mb-4 select-none">
              <OzcluLogo size="lg" />
            </div>
            <p className="font-body-lg text-secondary text-sm text-slate-500 font-semibold">
              Initiate and monitor candidate identity checks.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 bg-red-50 text-red-850 border border-red-200 rounded-xl p-3.5 font-body-sm flex items-center gap-2 relative z-10 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold text-xs">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4 relative z-10">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[#475569] text-xs font-bold uppercase tracking-wider" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-[#eaf0e4] rounded-xl p-3 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-shadow bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold"
                placeholder="Enter your email address"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-[#475569] text-xs font-bold uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[#eaf0e4] rounded-xl p-3 pr-10 font-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-[#eaf0e4] focus:border-[#181d16] transition-shadow bg-[#f6fbf0]/50 placeholder-slate-400 font-semibold"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#475569] hover:text-[#181d16] transition-colors flex items-center justify-center p-1 cursor-pointer focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 py-3 bg-[#181d16] text-white rounded-xl font-semibold text-sm hover:bg-[#1E293B] active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="animate-pulse">Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-[#f0f5ea] bg-white flex justify-center items-center font-body-sm text-slate-500 text-xs font-semibold">
        <span>&copy; {new Date().getFullYear()} Cluso Infolink. Client Link.</span>
      </footer>
    </div>
  );
}
