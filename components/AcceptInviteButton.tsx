"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/app/actions/invites";

export default function AcceptInviteButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAccept() {
    startTransition(async () => {
      await acceptInvite(token);
      router.push("/");
    });
  }

  return (
    <button
      onClick={handleAccept}
      disabled={isPending}
      className="rounded-full bg-amber-700 px-6 py-3 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50 transition-colors"
    >
      {isPending ? "Bezig…" : "Uitnodiging accepteren"}
    </button>
  );
}
