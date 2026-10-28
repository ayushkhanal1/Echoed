"use client";

import { useEffect, useState, useCallback } from "react";
import SubmitExperienceForm from "./SubmitExperienceForm";
import MyExperiencesList from "./MyExperiencesList";

interface PostItem {
  id: string;
  body: string;
  status: string;
  created_at: string;
  is_embedded: boolean;
}

export default function DashboardContainer() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="space-y-10">
      {/* 1. Submission Form */}
      <SubmitExperienceForm onSubmitted={fetchPosts} />

      {/* 2. My Private Experiences Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-950 font-serif">
              My Private Submissions
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
              {posts.length}
            </span>
          </div>
          <button
            onClick={fetchPosts}
            className="text-xs text-gray-500 hover:text-gray-950 font-medium transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        <MyExperiencesList posts={posts} loading={loading} />
      </div>
    </div>
  );
}
