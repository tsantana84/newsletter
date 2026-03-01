import { describe, it, expect, vi, beforeEach } from "vitest";

// Chainable mock builder for Supabase query API
function createChainMock(resolvedValue: any = { data: null, error: null }) {
  const chain: any = {};
  const methods = ["select", "insert", "update", "eq", "single"];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  // Terminal method returns the resolved value
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  return chain;
}

let mockChain: any;

vi.mock("./db", () => ({
  supabase: {
    from: vi.fn(() => mockChain),
  },
}));

import { createSubscriber, confirmSubscriber, unsubscribeByToken } from "./subscribers";
import { supabase } from "./db";

describe("createSubscriber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockImplementation(() => mockChain);
  });

  it("creates a new subscriber with PENDING status", async () => {
    // First call: select (existing check) returns null (no match)
    const selectChain = createChainMock({ data: null, error: { code: "PGRST116" } });
    // Second call: insert returns new subscriber
    const insertChain = createChainMock({
      data: {
        id: "test-id",
        email: "test@example.com",
        confirm_token: "token-123",
        status: "PENDING",
      },
      error: null,
    });

    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : insertChain;
    });

    const result = await createSubscriber("test@example.com");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confirmToken).toBe("token-123");
    }
  });

  it("returns error for invalid email", async () => {
    mockChain = createChainMock();
    const result = await createSubscriber("invalid");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid email address");
    }
  });

  it("returns error for already-active subscriber", async () => {
    mockChain = createChainMock({
      data: { status: "ACTIVE", email: "test@example.com" },
      error: null,
    });

    const result = await createSubscriber("test@example.com");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Already subscribed");
    }
  });

  it("returns error for pending subscriber", async () => {
    mockChain = createChainMock({
      data: { status: "PENDING", email: "test@example.com", confirm_token: "token-123" },
      error: null,
    });

    const result = await createSubscriber("test@example.com");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Confirmation email already sent. Check your inbox.");
    }
  });

  it("allows re-subscribe for unsubscribed user", async () => {
    // First call: select returns unsubscribed user
    const selectChain = createChainMock({
      data: {
        id: "existing",
        email: "test@example.com",
        status: "UNSUBSCRIBED",
        confirm_token: null,
        unsubscribe_token: "unsub-123",
      },
      error: null,
    });
    // Second call: update returns re-subscribed user
    const updateChain = createChainMock({
      data: {
        id: "existing",
        email: "test@example.com",
        status: "PENDING",
        confirm_token: "new-token",
        unsubscribe_token: "unsub-123",
      },
      error: null,
    });

    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : updateChain;
    });

    const result = await createSubscriber("test@example.com");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confirmToken).toBe("new-token");
    }
  });

  it("normalizes email to lowercase", async () => {
    // First call: select returns null
    const selectChain = createChainMock({ data: null, error: { code: "PGRST116" } });
    // Second call: insert
    const insertChain = createChainMock({
      data: {
        id: "test-id",
        email: "test@example.com",
        confirm_token: "token-123",
        status: "PENDING",
      },
      error: null,
    });

    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : insertChain;
    });

    await createSubscriber("Test@Example.COM");
    // Verify the eq was called with lowercased email on the select chain
    expect(selectChain.eq).toHaveBeenCalledWith("email", "test@example.com");
  });
});

describe("confirmSubscriber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockImplementation(() => mockChain);
  });

  it("confirms a pending subscriber", async () => {
    const selectChain = createChainMock({
      data: { status: "PENDING", confirm_token: "token-123" },
      error: null,
    });
    const updateChain = createChainMock({
      data: { status: "ACTIVE", confirm_token: null },
      error: null,
    });

    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : updateChain;
    });

    const result = await confirmSubscriber("token-123");
    expect(result.success).toBe(true);
  });

  it("returns error for invalid token", async () => {
    mockChain = createChainMock({ data: null, error: { code: "PGRST116" } });

    const result = await confirmSubscriber("bad-token");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid or expired confirmation link");
    }
  });

  it("returns success for already-active subscriber", async () => {
    mockChain = createChainMock({
      data: {
        status: "ACTIVE",
        confirm_token: "token-123",
        email: "test@example.com",
      },
      error: null,
    });

    const result = await confirmSubscriber("token-123");
    expect(result.success).toBe(true);
    // Should NOT have made a second from() call for update
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(1);
  });
});

describe("unsubscribeByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockImplementation(() => mockChain);
  });

  it("unsubscribes an active subscriber", async () => {
    const selectChain = createChainMock({
      data: { status: "ACTIVE", unsubscribe_token: "unsub-123" },
      error: null,
    });
    const updateChain = createChainMock({
      data: { status: "UNSUBSCRIBED" },
      error: null,
    });

    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? selectChain : updateChain;
    });

    const result = await unsubscribeByToken("unsub-123");
    expect(result.success).toBe(true);
  });

  it("returns error for invalid token", async () => {
    mockChain = createChainMock({ data: null, error: { code: "PGRST116" } });

    const result = await unsubscribeByToken("bad-token");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid unsubscribe link");
    }
  });

  it("returns success for already-unsubscribed subscriber", async () => {
    mockChain = createChainMock({
      data: {
        status: "UNSUBSCRIBED",
        unsubscribe_token: "unsub-123",
      },
      error: null,
    });

    const result = await unsubscribeByToken("unsub-123");
    expect(result.success).toBe(true);
    // Should NOT have made a second from() call for update
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(1);
  });
});
