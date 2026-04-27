import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SignInPage from "@/app/[locale]/auth/signin/page";

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string) =>
      ({
        title: "Welcome back",
        subtitle: "Sign in to add recipes.",
        emailPlaceholder: "your@email.com",
        emailSubmit: "Send sign-in link",
        sending: "Sending…",
        or: "or",
        googleButton: "Sign in with Google",
      }[key] ?? key)
    ),
}));

vi.mock("@/components/EmailSignInForm", () => ({
  EmailSignInForm: ({ callbackUrl }: { callbackUrl: string }) => (
    <form data-testid="email-form" data-callbackurl={callbackUrl}>
      <input type="email" placeholder="your@email.com" />
      <button type="submit">Send sign-in link</button>
    </form>
  ),
}));

const defaultSearchParams = Promise.resolve({});

describe("SignInPage", () => {
  it("renders the sign-in card when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);

    const Page = await SignInPage({ searchParams: defaultSearchParams });
    render(Page);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Sign in to add recipes.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
  });

  it("redirects to home when already authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1", name: "Jan", email: "jan@test.nl" } } as never);

    await SignInPage({ searchParams: defaultSearchParams });
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("passes callbackUrl to the email form", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);

    const Page = await SignInPage({
      searchParams: Promise.resolve({ callbackUrl: "/invite/abc123" }),
    });
    render(Page);
    expect(screen.getByTestId("email-form")).toHaveAttribute("data-callbackurl", "/invite/abc123");
  });
});
