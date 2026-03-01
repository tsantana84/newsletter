import Link from "next/link";
import type { IssueMeta } from "@/lib/markdown";

const CATEGORY_COLORS: Record<string, string> = {
  AI: "bg-purple-100 text-purple-800",
  SOFTWARE_ENGINEERING: "bg-blue-100 text-blue-800",
  ENGINEERING_MANAGEMENT: "bg-green-100 text-green-800",
};

export function IssueCard({ issue }: { issue: IssueMeta }) {
  return (
    <Link
      href={`/issues/${issue.slug}`}
      className="block rounded-lg border border-gray-200 p-6 hover:border-gray-400 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-medium px-2 py-1 rounded ${CATEGORY_COLORS[issue.category] || "bg-gray-100 text-gray-800"}`}>
          {issue.category.replace(/_/g, " ")}
        </span>
        <span className="text-sm text-gray-500">{issue.date}</span>
        <span className="text-sm text-gray-400">{issue.readingTime}</span>
      </div>
      <h3 className="text-xl font-semibold mb-1">{issue.title}</h3>
      <p className="text-gray-600">{issue.description}</p>
    </Link>
  );
}
