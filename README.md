# Echoed — Discover Shared Human Coincidences

> A privacy-first, AI-driven platform where people submit their strange real-life coincidences in complete privacy, and vector AI + Meta LLM silently discover if someone else in the world lived through the exact same experience — publishing side-by-side only when both authors consent.

Built for the **Meta Global AI Developer Hackathon**.

---

## ✦ Core Architecture

```
User Story → AWS Bedrock Titan V2 (1024-dim vector) → PostgreSQL pgvector Cosine Search
  → Meta LLM Verification → Progressive Dual-Author Consent → Anonymous Global Feed
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 App Router (React 18) | Server-rendered pages + API routes |
| Auth | Amazon Cognito User Pools | Email/password with OTP verification |
| Database | Amazon RDS PostgreSQL 16 + pgvector | Structured data + 1024-dim vector similarity |
| Embeddings | AWS Bedrock — Amazon Titan Text V2 | Semantic text-to-vector conversion |
| Verification | Meta LLM (muse-spark-open-1026) | Cross-story validation & PII filtering |
| Hosting | AWS Amplify (Serverless) | Auto-deploys API routes as Lambda functions |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- An AWS account with:
  - Amazon RDS PostgreSQL instance (with `pgvector` extension)
  - Amazon Cognito User Pool
  - AWS Bedrock model access (Titan Text Embeddings V2)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Echoed.git
cd Echoed

# Install dependencies
npm install

# Copy environment template and fill in your credentials
cp .env.example .env.local
# Edit .env.local with your real AWS credentials

# Run database migrations
npm run db:migrate

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🗂️ Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (auth)/             # Login & Signup pages
│   ├── api/                # Serverless API endpoints
│   │   ├── auth/           # Cognito auth (signup, login, logout, verify)
│   │   ├── posts/          # Private story submission + Bedrock embedding
│   │   ├── comments/       # Anonymous thread-specific comments
│   │   ├── consent/        # Accept/decline match connections
│   │   ├── notifications/  # User notification center
│   │   └── vote/           # Upvote/downvote threads
│   ├── feed/               # Global community feed (public)
│   ├── profile/            # User profile + post history
│   ├── submit/             # Write a new private experience
│   ├── notifications/      # Notification center UI
│   ├── thread/[id]/        # Full thread detail (side-by-side stories)
│   └── how-it-works/       # Plain-English user guide
├── components/             # Reusable UI components
├── db/                     # Database schema, migrations, seed scripts
├── lib/                    # Core libraries
│   ├── ai/                 # Bedrock embedding + pgvector similarity search
│   ├── auth.ts             # Session management + PostgreSQL user sync
│   ├── cognito.ts          # AWS Cognito SDK integration
│   └── jwt.ts              # Cognito JWKS token verification
└── types/                  # TypeScript type definitions
```

---

## 📜 Available Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start local development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Run PostgreSQL schema migrations |
| `npm run db:test` | Test database connection |
| `npm run db:seed-mock` | Seed realistic mock feed data for testing |
| `npm run db:clean-mock` | Remove all mock seed data |
| `npm run test:auth` | Verify Cognito + PostgreSQL user sync |
| `npm run test:submission` | Test Bedrock embedding pipeline |
| `npm run test:similarity` | Test pgvector cosine similarity search |

---

## 🔐 Security

- **All secrets** are stored exclusively in `.env.local`, which is listed in `.gitignore` and **never committed** to version control.
- A `.env.example` template with placeholder values is provided for developer onboarding.
- User sessions are managed via `httpOnly` secure cookies with Cognito JWT verification.
- All stories are private by default — published only after mutual dual-author consent.
- Anonymous aliases (`Echoer_XXX`) are assigned per-thread for community discussion.

---

## 🎨 Theme

Echoed features a dual-theme UI:
- **Silver-Titanium Matte** (default) — soothing, cool-gray studio canvas with frosted glass cards
- **Midnight Slate Dark Mode** — deep charcoal with translucent dark glass panels

Toggle between themes using the 🌙/☀️ button in the navigation bar.

---

## 📄 License

Built for the Meta Global AI Developer Hackathon. See [LICENSE](LICENSE) for details.
