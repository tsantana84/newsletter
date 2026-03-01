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

  it("sends a confirmation email with the correct token link", async () => {
    const result = await sendConfirmationEmail({
      to: "test@example.com",
      confirmToken: "token-abc",
    });
    expect(result.success).toBe(true);
  });
});

describe("sendNewsletter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends newsletter to a list of subscribers", async () => {
    const result = await sendNewsletter({
      subject: "Test Issue",
      htmlContent: "<h1>Hello</h1>",
      subscribers: [
        { email: "a@example.com", unsubscribeToken: "unsub-a" },
        { email: "b@example.com", unsubscribeToken: "unsub-b" },
      ],
    });
    expect(result.success).toBe(true);
  });
});
