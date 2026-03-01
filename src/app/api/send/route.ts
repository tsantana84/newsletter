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
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
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
