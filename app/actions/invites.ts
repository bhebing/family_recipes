"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
  if (!user?.isAdmin) throw new Error("Forbidden");
  return session.user.id;
}

export async function createInvite(note: string) {
  const adminId = await requireAdmin();
  const invite = await prisma.invite.create({
    data: { note: note.trim() || null, createdById: adminId },
  });
  revalidatePath("/admin/invites");
  return invite.token;
}

export async function revokeInvite(inviteId: string) {
  await requireAdmin();
  await prisma.invite.delete({ where: { id: inviteId } });
  revalidatePath("/admin/invites");
}

export async function revokeUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { approved: false } });
  revalidatePath("/admin/invites");
}

export async function acceptInvite(token: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.usedById) throw new Error("Invalid or already used invite");

  await prisma.$transaction([
    prisma.invite.update({
      where: { token },
      data: { usedById: session.user.id, usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { approved: true },
    }),
  ]);
}
