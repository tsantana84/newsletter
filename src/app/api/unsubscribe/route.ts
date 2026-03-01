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
