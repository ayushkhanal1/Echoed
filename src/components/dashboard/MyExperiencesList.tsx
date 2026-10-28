"use client";

interface PostItem {
  id: string;
  body: string;
  status: string;
  created_at: string;
  is_embedded: boolean;
}

interface ExperiencesListProps {
  posts: PostItem[];
  loading: boolean;
}

export default function MyExperiencesList({ posts, loading }: ExperiencesListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-3xl bg-white/60 border border-gray-200/60 p-6 animate-pulse space-y-3"
          >
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-white/50 p-10 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-xl mx-auto text-gray-500">
          📝
        </div>
        <h3 className="text-base font-bold text-gray-950 font-serif">
          No private experiences submitted yet
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
          When you write and submit an experience above, it will be vectorized and displayed here waiting for potential match clusters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 p-6 shadow-sm hover:shadow-md transition-all space-y-3"
        >
          {/* Post Header with Status Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                100% Private Story
              </span>

              {post.is_embedded && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-800 font-medium border border-orange-200/60">
                  🧮 768-dim Vector Embedded
                </span>
              )}
            </div>

            <span className="text-gray-400 font-mono text-[11px]">
              {new Date(post.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Post Content */}
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
            {post.body}
          </p>

          {/* Footer Status */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500 font-medium">
            <span className="flex items-center gap-1 text-gray-500">
              <span>Status:</span>
              <span className="text-orange-700 font-semibold uppercase tracking-wider">
                {post.status} — Waiting for similarity matches
              </span>
            </span>
            <span className="font-mono text-gray-400">ID: {post.id.substring(0, 8)}...</span>
          </div>
        </div>
      ))}
    </div>
  );
}
