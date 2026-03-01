import { getAllIssues } from "@/lib/markdown";
import { SubscribeForm } from "@/components/subscribe-form";
import { IssueCard } from "@/components/issue-card";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string; unsubscribed?: string; error?: string }>;
}) {
  const params = await searchParams;
  const issues = await getAllIssues();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {params.confirmed && (
        <div className="mb-8 rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
          You&apos;re confirmed! Welcome to the newsletter.
        </div>
      )}
      {params.unsubscribed && (
        <div className="mb-8 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-yellow-800">
          You&apos;ve been unsubscribed. Sorry to see you go.
        </div>
      )}

      <section className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          AI, Software Engineering &<br />Engineering Management
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          A twice-weekly newsletter for senior engineers and tech leads.
          Original deep-dives and curated insights — no fluff.
        </p>
        <SubscribeForm />
      </section>

      {issues.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Latest Issues</h2>
          <div className="flex flex-col gap-4">
            {issues.slice(0, 10).map((issue) => (
              <IssueCard key={issue.slug} issue={issue} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
