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
    <header className="bg-[#2c2416] border-b border-[#1a150d]">
      <div className="mx-auto max-w-4xl px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-lg font-bold tracking-wide text-[#f5ede0] hover:text-amber-300 transition-colors"
        >
          Family Recipes
        </Link>

        <div className="flex items-center gap-6">
          <LanguageSelector />
          {session?.user ? (
            <>
              <span className="text-sm text-[#c8a97a] hidden sm:block">
                {session.user.name}
              </span>
              {isAdmin && (
                <Link
                  href="/admin/invites"
                  className="text-sm text-[#a89070] hover:text-[#f5ede0] transition-colors"
                >
                  Beheer
                </Link>
              )}
              <Link
                href="/recipes/new"
                className="text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors"
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
