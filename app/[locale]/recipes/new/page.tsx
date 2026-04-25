import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import RecipeForm from "@/components/RecipeForm";

export default async function NewRecipePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const t = await getTranslations("RecipeForm");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("createTitle")}</h1>
      <RecipeForm mode="create" />
    </div>
  );
}
