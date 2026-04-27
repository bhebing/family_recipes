import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => ({ signIn: "Sign in", signOut: "Sign out" }[key] ?? key),
}));

describe("SignInButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a link to the sign-in page", () => {
    render(<SignInButton />);
    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/auth/signin");
  });
});

describe("SignOutButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the sign-out label", () => {
    render(<SignOutButton />);
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("calls signOut on click", async () => {
    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button"));
    expect(mockSignOut).toHaveBeenCalled();
  });
});
