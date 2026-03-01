import { NextRequest, NextResponse } from "next/server";
import { createSubscriber } from "@/lib/subscribers";
import { sendConfirmationEmail } from "@/lib/email";
import { subscribeLimiter, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // CSRF: verify origin matches our site
  const origin = request.headers.get("origin");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (origin && siteUrl && !origin.startsWith(siteUrl)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!subscribeLimiter.check(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await createSubscriber(email, name);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.data?.confirmToken) {
      const emailResult = await sendConfirmationEmail({
        to: result.data.email,
        confirmToken: result.data.confirmToken,
      });
      if (!emailResult.success) {
        console.error("Failed to send confirmation email:", emailResult.error);
      }
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
