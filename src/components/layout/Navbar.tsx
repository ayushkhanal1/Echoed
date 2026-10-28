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

  // Initial load: fetch user & unread count once
  useEffect(() => {
    fetchAuth();
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
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200/60 transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-white border border-gray-200/80 p-1 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
            <Image
              src="/logo-icon.jpg"
              alt="Echoed Logo Icon"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-950 font-serif">
            Echoed
          </span>
        </Link>

        {/* Center Navigation Links */}
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

        {/* Right CTA Actions & Theme Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle />

          {loading ? (
            <div className="h-9 w-24 bg-gray-200/60 rounded-full animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-full shadow-sm hover:border-gray-300"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{user.displayName || user.email.split("@")[0]}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-gray-500 hover:text-rose-600 px-3 py-1.5 rounded-full hover:bg-rose-50 transition-all"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-gray-700 hover:text-gray-950 px-3 py-2 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-gray-950 hover:bg-black rounded-full transition-all shadow-sm hover:shadow"
              >
                Get Started — It&apos;s Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
