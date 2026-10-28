import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";

export default async function FeedPage() {
  const user = await getSessionUser();

  // Fetch published threads ordered by hot/score (upvotes - downvotes)
  const query = `
    SELECT 
      et.id,
      et.cluster_id,
      et.title,
      et.preview_summary,
      et.upvote_count,
      et.downvote_count,
      et.comment_count,
      et.published_at,
      (et.upvote_count - et.downvote_count) AS score,
      (
        SELECT count(*) 
        FROM cluster_members cm 
        WHERE cm.cluster_id = et.cluster_id AND cm.consent_status = 'accepted'
      ) AS consented_author_count
    FROM experience_threads et
    ORDER BY score DESC, et.published_at DESC
    LIMIT 30;
  `;

  const result = await db.query(query);
  const threads = result.rows;

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-8 py-10 sm:py-16 space-y-8">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-xs font-semibold text-orange-700 mb-2 shadow-sm">
            <span>🌐</span> Community Feed
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950 font-serif">
            Global Experience Threads
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real parallel human coincidences, verified by Meta AI and published with author consent.
          </p>
        </div>

        {user ? (
          <Link
            href="/submit"
            className="px-5 py-2.5 rounded-full bg-gray-950 hover:bg-black text-white text-xs font-semibold transition-all shadow-sm self-start sm:self-center"
          >
            + Share an Experience
          </Link>
        ) : (
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-full bg-gray-950 hover:bg-black text-white text-xs font-semibold transition-all shadow-sm self-start sm:self-center"
          >
            Join to Share & Vote
          </Link>
        )}
      </div>

      {/* Threads List */}
      <div className="space-y-6">
        {threads.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white/60 p-12 text-center space-y-4 shadow-sm">
            <span className="text-4xl block">✨</span>
            <h3 className="text-lg font-bold text-gray-950 font-serif">
              No public threads yet
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              When two or more authors submit matching experiences and both accept the connection, their parallel accounts are published here side-by-side.
            </p>
            <div className="pt-2">
              <Link
                href="/submit"
                className="inline-flex items-center px-6 py-3 rounded-full bg-gray-950 text-white text-xs font-semibold hover:bg-black transition-all shadow-sm"
              >
                Submit the First Experience →
              </Link>
            </div>
          </div>
        ) : (
          threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/thread/${thread.id}`}
              className="group block rounded-3xl bg-white/90 backdrop-blur-xl border border-white/90 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all hover:border-gray-300"
            >
              <div className="space-y-4">
                {/* Meta Verification Badge + Author Count */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-800 font-semibold text-[11px]">
                      <span>✦</span> Meta AI Verified Coincidence
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-medium text-[11px] border border-blue-200/60">
                      👥 {thread.consented_author_count || 2} Parallel Accounts
                    </span>
                  </div>

                  <span className="text-gray-400 font-mono text-[11px]">
                    {new Date(thread.published_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-gray-950 font-serif group-hover:text-orange-600 transition-colors">
                  {thread.title}
                </h3>

                {/* Preview Summary */}
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
                  {thread.preview_summary}
                </p>

                {/* Engagement Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-4 text-gray-600 font-medium">
                    <span className="flex items-center gap-1">
                      <span>👍</span>
                      <span className="font-bold text-gray-950">
                        {thread.upvote_count - thread.downvote_count}
                      </span>{" "}
                      votes
                    </span>
                    <span className="flex items-center gap-1">
                      <span>💬</span>
                      <span>{thread.comment_count}</span> comments
                    </span>
                  </div>

                  <span className="text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Read Parallel Stories Side-by-Side →
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
