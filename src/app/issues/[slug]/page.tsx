import { getIssueBySlug, getAllIssues } from "@/lib/markdown";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    title: `${issue.title} — Newsletter`,
    description: issue.description,
  };
}

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);

  if (!issue) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/archive" className="text-sm text-gray-500 hover:text-black mb-8 inline-block">
        &larr; Archive
      </Link>
      <article>
        <header className="mb-8">
          <span className="text-sm text-gray-500">
            {issue.date} &middot; {issue.readingTime} &middot; {issue.category.replace(/_/g, " ")}
          </span>
          <h1 className="text-3xl font-bold mt-2 mb-2">{issue.title}</h1>
          <p className="text-lg text-gray-600">{issue.description}</p>
        </header>
        <div className="prose prose-lg max-w-none">
          <MDXRemote source={issue.content} />
        </div>
      </article>
    </div>
  );
}
