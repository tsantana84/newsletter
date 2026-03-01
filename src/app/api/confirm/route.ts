import { NextRequest, NextResponse } from "next/server";
import { confirmSubscriber } from "@/lib/subscribers";
import { tokenLimiter, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  if (!tokenLimiter.check(ip)) {
    logger.warn("confirm.rate_limited", { ip });
    return NextResponse.redirect(new URL("/?error=rate-limited", request.url));
  }

  const token = request.nextUrl.searchParams.get("token");

  if (!token || typeof token !== "string" || token.length > 128) {
    logger.warn("confirm.invalid_token", { ip });
    return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
  }

  const result = await confirmSubscriber(token);

  if (!result.success) {
    logger.warn("confirm.failed", { ip, error: result.error });
    return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
  }

  logger.info("confirm.success", { ip });
  return NextResponse.redirect(new URL("/?confirmed=true", request.url));
}
