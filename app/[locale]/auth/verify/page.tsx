import { getTranslations } from "next-intl/server";

export default async function VerifyEmailPage() {
  const t = await getTranslations("VerifyEmail");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="max-w-sm">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-3">
          {t("title")}
        </h1>
        <p className="text-stone-400 text-sm mb-4">{t("body")}</p>
        <p className="text-stone-300 text-xs">{t("spam")}</p>
      </div>
    </div>
  );
}
