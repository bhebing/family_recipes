import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    review: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("addComment", () => {
  beforeEach(() => vi.resetAllMocks());

  it("throws when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const { addComment } = await import("@/app/actions/comments");
    await expect(addComment("r1", "Lekker!")).rejects.toThrow("Unauthorized");
  });

  it("throws when content is empty or whitespace", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    const { addComment } = await import("@/app/actions/comments");
    await expect(addComment("r1", "   ")).rejects.toThrow("Comment cannot be empty");
  });

  it("creates comment and revalidates path on success", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.review.create).mockResolvedValueOnce({} as never);

    const { addComment } = await import("@/app/actions/comments");
    await addComment("r1", "  Lekker recept!  ");

    expect(prisma.review.create).toHaveBeenCalledWith({
      data: { content: "Lekker recept!", recipeId: "r1", authorId: "u1" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/recipes/r1");
  });
});

describe("deleteComment", () => {
  beforeEach(() => vi.resetAllMocks());

  it("throws when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const { deleteComment } = await import("@/app/actions/comments");
    await expect(deleteComment("c1", "r1")).rejects.toThrow("Unauthorized");
  });

  it("throws Forbidden when comment does not exist", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.review.findUnique).mockResolvedValueOnce(null as never);

    const { deleteComment } = await import("@/app/actions/comments");
    await expect(deleteComment("c1", "r1")).rejects.toThrow("Forbidden");
  });

  it("throws Forbidden when user is not the comment author", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u2" } } as never);
    vi.mocked(prisma.review.findUnique).mockResolvedValueOnce({ id: "c1", authorId: "u1", recipeId: "r1" } as never);

    const { deleteComment } = await import("@/app/actions/comments");
    await expect(deleteComment("c1", "r1")).rejects.toThrow("Forbidden");
  });

  it("throws when comment does not belong to the stated recipe", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.review.findUnique).mockResolvedValueOnce({ id: "c1", authorId: "u1", recipeId: "r2" } as never);

    const { deleteComment } = await import("@/app/actions/comments");
    await expect(deleteComment("c1", "r1")).rejects.toThrow("Comment does not belong to this recipe");
  });

  it("deletes comment and revalidates path on success", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.review.findUnique).mockResolvedValueOnce({ id: "c1", authorId: "u1", recipeId: "r1" } as never);
    vi.mocked(prisma.review.delete).mockResolvedValueOnce({} as never);

    const { deleteComment } = await import("@/app/actions/comments");
    await deleteComment("c1", "r1");

    expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/recipes/r1");
  });
});
