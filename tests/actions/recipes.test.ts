import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedirect = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error("NEXT_REDIRECT");
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    recipe: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    ingredient: { deleteMany: vi.fn() },
    step: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const baseData = {
  title: "  Stamppot  ",
  description: "  Lekker  ",
  category: "Hoofdgerecht",
  servings: "4",
  prepTime: "10",
  cookTime: "30",
  imageUrl: null,
  ingredients: [{ name: "Aardappels", amount: "1", unit: "kg" }],
  steps: [{ instruction: "Kook de aardappels" }],
};

describe("createRecipe", () => {
  beforeEach(() => vi.resetAllMocks());

  it("throws when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const { createRecipe } = await import("@/app/actions/recipes");
    await expect(createRecipe(baseData)).rejects.toThrow("Unauthorized");
  });

  it("creates recipe and redirects on success", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.recipe.create).mockResolvedValueOnce({ id: "r1" } as never);

    const { createRecipe } = await import("@/app/actions/recipes");
    await expect(createRecipe(baseData)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/recipes/r1");
  });

  it("trims title and description before saving", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.recipe.create).mockResolvedValueOnce({ id: "r1" } as never);

    const { createRecipe } = await import("@/app/actions/recipes");
    await expect(createRecipe(baseData)).rejects.toThrow("NEXT_REDIRECT");
    expect(prisma.recipe.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: "Stamppot", description: "Lekker" }),
      })
    );
  });

  it("filters out blank ingredients and steps", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.recipe.create).mockResolvedValueOnce({ id: "r1" } as never);

    const data = {
      ...baseData,
      ingredients: [{ name: "Aardappels", amount: "1", unit: "kg" }, { name: "  ", amount: "", unit: "" }],
      steps: [{ instruction: "Kook" }, { instruction: "  " }],
    };
    const { createRecipe } = await import("@/app/actions/recipes");
    await expect(createRecipe(data)).rejects.toThrow("NEXT_REDIRECT");
    const call = vi.mocked(prisma.recipe.create).mock.calls[0][0];
    expect((call.data.ingredients as { create: unknown[] }).create).toHaveLength(1);
    expect((call.data.steps as { create: unknown[] }).create).toHaveLength(1);
  });
});

describe("updateRecipe", () => {
  beforeEach(() => vi.resetAllMocks());

  it("throws when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const { updateRecipe } = await import("@/app/actions/recipes");
    await expect(updateRecipe("r1", baseData)).rejects.toThrow("Unauthorized");
  });

  it("throws Forbidden when user is not the author", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u2" } } as never);
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce({ id: "r1", authorId: "u1" } as never);

    const { updateRecipe } = await import("@/app/actions/recipes");
    await expect(updateRecipe("r1", baseData)).rejects.toThrow("Forbidden");
  });

  it("throws Forbidden when recipe does not exist", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce(null as never);

    const { updateRecipe } = await import("@/app/actions/recipes");
    await expect(updateRecipe("r1", baseData)).rejects.toThrow("Forbidden");
  });

  it("updates recipe and redirects on success", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce({ id: "r1", authorId: "u1" } as never);
    vi.mocked(prisma.$transaction).mockResolvedValueOnce(undefined as never);

    const { updateRecipe } = await import("@/app/actions/recipes");
    await expect(updateRecipe("r1", baseData)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/recipes/r1");
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
