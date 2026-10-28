"use client";

import { useState } from "react";

interface SubmitFormProps {
  onSubmitted: () => void;
}

const EXAMPLE_PROMPTS = [
  "I keep dreaming about a house with an extra hidden room that feels oddly familiar.",
  "Met a stranger on a delayed flight who had the exact same unusual birthmark in the exact same spot.",
  "Woke up at 3:17 AM feeling someone was calling my name, only to find my clock stopped.",
];

export default function SubmitExperienceForm({ onSubmitted }: SubmitFormProps) {
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
        body: JSON.stringify({ body: body.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit experience");
      }

      setSuccess("Your experience has been securely saved and embedded into the vector index!");
      setBody("");
      onSubmitted();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/90 p-6 sm:p-8 shadow-xl shadow-gray-200/40">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 font-bold text-sm">
            ✦
          </div>
          <h2 className="text-xl font-bold text-gray-950 font-serif">
            Share a Private Experience
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          100% Private Default
        </span>
      </div>

      <p className="mt-3 text-xs sm:text-sm text-gray-500 leading-relaxed">
        Describe a bizarre coincidence, recurring phenomenon, or unexplainable pattern you experienced.
        It remains completely private until matched and approved.
      </p>

      {/* Example Inspiration Chips */}
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Inspiration:
        </span>
        {EXAMPLE_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setBody(prompt)}
            className="text-xs px-3 py-1 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/70 transition-all text-left truncate max-w-[260px] sm:max-w-none"
          >
            &ldquo;{prompt.substring(0, 48)}...&rdquo;
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <textarea
            required
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your experience in detail. How did it begin? What felt unusual or unexplainable? Describe the sensations, objects, or timeline..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950/5 transition-all shadow-sm resize-none"
          />
          <div className="flex items-center justify-between text-xs text-gray-400 mt-2 px-1">
            <span>
              {isMinimumMet ? (
                <span className="text-emerald-600 font-medium">
                  ✓ Detailed enough for embedding
                </span>
              ) : (
                <span className="text-gray-400">
                  Minimum 15 characters ({15 - charCount} more needed)
                </span>
              )}
            </span>
            <span>{charCount} / 5,000 characters</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>🔒</span>
            <span>Vectorized upon submission. No raw text is ever publicly revealed.</span>
          </div>

          <button
            type="submit"
            disabled={loading || !isMinimumMet}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-gray-950 hover:bg-black text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Embedding into Vector Index...</span>
              </>
            ) : (
              <span>Save & Embed Privately →</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
