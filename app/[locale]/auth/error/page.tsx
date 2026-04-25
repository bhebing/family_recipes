import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-3">
        Geen toegang
      </h1>
      <p className="text-stone-400 text-sm max-w-sm mb-8">
        Je hebt een uitnodigingslink nodig om in te loggen op Family Recipes.
        Neem contact op met de beheerder.
      </p>
      <Link
        href="/"
        className="text-sm text-amber-700 hover:text-amber-800 transition-colors"
      >
        Terug naar home
      </Link>
    </div>
  );
}
