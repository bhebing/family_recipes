"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export default function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/") || "/");
  }

  return (
    <div className="flex items-center gap-1 text-xs font-medium tracking-wide">
      {(["nl", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-2 py-1 rounded uppercase transition-colors ${
            locale === l
              ? "text-[#f5ede0]"
              : "text-[#a89070] hover:text-[#c8b898]"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
