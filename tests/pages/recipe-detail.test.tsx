import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RecipePage from "@/app/[locale]/recipes/[id]/page";

const mockNotFound = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: () => { mockNotFound(); throw new Error("NEXT_NOT_FOUND"); },
}));

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    recipe: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string, params?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        edit: "Edit",
        ingredients: "Ingredients",
        instructions: "Instructions",
      };
      if (key === "by") return `By ${params?.name}`;
      if (key === "servings") return `${params?.count} servings`;
      if (key === "prepTime") return `Prep: ${params?.minutes} min`;
      if (key === "cookTime") return `Cook: ${params?.minutes} min`;
      if (key === "totalTime") return `Total: ${params?.minutes} min`;
      return map[key] ?? key;
    }),
}));

vi.mock("@/components/CommentsSection", () => ({
  default: ({ comments }: { comments: unknown[] }) => (
    <div data-testid="comments-section">{comments.length} comments</div>
  ),
}));

const baseRecipe = {
  id: "r1",
  title: "Stamppot",
  description: "Lekker",
  category: "Hoofdgerecht",
  servings: 4,
  prepTime: 10,
  cookTime: 30,
  imageUrl: null,
  authorId: "u1",
  createdAt: new Date(),
  updatedAt: new Date(),
  author: { id: "u1", name: "Jan" },
  ingredients: [{ id: "i1", name: "Aardappels", amount: "1", unit: "kg", order: 1, recipeId: "r1" }],
  steps: [{ id: "s1", instruction: "Kook de aardappels", order: 1, recipeId: "r1" }],
  reviews: [],
};

describe("RecipePage", () => {
  it("renders recipe title, description and meta", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce(baseRecipe as never);

    const Page = await RecipePage({ params: Promise.resolve({ id: "r1" }) });
    render(Page);
    expect(screen.getByText("Stamppot")).toBeInTheDocument();
    expect(screen.getByText("Lekker")).toBeInTheDocument();
    expect(screen.getByText("By Jan")).toBeInTheDocument();
  });

  it("renders ingredients and steps", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce(baseRecipe as never);

    const Page = await RecipePage({ params: Promise.resolve({ id: "r1" }) });
    render(Page);
    expect(screen.getByText("Aardappels")).toBeInTheDocument();
    expect(screen.getByText("Kook de aardappels")).toBeInTheDocument();
  });

  it("renders the comments section", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce(baseRecipe as never);

    const Page = await RecipePage({ params: Promise.resolve({ id: "r1" }) });
    render(Page);
    expect(screen.getByTestId("comments-section")).toBeInTheDocument();
  });

  it("calls notFound when recipe does not exist", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce(null as never);

    await expect(RecipePage({ params: Promise.resolve({ id: "missing" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("shows Edit button for the recipe author", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { auth } = await import("@/auth");
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce(baseRecipe as never);
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1", name: "Jan", email: "jan@test.nl" } } as never);

    const Page = await RecipePage({ params: Promise.resolve({ id: "r1" }) });
    render(Page);
    expect(screen.getByRole("link", { name: "Edit" })).toBeInTheDocument();
  });

  it("hides Edit button for non-authors", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { auth } = await import("@/auth");
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce(baseRecipe as never);
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "other", name: "Piet", email: "piet@test.nl" } } as never);

    const Page = await RecipePage({ params: Promise.resolve({ id: "r1" }) });
    render(Page);
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
  });
});
