"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INSPIRATION_EXAMPLES = [
  {
    title: "The Clock Stopped at 3:14 AM",
    description: "Every single night around mid-autumn, I wake up with the distinct feeling that someone spoke my name, only to look at my bedside clock and see it paused at 3:14 AM.",
  },
  {
    title: "The Kyoto Antique Postcard",
    description: "I was sitting in a small tea shop in Kyoto and found a vintage 1954 postcard tucked under the table with my grandmother's exact maiden name and childhood address.",
  },
  {
    title: "The Recurring Hidden Room",
    description: "Ever since childhood, I have dreams about entering a specific Victorian house with an oval door leading into a warm sunlit library I have never seen in waking life.",
  },
];

export default function SubmitClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const charCount = body.trim().length;
  const isMinimumMet = charCount >= 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMinimumMet) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit post");
      }

      setSuccess("Your experience has been securely saved to your private vault!");
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to submit experience");
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-8 py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-xs font-semibold text-orange-700 mb-3 shadow-sm">
          <span>✦</span> Add Private Post
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950 font-serif">
          Record a Unique Life Experience
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
          Describe an unusual coincidence, recurring dream, or personal phenomenon. 
          Your post is kept <strong>100% private by default</strong>.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/90 p-5 sm:p-8 shadow-sm space-y-6">
        {/* Privacy Highlight */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-800 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Vault Protected: Only matching AI will ever analyze this text.</span>
          </div>
          <Link href="/how-it-works" className="underline hover:text-emerald-950">
            Learn more
          </Link>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
            <span>✓</span>
            <span>{success} Redirecting to your profile...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Experience Title <span className="text-gray-400 font-normal">(short summary)</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Stranger with the Identical Pocket Watch"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950/5 transition-all shadow-sm font-medium"
            />
          </div>

          {/* Experience Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Detailed Description <span className="text-gray-400 font-normal">(how it happened, feelings, sensations)</span>
            </label>
            <textarea
              required
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe the experience in full detail. Where were you? What exact details made it feel like more than a normal occurrence? Describe the exact timeline, location, or physical details..."
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950/5 transition-all shadow-sm resize-none"
            />
            <div className="flex items-center justify-between text-xs text-gray-400 mt-2 px-1">
              <span>
                {isMinimumMet ? (
                  <span className="text-emerald-600 font-medium">
                    ✓ Ready for AI matching analysis
                  </span>
                ) : (
                  <span>Minimum 15 characters ({15 - charCount} more needed)</span>
                )}
              </span>
              <span>{charCount} / 5,000 characters</span>
            </div>
          </div>

          {/* Inspiration Chips */}
          <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Click to use an example:
            </span>
            <div className="flex flex-col gap-2">
              {INSPIRATION_EXAMPLES.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTitle(ex.title);
                    setBody(ex.description);
                  }}
                  className="text-left text-xs p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-all text-gray-700"
                >
                  <span className="font-semibold text-gray-950">{ex.title}: </span>
                  <span className="text-gray-500 line-clamp-1">{ex.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/profile"
              className="text-xs font-semibold text-gray-500 hover:text-gray-950"
            >
              ← Cancel & return to profile
            </Link>

            <button
              type="submit"
              disabled={loading || !isMinimumMet || !title.trim()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gray-950 hover:bg-black text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving to private vault...</span>
                </>
              ) : (
                <span>Save Experience Privately →</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
