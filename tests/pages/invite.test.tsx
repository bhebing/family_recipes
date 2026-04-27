import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InvitePage from "@/app/[locale]/invite/[token]/page";

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error("NEXT_REDIRECT");
  },
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    invite: { findUnique: vi.fn() },
  },
}));

vi.mock("@/components/AcceptInviteButton", () => ({
  default: ({ token }: { token: string }) => <button data-testid="accept-btn" data-token={token}>Accepteer uitnodiging</button>,
}));

const baseInvite = {
  token: "tok123",
  usedById: null,
  note: null,
  createdBy: { name: "Jan" },
};

describe("InvitePage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to error when invite does not exist", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.invite.findUnique).mockResolvedValueOnce(null as never);

    await expect(InvitePage({ params: Promise.resolve({ token: "bad" }) })).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/auth/error");
  });

  it("redirects to error when invite is already used", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.invite.findUnique).mockResolvedValueOnce({ ...baseInvite, usedById: "u2" } as never);

    await expect(InvitePage({ params: Promise.resolve({ token: "tok123" }) })).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/auth/error");
  });

  it("shows accept button when user is signed in", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { auth } = await import("@/auth");
    vi.mocked(prisma.invite.findUnique).mockResolvedValueOnce(baseInvite as never);
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1", name: "Piet" } } as never);

    const Page = await InvitePage({ params: Promise.resolve({ token: "tok123" }) });
    render(Page);
    expect(screen.getByTestId("accept-btn")).toBeInTheDocument();
  });

  it("shows sign-in link pointing to sign-in page when not authenticated", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { auth } = await import("@/auth");
    vi.mocked(prisma.invite.findUnique).mockResolvedValueOnce(baseInvite as never);
    vi.mocked(auth).mockResolvedValueOnce(null as never);

    const Page = await InvitePage({ params: Promise.resolve({ token: "tok123" }) });
    render(Page);
    const link = screen.getByRole("link", { name: "Inloggen" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/auth/signin?callbackUrl=/invite/tok123");
  });

  it("shows inviter name on the page", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { auth } = await import("@/auth");
    vi.mocked(prisma.invite.findUnique).mockResolvedValueOnce(baseInvite as never);
    vi.mocked(auth).mockResolvedValueOnce(null as never);

    const Page = await InvitePage({ params: Promise.resolve({ token: "tok123" }) });
    render(Page);
    expect(screen.getByText(/Jan heeft je uitgenodigd/)).toBeInTheDocument();
  });

  it("shows invite note when present", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { auth } = await import("@/auth");
    vi.mocked(prisma.invite.findUnique).mockResolvedValueOnce({ ...baseInvite, note: "Welkom!" } as never);
    vi.mocked(auth).mockResolvedValueOnce(null as never);

    const Page = await InvitePage({ params: Promise.resolve({ token: "tok123" }) });
    render(Page);
    expect(screen.getByText(/Welkom!/)).toBeInTheDocument();
  });
});
