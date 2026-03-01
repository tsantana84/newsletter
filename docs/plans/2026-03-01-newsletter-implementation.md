# Newsletter System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a self-hosted newsletter system with subscriber management, markdown-based authoring, email delivery via Resend, and a public website with archive.

**Architecture:** Monolith Next.js 15 (App Router) application. Prisma ORM with PostgreSQL (SQLite for dev). Markdown files in the repo for content authoring. Resend + React Email for delivery. Tailwind CSS for styling.

**Tech Stack:** TypeScript, Next.js 15, Prisma, SQLite/PostgreSQL, Resend, React Email, Tailwind CSS, next-mdx-remote, Vitest

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project scaffolded with App Router, Tailwind, TypeScript.

**Step 2: Install core dependencies**

Run:
```bash
npm install prisma @prisma/client resend @react-email/components react-email next-mdx-remote gray-matter reading-time
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

**Step 3: Create .env.example**

Create `.env.example`:
```env
DATABASE_URL="file:./dev.db"
RESEND_API_KEY="re_your_api_key"
SEND_API_KEY="your_secret_key_for_send_endpoint"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Copy to `.env`:
```bash
cp .env.example .env
```

**Step 4: Create vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/test/setup.ts`:
```typescript
import "@testing-library/jest-dom/vitest";
```

**Step 5: Add test script to package.json**

Add to `scripts` in `package.json`:
```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 6: Verify setup**

Run:
```bash
npm run dev
```
Expected: Next.js dev server starts on localhost:3000.

Run:
```bash
npm run test:run
```
Expected: Vitest runs (0 tests, no errors).

**Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js project with core dependencies"
```

---

## Task 2: Database Schema & Prisma Setup

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

**Step 1: Initialize Prisma**

Run:
```bash
npx prisma init --datasource-provider sqlite
```

**Step 2: Write the schema**

Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Subscriber {
  id               String    @id @default(cuid())
  email            String    @unique
  name             String?
  status           String    @default("PENDING")
  confirmToken     String?   @unique
  unsubscribeToken String    @unique @default(cuid())
  subscribedAt     DateTime  @default(now())
  confirmedAt      DateTime?
  unsubscribedAt   DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

model Issue {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  description String
  category    String
  publishedAt DateTime?
  sentAt      DateTime?
  createdAt   DateTime  @default(now())
}
```

Note: Using String instead of enum for SQLite compatibility. Validate in application code.

**Step 3: Create Prisma client singleton**

Create `src/lib/db.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 4: Generate client and run migration**

Run:
```bash
npx prisma migrate dev --name init
```
Expected: Migration created, database file generated at `prisma/dev.db`.

**Step 5: Verify with Prisma Studio**

Run:
```bash
npx prisma studio
```
Expected: Opens browser showing Subscriber and Issue tables.

**Step 6: Commit**

```bash
git add prisma/ src/lib/db.ts
git commit -m "feat: add Prisma schema with Subscriber and Issue models"
```

---

## Task 3: Subscriber Management Library

**Files:**
- Create: `src/lib/subscribers.ts`
- Create: `src/lib/subscribers.test.ts`
- Create: `src/lib/validation.ts`
- Create: `src/lib/validation.test.ts`

**Step 1: Write email validation tests**

Create `src/lib/validation.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { validateEmail } from "./validation";

describe("validateEmail", () => {
  it("accepts valid email addresses", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("name+tag@domain.co")).toBe(true);
  });

  it("rejects invalid email addresses", () => {
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("notanemail")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
    expect(validateEmail("user@.com")).toBe(false);
  });

  it("rejects emails that are too long", () => {
    const longEmail = "a".repeat(255) + "@example.com";
    expect(validateEmail(longEmail)).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/validation.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement email validation**

Create `src/lib/validation.ts`:
```typescript
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_EMAIL_LENGTH = 254;

export function validateEmail(email: string): boolean {
  if (!email || email.length > MAX_EMAIL_LENGTH) return false;
  return EMAIL_REGEX.test(email);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/validation.test.ts`
Expected: PASS — all tests green.

**Step 5: Write subscriber management tests**

Create `src/lib/subscribers.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSubscriber, confirmSubscriber, unsubscribeByToken } from "./subscribers";

// Mock Prisma
vi.mock("./db", () => ({
  prisma: {
    subscriber: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "./db";

const mockPrisma = vi.mocked(prisma);

describe("createSubscriber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new subscriber with PENDING status", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue(null);
    mockPrisma.subscriber.create.mockResolvedValue({
      id: "test-id",
      email: "test@example.com",
      name: null,
      status: "PENDING",
      confirmToken: "token-123",
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: null,
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createSubscriber("test@example.com");

    expect(result.success).toBe(true);
    expect(mockPrisma.subscriber.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "test@example.com",
        status: "PENDING",
      }),
    });
  });

  it("returns error for invalid email", async () => {
    const result = await createSubscriber("invalid");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email address");
  });

  it("returns error for already-active subscriber", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue({
      id: "existing",
      email: "test@example.com",
      name: null,
      status: "ACTIVE",
      confirmToken: null,
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: new Date(),
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createSubscriber("test@example.com");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Already subscribed");
  });
});

describe("confirmSubscriber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms a pending subscriber", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue({
      id: "test-id",
      email: "test@example.com",
      name: null,
      status: "PENDING",
      confirmToken: "token-123",
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: null,
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.subscriber.update.mockResolvedValue({} as any);

    const result = await confirmSubscriber("token-123");
    expect(result.success).toBe(true);
    expect(mockPrisma.subscriber.update).toHaveBeenCalledWith({
      where: { confirmToken: "token-123" },
      data: expect.objectContaining({
        status: "ACTIVE",
        confirmToken: null,
      }),
    });
  });

  it("returns error for invalid token", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue(null);
    const result = await confirmSubscriber("bad-token");
    expect(result.success).toBe(false);
  });
});

describe("unsubscribeByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unsubscribes an active subscriber", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue({
      id: "test-id",
      email: "test@example.com",
      name: null,
      status: "ACTIVE",
      confirmToken: null,
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: new Date(),
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.subscriber.update.mockResolvedValue({} as any);

    const result = await unsubscribeByToken("unsub-123");
    expect(result.success).toBe(true);
  });
});
```

**Step 6: Run test to verify it fails**

Run: `npx vitest run src/lib/subscribers.test.ts`
Expected: FAIL — module not found.

**Step 7: Implement subscriber management**

Create `src/lib/subscribers.ts`:
```typescript
import { prisma } from "./db";
import { validateEmail } from "./validation";
import crypto from "crypto";

type Result = { success: true; data?: any } | { success: false; error: string };

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSubscriber(email: string, name?: string): Promise<Result> {
  if (!validateEmail(email)) {
    return { success: false, error: "Invalid email address" };
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.subscriber.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    if (existing.status === "ACTIVE") {
      return { success: false, error: "Already subscribed" };
    }
    if (existing.status === "PENDING") {
      return { success: false, error: "Confirmation email already sent. Check your inbox." };
    }
    // UNSUBSCRIBED — allow re-subscribe
    const confirmToken = generateToken();
    const updated = await prisma.subscriber.update({
      where: { email: normalizedEmail },
      data: {
        status: "PENDING",
        confirmToken,
        unsubscribedAt: null,
      },
    });
    return { success: true, data: updated };
  }

  const confirmToken = generateToken();
  const subscriber = await prisma.subscriber.create({
    data: {
      email: normalizedEmail,
      name: name || null,
      status: "PENDING",
      confirmToken,
    },
  });

  return { success: true, data: subscriber };
}

export async function confirmSubscriber(token: string): Promise<Result> {
  const subscriber = await prisma.subscriber.findUnique({
    where: { confirmToken: token },
  });

  if (!subscriber) {
    return { success: false, error: "Invalid or expired confirmation link" };
  }

  if (subscriber.status === "ACTIVE") {
    return { success: true, data: subscriber };
  }

  const updated = await prisma.subscriber.update({
    where: { confirmToken: token },
    data: {
      status: "ACTIVE",
      confirmToken: null,
      confirmedAt: new Date(),
    },
  });

  return { success: true, data: updated };
}

export async function unsubscribeByToken(token: string): Promise<Result> {
  const subscriber = await prisma.subscriber.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!subscriber) {
    return { success: false, error: "Invalid unsubscribe link" };
  }

  if (subscriber.status === "UNSUBSCRIBED") {
    return { success: true, data: subscriber };
  }

  const updated = await prisma.subscriber.update({
    where: { unsubscribeToken: token },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
    },
  });

  return { success: true, data: updated };
}

export async function getActiveSubscribers() {
  return prisma.subscriber.findMany({
    where: { status: "ACTIVE" },
    select: { email: true, name: true, unsubscribeToken: true },
  });
}
```

**Step 8: Run tests to verify they pass**

Run: `npx vitest run src/lib/subscribers.test.ts`
Expected: PASS — all tests green.

**Step 9: Commit**

```bash
git add src/lib/validation.ts src/lib/validation.test.ts src/lib/subscribers.ts src/lib/subscribers.test.ts
git commit -m "feat: add subscriber management with email validation"
```

---

## Task 4: Email Integration (Resend + React Email)

**Files:**
- Create: `src/lib/email.ts`
- Create: `src/lib/email.test.ts`
- Create: `src/templates/newsletter-email.tsx`
- Create: `src/templates/confirmation-email.tsx`

**Step 1: Write email service tests**

Create `src/lib/email.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendConfirmationEmail, sendNewsletter } from "./email";

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "email-123" }, error: null }),
    },
    batch: {
      send: vi.fn().mockResolvedValue({ data: [{ id: "batch-123" }], error: null }),
    },
  })),
}));

describe("sendConfirmationEmail", () => {
  it("sends a confirmation email with the correct token link", async () => {
    const result = await sendConfirmationEmail({
      to: "test@example.com",
      confirmToken: "token-abc",
    });

    expect(result.success).toBe(true);
  });
});

describe("sendNewsletter", () => {
  it("sends newsletter to a list of subscribers", async () => {
    const result = await sendNewsletter({
      subject: "Test Issue",
      htmlContent: "<h1>Hello</h1>",
      subscribers: [
        { email: "a@example.com", unsubscribeToken: "unsub-a" },
        { email: "b@example.com", unsubscribeToken: "unsub-b" },
      ],
    });

    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/email.test.ts`
Expected: FAIL — module not found.

**Step 3: Create email templates**

Create `src/templates/confirmation-email.tsx`:
```tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";

interface ConfirmationEmailProps {
  confirmUrl: string;
}

export function ConfirmationEmail({ confirmUrl }: ConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section>
            <Text style={heading}>Confirm your subscription</Text>
            <Text style={text}>
              Thanks for subscribing! Click the link below to confirm your email
              address and start receiving the newsletter.
            </Text>
            <Link href={confirmUrl} style={button}>
              Confirm Subscription
            </Link>
            <Hr style={hr} />
            <Text style={footer}>
              If you didn&apos;t subscribe, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#f6f9fc", fontFamily: "system-ui, sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "40px", maxWidth: "600px" };
const heading = { fontSize: "24px", fontWeight: "bold" as const, marginBottom: "16px" };
const text = { fontSize: "16px", lineHeight: "1.6", color: "#333" };
const button = {
  display: "inline-block",
  backgroundColor: "#000",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "16px",
  marginTop: "16px",
};
const hr = { borderColor: "#e6e6e6", margin: "24px 0" };
const footer = { fontSize: "14px", color: "#666" };
```

Create `src/templates/newsletter-email.tsx`:
```tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";

interface NewsletterEmailProps {
  title: string;
  htmlContent: string;
  unsubscribeUrl: string;
  issueUrl: string;
}

export function NewsletterEmail({
  title,
  htmlContent,
  unsubscribeUrl,
  issueUrl,
}: NewsletterEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section>
            <Text style={heading}>{title}</Text>
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            <Hr style={hr} />
            <Text style={footer}>
              <Link href={issueUrl}>Read online</Link>
              {" | "}
              <Link href={unsubscribeUrl}>Unsubscribe</Link>
            </Text>
            <Text style={footer}>
              You received this because you subscribed to the newsletter.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#f6f9fc", fontFamily: "system-ui, sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "40px", maxWidth: "600px" };
const heading = { fontSize: "28px", fontWeight: "bold" as const, marginBottom: "24px" };
const hr = { borderColor: "#e6e6e6", margin: "32px 0" };
const footer = { fontSize: "14px", color: "#666", textAlign: "center" as const };
```

**Step 4: Implement email service**

Create `src/lib/email.ts`:
```typescript
import { Resend } from "resend";
import { render } from "@react-email/components";
import { ConfirmationEmail } from "@/templates/confirmation-email";
import { NewsletterEmail } from "@/templates/newsletter-email";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "newsletter@yourdomain.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const BATCH_SIZE = 50;

type Result = { success: true; data?: any } | { success: false; error: string };

export async function sendConfirmationEmail({
  to,
  confirmToken,
}: {
  to: string;
  confirmToken: string;
}): Promise<Result> {
  const confirmUrl = `${SITE_URL}/api/confirm?token=${confirmToken}`;

  try {
    const html = await render(ConfirmationEmail({ confirmUrl }));

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Confirm your subscription",
      html,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to send confirmation email" };
  }
}

export async function sendNewsletter({
  subject,
  htmlContent,
  subscribers,
}: {
  subject: string;
  htmlContent: string;
  subscribers: { email: string; unsubscribeToken: string }[];
}): Promise<Result> {
  try {
    // Send in batches to respect rate limits
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);

      const emails = await Promise.all(
        batch.map(async (sub) => {
          const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${sub.unsubscribeToken}`;
          const issueUrl = `${SITE_URL}`;

          const html = await render(
            NewsletterEmail({
              title: subject,
              htmlContent,
              unsubscribeUrl,
              issueUrl,
            })
          );

          return {
            from: FROM_EMAIL,
            to: sub.email,
            subject,
            html,
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          };
        })
      );

      await resend.batch.send(emails);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to send newsletter" };
  }
}
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/email.test.ts`
Expected: PASS.

**Step 6: Commit**

```bash
git add src/lib/email.ts src/lib/email.test.ts src/templates/
git commit -m "feat: add email service with Resend and React Email templates"
```

---

## Task 5: Markdown Content System

**Files:**
- Create: `src/lib/markdown.ts`
- Create: `src/lib/markdown.test.ts`
- Create: `content/issues/.gitkeep`

**Step 1: Write markdown parsing tests**

Create `src/lib/markdown.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseIssue, getAllIssues, getIssueBySlug } from "./markdown";

describe("parseIssue", () => {
  it("parses frontmatter and content from markdown", () => {
    const raw = `---
title: "Test Issue"
description: "A test issue"
category: AI
date: 2026-03-03
---

# Hello World

This is the content.`;

    const result = parseIssue(raw, "test-issue");

    expect(result.title).toBe("Test Issue");
    expect(result.description).toBe("A test issue");
    expect(result.category).toBe("AI");
    expect(result.slug).toBe("test-issue");
    expect(result.content).toContain("# Hello World");
  });
});

describe("getAllIssues", () => {
  it("returns an array of issues sorted by date descending", async () => {
    const issues = await getAllIssues();
    expect(Array.isArray(issues)).toBe(true);

    if (issues.length > 1) {
      const dates = issues.map((i) => new Date(i.date).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/markdown.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement markdown parser**

Create `src/lib/markdown.ts`:
```typescript
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const CONTENT_DIR = path.join(process.cwd(), "content", "issues");

export interface IssueMeta {
  title: string;
  description: string;
  category: string;
  date: string;
  slug: string;
  readingTime: string;
}

export interface Issue extends IssueMeta {
  content: string;
}

export function parseIssue(raw: string, slug: string): Issue {
  const { data, content } = matter(raw);

  return {
    title: data.title,
    description: data.description,
    category: data.category,
    date: data.date instanceof Date ? data.date.toISOString().split("T")[0] : data.date,
    slug,
    readingTime: readingTime(content).text,
    content,
  };
}

export async function getAllIssues(): Promise<IssueMeta[]> {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  const issues = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
    const { content, ...meta } = parseIssue(raw, slug);
    return meta;
  });

  return issues.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getIssueBySlug(slug: string): Promise<Issue | null> {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  return parseIssue(raw, slug);
}
```

**Step 4: Create sample content**

Create `content/issues/2026-03-03-welcome.md`:
```markdown
---
title: "Welcome to the Newsletter"
description: "Introducing our tech newsletter covering AI, Software Engineering, and Engineering Management"
category: AI
date: 2026-03-03
---

# Welcome

This is the first issue of the newsletter. We cover:

- **AI** — Latest developments in artificial intelligence and machine learning
- **Software Engineering** — Best practices, architecture, and tooling
- **Engineering Management** — Leadership, team dynamics, and scaling engineering orgs

Stay tuned for more.
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/markdown.test.ts`
Expected: PASS.

**Step 6: Commit**

```bash
git add src/lib/markdown.ts src/lib/markdown.test.ts content/
git commit -m "feat: add markdown content system with frontmatter parsing"
```

---

## Task 6: API Routes

**Files:**
- Create: `src/app/api/subscribe/route.ts`
- Create: `src/app/api/confirm/route.ts`
- Create: `src/app/api/unsubscribe/route.ts`
- Create: `src/app/api/send/route.ts`

**Step 1: Subscribe endpoint**

Create `src/app/api/subscribe/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSubscriber } from "@/lib/subscribers";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await createSubscriber(email, name);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.data?.confirmToken) {
      await sendConfirmationEmail({
        to: result.data.email,
        confirmToken: result.data.confirmToken,
      });
    }

    return NextResponse.json(
      { message: "Check your email to confirm your subscription" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
```

**Step 2: Confirm endpoint**

Create `src/app/api/confirm/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { confirmSubscriber } from "@/lib/subscribers";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
  }

  const result = await confirmSubscriber(token);

  if (!result.success) {
    return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
  }

  return NextResponse.redirect(new URL("/?confirmed=true", request.url));
}
```

**Step 3: Unsubscribe endpoint**

Create `src/app/api/unsubscribe/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/subscribers";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
  }

  const result = await unsubscribeByToken(token);

  if (!result.success) {
    return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
  }

  return NextResponse.redirect(new URL("/?unsubscribed=true", request.url));
}
```

**Step 4: Send endpoint (protected)**

Create `src/app/api/send/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getActiveSubscribers } from "@/lib/subscribers";
import { sendNewsletter } from "@/lib/email";
import { getIssueBySlug } from "@/lib/markdown";
import { prisma } from "@/lib/db";
import { marked } from "marked";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");

  if (apiKey !== process.env.SEND_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { error: "Issue slug is required" },
        { status: 400 }
      );
    }

    const issue = await getIssueBySlug(slug);
    if (!issue) {
      return NextResponse.json(
        { error: "Issue not found" },
        { status: 404 }
      );
    }

    const subscribers = await getActiveSubscribers();
    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No active subscribers" },
        { status: 400 }
      );
    }

    const htmlContent = await marked(issue.content);

    const result = await sendNewsletter({
      subject: issue.title,
      htmlContent,
      subscribers,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Track that this issue was sent
    await prisma.issue.upsert({
      where: { slug },
      update: { sentAt: new Date() },
      create: {
        slug,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        publishedAt: new Date(issue.date),
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Newsletter sent to ${subscribers.length} subscribers`,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send newsletter" },
      { status: 500 }
    );
  }
}
```

**Step 5: Install marked**

Run:
```bash
npm install marked
```

**Step 6: Verify endpoints start without errors**

Run: `npm run dev`
Test with curl:
```bash
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```
Expected: 201 response.

**Step 7: Commit**

```bash
git add src/app/api/ package.json package-lock.json
git commit -m "feat: add API routes for subscribe, confirm, unsubscribe, and send"
```

---

## Task 7: Website Pages — Landing Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/components/subscribe-form.tsx`
- Create: `src/components/issue-card.tsx`

**Step 1: Create subscribe form component**

Create `src/components/subscribe-form.tsx`:
```tsx
"use client";

import { useState } from "react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error);
        return;
      }

      setStatus("success");
      setMessage(data.message);
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:gap-2 w-full max-w-md">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        disabled={status === "loading"}
        className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-lg bg-black px-6 py-3 text-base font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {status === "loading" ? "Subscribing..." : "Subscribe"}
      </button>
      {status === "success" && (
        <p className="text-green-600 text-sm sm:col-span-2">{message}</p>
      )}
      {status === "error" && (
        <p className="text-red-600 text-sm sm:col-span-2">{message}</p>
      )}
    </form>
  );
}
```

**Step 2: Create issue card component**

Create `src/components/issue-card.tsx`:
```tsx
import Link from "next/link";
import type { IssueMeta } from "@/lib/markdown";

const CATEGORY_COLORS: Record<string, string> = {
  AI: "bg-purple-100 text-purple-800",
  SOFTWARE_ENGINEERING: "bg-blue-100 text-blue-800",
  ENGINEERING_MANAGEMENT: "bg-green-100 text-green-800",
};

export function IssueCard({ issue }: { issue: IssueMeta }) {
  return (
    <Link
      href={`/issues/${issue.slug}`}
      className="block rounded-lg border border-gray-200 p-6 hover:border-gray-400 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-medium px-2 py-1 rounded ${CATEGORY_COLORS[issue.category] || "bg-gray-100 text-gray-800"}`}>
          {issue.category.replace(/_/g, " ")}
        </span>
        <span className="text-sm text-gray-500">{issue.date}</span>
        <span className="text-sm text-gray-400">{issue.readingTime}</span>
      </div>
      <h3 className="text-xl font-semibold mb-1">{issue.title}</h3>
      <p className="text-gray-600">{issue.description}</p>
    </Link>
  );
}
```

**Step 3: Update layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tech Newsletter — AI, Software Engineering & Engineering Management",
  description:
    "A twice-weekly newsletter for senior engineers and tech leads covering AI, software engineering, and engineering management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
```

**Step 4: Build landing page**

Replace `src/app/page.tsx`:
```tsx
import { getAllIssues } from "@/lib/markdown";
import { SubscribeForm } from "@/components/subscribe-form";
import { IssueCard } from "@/components/issue-card";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string; unsubscribed?: string; error?: string }>;
}) {
  const params = await searchParams;
  const issues = await getAllIssues();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* Status messages */}
      {params.confirmed && (
        <div className="mb-8 rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
          You&apos;re confirmed! Welcome to the newsletter.
        </div>
      )}
      {params.unsubscribed && (
        <div className="mb-8 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-yellow-800">
          You&apos;ve been unsubscribed. Sorry to see you go.
        </div>
      )}

      {/* Hero */}
      <section className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          AI, Software Engineering &<br />Engineering Management
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          A twice-weekly newsletter for senior engineers and tech leads.
          Original deep-dives and curated insights — no fluff.
        </p>
        <SubscribeForm />
      </section>

      {/* Latest Issues */}
      {issues.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Latest Issues</h2>
          <div className="flex flex-col gap-4">
            {issues.slice(0, 10).map((issue) => (
              <IssueCard key={issue.slug} issue={issue} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

**Step 5: Verify**

Run: `npm run dev`
Visit `http://localhost:3000` — landing page with subscribe form and latest issues.

**Step 6: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx src/components/
git commit -m "feat: add landing page with subscribe form and issue cards"
```

---

## Task 8: Website Pages — Archive & Issue Detail

**Files:**
- Create: `src/app/archive/page.tsx`
- Create: `src/app/issues/[slug]/page.tsx`

**Step 1: Archive page**

Create `src/app/archive/page.tsx`:
```tsx
import { getAllIssues } from "@/lib/markdown";
import { IssueCard } from "@/components/issue-card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive — Newsletter",
  description: "Browse all past newsletter issues.",
};

export default async function ArchivePage() {
  const issues = await getAllIssues();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-gray-500 hover:text-black mb-8 inline-block">
        &larr; Home
      </Link>
      <h1 className="text-3xl font-bold mb-8">Archive</h1>
      {issues.length === 0 ? (
        <p className="text-gray-500">No issues published yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {issues.map((issue) => (
            <IssueCard key={issue.slug} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Issue detail page**

Create `src/app/issues/[slug]/page.tsx`:
```tsx
import { getIssueBySlug, getAllIssues } from "@/lib/markdown";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const issues = await getAllIssues();
  return issues.map((issue) => ({ slug: issue.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);
  if (!issue) return {};
  return {
    title: `${issue.title} — Newsletter`,
    description: issue.description,
  };
}

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);

  if (!issue) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/archive" className="text-sm text-gray-500 hover:text-black mb-8 inline-block">
        &larr; Archive
      </Link>
      <article>
        <header className="mb-8">
          <span className="text-sm text-gray-500">
            {issue.date} &middot; {issue.readingTime} &middot; {issue.category.replace(/_/g, " ")}
          </span>
          <h1 className="text-3xl font-bold mt-2 mb-2">{issue.title}</h1>
          <p className="text-lg text-gray-600">{issue.description}</p>
        </header>
        <div className="prose prose-lg max-w-none">
          <MDXRemote source={issue.content} />
        </div>
      </article>
    </div>
  );
}
```

**Step 3: Install prose plugin**

Run:
```bash
npm install @tailwindcss/typography
```

Add to `tailwind.config.ts` plugins array:
```typescript
plugins: [require("@tailwindcss/typography")],
```

**Step 4: Verify**

Run: `npm run dev`
- Visit `/archive` — shows list of issues.
- Visit `/issues/2026-03-03-welcome` — renders the sample issue.

**Step 5: Commit**

```bash
git add src/app/archive/ src/app/issues/ tailwind.config.ts package.json package-lock.json
git commit -m "feat: add archive and issue detail pages with MDX rendering"
```

---

## Task 9: Rate Limiting & Security

**Files:**
- Create: `src/lib/rate-limit.ts`
- Create: `src/lib/rate-limit.test.ts`
- Modify: `src/app/api/subscribe/route.ts`

**Step 1: Write rate limiter tests**

Create `src/lib/rate-limit.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ windowMs: 1000, maxRequests: 3 });
  });

  it("allows requests within the limit", () => {
    expect(limiter.check("ip-1")).toBe(true);
    expect(limiter.check("ip-1")).toBe(true);
    expect(limiter.check("ip-1")).toBe(true);
  });

  it("blocks requests over the limit", () => {
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-1");
    expect(limiter.check("ip-1")).toBe(false);
  });

  it("tracks different keys independently", () => {
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-1");
    expect(limiter.check("ip-2")).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/rate-limit.test.ts`
Expected: FAIL.

**Step 3: Implement rate limiter**

Create `src/lib/rate-limit.ts`:
```typescript
interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor({ windowMs, maxRequests }: RateLimitOptions) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }
}

// Subscribe endpoint: 5 requests per minute per IP
export const subscribeLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
});
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/rate-limit.test.ts`
Expected: PASS.

**Step 5: Add rate limiting to subscribe route**

Update `src/app/api/subscribe/route.ts` — add at the top of the POST handler before processing:
```typescript
import { subscribeLimiter } from "@/lib/rate-limit";

// Inside POST handler, before try block:
const ip = request.headers.get("x-forwarded-for") || "unknown";
if (!subscribeLimiter.check(ip)) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429 }
  );
}
```

**Step 6: Commit**

```bash
git add src/lib/rate-limit.ts src/lib/rate-limit.test.ts src/app/api/subscribe/route.ts
git commit -m "feat: add rate limiting to subscribe endpoint"
```

---

## Task 10: CLI Send Script

**Files:**
- Create: `scripts/send.sh`

**Step 1: Create send script**

Create `scripts/send.sh`:
```bash
#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/send.sh <issue-slug>"
  echo ""
  echo "Example: ./scripts/send.sh 2026-03-03-welcome"
  exit 1
fi

SLUG="$1"
API_URL="${SITE_URL:-http://localhost:3000}"
API_KEY="${SEND_API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "Error: SEND_API_KEY environment variable is not set"
  exit 1
fi

echo "Sending issue: $SLUG"
echo "API URL: $API_URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/send" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{\"slug\": \"$SLUG\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "Success: $BODY"
else
  echo "Error ($HTTP_CODE): $BODY"
  exit 1
fi
```

**Step 2: Make executable**

Run:
```bash
chmod +x scripts/send.sh
```

**Step 3: Commit**

```bash
git add scripts/
git commit -m "feat: add CLI send script for triggering newsletter delivery"
```

---

## Task 11: Final Verification

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

**Step 2: Run build**

Run: `npm run build`
Expected: Production build succeeds.

**Step 3: Manual smoke test**

1. Start dev server: `npm run dev`
2. Visit `/` — landing page renders
3. Subscribe with a test email
4. Check terminal/Resend dashboard for confirmation email
5. Visit `/archive` — shows issues
6. Visit `/issues/2026-03-03-welcome` — renders issue

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: final verification and cleanup"
```
