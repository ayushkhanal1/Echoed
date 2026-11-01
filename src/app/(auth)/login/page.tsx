"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const verified = searchParams.get("verified");
    const prefillEmail = searchParams.get("email");

    if (prefillEmail) {
      setEmail(prefillEmail);
    }
    if (verified === "true") {
      setSuccessMsg("Email verified! Enter your password to access your dashboard.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      window.dispatchEvent(new Event("auth-change"));
      window.location.href = "/feed";
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 p-5 sm:p-10 shadow-xl shadow-gray-200/50">
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
          <span>✦</span> Secure Member Access
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950 font-serif">
          Welcome back
        </h2>
        <p className="mt-1.5 text-sm text-gray-500 max-w-sm mx-auto">
          Sign in to view your private submissions, check match notifications, and explore threads.
        </p>
      </div>

      {/* Error / Success Feedback */}
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

      <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
            placeholder="••••••••"
            className="w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950/5 transition-all shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gray-950 hover:bg-black py-3.5 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-40 cursor-pointer mt-2"
        >
          {loading ? "Signing in..." : "Sign In →"}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-gray-500 mt-8 pt-6 border-t border-gray-100">
        Don&apos;t have an account yet?{" "}
        <Link
          href="/signup"
          className="text-gray-950 hover:underline font-semibold"
        >
          Create one for free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
