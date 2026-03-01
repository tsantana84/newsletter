import { describe, it, expect } from "vitest";
import { getCategoryStyle, CATEGORY_STYLES } from "./categories";

describe("getCategoryStyle", () => {
  it("returns violet style for AI", () => {
    const style = getCategoryStyle("AI");
    expect(style.text).toBe("text-violet-400");
    expect(style.bg).toContain("violet");
  });

  it("returns blue style for SOFTWARE_ENGINEERING", () => {
    const style = getCategoryStyle("SOFTWARE_ENGINEERING");
    expect(style.text).toBe("text-blue-400");
  });

  it("returns green style for ENGINEERING_MANAGEMENT", () => {
    const style = getCategoryStyle("ENGINEERING_MANAGEMENT");
    expect(style.text).toBe("text-green-400");
  });

  it("returns default slate style for unknown category", () => {
    const style = getCategoryStyle("UNKNOWN");
    expect(style.text).toBe("text-slate-400");
    expect(style.bg).toContain("slate");
    expect(style.dot).toContain("slate");
  });

  it("has all three expected categories", () => {
    expect(Object.keys(CATEGORY_STYLES)).toEqual([
      "AI",
      "SOFTWARE_ENGINEERING",
      "ENGINEERING_MANAGEMENT",
    ]);
  });
});
