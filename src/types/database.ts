// Type definitions for Echoed database entities

// ============================================================
// Users
// ============================================================
export interface User {
  id: string;
  cognito_sub: string;
  email: string;
  display_name: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================
// Posts (Private Experiences)
// ============================================================
export type PostStatus = "active" | "archived" | "flagged";

export interface Post {
  id: string;
  user_id: string;
  title?: string | null;
  body: string;
  embedding: number[] | null; // 1024-dim vector (AWS Bedrock Titan V2)
  status: PostStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePostInput {
  user_id: string;
  title?: string;
  body: string;
}

// ============================================================
// Clusters (Verified Match Groups)
// ============================================================
export type ClusterStatus = "pending" | "published" | "archived";

export interface Cluster {
  id: string;
  thread_title: string | null;
  preview_summary: string | null;
  match_reasoning: string | null;
  llm_model: string;
  status: ClusterStatus;
  created_at: Date;
  updated_at: Date;
}

// ============================================================
// Cluster Members (Posts in a Cluster + Consent)
// ============================================================
export type ConsentStatus = "pending" | "accepted" | "declined";

export interface ClusterMember {
  id: string;
  cluster_id: string;
  post_id: string;
  user_id: string;
  consent_status: ConsentStatus;
  author_alias: string | null;
  consented_at: Date | null;
  created_at: Date;
}

// ============================================================
// Experience Threads (Public Feed Items)
// ============================================================
export interface ExperienceThread {
  id: string;
  cluster_id: string;
  title: string;
  preview_summary: string;
  upvote_count: number;
  downvote_count: number;
  comment_count: number;
  published_at: Date;
  updated_at: Date;
}

// ============================================================
// Votes
// ============================================================
export type VoteValue = 1 | -1;

export interface Vote {
  id: string;
  thread_id: string;
  user_id: string;
  value: VoteValue;
  created_at: Date;
}

// ============================================================
// Comments
// ============================================================
export interface Comment {
  id: string;
  thread_id: string;
  user_id: string;
  anonymous_alias: string;
  body: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================
// Anonymous Aliases
// ============================================================
export interface AnonymousAlias {
  id: string;
  thread_id: string;
  user_id: string;
  alias: string;
}

// ============================================================
// Notifications
// ============================================================
export type NotificationType = "match_found" | "thread_published" | "new_consent";

export interface Notification {
  id: string;
  user_id: string;
  cluster_id: string | null;
  type: NotificationType;
  title: string | null;
  message: string | null;
  is_read: boolean;
  created_at: Date;
}

// ============================================================
// Candidate Matches (Stage 1 Results)
// ============================================================
export interface CandidateMatch {
  id: string;
  source_post_id: string;
  matched_post_id: string;
  cosine_distance: number;
  created_at: Date;
}
