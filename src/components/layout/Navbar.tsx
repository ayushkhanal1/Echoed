"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

interface UserProfile {
  id: string;
  cognitoSub: string;
  email: string;
  displayName: string | null;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setUnreadCount(data.unreadCount || 0);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch auth on initial load and whenever pathname changes
  useEffect(() => {
    fetchAuth();
  }, [pathname]);

  // Listen for custom auth events triggered by login/signup/logout
  useEffect(() => {
    const handleAuthChange = () => fetchAuth();
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  // When visiting notifications, immediately clear the badge
  useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadCount(0);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.dispatchEvent(new Event("auth-change"));
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* ============================================================ */}
      {/* TOP DESKTOP & MOBILE HEADER */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200/60 transition-all">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-3 sm:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white border border-gray-200/80 p-1 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
              <Image
                src="/logo-icon.jpg"
                alt="Echoed Logo Icon"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-950 font-serif">
              Echoed
            </span>
          </Link>

          {/* Desktop Center Navigation Links (Preserved 100% on PC) */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                <Link
                  href="/feed"
                  className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    isActive("/feed")
                      ? "bg-gray-950 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                  }`}
                >
                  📰 Home Feed
                </Link>
                <Link
                  href="/submit"
                  className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    isActive("/submit")
                      ? "bg-gray-950 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                  }`}
                >
                  ✍️ Add Post
                </Link>
                <Link
                  href="/notifications"
                  className={`relative px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    isActive("/notifications")
                      ? "bg-gray-950 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                  }`}
                >
                  <span>🔔 Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    isActive("/profile")
                      ? "bg-gray-950 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                  }`}
                >
                  👤 Profile
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                <Link
                  href="/how-it-works"
                  className="hover:text-gray-950 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
                >
                  How it Works
                </Link>
                <span className="text-gray-300">•</span>
                <Link
                  href="/feed"
                  className="hover:text-gray-950 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
                >
                  Browse Global Feed
                </Link>
              </div>
            )}
          </nav>

          {/* Right Header Controls (Theme Toggle & Compact Mobile Actions) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {loading ? (
              <div className="h-8 sm:h-9 w-20 sm:w-24 bg-gray-200/60 rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/profile"
                  className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-full shadow-sm hover:border-gray-300"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{user.displayName || user.email.split("@")[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-gray-500 hover:text-rose-600 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-200/80 hover:bg-rose-50 hover:border-rose-200 transition-all"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-3">
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-950 px-2.5 sm:px-3 py-1.5 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-3.5 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-gray-950 hover:bg-black rounded-full transition-all shadow-sm"
                >
                  <span>Sign Up</span>
                  <span className="hidden sm:inline">&nbsp;— Free</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Phone-Only 4 Main Pages Tab Bar) */}
      {/* ============================================================ */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-gray-200/90 shadow-[0_-6px_25px_rgba(0,0,0,0.08)] px-1 py-1.5"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {user ? (
            <>
              {/* 1. Home Feed */}
              <Link
                href="/feed"
                className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-2xl transition-all ${
                  isActive("/feed")
                    ? "text-orange-600 font-bold scale-105"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                <span className="text-lg">📰</span>
                <span className="text-[10px] tracking-tight mt-0.5">Feed</span>
              </Link>

              {/* 2. Add Post */}
              <Link
                href="/submit"
                className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-2xl transition-all ${
                  isActive("/submit")
                    ? "text-orange-600 font-bold scale-105"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                <span className="text-lg">✍️</span>
                <span className="text-[10px] tracking-tight mt-0.5">Add Post</span>
              </Link>

              {/* 3. Notifications */}
              <Link
                href="/notifications"
                className={`relative flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-2xl transition-all ${
                  isActive("/notifications")
                    ? "text-orange-600 font-bold scale-105"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                <div className="relative">
                  <span className="text-lg">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[9px] font-bold leading-none shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">Alerts</span>
              </Link>

              {/* 4. Profile */}
              <Link
                href="/profile"
                className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-2xl transition-all ${
                  isActive("/profile")
                    ? "text-orange-600 font-bold scale-105"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                <span className="text-lg">👤</span>
                <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
              </Link>
            </>
          ) : (
            <>
              {/* Unauthenticated Visitor Tabs */}
              <Link
                href="/"
                className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-2xl transition-all ${
                  isActive("/")
                    ? "text-orange-600 font-bold scale-105"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                <span className="text-lg">🏠</span>
                <span className="text-[10px] tracking-tight mt-0.5">Home</span>
              </Link>

              <Link
                href="/feed"
                className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-2xl transition-all ${
                  isActive("/feed")
                    ? "text-orange-600 font-bold scale-105"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                <span className="text-lg">📰</span>
                <span className="text-[10px] tracking-tight mt-0.5">Feed</span>
              </Link>

              <Link
                href="/how-it-works"
                className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-2xl transition-all ${
                  isActive("/how-it-works")
                    ? "text-orange-600 font-bold scale-105"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                <span className="text-lg">📖</span>
                <span className="text-[10px] tracking-tight mt-0.5">How it Works</span>
              </Link>

              <Link
                href="/login"
                className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-2xl transition-all ${
                  isActive("/login")
                    ? "text-orange-600 font-bold scale-105"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                <span className="text-lg">🔑</span>
                <span className="text-[10px] tracking-tight mt-0.5">Log In</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
