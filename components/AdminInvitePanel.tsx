"use client";

import { useState, useTransition } from "react";
import { createInvite, revokeInvite, revokeUser } from "@/app/actions/invites";

interface Invite {
  id: string;
  token: string;
  note: string | null;
  createdAt: Date;
  usedBy: { name: string | null; email: string } | null;
  usedAt?: Date | null;
}

interface ApprovedUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}

interface Props {
  invites: Invite[];
  approvedUsers: ApprovedUser[];
  baseUrl: string;
}

export default function AdminInvitePanel({ invites, approvedUsers, baseUrl }: Props) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCreate() {
    startTransition(async () => {
      const token = await createInvite(note);
      setNewLink(`${baseUrl}/nl/invite/${token}`);
      setNote("");
      setCopied(false);
    });
  }

  function copyLink() {
    if (!newLink) return;
    navigator.clipboard.writeText(newLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const pending = invites.filter((i) => !i.usedBy);
  const used = invites.filter((i) => i.usedBy);

  return (
    <div className="space-y-12">
      {/* Create invite */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">
          Nieuwe uitnodiging
        </h2>
        <div className="flex gap-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notitie (bijv. voor tante Marie)"
            className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm placeholder:text-stone-300 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 transition-colors"
          />
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="rounded-full bg-amber-700 px-5 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50 transition-colors"
          >
            Aanmaken
          </button>
        </div>

        {newLink && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3">
            <p className="flex-1 text-sm text-stone-600 truncate font-mono">{newLink}</p>
            <button
              onClick={copyLink}
              className="shrink-0 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
            >
              {copied ? "Gekopieerd!" : "Kopiëren"}
            </button>
          </div>
        )}
      </section>

      {/* Pending invites */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">
            Openstaand ({pending.length})
          </h2>
          <ul className="space-y-2">
            {pending.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-4 py-2 border-b border-stone-100">
                <div>
                  <p className="text-sm text-stone-700">{invite.note ?? <span className="text-stone-400">Geen notitie</span>}</p>
                  <p className="text-xs text-stone-400 font-mono">{invite.token}</p>
                </div>
                <button
                  onClick={() => startTransition(() => revokeInvite(invite.id))}
                  disabled={isPending}
                  className="shrink-0 text-xs text-stone-300 hover:text-red-400 transition-colors"
                >
                  Intrekken
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Approved users */}
      {approvedUsers.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">
            Goedgekeurde gebruikers ({approvedUsers.length})
          </h2>
          <ul className="space-y-2">
            {approvedUsers.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-4 py-2 border-b border-stone-100">
                <div>
                  <p className="text-sm text-stone-700">{user.name ?? "—"}</p>
                  <p className="text-xs text-stone-400">{user.email}</p>
                </div>
                <button
                  onClick={() => startTransition(() => revokeUser(user.id))}
                  disabled={isPending}
                  className="shrink-0 text-xs text-stone-300 hover:text-red-400 transition-colors"
                >
                  Toegang intrekken
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Used invites */}
      {used.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">
            Gebruikt ({used.length})
          </h2>
          <ul className="space-y-2">
            {used.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-4 py-2 border-b border-stone-100">
                <div>
                  <p className="text-sm text-stone-700">{invite.usedBy?.name ?? invite.usedBy?.email}</p>
                  <p className="text-xs text-stone-400">{invite.note ?? "Geen notitie"}</p>
                </div>
                <span className="text-xs text-stone-300">Gebruikt</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
