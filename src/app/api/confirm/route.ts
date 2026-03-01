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
