import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditRecipePage from "@/app/[locale]/recipes/[id]/edit/page";

const mockRedirect = vi.fn();
const mockNotFound = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error("NEXT_REDIRECT");
  },
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    recipe: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => ({ editTitle: "Edit recipe" }[key] ?? key)),
}));

vi.mock("@/components/RecipeForm", () => ({
  default: ({ mode }: { mode: string }) => <div data-testid="recipe-form" data-mode={mode} />,
}));

const baseRecipe = {
  id: "r1",
  authorId: "u1",
  title: "Stamppot",
  description: null,
  category: null,
  servings: null,
  prepTime: null,
  cookTime: null,
  imageUrl: null,
  ingredients: [],
  steps: [],
};

describe("EditRecipePage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to sign-in when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);

    await expect(EditRecipePage({ params: Promise.resolve({ id: "r1" }) })).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/auth/signin");
  });

  it("redirects to pending when user is not approved", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce(baseRecipe as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ approved: false } as never);

    await expect(EditRecipePage({ params: Promise.resolve({ id: "r1" }) })).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/auth/pending");
  });

  it("calls notFound when recipe does not exist", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ approved: true } as never);

    await expect(EditRecipePage({ params: Promise.resolve({ id: "r1" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("redirects to recipe when user is not the author", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u2" } } as never);
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce(baseRecipe as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ approved: true } as never);

    await expect(EditRecipePage({ params: Promise.resolve({ id: "r1" }) })).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/recipes/r1");
  });

  it("renders the edit form for the recipe author", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce(baseRecipe as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ approved: true } as never);

    const Page = await EditRecipePage({ params: Promise.resolve({ id: "r1" }) });
    render(Page);
    expect(screen.getByText("Edit recipe")).toBeInTheDocument();
    expect(screen.getByTestId("recipe-form")).toHaveAttribute("data-mode", "edit");
  });
});
