import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import CommentsSection from "@/components/CommentsSection";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: Props) {
  const { id } = await params;

  const [recipe, session, t] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        ingredients: { orderBy: { order: "asc" } },
        steps: { orderBy: { order: "asc" } },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true } } },
        },
      },
    }),
    auth(),
    getTranslations("RecipePage"),
  ]);

  if (!recipe) notFound();

  const isAuthor = session?.user?.id === recipe.author.id;
  const totalTime =
    recipe.prepTime != null && recipe.cookTime != null
      ? recipe.prepTime + recipe.cookTime
      : null;

  return (
    <div className="max-w-2xl">
      {/* Hero image */}
      {recipe.imageUrl && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-8 bg-[#e8d4b8]">
          <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-start justify-between gap-6 mb-3">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[#2c2416] leading-tight">
            {recipe.title}
          </h1>
          {isAuthor && (
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="shrink-0 text-sm text-[#a89070] hover:text-[#2c2416] transition-colors mt-2"
            >
              {t("edit")}
            </Link>
          )}
        </div>

        {recipe.category && (
          <p className="text-xs font-medium uppercase tracking-widest text-amber-700 mb-4">
            {recipe.category}
          </p>
        )}

        {recipe.description && (
          <p className="text-[#5a4a38] leading-relaxed">{recipe.description}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#a89070]">
          <span>{t("by", { name: recipe.author.name ?? "?" })}</span>
          {recipe.servings != null && <span>· {t("servings", { count: recipe.servings })}</span>}
          {recipe.prepTime != null && <span>· {t("prepTime", { minutes: recipe.prepTime })}</span>}
          {recipe.cookTime != null && <span>· {t("cookTime", { minutes: recipe.cookTime })}</span>}
          {totalTime != null && <span>· {t("totalTime", { minutes: totalTime })}</span>}
        </div>
      </div>

      {/* Ingredients */}
      {recipe.ingredients.length > 0 && (
        <section className="mb-10 bg-[#fdf8f2] rounded-xl border border-[#e0cdb8] p-6">
          <h2 className="font-serif text-lg font-bold text-[#2c2416] mb-4">
            {t("ingredients")}
          </h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="flex gap-3 text-[#3d2e1a]">
                <span className="w-20 shrink-0 text-right text-[#a89070] text-sm">
                  {ing.amount}{ing.unit ? ` ${ing.unit}` : ""}
                </span>
                <span>{ing.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Steps */}
      {recipe.steps.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-lg font-bold text-[#2c2416] mb-5">
            {t("instructions")}
          </h2>
          <ol className="space-y-5">
            {recipe.steps.map((step) => (
              <li key={step.id} className="flex gap-5">
                <span className="shrink-0 font-serif font-bold text-amber-700 w-6 pt-0.5 text-lg leading-none">
                  {step.order}.
                </span>
                <p className="text-[#3d2e1a] leading-relaxed">{step.instruction}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Comments */}
      <div className="pt-10 border-t border-[#e0cdb8]">
        <CommentsSection
          recipeId={recipe.id}
          comments={recipe.reviews}
          currentUserId={session?.user?.id ?? null}
        />
      </div>
    </div>
  );
}
