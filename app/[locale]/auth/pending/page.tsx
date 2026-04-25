import { signOut } from "@/auth";

export default function PendingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-3">
        Toegang aangevraagd
      </h1>
      <p className="text-stone-400 text-sm max-w-sm mb-8">
        Je account wacht op goedkeuring. Je hebt een uitnodigingslink nodig om toegang te krijgen.
        Neem contact op met de beheerder.
      </p>
      <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
        <button
          type="submit"
          className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
        >
          Uitloggen
        </button>
      </form>
    </div>
  );
}
