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
  useTranslations: () => (key: string) => ({ signIn: "Sign in with Google", signOut: "Sign out" }[key] ?? key),
}));

describe("SignInButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the sign-in label", () => {
    render(<SignInButton />);
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeInTheDocument();
  });

  it("calls signIn with google on click", async () => {
    render(<SignInButton />);
    await userEvent.click(screen.getByRole("button"));
    expect(mockSignIn).toHaveBeenCalledWith("google");
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
