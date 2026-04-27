import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AcceptInviteButton from "@/components/AcceptInviteButton";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { createdBy: { select: { name: true } } },
  });

  if (!invite || invite.usedById) {
    redirect("/auth/error");
  }

  const session = await auth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="max-w-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-amber-700 mb-4">
          Uitnodiging
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-3">
          Je bent uitgenodigd
        </h1>
        <p className="text-stone-400 text-sm mb-8">
          {invite.createdBy.name} heeft je uitgenodigd voor Family Recipes.
          {invite.note && ` "${invite.note}"`}
        </p>

        {session?.user ? (
          <AcceptInviteButton token={token} />
        ) : (
          <a
            href={`/auth/signin?callbackUrl=/invite/${token}`}
            className="inline-block rounded-full bg-amber-700 px-6 py-3 text-sm font-medium text-white hover:bg-amber-800 transition-colors"
          >
            Inloggen
          </a>
        )}
      </div>
    </div>
  );
}
