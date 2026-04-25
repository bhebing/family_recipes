import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NewRecipePage from "@/app/[locale]/recipes/new/page";

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string) => ({ createTitle: "Add a recipe" }[key] ?? key)),
}));

vi.mock("@/components/RecipeForm", () => ({
  default: ({ mode }: { mode: string }) => <div data-testid="recipe-form" data-mode={mode} />,
}));

describe("NewRecipePage", () => {
  it("renders the form when authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1", name: "Jan", email: "jan@test.nl" } } as never);

    const Page = await NewRecipePage();
    render(Page);
    expect(screen.getByText("Add a recipe")).toBeInTheDocument();
    expect(screen.getByTestId("recipe-form")).toHaveAttribute("data-mode", "create");
  });

  it("redirects to sign-in when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);

    await NewRecipePage();
    expect(mockRedirect).toHaveBeenCalledWith("/auth/signin");
  });
});
