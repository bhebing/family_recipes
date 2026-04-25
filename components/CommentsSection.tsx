"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { addComment, deleteComment } from "@/app/actions/comments";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: { name: string | null };
  authorId: string;
}

interface Props {
  recipeId: string;
  comments: Comment[];
  currentUserId: string | null;
}

export default function CommentsSection({ recipeId, comments, currentUserId }: Props) {
  const t = useTranslations("RecipePage");
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addComment(recipeId, text);
        setText("");
      } catch {
        setError("Er is iets misgegaan. Probeer opnieuw.");
      }
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      await deleteComment(commentId, recipeId);
    });
  }

  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-6">
        {t("comments", { count: comments.length })}
      </h2>

      {comments.length > 0 && (
        <ul className="space-y-5 mb-8">
          {comments.map((comment) => (
            <li key={comment.id}>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-medium text-stone-800">
                    {comment.author.name ?? "?"}
                  </span>
                  <span className="text-xs text-stone-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {currentUserId === comment.authorId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={isPending}
                    className="text-xs text-stone-300 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {t("commentDelete")}
                  </button>
                )}
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}

      {comments.length === 0 && (
        <p className="text-sm text-stone-400 mb-8">{t("noComments")}</p>
      )}

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={t("commentPlaceholder")}
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm placeholder:text-stone-300 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition-colors"
          />
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            className="rounded-full bg-amber-700 px-5 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? t("commentSubmitting") : t("commentSubmit")}
          </button>
        </form>
      ) : (
        <p className="text-sm text-stone-400">
          <Link href="/auth/signin" className="text-amber-700 hover:text-amber-800 transition-colors">
            {t("commentSignIn")}
          </Link>
        </p>
      )}
    </section>
  );
}
