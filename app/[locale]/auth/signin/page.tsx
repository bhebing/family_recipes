import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { signIn } from "@/auth";
import { EmailSignInForm } from "@/components/EmailSignInForm";

interface Props {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { callbackUrl = "/" } = await searchParams;
  const t = await getTranslations("SignIn");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm text-center bg-[#fdf8f2] rounded-2xl border border-[#e0cdb8] p-8"
        style={{ boxShadow: "2px 4px 16px rgba(44,36,22,0.08)" }}>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#a89070] mb-3">
          Recettes de Cuisine
        </p>
        <h1 className="font-serif text-3xl font-bold text-[#2c2416] mb-2">
          {t("title")}
        </h1>
        <p className="text-sm text-[#8a7060] mb-8">{t("subtitle")}</p>

        <EmailSignInForm callbackUrl={callbackUrl} />

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#e0cdb8]" />
          <span className="text-xs text-[#a89070]">{t("or")}</span>
          <div className="flex-1 h-px bg-[#e0cdb8]" />
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-full border border-[#e0cdb8] px-6 py-3 text-sm font-medium text-[#5a4a38] hover:bg-[#f5ede0] transition-colors"
          >
            {t("googleButton")}
          </button>
        </form>
      </div>
    </div>
  );
}
