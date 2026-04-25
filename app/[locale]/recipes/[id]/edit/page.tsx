import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import RecipeForm from "@/components/RecipeForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const [recipe, t] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: { orderBy: { order: "asc" } },
        steps: { orderBy: { order: "asc" } },
      },
    }),
    getTranslations("RecipeForm"),
  ]);

  if (!recipe) notFound();
  if (recipe.authorId !== session.user.id) redirect(`/recipes/${id}`);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("editTitle")}</h1>
      <RecipeForm
        mode="edit"
        recipeId={id}
        defaultValues={{
          imageUrl: recipe.imageUrl ?? null,
          title: recipe.title,
          description: recipe.description ?? "",
          category: recipe.category ?? "",
          servings: recipe.servings?.toString() ?? "",
          prepTime: recipe.prepTime?.toString() ?? "",
          cookTime: recipe.cookTime?.toString() ?? "",
          ingredients: recipe.ingredients.map((i) => ({
            name: i.name,
            amount: i.amount,
            unit: i.unit ?? "",
          })),
          steps: recipe.steps.map((s) => ({ instruction: s.instruction })),
        }}
      />
    </div>
  );
}
