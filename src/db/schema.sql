-- ============================================================
-- Echoed Database Schema
-- PostgreSQL 16 + pgvector + pg_trgm
-- ============================================================

-- Enable the pgvector extension (requires shared_preload_libraries = 'pgvector')
CREATE EXTENSION IF NOT EXISTS vector;
-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Enable pg_trgm for fast non-ML trigram text similarity (Stage 1 Recall)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 1. USERS
-- Stores basic auth-linked profile info. Cognito handles actual auth.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_sub     VARCHAR(255) UNIQUE NOT NULL,  -- Cognito User Pool sub claim
    email           VARCHAR(255) UNIQUE NOT NULL,
    display_name    VARCHAR(100),                   -- Optional, never shown publicly
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);

-- ============================================================
-- 2. POSTS (Private Experiences)
-- Every submitted experience. Private by default.
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200),                    -- Experience Title (optional summary)
    body            TEXT NOT NULL,                   -- The raw private story
    embedding       vector(1024),                    -- Optional vector storage
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'archived', 'flagged')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
-- GIN Trigram indexes for fast Stage 1 candidate recall (sub-millisecond string math)
CREATE INDEX IF NOT EXISTS idx_posts_body_trgm ON posts USING gin (body gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_title_trgm ON posts USING gin (title gin_trgm_ops);

-- ============================================================
-- 3. CLUSTERS (Verified Match Groups)
-- Created by the Meta LLM after verifying that multiple posts
-- genuinely describe the same experience.
-- ============================================================
CREATE TABLE IF NOT EXISTS clusters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_title    VARCHAR(300),                    -- AI-generated thread title
    preview_summary TEXT,                            -- 1-sentence neutral preview
    match_reasoning TEXT,                            -- LLM's explanation of why stories match
    llm_model       VARCHAR(100) DEFAULT 'meta-models/muse-spark-open-1026',
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'published', 'archived')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. CLUSTER MEMBERS (Posts in a Cluster + Consent State)
-- Junction table linking posts to clusters with consent tracking.
-- ============================================================
CREATE TABLE IF NOT EXISTS cluster_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id      UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_status  VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (consent_status IN ('pending', 'accepted', 'declined')),
    author_alias    VARCHAR(50),                     -- e.g., "Author #1", "Author #2"
    consented_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(cluster_id, post_id)                      -- A post appears at most once per cluster
);

CREATE INDEX idx_cluster_members_cluster ON cluster_members(cluster_id);
CREATE INDEX idx_cluster_members_user ON cluster_members(user_id);
CREATE INDEX idx_cluster_members_consent ON cluster_members(consent_status);

-- ============================================================
-- 5. EXPERIENCE THREADS (Public Feed Items)
-- Created once ≥2 cluster members consent. Links to a cluster.
-- ============================================================
CREATE TABLE IF NOT EXISTS experience_threads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id      UUID UNIQUE NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    title           VARCHAR(300) NOT NULL,           -- Copied from cluster.thread_title
    preview_summary TEXT NOT NULL,                    -- Copied from cluster.preview_summary
    upvote_count    INTEGER NOT NULL DEFAULT 0,
    downvote_count  INTEGER NOT NULL DEFAULT 0,
    comment_count   INTEGER NOT NULL DEFAULT 0,
    published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_threads_published ON experience_threads(published_at DESC);

-- ============================================================
-- 6. VOTES
-- One vote per user per thread. Value: +1 (upvote) or -1 (downvote).
-- ============================================================
CREATE TABLE IF NOT EXISTS votes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       UUID NOT NULL REFERENCES experience_threads(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value           SMALLINT NOT NULL CHECK (value IN (1, -1)),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(thread_id, user_id)                       -- One vote per user per thread
);

CREATE INDEX idx_votes_thread ON votes(thread_id);

-- ============================================================
-- 7. COMMENTS (Anonymous, Thread-Specific Aliases)
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       UUID NOT NULL REFERENCES experience_threads(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    anonymous_alias VARCHAR(50) NOT NULL,             -- e.g., "Echoer_482" — unique per user per thread
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_thread ON comments(thread_id);
CREATE INDEX idx_comments_thread_created ON comments(thread_id, created_at);

-- ============================================================
-- 8. ANONYMOUS ALIASES (Lookup table for consistent thread aliases)
-- Ensures a user always gets the same alias within one thread.
-- ============================================================
CREATE TABLE IF NOT EXISTS anonymous_aliases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       UUID NOT NULL REFERENCES experience_threads(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alias           VARCHAR(50) NOT NULL,             -- e.g., "Echoer_482"

    UNIQUE(thread_id, user_id)                        -- One alias per user per thread
);

-- ============================================================
-- 9. NOTIFICATIONS
-- Private notifications sent to users when their post is matched or submitted.
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cluster_id      UUID REFERENCES clusters(id) ON DELETE CASCADE, -- Nullable for user submission confirmations
    type            VARCHAR(30) NOT NULL DEFAULT 'match_found'
                    CHECK (type IN ('match_found', 'consent_request', 'thread_published', 'post_sent', 'match_joined')),
    title           VARCHAR(300),
    message         TEXT,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- 10. CANDIDATE MATCHES (Stage 1 Vector / Text Search Results)
-- Tracks which posts were found as similar before LLM verification.
-- Useful for debugging and audit trail.
-- ============================================================
CREATE TABLE IF NOT EXISTS candidate_matches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_post_id  UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    matched_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    cosine_distance REAL NOT NULL,                    -- Distance metric (1 - similarity)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(source_post_id, matched_post_id)
);

CREATE INDEX idx_candidates_source ON candidate_matches(source_post_id);
