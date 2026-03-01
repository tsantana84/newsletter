import { describe, it, expect } from "vitest";
import { validateEmail } from "./validation";

describe("validateEmail", () => {
  it("accepts valid email addresses", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("name+tag@domain.co")).toBe(true);
  });

  it("rejects invalid email addresses", () => {
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("notanemail")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
    expect(validateEmail("user@.com")).toBe(false);
  });

  it("rejects emails that are too long", () => {
    const longEmail = "a".repeat(255) + "@example.com";
    expect(validateEmail(longEmail)).toBe(false);
  });
});
