import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSubscriber, confirmSubscriber, unsubscribeByToken } from "./subscribers";

// Mock the db module
vi.mock("./db", () => ({
  prisma: {
    subscriber: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "./db";
const mockPrisma = vi.mocked(prisma);

describe("createSubscriber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new subscriber with PENDING status", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue(null);
    mockPrisma.subscriber.create.mockResolvedValue({
      id: "test-id",
      email: "test@example.com",
      name: null,
      status: "PENDING",
      confirmToken: "token-123",
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: null,
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createSubscriber("test@example.com");
    expect(result.success).toBe(true);
    expect(mockPrisma.subscriber.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "test@example.com",
        status: "PENDING",
      }),
    });
  });

  it("returns error for invalid email", async () => {
    const result = await createSubscriber("invalid");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid email address");
    }
  });

  it("returns error for already-active subscriber", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue({
      id: "existing",
      email: "test@example.com",
      name: null,
      status: "ACTIVE",
      confirmToken: null,
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: new Date(),
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createSubscriber("test@example.com");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Already subscribed");
    }
  });

  it("returns error for pending subscriber", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue({
      id: "existing",
      email: "test@example.com",
      name: null,
      status: "PENDING",
      confirmToken: "token-123",
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: null,
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createSubscriber("test@example.com");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Confirmation email already sent. Check your inbox."
      );
    }
  });

  it("allows re-subscribe for unsubscribed user", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue({
      id: "existing",
      email: "test@example.com",
      name: null,
      status: "UNSUBSCRIBED",
      confirmToken: null,
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: new Date(),
      unsubscribedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.subscriber.update.mockResolvedValue({
      id: "existing",
      email: "test@example.com",
      name: null,
      status: "PENDING",
      confirmToken: "new-token",
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: new Date(),
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createSubscriber("test@example.com");
    expect(result.success).toBe(true);
    expect(mockPrisma.subscriber.update).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      data: expect.objectContaining({
        status: "PENDING",
        unsubscribedAt: null,
      }),
    });
  });

  it("normalizes email to lowercase", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue(null);
    mockPrisma.subscriber.create.mockResolvedValue({
      id: "test-id",
      email: "test@example.com",
      name: null,
      status: "PENDING",
      confirmToken: "token-123",
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: null,
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await createSubscriber("Test@Example.COM");
    expect(mockPrisma.subscriber.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
  });
});

describe("confirmSubscriber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms a pending subscriber", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue({
      id: "test-id",
      email: "test@example.com",
      name: null,
      status: "PENDING",
      confirmToken: "token-123",
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: null,
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.subscriber.update.mockResolvedValue({} as any);

    const result = await confirmSubscriber("token-123");
    expect(result.success).toBe(true);
    expect(mockPrisma.subscriber.update).toHaveBeenCalledWith({
      where: { confirmToken: "token-123" },
      data: expect.objectContaining({ status: "ACTIVE", confirmToken: null }),
    });
  });

  it("returns error for invalid token", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue(null);

    const result = await confirmSubscriber("bad-token");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid or expired confirmation link");
    }
  });

  it("returns success for already-active subscriber", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue({
      id: "test-id",
      email: "test@example.com",
      name: null,
      status: "ACTIVE",
      confirmToken: "token-123",
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: new Date(),
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await confirmSubscriber("token-123");
    expect(result.success).toBe(true);
    expect(mockPrisma.subscriber.update).not.toHaveBeenCalled();
  });
});

describe("unsubscribeByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unsubscribes an active subscriber", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue({
      id: "test-id",
      email: "test@example.com",
      name: null,
      status: "ACTIVE",
      confirmToken: null,
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: new Date(),
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.subscriber.update.mockResolvedValue({} as any);

    const result = await unsubscribeByToken("unsub-123");
    expect(result.success).toBe(true);
    expect(mockPrisma.subscriber.update).toHaveBeenCalledWith({
      where: { unsubscribeToken: "unsub-123" },
      data: expect.objectContaining({ status: "UNSUBSCRIBED" }),
    });
  });

  it("returns error for invalid token", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue(null);

    const result = await unsubscribeByToken("bad-token");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid unsubscribe link");
    }
  });

  it("returns success for already-unsubscribed subscriber", async () => {
    mockPrisma.subscriber.findUnique.mockResolvedValue({
      id: "test-id",
      email: "test@example.com",
      name: null,
      status: "UNSUBSCRIBED",
      confirmToken: null,
      unsubscribeToken: "unsub-123",
      subscribedAt: new Date(),
      confirmedAt: new Date(),
      unsubscribedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await unsubscribeByToken("unsub-123");
    expect(result.success).toBe(true);
    expect(mockPrisma.subscriber.update).not.toHaveBeenCalled();
  });
});
