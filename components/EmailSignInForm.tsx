"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

interface Props {
  callbackUrl: string;
}

export function EmailSignInForm({ callbackUrl }: Props) {
  const t = useTranslations("SignIn");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("resend", { email, callbackUrl });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("emailPlaceholder")}
        required
        className="w-full rounded-lg border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-amber-700 px-6 py-3 text-sm font-medium text-white hover:bg-amber-800 transition-colors disabled:opacity-50"
      >
        {loading ? t("sending") : t("emailSubmit")}
      </button>
    </form>
  );
}
