import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LanguageSelector from "@/components/LanguageSelector";

const mockPush = vi.fn();
const mockPathname = vi.fn(() => "/nl");

vi.mock("next-intl", () => ({
  useLocale: () => "nl",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname(),
}));

describe("LanguageSelector", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders NL and EN buttons", () => {
    render(<LanguageSelector />);
    expect(screen.getByRole("button", { name: "nl" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "en" })).toBeInTheDocument();
  });

  it("highlights the active locale", () => {
    render(<LanguageSelector />);
    expect(screen.getByRole("button", { name: "nl" })).toHaveClass("text-stone-800");
    expect(screen.getByRole("button", { name: "en" })).toHaveClass("text-stone-400");
  });

  it("navigates to the switched locale on click", async () => {
    render(<LanguageSelector />);
    await userEvent.click(screen.getByRole("button", { name: "en" }));
    expect(mockPush).toHaveBeenCalledWith("/en");
  });

  it("keeps the path when switching locale", async () => {
    mockPathname.mockReturnValue("/nl/recipes/abc");
    render(<LanguageSelector />);
    await userEvent.click(screen.getByRole("button", { name: "en" }));
    expect(mockPush).toHaveBeenCalledWith("/en/recipes/abc");
  });
});
