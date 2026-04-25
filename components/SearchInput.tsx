"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SearchInput() {
  const t = useTranslations("HomePage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  function handleClear() {
    setValue("");
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 pr-9 text-sm placeholder:text-stone-300 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Zoekopdracht wissen"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-600 transition-colors text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
