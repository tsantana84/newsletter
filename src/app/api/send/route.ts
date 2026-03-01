import { NextRequest, NextResponse } from "next/server";
import { getActiveSubscribers } from "@/lib/subscribers";
import { sendNewsletter } from "@/lib/email";
import { getIssueBySlug } from "@/lib/markdown";
import { supabase } from "@/lib/db";
import { sendLimiter } from "@/lib/rate-limit";
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
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

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
      return NextResponse.json(
        { error: "Invalid issue slug" },
        { status: 400 }
      );
    }

    const issue = await getIssueBySlug(slug);

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const subscribers = await getActiveSubscribers();

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No active subscribers" },
        { status: 400 }
      );
    }

    const rawHtml = await marked(issue.content);
    const htmlContent = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ["h1","h2","h3","h4","h5","h6","p","a","ul","ol","li",
        "strong","em","code","pre","blockquote","hr","br","img","table",
        "thead","tbody","tr","th","td"],
      ALLOWED_ATTR: ["href","src","alt","title"],
    });

    const result = await sendNewsletter({
      subject: issue.title,
      htmlContent,
      subscribers,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Track that this issue was sent
    const { data: existingIssue } = await supabase
      .from("issues")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingIssue) {
      await supabase
        .from("issues")
        .update({ sent_at: new Date().toISOString() })
        .eq("slug", slug);
    } else {
      await supabase
        .from("issues")
        .insert({
          slug,
          title: issue.title,
          description: issue.description,
          category: issue.category,
          published_at: new Date(issue.date).toISOString(),
          sent_at: new Date().toISOString(),
        });
    }

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
