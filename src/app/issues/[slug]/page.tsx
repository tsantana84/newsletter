import { getIssueBySlug, getAllIssues } from "@/lib/markdown";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  AI: { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
  SOFTWARE_ENGINEERING: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  ENGINEERING_MANAGEMENT: { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const issues = await getAllIssues();
  return issues.map((issue) => ({ slug: issue.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);
  if (!issue) return {};
  return {
    title: `${issue.title} — Newsletter`,
    description: issue.description,
  };
}

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);

  if (!issue) notFound();

  const style = CATEGORY_STYLES[issue.category] || { bg: "bg-slate-500/10", text: "text-slate-400", dot: "bg-slate-400" };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/archive"
        className="cursor-pointer inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-10 transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Archive
      </Link>
      <article>
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              {issue.category.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-slate-500">{issue.date}</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {issue.readingTime}
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold text-slate-50 mb-4 leading-tight">
            {issue.title}
          </h1>
          <p className="text-lg text-slate-400">{issue.description}</p>
        </header>
        <div className="prose prose-lg max-w-none">
          <MDXRemote source={issue.content} />
        </div>
      </article>
    </div>
  );
}
