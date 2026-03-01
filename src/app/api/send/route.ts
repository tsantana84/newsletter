import { NextRequest, NextResponse } from "next/server";
import { getActiveSubscribers } from "@/lib/subscribers";
import { sendNewsletter } from "@/lib/email";
import { getIssueBySlug } from "@/lib/markdown";
import { trackIssueSent } from "@/lib/issues";
import { sendLimiter, getClientIp } from "@/lib/rate-limit";
import { marked } from "marked";
import crypto from "crypto";
import DOMPurify from "isomorphic-dompurify";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function safeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (!sendLimiter.check(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const apiKey = request.headers.get("x-api-key") || "";

  if (!safeCompare(apiKey, process.env.SEND_API_KEY || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug || typeof slug !== "string" || !SLUG_REGEX.test(slug)) {
      return NextResponse.json({ error: "Invalid issue slug" }, { status: 400 });
    }

    const issue = await getIssueBySlug(slug);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const subscribersResult = await getActiveSubscribers();
    if (!subscribersResult.success) {
      return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
    }
    if (subscribersResult.data.length === 0) {
      return NextResponse.json({ error: "No active subscribers" }, { status: 400 });
    }

    const rawHtml = await marked(issue.content);
    const htmlContent = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        "h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "ul", "ol", "li",
        "strong", "em", "code", "pre", "blockquote", "hr", "br", "img",
        "table", "thead", "tbody", "tr", "th", "td",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title"],
    });

    const result = await sendNewsletter({
      subject: issue.title,
      slug,
      htmlContent,
      subscribers: subscribersResult.data,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await trackIssueSent(issue);

    return NextResponse.json({
      message: `Newsletter sent to ${subscribersResult.data.length} subscribers`,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send newsletter" },
      { status: 500 }
    );
  }
}
