import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HomePage from "@/app/[locale]/page";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    recipe: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string, params?: Record<string, unknown>) => {
      if (key === "recipeCount") return `${params?.count} recipes`;
      if (key === "noResults") return `No recipes found for "${params?.query}"`;
      return { title: "All Recipes", empty: "No recipes yet.", addFirst: "Start met een eerste recept" }[key] ?? key;
    }),
}));

vi.mock("@/components/SearchInput", () => ({
  default: () => <input placeholder="Search recipes…" />,
}));

describe("HomePage", () => {
  it("renders the page title", async () => {
    const Page = await HomePage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getByText("All Recipes")).toBeInTheDocument();
  });

  it("shows empty state when there are no recipes", async () => {
    const Page = await HomePage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getByText("No recipes yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start met een eerste recept" })).toBeInTheDocument();
  });

  it("renders recipe cards when recipes exist", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.recipe.findMany).mockResolvedValueOnce([
      {
        id: "1",
        title: "Appeltaart",
        description: "Lekker",
        category: "Nagerecht",
        servings: 8,
        prepTime: 20,
        cookTime: 45,
        imageUrl: null,
        authorId: "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { name: "Jan" },
      },
    ] as never);

    const Page = await HomePage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getByText("Appeltaart")).toBeInTheDocument();
    expect(screen.getByText("Nagerecht")).toBeInTheDocument();
  });

  it("shows no-results message when search returns nothing", async () => {
    const Page = await HomePage({ searchParams: Promise.resolve({ q: "kip" }) });
    render(Page);
    expect(screen.getByText('No recipes found for "kip"')).toBeInTheDocument();
  });

  it("passes the search query to prisma", async () => {
    const { prisma } = await import("@/lib/prisma");
    await HomePage({ searchParams: Promise.resolve({ q: "kip" }) });
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      })
    );
  });
});
