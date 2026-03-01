import { getIssueBySlug, getAllIssues } from "@/lib/markdown";
import { getCategoryStyle } from "@/lib/categories";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";

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
    title: `${issue.title} — Inference`,
    description: issue.description,
  };
}

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);

  if (!issue) notFound();

  const style = getCategoryStyle(issue.category);

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
