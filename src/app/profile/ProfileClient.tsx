"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PostItem {
  id: string;
  title?: string | null;
  body: string;
  status: string;
  created_at: string;
  is_embedded: boolean;
}

interface MatchItem {
  membership_id: string;
  cluster_id: string;
  consent_status: string;
  author_alias?: string | null;
  matched_at: string;
  thread_title?: string | null;
  preview_summary?: string | null;
  match_reasoning?: string | null;
  cluster_status: string;
  thread_id?: string | null;
  upvote_count?: number;
  comment_count?: number;
}

interface ProfileProps {
  initialUser: {
    id: string;
    email: string;
    displayName: string;
  };
  unmatchedPosts: PostItem[];
  matchedThreads: MatchItem[];
}

export default function ProfileClient({
  initialUser,
  unmatchedPosts,
  matchedThreads,
}: ProfileProps) {
  const router = useRouter();

  // Username Editing States
  const [displayName, setDisplayName] = useState(initialUser.displayName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(initialUser.displayName);
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);

  // Active History Tab
  const [activeTab, setActiveTab] = useState<"unmatched" | "matched">("unmatched");

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setSavingName(true);
    setNameMsg(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: nameInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      setDisplayName(data.user.display_name);
      setIsEditingName(false);
      setNameMsg("Username updated!");
      setTimeout(() => setNameMsg(null), 3000);
      router.refresh();
    } catch (err: any) {
      setNameMsg(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-8 py-10 sm:py-14 space-y-10">
      {/* Profile Overview Card */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/90 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              {isEditingName ? (
                <form onSubmit={handleSaveUsername} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={30}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-950 focus:border-gray-950 focus:outline-none"
                    placeholder="Enter unique username"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={savingName}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-950 text-white text-xs font-semibold hover:bg-black disabled:opacity-50"
                  >
                    {savingName ? "..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setNameInput(displayName);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-500 hover:text-gray-950"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-gray-950 font-serif">
                    {displayName}
                  </h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                  >
                    ✎ Edit
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 font-medium">{initialUser.email}</p>
            </div>
          </div>

          {/* Quick Actions (How It Works + Logout) */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold border border-orange-200/60 transition-colors shadow-sm"
            >
              <span>📖</span> How it Works
            </Link>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-gray-200 hover:border-rose-200 hover:bg-rose-50 text-gray-600 hover:text-rose-700 text-xs font-semibold transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        {nameMsg && (
          <p className="mt-2 text-xs font-medium text-emerald-600">{nameMsg}</p>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
            <span className="text-xs text-gray-500 block">Total Private Stories</span>
            <span className="text-xl font-bold text-gray-950 font-serif">
              {unmatchedPosts.length}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
            <span className="text-xs text-gray-500 block">Matched Threads</span>
            <span className="text-xl font-bold text-orange-600 font-serif">
              {matchedThreads.length}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 col-span-2 sm:col-span-1">
            <span className="text-xs text-gray-500 block">Privacy Level</span>
            <span className="text-xs font-semibold text-emerald-700 mt-1 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              100% Anonymous Vault
            </span>
          </div>
        </div>
      </div>

      {/* Post History Tabs */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("unmatched")}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "unmatched"
                  ? "bg-gray-950 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-950 hover:bg-gray-100"
              }`}
            >
              ⏳ Awaiting Matches ({unmatchedPosts.length})
            </button>

            <button
              onClick={() => setActiveTab("matched")}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "matched"
                  ? "bg-gray-950 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-950 hover:bg-gray-100"
              }`}
            >
              ✨ Matched Threads ({matchedThreads.length})
            </button>
          </div>

          <Link
            href="/submit"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>+ Write New</span>
          </Link>
        </div>

        {/* Tab 1: Unmatched Posts */}
        {activeTab === "unmatched" && (
          <div className="space-y-4">
            {unmatchedPosts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white/50 p-10 text-center space-y-3">
                <span className="text-3xl block">✍️</span>
                <h4 className="text-base font-bold text-gray-950 font-serif">
                  No private experiences yet
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Share a coincidence, unusual pattern, or strange observation. It will be stored safely in your private vault while our vector engine searches for matches.
                </p>
                <Link
                  href="/submit"
                  className="inline-block mt-2 px-5 py-2.5 rounded-full bg-gray-950 text-white text-xs font-semibold hover:bg-black shadow-sm"
                >
                  Write Your First Story
                </Link>
              </div>
            ) : (
              unmatchedPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 p-6 shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                        🔒 100% Private
                      </span>
                      {post.is_embedded && (
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-800 font-medium border border-orange-200">
                          🧮 1024-dim Vector Indexed
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 font-mono text-[11px]">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {post.title && (
                    <h4 className="text-base font-bold text-gray-950 font-serif">
                      {post.title}
                    </h4>
                  )}

                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {post.body}
                  </p>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="text-orange-700 font-medium">
                      Status: Waiting for matching submissions from other authors
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Matched Threads */}
        {activeTab === "matched" && (
          <div className="space-y-4">
            {matchedThreads.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white/50 p-10 text-center space-y-3">
                <span className="text-3xl block">🔮</span>
                <h4 className="text-base font-bold text-gray-950 font-serif">
                  No matched threads yet
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  When another user submits an experience that matches yours and you both consent, your shared experience thread will appear here.
                </p>
              </div>
            ) : (
              matchedThreads.map((m) => (
                <div
                  key={m.membership_id}
                  className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/90 p-6 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold">
                      MATCH CONFIRMED
                    </span>
                    <span className="text-gray-400">
                      Matched {new Date(m.matched_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-gray-950 font-serif">
                    {m.thread_title || "Shared Experience Thread"}
                  </h4>

                  {m.preview_summary && (
                    <p className="text-xs sm:text-sm text-gray-600">
                      {m.preview_summary}
                    </p>
                  )}

                  {m.thread_id && (
                    <div className="pt-2 flex items-center justify-between">
                      <Link
                        href={`/thread/${m.thread_id}`}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700"
                      >
                        View Public Thread →
                      </Link>
                      <span className="text-xs text-gray-500">
                        👍 {m.upvote_count || 0} votes • 💬 {m.comment_count || 0} comments
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
