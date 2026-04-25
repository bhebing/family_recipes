import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CommentsSection from "@/components/CommentsSection";

const mockAdd = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/app/actions/comments", () => ({
  addComment: (...args: unknown[]) => mockAdd(...args),
  deleteComment: (...args: unknown[]) => mockDelete(...args),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      noComments: "No comments yet.",
      commentPlaceholder: "Add a comment…",
      commentSubmit: "Post comment",
      commentSubmitting: "Posting…",
      commentDelete: "Delete",
      commentSignIn: "Sign in to leave a comment.",
    };
    if (key === "comments") return `Comments (${params?.count})`;
    return map[key] ?? key;
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const baseComment = {
  id: "c1",
  content: "Lekker, maar iets meer zout!",
  createdAt: new Date("2024-01-01"),
  author: { name: "Jan" },
  authorId: "u1",
};

describe("CommentsSection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows empty state when no comments", () => {
    render(<CommentsSection recipeId="r1" comments={[]} currentUserId={null} />);
    expect(screen.getByText("No comments yet.")).toBeInTheDocument();
  });

  it("renders existing comments", () => {
    render(<CommentsSection recipeId="r1" comments={[baseComment]} currentUserId={null} />);
    expect(screen.getByText("Lekker, maar iets meer zout!")).toBeInTheDocument();
    expect(screen.getByText("Jan")).toBeInTheDocument();
  });

  it("shows sign-in link when not authenticated", () => {
    render(<CommentsSection recipeId="r1" comments={[]} currentUserId={null} />);
    expect(screen.getByRole("link", { name: "Sign in to leave a comment." })).toBeInTheDocument();
  });

  it("shows comment form when authenticated", () => {
    render(<CommentsSection recipeId="r1" comments={[]} currentUserId="u1" />);
    expect(screen.getByPlaceholderText("Add a comment…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post comment" })).toBeInTheDocument();
  });

  it("submit button is disabled when text is empty", () => {
    render(<CommentsSection recipeId="r1" comments={[]} currentUserId="u1" />);
    expect(screen.getByRole("button", { name: "Post comment" })).toBeDisabled();
  });

  it("calls addComment on submit", async () => {
    render(<CommentsSection recipeId="r1" comments={[]} currentUserId="u1" />);
    await userEvent.type(screen.getByPlaceholderText("Add a comment…"), "Lekker recept!");
    await userEvent.click(screen.getByRole("button", { name: "Post comment" }));
    expect(mockAdd).toHaveBeenCalledWith("r1", "Lekker recept!");
  });

  it("shows delete button only for the comment author", () => {
    render(<CommentsSection recipeId="r1" comments={[baseComment]} currentUserId="u1" />);
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("hides delete button for other users", () => {
    render(<CommentsSection recipeId="r1" comments={[baseComment]} currentUserId="u2" />);
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("calls deleteComment when delete is clicked", async () => {
    render(<CommentsSection recipeId="r1" comments={[baseComment]} currentUserId="u1" />);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(mockDelete).toHaveBeenCalledWith("c1", "r1");
  });
});
