"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface RecipeFormData {
  title: string;
  description: string;
  category: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  imageUrl: string | null;
  ingredients: { name: string; amount: string; unit: string }[];
  steps: { instruction: string }[];
}

export async function createRecipe(data: RecipeFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const recipe = await prisma.recipe.create({
    data: {
      title: data.title.trim(),
      description: data.description.trim() || null,
      category: data.category.trim() || null,
      servings: data.servings ? parseInt(data.servings) : null,
      prepTime: data.prepTime ? parseInt(data.prepTime) : null,
      cookTime: data.cookTime ? parseInt(data.cookTime) : null,
      imageUrl: data.imageUrl ?? null,
      authorId: session.user.id,
      ingredients: {
        create: data.ingredients
          .filter((i) => i.name.trim())
          .map((i, idx) => ({
            name: i.name.trim(),
            amount: i.amount.trim(),
            unit: i.unit.trim() || null,
            order: idx + 1,
          })),
      },
      steps: {
        create: data.steps
          .filter((s) => s.instruction.trim())
          .map((s, idx) => ({
            instruction: s.instruction.trim(),
            order: idx + 1,
          })),
      },
    },
  });

  redirect(`/recipes/${recipe.id}`);
}

export async function updateRecipe(id: string, data: RecipeFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe || recipe.authorId !== session.user.id) throw new Error("Forbidden");

  await prisma.$transaction([
    prisma.ingredient.deleteMany({ where: { recipeId: id } }),
    prisma.step.deleteMany({ where: { recipeId: id } }),
    prisma.recipe.update({
      where: { id },
      data: {
        title: data.title.trim(),
        description: data.description.trim() || null,
        category: data.category.trim() || null,
        servings: data.servings ? parseInt(data.servings) : null,
        prepTime: data.prepTime ? parseInt(data.prepTime) : null,
        cookTime: data.cookTime ? parseInt(data.cookTime) : null,
        imageUrl: data.imageUrl ?? null,
        ingredients: {
          create: data.ingredients
            .filter((i) => i.name.trim())
            .map((i, idx) => ({
              name: i.name.trim(),
              amount: i.amount.trim(),
              unit: i.unit.trim() || null,
              order: idx + 1,
            })),
        },
        steps: {
          create: data.steps
            .filter((s) => s.instruction.trim())
            .map((s, idx) => ({
              instruction: s.instruction.trim(),
              order: idx + 1,
            })),
        },
      },
    }),
  ]);

  redirect(`/recipes/${id}`);
}
