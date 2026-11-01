"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MatchedPost {
  author_alias: string;
  title: string | null;
  body: string;
  created_at: string;
}

interface CommentItem {
  id: string;
  anonymous_alias: string;
  body: string;
  created_at: string;
}

interface ThreadClientProps {
  thread: {
    id: string;
    cluster_id: string;
    title: string;
    preview_summary: string;
    match_reasoning: string | null;
    upvote_count: number;
    downvote_count: number;
    comment_count: number;
    published_at: string;
  };
  posts: MatchedPost[];
  initialComments: CommentItem[];
  userVote: number | null; // 1, -1, or null
  isLoggedIn: boolean;
}

export default function ThreadClient({
  thread,
  posts,
  initialComments,
  userVote: initialUserVote,
  isLoggedIn,
}: ThreadClientProps) {
  const router = useRouter();

  // Voting state
  const [upvotes, setUpvotes] = useState(thread.upvote_count);
  const [downvotes, setDownvotes] = useState(thread.downvote_count);
  const [currentUserVote, setCurrentUserVote] = useState<number | null>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);

  // Commenting state
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const score = upvotes - downvotes;

  const handleVote = async (value: 1 | -1) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread.id,
          value,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUpvotes(data.upvotes);
        setDownvotes(data.downvotes);
        setCurrentUserVote(value);
      }
    } catch (err) {
      console.error("Failed to vote:", err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (!commentBody.trim()) return;

    setSubmittingComment(true);
    setCommentError(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread.id,
          body: commentBody.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment");
      }

      setComments((prev) => [...prev, data.comment]);
      setCommentBody("");
    } catch (err: any) {
      setCommentError(err.message || "Failed to submit comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-8 py-10 sm:py-16 space-y-10">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200/80">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-950 transition-colors"
        >
          <span>←</span> Back to Community Feed
        </Link>
        <span className="text-xs text-gray-400 font-mono">
          Published {new Date(thread.published_at).toLocaleDateString()}
        </span>
      </div>

      {/* Main Thread Header Card */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/90 p-8 sm:p-10 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-800 font-semibold text-xs shadow-sm">
            <span>✦</span> Meta AI Verified Coincidence
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-800 font-semibold text-xs border border-blue-200/60">
            👥 {posts.length} Parallel Accounts
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200/60">
            🔒 Authors Consented
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950 font-serif leading-tight">
          {thread.title}
        </h1>

        <p className="text-base sm:text-lg text-gray-700 font-medium leading-relaxed bg-amber-50/50 p-5 rounded-2xl border border-amber-200/40">
          &ldquo;{thread.preview_summary}&rdquo;
        </p>

        {thread.match_reasoning && (
          <div className="rounded-2xl bg-gray-50/80 border border-gray-200/80 p-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Meta AI Match Analysis
            </span>
            <p className="text-xs text-gray-700 leading-relaxed">
              {thread.match_reasoning}
            </p>
          </div>
        )}

        {/* Voting & Engagement Row */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote(1)}
              disabled={isVoting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                currentUserVote === 1
                  ? "bg-orange-500 text-white shadow-orange-200"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-orange-50 hover:text-orange-600"
              }`}
              title="Upvote this verified coincidence"
            >
              <span>▲</span>
              <span>{upvotes}</span>
            </button>

            <span className="text-sm font-bold text-gray-950 font-mono px-1">
              {score > 0 ? `+${score}` : score}
            </span>

            <button
              onClick={() => handleVote(-1)}
              disabled={isVoting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                currentUserVote === -1
                  ? "bg-gray-800 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
              title="Downvote"
            >
              <span>▼</span>
              <span>{downvotes}</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <span>💬</span>
            <span>{comments.length} anonymous comments</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Parallel Experiences */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-950 font-serif">
            Parallel Author Accounts
          </h2>
          <span className="text-xs text-gray-500">
            Both authors independently documented this anomaly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post, idx) => (
            <div
              key={idx}
              className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/90 p-6 sm:p-7 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-950 text-white flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-gray-950 font-serif">
                      {post.author_alias || `Author #${idx + 1}`}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>

                {post.title && (
                  <h3 className="text-base font-bold text-gray-950 font-serif">
                    {post.title}
                  </h3>
                )}

                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {post.body}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <span>Identity protected</span>
                <span className="text-emerald-700 font-semibold">✓ Consented to publish</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <div className="space-y-6 pt-6 border-t border-gray-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-950 font-serif">
            Community Discussion ({comments.length})
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Every user is assigned an anonymous, thread-consistent alias (e.g. Echoer_482) to protect privacy.
          </p>
        </div>

        {/* Comment Form */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/90 p-6 shadow-sm">
          {isLoggedIn ? (
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              {commentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {commentError}
                </div>
              )}
              <textarea
                required
                rows={3}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Share your perspective or ask a question about this coincidence..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 p-4 text-xs sm:text-sm text-gray-950 focus:border-gray-950 focus:bg-white focus:outline-none transition-all placeholder:text-gray-400 resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Your identity stays anonymous in this thread.
                </span>
                <button
                  type="submit"
                  disabled={submittingComment || !commentBody.trim()}
                  className="px-5 py-2.5 rounded-full bg-gray-950 hover:bg-black text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  {submittingComment ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-gray-500">
                Log in to join the anonymous discussion on this thread.
              </p>
              <Link
                href="/login"
                className="inline-block px-5 py-2 rounded-full bg-gray-950 text-white text-xs font-semibold hover:bg-black shadow-sm"
              >
                Log In to Comment
              </Link>
            </div>
          )}
        </div>

        {/* Comments List */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-400">
              No comments yet. Be the first to share your thoughts on this coincidence!
            </div>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-white/70 border border-gray-100 p-4 sm:p-5 space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900 font-serif">
                    {c.anonymous_alias}
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {c.body}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
