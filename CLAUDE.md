# Inference Newsletter

A self-hosted newsletter system for senior engineers covering AI, Software Engineering, and Engineering Management.

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 (CSS-based config, no tailwind.config.ts)
- **Database**: Supabase (PostgreSQL via @supabase/supabase-js)
- **Email**: Resend + React Email templates
- **Icons**: Lucide React
- **Testing**: Vitest + Testing Library
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/                      # Next.js App Router pages & API routes
│   ├── page.tsx              # Landing page (hero + subscribe + latest issues)
│   ├── layout.tsx            # Root layout (Space Grotesk + DM Sans fonts)
│   ├── archive/page.tsx      # All issues listing
│   ├── issues/[slug]/page.tsx # Individual issue (MDX rendered)
│   └── api/
│       ├── subscribe/        # POST — create subscriber, send confirmation
│       ├── confirm/          # GET — confirm via token
│       ├── unsubscribe/      # GET — unsubscribe via token
│       ├── send/             # POST — send newsletter (API key protected)
│       └── og/               # GET — dynamic OG image generation (edge)
├── components/
│   ├── subscribe-form.tsx    # Client component with email input
│   └── issue-card.tsx        # Issue preview card
├── templates/
│   ├── confirmation-email.tsx # React Email template
│   └── newsletter-email.tsx   # React Email template
├── lib/
│   ├── db.ts                 # Supabase client (service role)
│   ├── subscribers.ts        # Subscriber CRUD operations
│   ├── email.ts              # Resend email sending (confirmation + newsletter)
│   ├── markdown.ts           # Markdown parsing (gray-matter + reading-time)
│   ├── issues.ts             # Issue tracking (upsert sent status)
│   ├── validation.ts         # Email format validation
│   ├── rate-limit.ts         # In-memory rate limiter + IP extraction
│   ├── categories.ts         # Shared category styles (AI/SWE/EM)
│   ├── types.ts              # Shared Result<T> type
│   └── logger.ts             # Structured JSON logging
└── test/
    └── setup.ts              # Vitest setup (jest-dom)

content/
└── issues/                   # Markdown newsletter issues (frontmatter: title, description, category, date)

supabase/
└── migrations/               # SQL migrations (subscribers + issues tables)
```

## Key Patterns

- **Result<T> type**: All lib functions return `{ success: true, data: T } | { success: false, error: string }`. Check `success` before accessing `data`.
- **Subscriber statuses**: PENDING → ACTIVE → UNSUBSCRIBED. Use `SubscriberStatus` constants from `subscribers.ts`.
- **Column naming**: Database uses snake_case (`confirm_token`), TypeScript uses camelCase (`confirmToken`). Mapping happens in `subscribers.ts`.
- **Rate limiting**: In-memory (resets per serverless invocation). `subscribeLimiter`, `tokenLimiter`, `sendLimiter` in `rate-limit.ts`.
- **Logging**: Use `logger.info/warn/error(event, data)` from `lib/logger.ts`. Events follow `resource.action` pattern (e.g., `subscribe.success`).
- **Categories**: AI, SOFTWARE_ENGINEERING, ENGINEERING_MANAGEMENT. Colors defined in `lib/categories.ts`.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL     # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY    # Supabase service role key (bypasses RLS)
RESEND_API_KEY               # Resend API key for email delivery
SEND_API_KEY                 # Secret key protecting the /api/send endpoint
NEXT_PUBLIC_SITE_URL         # Public site URL (for email links)
```

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test:run     # Run tests once
npm run test         # Run tests in watch mode
```

## Writing a Newsletter Issue

Create a markdown file in `content/issues/`:

```markdown
---
title: "Your Issue Title"
description: "Brief description for cards and meta tags"
category: AI
date: 2026-03-15
---

Your markdown content here.
```

Category must be one of: `AI`, `SOFTWARE_ENGINEERING`, `ENGINEERING_MANAGEMENT`.
Slug is derived from the filename (without `.md`).

## Sending a Newsletter

```bash
SEND_API_KEY="your-key" ./scripts/send.sh <slug>
```

## Testing

45 tests across 6 files. Run with `npm run test:run`.

| File | Tests | Covers |
|------|-------|--------|
| `validation.test.ts` | 3 | Email format, length |
| `rate-limit.test.ts` | 3 | Allow, block, independent keys |
| `categories.test.ts` | 5 | All categories + unknown fallback |
| `subscribers.test.ts` | 17 | CRUD, status transitions, name sanitization, error handling |
| `markdown.test.ts` | 10 | Parsing, listing, path traversal (6 cases) |
| `email.test.ts` | 7 | Send/batch, Resend errors, throw handling |

When adding new lib functions, add tests in the corresponding `.test.ts` file. Mock Supabase using the chainable mock pattern in `subscribers.test.ts`.

## Security Notes

- `/api/send` uses `crypto.timingSafeEqual` for API key comparison
- HTML content is sanitized with DOMPurify before email delivery
- `getIssueBySlug` has path traversal protection (rejects `../`, `/`, `\`)
- All routes have rate limiting (`subscribeLimiter`, `tokenLimiter`, `sendLimiter`)
- Subscribe endpoint has CSRF origin checking
- Security headers in `next.config.ts` (X-Frame-Options, HSTS, nosniff, Referrer-Policy, Permissions-Policy)
- Error messages are generic — no Supabase internals leak to users
- Env vars validated at startup (throws on missing)
- Name input sanitized (trimmed, 100 char max)
- Token length validated on confirm/unsubscribe endpoints (max 128)

## Deployment

- **Hosting**: Vercel (https://newsletter-nine-roan.vercel.app)
- **Database**: Supabase project `bhfstizhqqnxgaeswoam`
- **Deploy**: `vercel --prod`
- **Logs**: `vercel logs` or Vercel dashboard > Logs
- **Env vars**: Set via `vercel env add <NAME> production`

## Design System

- **Theme**: Dark mode (`#0F172A` background, `#F8FAFC` text)
- **Fonts**: Space Grotesk (headings) + DM Sans (body)
- **Accent**: Green `#22C55E` (CTA buttons, brand highlights)
- **Categories**: Violet (AI), Blue (SWE), Green (EM)
- **Icons**: Lucide React (no emojis as icons)
- **Config**: Tailwind v4 CSS-based (`globals.css`), no `tailwind.config.ts`
- **Design system doc**: `design-system/tech-newsletter/MASTER.md`
