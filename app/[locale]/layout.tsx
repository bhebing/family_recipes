import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import "../globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Family Recipes",
  description: "A shared cookbook for the family",
};

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${geist.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Navbar />
            <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-12">
              {children}
            </main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
