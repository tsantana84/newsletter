import { supabase } from "./db";
import { validateEmail } from "./validation";
import crypto from "crypto";

type Result = { success: true; data?: any } | { success: false; error: string };

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSubscriber(email: string, name?: string): Promise<Result> {
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
    if (existing.status === "ACTIVE") {
      return { success: false, error: "Already subscribed" };
    }
    if (existing.status === "PENDING") {
      return { success: false, error: "Confirmation email already sent. Check your inbox." };
    }
    // UNSUBSCRIBED — allow re-subscribe
    const confirmToken = generateToken();
    const { data: updated, error } = await supabase
      .from("subscribers")
      .update({
        status: "PENDING",
        confirm_token: confirmToken,
        unsubscribed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("email", normalizedEmail)
      .select()
      .single();

    if (error) return { success: false, error: "Failed to process subscription" };
    return { success: true, data: { ...updated, confirmToken: updated.confirm_token } };
  }

  const confirmToken = generateToken();
  const { data: subscriber, error } = await supabase
    .from("subscribers")
    .insert({
      email: normalizedEmail,
      name: sanitizedName,
      status: "PENDING",
      confirm_token: confirmToken,
    })
    .select()
    .single();

  if (error) return { success: false, error: "Failed to process subscription" };
  return { success: true, data: { ...subscriber, confirmToken: subscriber.confirm_token } };
}

export async function confirmSubscriber(token: string): Promise<Result> {
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("*")
    .eq("confirm_token", token)
    .single();

  if (!subscriber) {
    return { success: false, error: "Invalid or expired confirmation link" };
  }

  if (subscriber.status === "ACTIVE") {
    return { success: true, data: subscriber };
  }

  const { data: updated, error } = await supabase
    .from("subscribers")
    .update({
      status: "ACTIVE",
      confirm_token: null,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("confirm_token", token)
    .select()
    .single();

  if (error) return { success: false, error: "Failed to confirm subscription" };
  return { success: true, data: updated };
}

export async function unsubscribeByToken(token: string): Promise<Result> {
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("*")
    .eq("unsubscribe_token", token)
    .single();

  if (!subscriber) {
    return { success: false, error: "Invalid unsubscribe link" };
  }

  if (subscriber.status === "UNSUBSCRIBED") {
    return { success: true, data: subscriber };
  }

  const { data: updated, error } = await supabase
    .from("subscribers")
    .update({
      status: "UNSUBSCRIBED",
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("unsubscribe_token", token)
    .select()
    .single();

  if (error) return { success: false, error: "Failed to unsubscribe" };
  return { success: true, data: updated };
}

export async function getActiveSubscribers() {
  const { data, error } = await supabase
    .from("subscribers")
    .select("email, name, unsubscribe_token")
    .eq("status", "ACTIVE");

  if (error) return [];
  return data.map((s) => ({
    email: s.email,
    name: s.name,
    unsubscribeToken: s.unsubscribe_token,
  }));
}
