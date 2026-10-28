"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "confirm">("register");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live Password Criteria Verification
  const requirements = useMemo<PasswordRequirement[]>(() => {
    return [
      {
        id: "length",
        label: "At least 8 characters",
        met: password.length >= 8,
      },
      {
        id: "uppercase",
        label: "One uppercase letter (A-Z)",
        met: /[A-Z]/.test(password),
      },
      {
        id: "lowercase",
        label: "One lowercase letter (a-z)",
        met: /[a-z]/.test(password),
      },
      {
        id: "number",
        label: "At least one number (0-9)",
        met: /[0-9]/.test(password),
      },
      {
        id: "special",
        label: "One special character (!@#$%^&*)",
        met: /[^A-Za-z0-9]/.test(password),
      },
    ];
  }, [password]);

  const metCount = requirements.filter((r) => r.met).length;
  const isPasswordValid = metCount === requirements.length;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Strength score
  const strengthColor =
    metCount <= 2
      ? "bg-rose-500"
      : metCount <= 4
      ? "bg-amber-500"
      : "bg-emerald-500";
  const strengthLabel =
    metCount === 0
      ? ""
      : metCount <= 2
      ? "Weak"
      : metCount <= 4
      ? "Medium"
      : "Strong & Secure";

  // Handle Initial Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError("Please ensure your password meets all required criteria.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccessMsg("Verification code sent to your email!");
      setStep("confirm");
    } catch (err: any) {
      setError(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  // Handle Confirmation Code Verification
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid confirmation code");
      }

      router.push(`/login?verified=true&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend code");

      setSuccessMsg("A new verification code has been sent.");
    } catch (err: any) {
      setError(err.message || "Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 p-8 sm:p-10 shadow-xl shadow-gray-200/50">
        {/* Header with official logo */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-3 hover:opacity-90 transition-opacity">
            <Image
              src="/logo.jpg"
              alt="Echoed Official Logo"
              width={160}
              height={90}
              className="h-14 w-auto object-contain mx-auto"
              priority
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-xs font-semibold text-orange-700 mb-3 shadow-sm">
            <span>✦</span> Discover Shared Human Experiences
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950 font-serif">
            {step === "register" ? "Create your account" : "Verify your email"}
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 max-w-sm mx-auto">
            {step === "register"
              ? "Your experiences remain 100% private until matched and you consent to publish."
              : `Enter the 6-digit verification code sent to ${email}`}
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 1: Registration Form with Live Criteria Checkup */}
        {step === "register" && (
          <form onSubmit={handleRegister} className="mt-8 space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950/5 transition-all shadow-sm"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-gray-500 hover:text-gray-950 transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950/5 transition-all shadow-sm"
              />

              {/* Strength Progress Bar */}
              {password.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-gray-500">Strength:</span>
                    <span
                      className={
                        metCount <= 2
                          ? "text-rose-600"
                          : metCount <= 4
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }
                    >
                      {strengthLabel}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${strengthColor}`}
                      style={{ width: `${(metCount / requirements.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* LIVE CRITERIA CHECKUP LIST */}
              <div className="mt-4 rounded-2xl bg-gray-50/80 border border-gray-200/70 p-3.5 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                  Password Requirements
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {requirements.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-2 text-xs transition-colors duration-200"
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          req.met
                            ? "bg-emerald-500 text-white scale-105"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {req.met ? "✓" : "•"}
                      </div>
                      <span
                        className={
                          req.met
                            ? "text-gray-900 font-medium"
                            : "text-gray-500"
                        }
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950/5 transition-all shadow-sm"
              />
              {confirmPassword.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  {passwordsMatch ? (
                    <>
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="text-emerald-700 font-medium">
                        Passwords match
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-rose-500 font-bold">✕</span>
                      <span className="text-rose-600 font-medium">
                        Passwords do not match
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="w-full rounded-full bg-gray-950 hover:bg-black py-3.5 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:hover:bg-gray-950 cursor-pointer disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Creating your account..." : "Create Account →"}
            </button>
          </form>
        )}

        {/* Step 2: 6-Digit Confirmation Code Form */}
        {step === "confirm" && (
          <form onSubmit={handleConfirm} className="mt-8 space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-[0.4em] text-2xl font-mono rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950/5 shadow-sm transition-all"
              />
              <p className="mt-2 text-center text-xs text-gray-500">
                Check your spam folder if you do not see it within a minute.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.trim().length !== 6}
              className="w-full rounded-full bg-gray-950 hover:bg-black py-3.5 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-40"
            >
              {loading ? "Verifying..." : "Confirm & Continue →"}
            </button>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep("register")}
                className="hover:text-gray-950 font-medium transition-colors"
              >
                ← Edit email address
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8 pt-6 border-t border-gray-100">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-gray-950 hover:underline font-semibold"
          >
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
