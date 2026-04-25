import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SignInPage from "@/app/[locale]/auth/signin/page";

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string) =>
      ({ title: "Welcome back", subtitle: "Sign in to add recipes.", button: "Sign in with Google" }[key] ?? key)
    ),
}));

vi.mock("@/components/AuthButtons", () => ({
  SignInButton: () => <button>Sign in with Google</button>,
}));

describe("SignInPage", () => {
  it("renders the sign-in card when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);

    const Page = await SignInPage();
    render(Page);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Sign in to add recipes.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeInTheDocument();
  });

  it("redirects to home when already authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1", name: "Jan", email: "jan@test.nl" } } as never);

    await SignInPage();
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });
});
