export const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  AI: { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
  SOFTWARE_ENGINEERING: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  ENGINEERING_MANAGEMENT: { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
};

const DEFAULT_STYLE = { bg: "bg-slate-500/10", text: "text-slate-400", dot: "bg-slate-400" };

export function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
}
