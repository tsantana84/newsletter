import { describe, it, expect } from "vitest";
import { parseIssue, getAllIssues, getIssueBySlug } from "./markdown";

describe("parseIssue", () => {
  it("parses frontmatter and content from markdown", () => {
    const raw = `---
title: "Test Issue"
description: "A test issue"
category: AI
date: 2026-03-03
---

# Hello World

This is the content.`;

    const result = parseIssue(raw, "test-issue");
    expect(result.title).toBe("Test Issue");
    expect(result.description).toBe("A test issue");
    expect(result.category).toBe("AI");
    expect(result.slug).toBe("test-issue");
    expect(result.content).toContain("# Hello World");
  });
});

describe("getAllIssues", () => {
  it("returns an array of issues sorted by date descending", async () => {
    const issues = await getAllIssues();
    expect(Array.isArray(issues)).toBe(true);
    if (issues.length > 1) {
      const dates = issues.map((i) => new Date(i.date).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    }
  });
});

describe("getIssueBySlug", () => {
  it("returns null for non-existent slug", async () => {
    const result = await getIssueBySlug("non-existent-slug-12345");
    expect(result).toBeNull();
  });
});
