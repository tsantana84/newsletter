import { prisma } from "./db";
import { validateEmail } from "./validation";
import crypto from "crypto";

type Result = { success: true; data?: any } | { success: false; error: string };

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSubscriber(
  email: string,
  name?: string
): Promise<Result> {
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
      return {
        success: false,
        error: "Confirmation email already sent. Check your inbox.",
      };
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
