import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { SignInButton } from "@/components/AuthButtons";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const t = await getTranslations("SignIn");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-3">
          {t("title")}
        </h1>
        <p className="text-sm text-stone-400 mb-8">{t("subtitle")}</p>
        <SignInButton />
      </div>
    </div>
  );
}
