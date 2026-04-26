import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminInvitesPage from "@/app/[locale]/admin/invites/page";

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
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    invite: { findMany: vi.fn() },
  },
}));

vi.mock("@/components/AdminInvitePanel", () => ({
  default: () => <div data-testid="admin-invite-panel" />,
}));

describe("AdminInvitesPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to sign-in when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);

    await expect(AdminInvitesPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/auth/signin");
  });

  it("redirects to home when user is not an admin", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "u1" } } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ isAdmin: false } as never);

    await expect(AdminInvitesPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("renders the admin panel for admin users", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "admin1" } } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ isAdmin: true } as never);
    vi.mocked(prisma.invite.findMany).mockResolvedValueOnce([] as never);
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([] as never);

    const Page = await AdminInvitesPage();
    render(Page);
    expect(screen.getByTestId("admin-invite-panel")).toBeInTheDocument();
  });

  it("shows the page heading", async () => {
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "admin1" } } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ isAdmin: true } as never);
    vi.mocked(prisma.invite.findMany).mockResolvedValueOnce([] as never);
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([] as never);

    const Page = await AdminInvitesPage();
    render(Page);
    expect(screen.getByText("Uitnodigingen")).toBeInTheDocument();
  });
});
