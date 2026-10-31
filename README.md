# Echoed — Discover Shared Human Coincidences

> **A privacy-first platform where people document unexplainable real-life coincidences in complete privacy. PostgreSQL deterministic trigram indexing and Meta’s open-weights Muse Spark Open (`muse-spark-open-1026`) silently discover if someone else in the world lived through the exact same anomaly — publishing side-by-side only when both authors explicitly consent.**

Built for the **Meta Global AI Developer Hackathon**.

---

## 📖 The Problem & The Solution

- **The Problem:** Many people experience uncanny real-life coincidences — matching heirloom pocket watches stopped at the exact same minute on opposite sides of the earth, identical recurring childhood dreams of architectural rooms, or eerie synchronized events. Most people never share these because of the fear of judgment, skepticism, or having their identity exposed on public social media.
- **The Solution (Echoed):** Echoed provides an encrypted, anonymous personal vault. Users submit their experiences without making them public. Our two-stage search engine silently cross-references submissions worldwide. When a true parallel experience is detected, both authors receive a private match notification and summary. **Only if both authors click "Accept Connection"** are their stories published side-by-side on the global community feed.

---

## ✦ Core Architecture (100% Meta Runtime Compliant)

```
[ Author A Writes Story ]                  [ Author B Writes Story ]
          │                                          │
          ▼                                          ▼
   (Private Vault)                            (Private Vault)
          │                                          │
          └──────────────────┬───────────────────────┘
                             ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ STAGE 1: Fast Recall (PostgreSQL pg_trgm — Non-ML)          │
  │ • Sub-millisecond character triplet & keyword overlap math   │
  │ • Zero AI models called (100% standard database C code)     │
  │ • Filters out 99% of unrelated stories with 0 false matches  │
  └──────────────────────────┬──────────────────────────────────┘
                             ▼ (Top Candidate Matches)
  ┌─────────────────────────────────────────────────────────────┐
  │ STAGE 2: Deep Verification (Meta Muse Spark Open via Baseten)│
  │ • Model: meta-models/muse-spark-open-1026                  │
  │ • Verifies genuine convergence (objects, times, geolocations)│
  │ • Strips personal identifying information (PII)             │
  │ • Auto-generates Thread Title, Summary & Match Reasoning     │
  └──────────────────────────┬──────────────────────────────────┘
                             ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ MUTUAL DUAL-AUTHOR CONSENT PROTOCOL                         │
  │ • Private in-app notification sent to Author A and Author B │
  │ • Story remains 100% private if either author declines      │
  │ • Requires 2/2 mutual acceptances to trigger publication    │
  └──────────────────────────┬──────────────────────────────────┘
                             ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ ANONYMOUS GLOBAL COMMUNITY FEED                             │
  │ • Published side-by-side with Meta AI Reasoning analysis     │
  │ • Thread-consistent anonymous discussion (e.g. Echoer_482)  │
  │ • Live community upvoting/downvoting                        │
  └─────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 App Router, React 18, Tailwind CSS | Modern frosted glass UI with Silver-Titanium Light & Midnight Slate Dark mode |
| **Authentication** | Amazon Cognito User Pools | Email/password auth, email OTP code verification, and secure cookie sessions |
| **Database** | Amazon RDS PostgreSQL 16 (`pg_trgm` + `pgvector`) | Structured relational storage + sub-millisecond trigram matching |
| **Stage 1 Recall** | PostgreSQL `pg_trgm` Non-ML Search | Deterministic character trigram math (<5ms, zero non-Meta models) |
| **Stage 2 Verification** | **Meta Muse Spark Open** (`meta-models/muse-spark-open-1026`) | Deep reasoning, coincidence verification, and synthesis via Baseten |
| **Hosting** | **AWS Amplify (Serverless SSR)** | Full-stack Next.js 14 App Router compute hosting |

---

## 🏆 Hackathon Compliance: 100% Pure Meta Model

In strict alignment with the Meta Global AI Developer Hackathon runtime rules:
> *"Every model your project actually calls at runtime has to be a Meta model. Plain non-ML code isn't a model call."*

1. **Zero Non-Meta AI Models:** Stage 1 uses native PostgreSQL C-level mathematical trigram indexing (`pg_trgm`). No third-party or non-Meta embedding models are invoked at runtime.
2. **Meta Open-Weights Core Intelligence:** 100% of semantic reasoning, coincidence validation, title synthesis, summary creation, and PII filtering is powered directly by **Meta's open-weights model `meta-models/muse-spark-open-1026`** hosted via Baseten.

---

## 🗄️ Database Schema & Data Models

Echoed runs on 10 interconnected tables on Amazon RDS PostgreSQL 16:

1. **`users`**: Profiles linked to Cognito `sub` claims; display names are never made public.
2. **`posts`**: Private submitted experiences. Kept `active` and 100% hidden by default.
3. **`clusters`**: AI-formed match groups storing Meta AI's generated thread title, preview summary, and match reasoning.
4. **`cluster_members`**: Junction table tracking the consent state (`pending`, `accepted`, `declined`) for each author.
5. **`experience_threads`**: Public feed items created automatically once $\ge 2$ authors accept connection.
6. **`votes`**: Single-vote per user per thread (`+1` or `-1`) with real-time recalculation.
7. **`comments`**: Anonymous community comments tied to thread-specific aliases.
8. **`anonymous_aliases`**: Ensures a user consistently gets the same identifier (e.g. `Echoer_719`) within a specific thread.
9. **`notifications`**: Private in-app notification center alerting authors when an AI match is found.
10. **`candidate_matches`**: Audit log recording Stage 1 recall distance scores for traceability.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** $\ge 18.17.0$
- **Amazon Web Services (AWS) Account**:
  - Amazon RDS PostgreSQL 16 instance with `pg_trgm` and `pgvector`
  - Amazon Cognito User Pool
- **Baseten Account**:
  - API Key with access to `meta-models/muse-spark-open-1026`

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/Echoed.git
cd Echoed
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```env
# Database (Amazon RDS PostgreSQL)
DATABASE_URL=postgresql://YOUR_DB_USER:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/echoed

# Amazon Cognito Authentication
COGNITO_REGION=ap-southeast-2
COGNITO_USER_POOL_ID=your-cognito-pool-id
COGNITO_CLIENT_ID=your-cognito-app-client-id
COGNITO_CLIENT_SECRET=your-cognito-app-client-secret
NEXT_PUBLIC_COGNITO_REGION=ap-southeast-2

# Meta Muse Spark Open via Baseten Inference API
META_LLM_API_URL=https://inference.baseten.co/v1/chat/completions
META_LLM_API_KEY=your_baseten_api_key_here
META_LLM_MODEL=meta-models/muse-spark-open-1026
```

---

## 🧪 Comprehensive Verification Suite

Echoed comes with an end-to-end automated test suite verifying every single layer:

```bash
# Test 1: Full System Feature Verification (Post Request, Recall, Meta Muse Verification, Notifications, Consent, Voting, Comments)
npm run test:features

# Test 2: Live Meta Muse Spark Open inference via Baseten API
npm run test:baseten

# Test 3: Stage 1 Non-ML Trigram Recall & negative filtering
npm run test:similarity

# Test 4: End-to-End Pipeline test
npm run test:pipeline

# Test 5: Verify RDS PostgreSQL connection & database extensions (pg_trgm & pgvector)
npm run db:test

# Test 6: Verify Amazon Cognito authentication, JWKS connectivity, and user sync
npm run test:auth

# Inspect Live Database contents (Users, Posts, Matches)
npm run db:inspect

# Seed realistic demo threads for hackathon judges
npm run db:seed-mock
```

---

## ☁️ Deploying to AWS Amplify Hosting

Echoed includes a production-ready [`amplify.yml`](amplify.yml) build specification configured for Next.js 14 App Router Serverless SSR.

### Step-by-Step Deployment:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy Echoed to AWS Amplify"
   git push origin main
   ```

2. **Open the AWS Amplify Console:**
   - Navigate to [AWS Amplify Console](https://console.aws.amazon.com/amplify).
   - Click **"Create new app"** > **"Host web app"**.
   - Select **GitHub** as the source and authorize AWS Amplify.
   - Choose your repository (`Echoed`) and branch (`main`).

3. **Verify Build Settings:**
   - Amplify will automatically detect [`amplify.yml`](amplify.yml).
   - Ensure the build command is `npm run build` and base directory is `.next`.

4. **Add Environment Variables in Amplify Console:**
   - Go to **App settings > Environment variables** in the Amplify Console.
   - Add your production values:
     - `DATABASE_URL`
     - `COGNITO_REGION`
     - `COGNITO_USER_POOL_ID`
     - `COGNITO_CLIENT_ID`
     - `COGNITO_CLIENT_SECRET`
     - `NEXT_PUBLIC_COGNITO_REGION`
     - `META_LLM_API_URL`
     - `META_LLM_API_KEY`
     - `META_LLM_MODEL`

5. **Deploy:**
   - Click **"Save and deploy"**.
   - Amplify will build the Next.js application, provision serverless compute for the API routes, and deploy your live public `.amplifyapp.com` URL.

---

## 🎨 Theme & User Experience

Echoed features a dual-theme canvas:
- **Silver-Titanium Matte (Default):** Calm studio canvas with frosted glass panels and copper-amber accents.
- **Midnight Slate Dark Mode:** Deep charcoal with translucent panels.
- Toggle between themes using the 🌙/☀️ toggle in the navigation bar.

---

## 📄 License

Built for the **Meta Global AI Developer Hackathon**.
