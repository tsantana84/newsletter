import { getAllIssues } from "@/lib/markdown";
import { SubscribeForm } from "@/components/subscribe-form";
import { IssueCard } from "@/components/issue-card";
import { Zap, BookOpen, Users } from "lucide-react";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string; unsubscribed?: string; error?: string }>;
}) {
  const params = await searchParams;
  const issues = await getAllIssues();

  return (
    <div className="min-h-screen">
      {/* Notification toasts */}
      {params.confirmed && (
        <div className="fixed top-6 right-6 z-50 rounded-xl border border-green-500/30 bg-green-500/10 backdrop-blur-sm px-5 py-3 text-green-300 text-sm animate-fade-in">
          Welcome! You&apos;re now subscribed.
        </div>
      )}
      {params.unsubscribed && (
        <div className="fixed top-6 right-6 z-50 rounded-xl border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm px-5 py-3 text-yellow-300 text-sm animate-fade-in">
          You&apos;ve been unsubscribed.
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F172A]" />

        <div className="relative mx-auto max-w-3xl px-6 pt-32 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-4 py-1.5 text-xs text-slate-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Twice weekly for senior engineers
          </div>

          <h1 className="font-[family-name:var(--font-heading)] text-5xl sm:text-6xl font-bold tracking-tight text-slate-50 mb-6 leading-[1.1]">
            <span className="text-green-400">Inference</span>
            <br />
            <span className="text-3xl sm:text-4xl text-slate-300">AI-powered Software Engineering &amp; Management</span>
          </h1>

          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
            How engineers and engineering leaders leverage AI to ship better software, faster. Deep-dives and curated insights — no fluff.
          </p>

          <div className="flex justify-center">
            <SubscribeForm />
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
              <Zap className="h-5 w-5 text-violet-400" />
            </div>
            <h3 className="font-[family-name:var(--font-heading)] font-semibold text-slate-50 mb-1">AI &amp; LLMs</h3>
            <p className="text-sm text-slate-500">Agents, models, prompting, and production AI systems.</p>
          </div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
              <BookOpen className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="font-[family-name:var(--font-heading)] font-semibold text-slate-50 mb-1">AI + Engineering</h3>
            <p className="text-sm text-slate-500">AI-assisted development, coding agents, and evolving workflows.</p>
          </div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="font-[family-name:var(--font-heading)] font-semibold text-slate-50 mb-1">AI + Leadership</h3>
            <p className="text-sm text-slate-500">Leading teams in the AI era — strategy, adoption, and org transformation.</p>
          </div>
        </div>
      </section>

      {/* Latest Issues */}
      {issues.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 pb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-slate-50">Latest Issues</h2>
            <a href="/archive" className="cursor-pointer text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200">
              View all &rarr;
            </a>
          </div>
          <div className="flex flex-col gap-4">
            {issues.slice(0, 10).map((issue) => (
              <IssueCard key={issue.slug} issue={issue} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm text-slate-600">
            Inference — Built for engineers who ship.
          </p>
        </div>
      </footer>
    </div>
  );
}
