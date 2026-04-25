// Server-side data access layer backed by Supabase.
// Used by API routes (e.g. risk-score, detect-risk, tango).

import { createServiceClient } from "./supabase";
import { phoneticKey, type Recipient } from "./db";

const sb = () => createServiceClient();

export async function listRecipients(): Promise<Recipient[]> {
  const { data, error } = await sb().from("recipients").select("*");
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone ?? undefined,
    bank: r.bank ?? undefined,
    avatarColor: r.avatar_color ?? undefined,
  }));
}

export async function findRecipientsDb(query: string): Promise<Recipient[]> {
  const q = query.trim();
  if (!q) return [];
  const all = await listRecipients();
  const lower = q.toLowerCase();
  const pk = phoneticKey(q);
  const direct = all.filter(
    (r) => r.name.toLowerCase().includes(lower) || r.phone?.includes(q),
  );
  const fuzzy = all.filter((r) =>
    r.name
      .toLowerCase()
      .split(/\s+/)
      .some((tok) => phoneticKey(tok).includes(pk) || pk.includes(phoneticKey(tok))),
  );
  const seen = new Set<string>();
  return [...direct, ...fuzzy].filter((r) =>
    seen.has(r.id) ? false : (seen.add(r.id), true),
  );
}

export async function averageSentToDb(recipientId: string): Promise<number> {
  const { data, error } = await sb()
    .from("transactions")
    .select("amount")
    .eq("recipient_id", recipientId);
  if (error || !data || data.length === 0) return 0;
  const total = data.reduce((s, t) => s + Number(t.amount), 0);
  return total / data.length;
}

export async function logAction(entry: {
  user_id: string;
  type: string;
  summary: string;
  details?: Record<string, any>;
}) {
  await sb().from("action_log").insert(entry);
}

export async function logGuardianAudit(entry: {
  user_id: string;
  kind: string;
  summary: string;
  details?: Record<string, any>;
}) {
  await sb().from("guardian_audit").insert(entry);
}

export async function publishRemoteEvent(entry: {
  room: string;
  cmd: string;
  payload?: Record<string, any>;
}) {
  await sb().from("remote_events").insert(entry);
}
