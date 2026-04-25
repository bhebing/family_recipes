import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminInvitePanel from "@/components/AdminInvitePanel";

export default async function AdminInvitesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  if (!currentUser?.isAdmin) redirect("/");

  const [invites, approvedUsers] = await Promise.all([
    prisma.invite.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usedBy: { select: { name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: { approved: true, isAdmin: false },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-stone-900">Uitnodigingen</h1>
        <p className="mt-2 text-sm text-stone-400">
          Maak uitnodigingslinks aan en beheer toegang.
        </p>
      </div>
      <AdminInvitePanel invites={invites} approvedUsers={approvedUsers} baseUrl={baseUrl} />
    </div>
  );
}
