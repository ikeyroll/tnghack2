import { createClient } from "@supabase/supabase-js";

// Browser / client-side Supabase client (uses anon key, RLS-enforced).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

// Server-only client with the service role key. Use this from API routes
// only. NEVER import from a "use client" component.
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Database row types matching the SQL schema below.
export type Recipient = {
  id: string;
  name: string;
  phone: string | null;
  bank: string | null;
  avatar_color: string | null;
};

export type Transaction = {
  id: string;
  recipient_id: string;
  amount: number;
  note: string | null;
  created_at: string;
};

export type ActionLog = {
  id: string;
  user_id: string;
  type: string;
  summary: string;
  details: Record<string, any> | null;
  created_at: string;
};

export type GuardianAudit = {
  id: string;
  user_id: string;
  kind: string;
  summary: string;
  details: Record<string, any> | null;
  created_at: string;
};

// Demo single-user mode: every record uses this user_id.
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
