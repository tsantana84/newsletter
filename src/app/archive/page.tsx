import { getAllIssues } from "@/lib/markdown";
import { IssueCard } from "@/components/issue-card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive — Newsletter",
  description: "Browse all past newsletter issues.",
};

export default async function ArchivePage() {
  const issues = await getAllIssues();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-gray-500 hover:text-black mb-8 inline-block">
        &larr; Home
      </Link>
      <h1 className="text-3xl font-bold mb-8">Archive</h1>
      {issues.length === 0 ? (
        <p className="text-gray-500">No issues published yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {issues.map((issue) => (
            <IssueCard key={issue.slug} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
