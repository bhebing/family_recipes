"use client";

import { signIn, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

export function SignInButton() {
  const t = useTranslations("Navbar");
  return (
    <button
      onClick={() => signIn("google")}
      className="text-sm font-medium px-4 py-2 rounded-full bg-amber-700 text-white hover:bg-amber-800 transition-colors"
    >
      {t("signIn")}
    </button>
  );
}

export function SignOutButton() {
  const t = useTranslations("Navbar");
  return (
    <button
      onClick={() => signOut()}
      className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
    >
      {t("signOut")}
    </button>
  );
}
