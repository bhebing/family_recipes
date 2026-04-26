import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    invite: { create: vi.fn(), delete: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

async function setupAdmin() {
  const { auth } = await import("@/auth");
  const { prisma } = await import("@/lib/prisma");
  vi.mocked(auth).mockResolvedValueOnce({ user: { id: "admin1" } } as never);
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ isAdmin: true } as never);
}

async function setupNonAdmin() {
  const { auth } = await import("@/auth");
  const { prisma } = await import("@/lib/prisma");
  vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ isAdmin: false } as never);
}

describe("createInvite", () => {
  beforeEach(() => vi.resetAllMocks());

  it("throws Forbidden for non-admins", async () => {
    await setupNonAdmin();
    const { createInvite } = await import("@/app/actions/invites");
    await expect(createInvite("Voor Jan")).rejects.toThrow("Forbidden");
  });

  it("creates an invite and returns the token", async () => {
    await setupAdmin();
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.invite.create).mockResolvedValueOnce({ token: "tok123" } as never);

    const { createInvite } = await import("@/app/actions/invites");
    const token = await createInvite("Voor Jan");

    expect(token).toBe("tok123");
    expect(prisma.invite.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ note: "Voor Jan", createdById: "admin1" }) })
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/invites");
  });

  it("stores null note when note is blank", async () => {
    await setupAdmin();
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.invite.create).mockResolvedValueOnce({ token: "tok123" } as never);

    const { createInvite } = await import("@/app/actions/invites");
    await createInvite("   ");

    const call = vi.mocked(prisma.invite.create).mock.calls[0][0];
    expect(call.data.note).toBeNull();
  });
});

describe("revokeInvite", () => {
  beforeEach(() => vi.resetAllMocks());

  it("throws Forbidden for non-admins", async () => {
    await setupNonAdmin();
    const { revokeInvite } = await import("@/app/actions/invites");
    await expect(revokeInvite("inv1")).rejects.toThrow("Forbidden");
  });

  it("deletes the invite and revalidates path", async () => {
    await setupAdmin();
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.invite.delete).mockResolvedValueOnce({} as never);

    const { revokeInvite } = await import("@/app/actions/invites");
    await revokeInvite("inv1");

    expect(prisma.invite.delete).toHaveBeenCalledWith({ where: { id: "inv1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/invites");
  });
});

describe("revokeUser", () => {
  beforeEach(() => vi.resetAllMocks());

  it("throws Forbidden for non-admins", async () => {
    await setupNonAdmin();
    const { revokeUser } = await import("@/app/actions/invites");
    await expect(revokeUser("u1")).rejects.toThrow("Forbidden");
  });

  it("throws when target user does not exist", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "admin1" } } as never);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ isAdmin: true } as never)
      .mockResolvedValueOnce(null as never);

    const { revokeUser } = await import("@/app/actions/invites");
    await expect(revokeUser("ghost")).rejects.toThrow("User not found");
  });

  it("throws when trying to revoke an admin", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "admin1" } } as never);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ isAdmin: true } as never)
      .mockResolvedValueOnce({ isAdmin: true } as never);

    const { revokeUser } = await import("@/app/actions/invites");
    await expect(revokeUser("admin2")).rejects.toThrow("Cannot revoke admin users");
  });

  it("revokes user access and revalidates path", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "admin1" } } as never);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ isAdmin: true } as never)
      .mockResolvedValueOnce({ isAdmin: false } as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);

    const { revokeUser } = await import("@/app/actions/invites");
    await revokeUser("u1");

    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { approved: false } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/invites");
  });
});

describe("acceptInvite", () => {
  beforeEach(() => vi.resetAllMocks());

  it("throws when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const { acceptInvite } = await import("@/app/actions/invites");
    await expect(acceptInvite("tok123")).rejects.toThrow("Unauthorized");
  });

  it("throws when invite does not exist", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.invite.findUnique).mockResolvedValueOnce(null as never);

    const { acceptInvite } = await import("@/app/actions/invites");
    await expect(acceptInvite("invalid")).rejects.toThrow("Invalid or already used invite");
  });

  it("throws when invite is already used", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.invite.findUnique).mockResolvedValueOnce({ token: "tok123", usedById: "u2" } as never);

    const { acceptInvite } = await import("@/app/actions/invites");
    await expect(acceptInvite("tok123")).rejects.toThrow("Invalid or already used invite");
  });

  it("marks invite as used and approves user on success", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.invite.findUnique).mockResolvedValueOnce({ token: "tok123", usedById: null } as never);
    vi.mocked(prisma.$transaction).mockResolvedValueOnce(undefined as never);

    const { acceptInvite } = await import("@/app/actions/invites");
    await acceptInvite("tok123");

    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
