import { NextRequest, NextResponse } from "next/server";
import { logAction, logGuardianAudit } from "@/lib/data";
import { DEMO_USER_ID } from "@/lib/supabase";

export const runtime = "nodejs";

// Persist client-side audit + action events to Supabase.
// Body: { kind: "action" | "guardian", entry: {...} }
export async function POST(req: NextRequest) {
  try {
    const { kind, entry } = await req.json();
    if (!entry?.summary) {
      return NextResponse.json({ ok: false, error: "missing summary" }, { status: 400 });
    }
    if (kind === "guardian") {
      await logGuardianAudit({
        user_id: DEMO_USER_ID,
        kind: entry.kind ?? "info",
        summary: entry.summary,
        details: entry.details,
      });
    } else {
      await logAction({
        user_id: DEMO_USER_ID,
        type: entry.type ?? "info",
        summary: entry.summary,
        details: entry.details,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}

// GET ?limit=20 — returns recent action log entries (used in history drawer).
export async function GET(req: NextRequest) {
  const { createServiceClient } = await import("@/lib/supabase");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("action_log")
    .select("*")
    .eq("user_id", DEMO_USER_ID)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, entries: data ?? [] });
}
