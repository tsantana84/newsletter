import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import type { IssueMeta } from "@/lib/markdown";
import { getCategoryStyle } from "@/lib/categories";

export function IssueCard({ issue }: { issue: IssueMeta }) {
  const style = getCategoryStyle(issue.category);

  return (
    <Link
      href={`/issues/${issue.slug}`}
      className="group cursor-pointer block rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 hover:border-slate-600 hover:bg-slate-800 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {issue.category.replace(/_/g, " ")}
          </span>
          <span className="text-xs text-slate-500">{issue.date}</span>
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors duration-200" />
      </div>
      <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-50 mb-1.5 group-hover:text-green-400 transition-colors duration-200">
        {issue.title}
      </h3>
      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{issue.description}</p>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Clock className="h-3.5 w-3.5" />
        {issue.readingTime}
      </div>
    </Link>
  );
}
