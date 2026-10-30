# AI Super App & Workspace (Firebase Edition)

An all-in-one AI workspace combining the core ideas of Genspark, iLovePDF, Cutout.pro and Arena.ai — chat + model arena, master prompts, a 30-day file library, and free AI image generation/editing.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + next-themes (Dark/Light)
- **Backend**: Firebase Auth + Cloud Firestore + Firebase Storage (Admin SDK on the server)
- **AI**: A free multi-provider gateway (Google Gemini, Groq, Mistral, Cloudflare Workers AI)
- **Images**: Free text-to-image (FLUX.1, SDXL) and image-to-image (FLUX.2 Klein) via Cloudflare Workers AI; in-browser background removal
- **Auth**: Google Login + Email/Password — **strictly @gmail.com only**, plus an optional demo session

---

## Features

| Feature | Status |
|---|---|
| Gmail-only auth (Google + Email) | ✅ |
| AI Chat with streaming-style progress indicator | ✅ |
| Multi-provider model switcher (free models only) | ✅ |
| Auto Smart Router (picks the best free model per prompt) | ✅ |
| Arena mode (compare two models side by side) | ✅ |
| Automatic failover + provider failure alerting | ✅ |
| AI Image Studio — generate & edit images | ✅ |
| Background removal (100% in-browser, free) | ✅ |
| Image enhancement / restore | ✅ |
| Master Prompts (dynamic forms → run in chat) | ✅ |
| Library with 30-day auto-expiry | ✅ |
| Admin panel (users / models / broadcast / health & alerts) | ✅ |
| Security: Firebase token verification, IDOR protection, rate limiting, security headers | ✅ |

### Free AI models shipped by default

| Provider | Models |
|---|---|
| **Auto** | Smart Router (classifies the prompt and routes it) |
| **Google** | `gemini-3.8-flash`, `gemini-3.5-flash-lite` |
| **Groq** | `qwen/qwen3.8-27b`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b` |
| **Mistral** | `codestral-latest`, `open-mistral-nemo`, `ministral-8b-latest` |
| **Cloudflare** | `@cf/meta/llama-3.1-8b-instruct`, `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, `@cf/qwen/qwen2.5-coder-32b-instruct`, `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` |

> Paid providers (OpenAI, Anthropic, xAI, DeepSeek, OpenRouter, SambaNova, HuggingFace) are intentionally hidden from the UI because they need a funded key. The provider code still supports them — re-add an entry in `src/lib/gemini.ts` once you have a working key.

### Free image models

| Task | Model |
|---|---|
| Text-to-image | `@cf/black-forest-labs/flux-1-schnell`, `@cf/stabilityai/stable-diffusion-xl-base-1.0` |
| Image-to-image (edit/restyle/enhance) | `@cf/black-forest-labs/flux-2-klein-4b` |
| Background removal | runs locally in the browser (no API key, no upload) |

---

## Monitoring & Alerts (automatic failure handling)

Every model call goes through `generateAI()` (`src/lib/ai.ts`) which:

1. Calls the requested model.
2. On failure, logs an alert and automatically retries a fallback chain, so a single provider outage never surfaces as a hard error.
3. If every candidate fails, throws the last error.

Alerts are surfaced through:

- **In-app admin dashboard**: `/admin/alerts` (recent alerts + live health check).
- **Webhook**: Discord/Slack via `ALERT_WEBHOOK_URL`.
- **Email**: via Resend (`RESEND_API_KEY` + `ALERT_EMAIL_TO`).
- **API**: `GET /api/health`, `GET /api/health?deep=1` (live probe), `GET /api/alerts`.

Notifications for the same provider are throttled (`ALERT_THROTTLE_MS`, default 5 min).

---

## Security

- Every data API verifies a **Firebase ID token** server-side (`src/lib/server-auth.ts`) and scopes operations to the token's UID — clients can no longer act as another user (IDOR fixed).
- API routes enforce input validation, file MIME allowlist + 10 MB limits, and in-memory rate limiting (30 req/min/chat).
- Security headers (HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`.
- `DEMO_MODE_ALLOWED=false` forces authentication on all APIs in production.

---

## Firestore Data Model

```
users/{uid}
  - uid, email (@gmail.com), fullName, photoURL?, role, creditBalance,
    creditResetAt, subscriptionTier, isActive, createdAt, updatedAt

creditTransactions/{id}
  - userId, amount, type, description, metadata, createdAt

masterPrompts/{id}
  - title, description, category, formSchema[], promptTemplate,
    isPublic, createdBy, usageCount, createdAt

chatSessions/{id}
  - userId, title, model, createdAt, updatedAt

messages/{id}
  - sessionId, role, content, attachments[], tokensUsed, createdAt

libraryFiles/{id}
  - userId, name, fileType, storagePath, publicUrl,
    sizeBytes, source, expiresAt (now + 30 days), createdAt

systemAlerts/{id}
  - provider, model?, severity, message, statusCode?, userId?, createdAt, notified
```

See `firestore.rules` and `storage.rules` in the repo.

---

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Firebase project**
   - Enable Authentication → Email/Password + Google
   - Create a Firestore database and a Storage bucket
   - Generate a service account key (for the Admin SDK)

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in the Firebase client config, the Firebase Admin service account, and at least one provider key (`GEMINI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY` and/or `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`).

4. **Run**
   ```bash
   npm run dev
   ```

5. **Make yourself admin**
   After first login, open Firestore → `users/{your-uid}` → set `role: "admin"`.

### Quick demo (no Firebase needed)

On the login page use **demo@gmail.com** (any password) to enter a sandbox admin session.

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/        # protected user area (chat, image studio, media tools, library…)
│   ├── admin/            # admin-only (users, models, broadcast, health & alerts)
│   └── api/              # chat, image/generate, image/edit, library, upload, health, alerts…
├── components/
│   ├── layout/           # Sidebar, Header, ThemeToggle
│   ├── chat/             # chat UI, model selector, uploads
│   └── providers/        # Auth + Theme
├── lib/
│   ├── gemini.ts         # multi-provider model catalog + gateway
│   ├── image.ts          # free image generation / editing
│   ├── ai.ts             # failover wrapper
│   ├── monitoring.ts     # alerts, notifications, health checks
│   ├── server-auth.ts    # server-side Firebase token verification
│   └── firebase/         # client + admin SDK
└── types/
```
