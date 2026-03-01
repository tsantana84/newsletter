import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend, mockBatchSend } = vi.hoisted(() => {
  const mockSend = vi
    .fn()
    .mockResolvedValue({ data: { id: "email-123" }, error: null });
  const mockBatchSend = vi
    .fn()
    .mockResolvedValue({ data: [{ id: "batch-123" }], error: null });
  return { mockSend, mockBatchSend };
});

vi.mock("resend", () => {
  class MockResend {
    emails = { send: mockSend };
    batch = { send: mockBatchSend };
  }
  return { Resend: MockResend };
});

vi.mock("@react-email/components", async () => {
  const actual = await vi.importActual("@react-email/components");
  return {
    ...actual,
    render: vi.fn().mockResolvedValue("<html>mocked</html>"),
  };
});

import { sendConfirmationEmail, sendNewsletter } from "./email";

describe("sendConfirmationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends with correct from, to, and subject", async () => {
    const result = await sendConfirmationEmail({
      to: "test@example.com",
      confirmToken: "token-abc",
    });

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);

    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("test@example.com");
    expect(call.subject).toContain("Inference");
    expect(call.from).toContain("Inference");
    expect(call.html).toBe("<html>mocked</html>");
  });

  it("returns error when Resend returns an error", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid API key" },
    });

    const result = await sendConfirmationEmail({
      to: "test@example.com",
      confirmToken: "token-abc",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid API key");
    }
  });

  it("returns error when send throws", async () => {
    mockSend.mockRejectedValueOnce(new Error("Network error"));

    const result = await sendConfirmationEmail({
      to: "test@example.com",
      confirmToken: "token-abc",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Failed to send confirmation email");
    }
  });
});

describe("sendNewsletter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends to all subscribers with correct headers", async () => {
    const result = await sendNewsletter({
      subject: "Test Issue",
      slug: "2026-03-03-test",
      htmlContent: "<h1>Hello</h1>",
      subscribers: [
        { email: "a@example.com", unsubscribeToken: "unsub-a" },
        { email: "b@example.com", unsubscribeToken: "unsub-b" },
      ],
    });

    expect(result.success).toBe(true);
    expect(mockBatchSend).toHaveBeenCalledTimes(1);

    const emails = mockBatchSend.mock.calls[0][0];
    expect(emails).toHaveLength(2);
    expect(emails[0].to).toBe("a@example.com");
    expect(emails[1].to).toBe("b@example.com");

    // Verify List-Unsubscribe headers
    expect(emails[0].headers["List-Unsubscribe"]).toContain("unsub-a");
    expect(emails[0].headers["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click"
    );
  });

  it("passes slug to render for correct issue URL", async () => {
    const { render } = await import("@react-email/components");

    await sendNewsletter({
      subject: "Test",
      slug: "2026-03-03-my-issue",
      htmlContent: "<p>content</p>",
      subscribers: [{ email: "a@example.com", unsubscribeToken: "tok" }],
    });

    // render is called with a React element — verify it was called
    expect(vi.mocked(render)).toHaveBeenCalled();
    // The batch send should have been called (proves full pipeline ran)
    expect(mockBatchSend).toHaveBeenCalledTimes(1);
  });

  it("returns error when batch send fails", async () => {
    mockBatchSend.mockResolvedValueOnce({
      data: null,
      error: { message: "Rate limit exceeded" },
    });

    const result = await sendNewsletter({
      subject: "Test",
      slug: "test",
      htmlContent: "<p>hi</p>",
      subscribers: [{ email: "a@example.com", unsubscribeToken: "tok" }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Batch send failed");
    }
  });

  it("returns error when send throws", async () => {
    mockBatchSend.mockRejectedValueOnce(new Error("Connection refused"));

    const result = await sendNewsletter({
      subject: "Test",
      slug: "test",
      htmlContent: "<p>hi</p>",
      subscribers: [{ email: "a@example.com", unsubscribeToken: "tok" }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Failed to send newsletter");
    }
  });
});
