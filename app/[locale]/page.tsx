import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import SearchInput from "@/components/SearchInput";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [recipes, t] = await Promise.all([
    prisma.recipe.findMany({
      where: query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } },
              { ingredients: { some: { name: { contains: query, mode: "insensitive" } } } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    getTranslations("HomePage"),
  ]);

  return (
    <div>
      {/* Hero — drop /public/hero.jpg to replace the gradient placeholder */}
      <div className="-mx-6 -mt-12 mb-10 relative h-64 sm:h-80 overflow-hidden bg-stone-200">
        {/*
          Once you have a photo, replace the gradient div below with:
          <Image src="/hero.jpg" alt="Family kitchen" fill className="object-cover object-center" priority />
          <div className="absolute inset-0 bg-black/25" />
        */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-stone-100 to-stone-200" />
        <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-stone-800">
            {t("title")}
          </h1>
        </div>
      </div>

      <div className="mb-8">
        <Suspense>
          <SearchInput />
        </Suspense>
      </div>

      {recipes.length === 0 && !query && (
        <div className="py-24 text-center">
          <p className="text-stone-400 mb-6">{t("empty")}</p>
          <Link
            href="/recipes/new"
            className="inline-block px-6 py-3 rounded-full bg-amber-700 text-white text-sm font-medium hover:bg-amber-800 transition-colors"
          >
            {t("addFirst")}
          </Link>
        </div>
      )}

      {recipes.length === 0 && query && (
        <p className="py-16 text-center text-stone-400 text-sm">
          {t("noResults", { query })}
        </p>
      )}

      {recipes.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-stone-100"
            >
              {recipe.imageUrl ? (
                <div className="relative w-full aspect-video bg-stone-100">
                  <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-amber-50 to-stone-100" />
              )}
              <div className="p-5">
                {recipe.category && (
                  <p className="text-xs font-medium uppercase tracking-widest text-amber-700 mb-2">
                    {recipe.category}
                  </p>
                )}
                <h2 className="font-serif font-bold text-stone-900 group-hover:text-amber-700 transition-colors leading-snug">
                  {recipe.title}
                </h2>
                {recipe.description && (
                  <p className="mt-2 text-sm text-stone-500 line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-3 text-xs text-stone-400">
                  <span>{recipe.author.name}</span>
                  {recipe.prepTime != null && recipe.cookTime != null && (
                    <>
                      <span>·</span>
                      <span>{recipe.prepTime + recipe.cookTime} min</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
