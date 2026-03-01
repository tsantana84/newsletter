import { NextRequest, NextResponse } from "next/server";
import { createSubscriber } from "@/lib/subscribers";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
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
