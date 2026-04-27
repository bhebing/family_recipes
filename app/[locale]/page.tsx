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
      {/* Hero — mimics the book cover: dark band top, parchment body, serif title */}
      <div className="-mx-6 -mt-12 mb-10 overflow-hidden">
        <div className="relative h-56 sm:h-72 flex flex-col">
          {/* Dark charcoal band — like the book spine */}
          <div className="h-10 bg-[#1a150d] shrink-0" />
          {/* Parchment body with subtle texture gradient */}
          <div className="flex-1 bg-gradient-to-b from-[#e8d4b8] to-[#f5ede0] flex flex-col items-center justify-center px-6 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#8a6a40] mb-3">
              Recettes de Cuisine
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-[#2c2416]">
              {t("title")}
            </h1>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <Suspense>
          <SearchInput />
        </Suspense>
      </div>

      {recipes.length === 0 && !query && (
        <div className="py-24 text-center">
          <p className="text-[#8a7060] mb-6">{t("empty")}</p>
          <Link
            href="/recipes/new"
            className="inline-block px-6 py-3 rounded-full bg-[#2c2416] text-[#f5ede0] text-sm font-medium hover:bg-[#3d3020] transition-colors"
          >
            {t("addFirst")}
          </Link>
        </div>
      )}

      {recipes.length === 0 && query && (
        <p className="py-16 text-center text-[#8a7060] text-sm">
          {t("noResults", { query })}
        </p>
      )}

      {recipes.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="group bg-[#fdf8f2] rounded-xl overflow-hidden border border-[#e0cdb8] hover:border-[#c8a97a] hover:shadow-md transition-all"
              style={{ boxShadow: "2px 2px 8px rgba(44,36,22,0.06)" }}
            >
              {recipe.imageUrl ? (
                <div className="relative w-full aspect-video bg-[#e8d4b8]">
                  <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-[#ede0cc] to-[#f5ede0]" />
              )}
              <div className="p-5">
                {recipe.category && (
                  <p className="text-xs font-medium uppercase tracking-widest text-amber-700 mb-2">
                    {recipe.category}
                  </p>
                )}
                <h2 className="font-serif font-bold text-[#2c2416] group-hover:text-amber-800 transition-colors leading-snug">
                  {recipe.title}
                </h2>
                {recipe.description && (
                  <p className="mt-2 text-sm text-[#7a6650] line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-3 text-xs text-[#a89070]">
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
