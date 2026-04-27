"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

export function SignInButton() {
  const t = useTranslations("Navbar");
  return (
    <a
      href="/auth/signin"
      className="text-sm font-medium px-4 py-1.5 rounded border border-amber-300/50 text-amber-300 hover:bg-amber-300/10 transition-colors"
    >
      {t("signIn")}
    </a>
  );
}

export function SignOutButton() {
  const t = useTranslations("Navbar");
  return (
    <button
      onClick={() => signOut()}
      className="text-sm text-[#a89070] hover:text-[#f5ede0] transition-colors"
    >
      {t("signOut")}
    </button>
  );
}
