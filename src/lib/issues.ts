import { supabase } from "./db";

export async function trackIssueSent(issue: {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
}) {
  const { error } = await supabase.from("issues").upsert(
    {
      slug: issue.slug,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      published_at: new Date(issue.date).toISOString(),
      sent_at: new Date().toISOString(),
    },
    { onConflict: "slug" }
  );

  return error
    ? { success: false as const, error: "Failed to track issue" }
    : { success: true as const };
}
