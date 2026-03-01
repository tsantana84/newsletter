import { supabase } from "./db";
import { validateEmail } from "./validation";
import type { Result } from "./types";
import crypto from "crypto";

export const SubscriberStatus = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  UNSUBSCRIBED: "UNSUBSCRIBED",
} as const;

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSubscriber(
  email: string,
  name?: string
): Promise<Result<{ email: string; confirmToken: string }>> {
  if (!validateEmail(email)) {
    return { success: false, error: "Invalid email address" };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const sanitizedName = name ? name.trim().slice(0, 100) : null;

  const { data: existing } = await supabase
    .from("subscribers")
    .select("*")
    .eq("email", normalizedEmail)
    .single();

  if (existing) {
    if (existing.status === SubscriberStatus.ACTIVE) {
      return { success: false, error: "Already subscribed" };
    }
    if (existing.status === SubscriberStatus.PENDING) {
      return {
        success: false,
        error: "Confirmation email already sent. Check your inbox.",
      };
    }
    // UNSUBSCRIBED — allow re-subscribe
    const confirmToken = generateToken();
    const { data: updated, error } = await supabase
      .from("subscribers")
      .update({
        status: SubscriberStatus.PENDING,
        confirm_token: confirmToken,
        unsubscribed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("email", normalizedEmail)
      .select()
      .single();

    if (error)
      return { success: false, error: "Failed to process subscription" };
    return {
      success: true,
      data: { email: updated.email, confirmToken: updated.confirm_token },
    };
  }

  const confirmToken = generateToken();
  const { data: subscriber, error } = await supabase
    .from("subscribers")
    .insert({
      email: normalizedEmail,
      name: sanitizedName,
      status: SubscriberStatus.PENDING,
      confirm_token: confirmToken,
    })
    .select()
    .single();

  if (error)
    return { success: false, error: "Failed to process subscription" };
  return {
    success: true,
    data: {
      email: subscriber.email,
      confirmToken: subscriber.confirm_token,
    },
  };
}

export async function confirmSubscriber(token: string): Promise<Result<void>> {
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("*")
    .eq("confirm_token", token)
    .single();

  if (!subscriber) {
    return { success: false, error: "Invalid or expired confirmation link" };
  }

  if (subscriber.status === SubscriberStatus.ACTIVE) {
    return { success: true, data: undefined };
  }

  const { error } = await supabase
    .from("subscribers")
    .update({
      status: SubscriberStatus.ACTIVE,
      confirm_token: null,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("confirm_token", token);

  if (error)
    return { success: false, error: "Failed to confirm subscription" };
  return { success: true, data: undefined };
}

export async function unsubscribeByToken(
  token: string
): Promise<Result<void>> {
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("*")
    .eq("unsubscribe_token", token)
    .single();

  if (!subscriber) {
    return { success: false, error: "Invalid unsubscribe link" };
  }

  if (subscriber.status === SubscriberStatus.UNSUBSCRIBED) {
    return { success: true, data: undefined };
  }

  const { error } = await supabase
    .from("subscribers")
    .update({
      status: SubscriberStatus.UNSUBSCRIBED,
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("unsubscribe_token", token);

  if (error) return { success: false, error: "Failed to unsubscribe" };
  return { success: true, data: undefined };
}

interface ActiveSubscriber {
  email: string;
  name: string | null;
  unsubscribeToken: string;
}

export async function getActiveSubscribers(): Promise<
  Result<ActiveSubscriber[]>
> {
  const { data, error } = await supabase
    .from("subscribers")
    .select("email, name, unsubscribe_token")
    .eq("status", SubscriberStatus.ACTIVE);

  if (error)
    return { success: false, error: "Failed to fetch subscribers" };
  return {
    success: true,
    data: data.map((s) => ({
      email: s.email,
      name: s.name,
      unsubscribeToken: s.unsubscribe_token,
    })),
  };
}
