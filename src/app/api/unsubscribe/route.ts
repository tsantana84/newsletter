import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/subscribers";
import { tokenLimiter, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!tokenLimiter.check(ip)) {
    return NextResponse.redirect(new URL("/?error=rate-limited", request.url));
  }

  const token = request.nextUrl.searchParams.get("token");

  if (!token || typeof token !== "string" || token.length > 128) {
    return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
  }

  const result = await unsubscribeByToken(token);

  if (!result.success) {
    return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
  }

  return NextResponse.redirect(new URL("/?unsubscribed=true", request.url));
}
