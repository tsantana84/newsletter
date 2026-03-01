import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const CONTENT_DIR = path.join(process.cwd(), "content", "issues");

export interface IssueMeta {
  title: string;
  description: string;
  category: string;
  date: string;
  slug: string;
  readingTime: string;
}

export interface Issue extends IssueMeta {
  content: string;
}

export function parseIssue(raw: string, slug: string): Issue {
  const { data, content } = matter(raw);
  return {
    title: data.title,
    description: data.description,
    category: data.category,
    date: data.date instanceof Date ? data.date.toISOString().split("T")[0] : data.date,
    slug,
    readingTime: readingTime(content).text,
    content,
  };
}

export async function getAllIssues(): Promise<IssueMeta[]> {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const issues = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
    const { content, ...meta } = parseIssue(raw, slug);
    return meta;
  });
  return issues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getIssueBySlug(slug: string): Promise<Issue | null> {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return parseIssue(raw, slug);
}
