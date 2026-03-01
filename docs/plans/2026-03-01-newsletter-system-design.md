# Newsletter System Design

**Date:** 2026-03-01
**Status:** Approved

## Overview

A self-hosted tech newsletter system covering AI, Software Engineering, and Engineering Management. Targets senior engineers and tech leads. Published twice a week with a mix of original deep-dives and curated content with commentary.

## Decisions

| Decision | Choice |
|---|---|
| Topics | AI, Software Engineering, Engineering Management |
| Audience | Senior engineers & tech leads |
| Frequency | Twice a week |
| Content style | Mix of original writing + curated links |
| Infrastructure | Self-hosted, full control |
| Website | Full site (landing + archive + subscribe) |
| Monetization | Free for now, designed for future paid tier |
| Architecture | Monolith Next.js app |
| Stack | TypeScript / Next.js 15 (App Router) |
| Authoring | Markdown files in the repo |
| Email delivery | Resend |
| Database | Prisma + PostgreSQL (SQLite for dev) |
| Styling | Tailwind CSS |
| Email templates | React Email |
| Deployment | Vercel + managed PostgreSQL (Neon/Supabase) |

## Project Structure

```
newsletter/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Landing page
│   │   ├── archive/            # Newsletter archive listing
│   │   ├── issues/[slug]/      # Individual issue pages
│   │   └── api/
│   │       ├── subscribe/      # POST - subscribe endpoint
│   │       ├── unsubscribe/    # POST/GET - unsubscribe endpoint
│   │       ├── confirm/        # GET - double opt-in confirmation
│   │       └── send/           # POST - trigger newsletter send (protected)
│   ├── components/             # UI components
│   ├── lib/
│   │   ├── db.ts               # Database client (Prisma)
│   │   ├── email.ts            # Resend integration
│   │   ├── markdown.ts         # Markdown parsing & rendering
│   │   └── subscribers.ts      # Subscriber management logic
│   └── templates/
│       └── newsletter.tsx      # React Email template
├── content/
│   └── issues/                 # Markdown newsletter issues
│       ├── 2026-03-03-ai-agents-landscape.md
│       └── 2026-03-06-engineering-management-ai-era.md
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

## Data Model

```prisma
model Subscriber {
  id               String   @id @default(cuid())
  email            String   @unique
  name             String?
  status           Status   @default(PENDING)
  confirmToken     String?  @unique
  unsubscribeToken String   @unique @default(cuid())
  subscribedAt     DateTime @default(now())
  confirmedAt      DateTime?
  unsubscribedAt   DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

enum Status {
  PENDING
  ACTIVE
  UNSUBSCRIBED
}

model Issue {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  description String
  category    Category
  publishedAt DateTime?
  sentAt      DateTime?
  createdAt   DateTime  @default(now())
}

enum Category {
  AI
  SOFTWARE_ENGINEERING
  ENGINEERING_MANAGEMENT
}
```

## Core Flows

### Subscribe Flow

1. User enters email on website
2. POST /api/subscribe — validate email, check duplicates
3. Create subscriber with status PENDING
4. Send confirmation email via Resend (contains confirmToken link)
5. User clicks link → GET /api/confirm?token=xxx
6. Update status to ACTIVE, set confirmedAt
7. Show "Welcome, you're subscribed!" page

### Unsubscribe Flow

1. Every email footer contains: /api/unsubscribe?token=xxx
2. GET /api/unsubscribe?token=xxx
3. Update status to UNSUBSCRIBED, set unsubscribedAt
4. Show "You've been unsubscribed" page with re-subscribe option

### Publish & Send Flow

1. Write issue as markdown in content/issues/ with frontmatter
2. On deploy: Next.js statically renders the issue page on the website
3. To send: POST /api/send (protected by API key)
4. Fetch all ACTIVE subscribers
5. Render markdown to HTML email via React Email template
6. Batch-send via Resend API
7. Update Issue.sentAt

## Issue Markdown Format

```markdown
---
title: "The AI Agents Landscape in 2026"
description: "A deep dive into how AI agents are reshaping software engineering workflows"
category: AI
date: 2026-03-03
---

Content in markdown. Supports headers, lists, code blocks, links, images.
```

## Email Template

- Clean, minimal design using React Email
- Header: newsletter name/logo
- Body: rendered markdown content
- Footer: unsubscribe link, social links, compliance text
- Responsive across email clients (Gmail, Outlook, Apple Mail)
- Auto-generated plain-text fallback

## Website Pages

- `/` — Landing page with value prop, subscribe form, latest issues
- `/archive` — Paginated list of all published issues
- `/issues/[slug]` — Individual issue page rendered from markdown

## Security

- Subscribe endpoint: rate-limited
- Send endpoint: protected with SEND_API_KEY env variable
- Unsubscribe tokens: unique per subscriber, not guessable (cuid)
- Email validation: format + MX record check
- CSRF protection on forms

## Email Compliance

- Double opt-in (GDPR)
- One-click unsubscribe header (List-Unsubscribe)
- Physical address in footer (CAN-SPAM)
- "Why you're receiving this" text

## Deployment

- Vercel for hosting (free tier)
- Neon or Supabase for managed PostgreSQL (free tier)
- Resend free tier: 3,000 emails/month (~215 subscribers at 2x/week)

## Intentionally Excluded (for now)

- No analytics dashboard (use Resend built-in analytics)
- No admin panel (markdown files + CLI is the interface)
- No payment/premium tier (designed to add later)
- No A/B testing
- No RSS feed (easy to add later)
