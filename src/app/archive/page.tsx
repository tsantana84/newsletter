import { getAllIssues } from "@/lib/markdown";
import { IssueCard } from "@/components/issue-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive | Inference",
  description: "Browse all past Inference issues.",
};

export default async function ArchivePage() {
  const issues = await getAllIssues();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="cursor-pointer inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-10 transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-slate-50 mb-8">Archive</h1>
      {issues.length === 0 ? (
        <p className="text-slate-500">No issues published yet.</p>
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
