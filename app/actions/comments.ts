"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function addComment(recipeId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");

  await prisma.review.create({
    data: { content: trimmed, recipeId, authorId: session.user.id },
  });

  revalidatePath(`/recipes/${recipeId}`);
}

export async function deleteComment(commentId: string, recipeId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const comment = await prisma.review.findUnique({ where: { id: commentId } });
  if (!comment || comment.authorId !== session.user.id) throw new Error("Forbidden");

  await prisma.review.delete({ where: { id: commentId } });

  revalidatePath(`/recipes/${recipeId}`);
}
