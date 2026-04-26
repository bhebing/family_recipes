import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SignInButton, SignOutButton } from "./AuthButtons";
import LanguageSelector from "./LanguageSelector";

export default async function Navbar() {
  const [session, t] = await Promise.all([auth(), getTranslations("Navbar")]);

  const isAdmin = session?.user?.id
    ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } }))?.isAdmin
    : false;

  return (
    <header className="bg-[#fafaf8] border-b border-stone-200">
      <div className="mx-auto max-w-4xl px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-xl font-bold tracking-tight text-stone-800 hover:text-amber-700 transition-colors"
        >
          Family Recipes
        </Link>

        <div className="flex items-center gap-6">
          <LanguageSelector />
          {session?.user ? (
            <>
              <span className="text-sm text-stone-500 hidden sm:block">
                {session.user.name}
              </span>
              {isAdmin && (
                <Link
                  href="/admin/invites"
                  className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
                >
                  Beheer
                </Link>
              )}
              <Link
                href="/recipes/new"
                className="text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
              >
                {t("addRecipe")}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  );
}
