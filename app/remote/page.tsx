"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Mic, Wifi, WifiOff, ArrowLeft, QrCode as QrIcon, Bell, Wallet, Sparkles,
  ShieldAlert, CheckCircle2, Ban, Lock, ChevronLeft, ChevronRight, Heart,
} from "lucide-react";

type Status = "idle" | "sending" | "ok" | "err";
type View = "loading" | "menu" | "pay" | "balance" | "notifications" | "tango" | "listening" | "sent" | "error" | "guardian" | "stress";

type GuardianApproval = {
  id: string;
  recipientName: string;
  amount: number;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  reasons: string[];
};

type RoomState = {
  balance: number | null;
  notifications: { id: string; ts: number; title: string; body?: string }[];
  updatedAt: number;
};

// Deterministic QR mosaic (visual only)
function FakeQR({ size = 150, color = "#0057d9" }: { size?: number; color?: string }) {
  const cols = 25;
  const cells = Array.from({ length: cols * cols }, (_, i) => {
    const x = i % cols, y = Math.floor(i / cols);
    const on = ((x * 73856093) ^ (y * 19349663)) % 5 < 2;
    const inFinder = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17);
    return on || inFinder;
  });
  return (
    <div
      className="grid gap-[1px] p-1.5 rounded bg-white"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, width: size, height: size }}
    >
      {cells.map((on, i) => (
        <div key={i} style={{ background: on ? color : "#fff" }} />
      ))}
    </div>
  );
}

// Gemini-style 4-point sparkle in gradient colours
function GeminiSpark({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="33%" stopColor="#9B72F6" />
          <stop offset="66%" stopColor="#F65F73" />
          <stop offset="100%" stopColor="#FBBC04" />
        </linearGradient>
      </defs>
      <path
        d="M24 2 C 26 14, 34 22, 46 24 C 34 26, 26 34, 24 46 C 22 34, 14 26, 2 24 C 14 22, 22 14, 24 2 Z"
        fill="url(#gg)"
      />
    </svg>
  );
}

/** Classify a phrase into a watch-local view, or a relay command for the phone. */
type Interpreted =
  | { kind: "local"; view: "pay" | "balance" | "notifications"; label: string }
  | { kind: "relay"; cmd: string; payload?: any; label: string }
  | null;

function interpret(raw: string): Interpreted {
  const t = raw.toLowerCase().trim();
  if (!t) return null;

  // Local-on-watch: pay QR
  if (/\b(pay|pay\s+qr|show\s+pay|my\s+(pay|qr)|pay\s+code)\b/.test(t)) {
    return { kind: "local", view: "pay", label: "Pay QR" };
  }
  // Local-on-watch: balance
  if (/\b(balance|how\s+much|check\s+(my\s+)?(balance|money)|wallet)\b/.test(t)) {
    return { kind: "local", view: "balance", label: "Balance" };
  }
  // Local-on-watch: notifications
  if (/\b(notification|notifications|alerts?|recent|history|activity)\b/.test(t)) {
    return { kind: "local", view: "notifications", label: "Notifications" };
  }

  // Relay: navigation
  const navMap: [RegExp, string, string][] = [
    [/\b(open|go to|show)\s+home\b/, "open-home", "Home"],
    [/\b(open|go to|show)\s+scan(ner)?\b/, "open-scan", "Scan"],
    [/\b(open|go to|show)\s+receive\b/, "open-receive", "Receive"],
    [/\b(open|go to|show)\s+prepaid\b|\btop[-\s]?up\b|\breload\b/, "open-prepaid", "Prepaid"],
    [/\b(open|go to|show)\s+(donation|donate|charity)\b/, "open-donation", "Donation"],
    [/\b(open|go to|show)\s+(cash\s*loan|loan)\b/, "open-cashloan", "CashLoan"],
    [/\b(open|go to|show)\s+transfer\b/, "open-transfer", "Transfer"],
    [/\b(tango|assistant|ask\s+ai)\b/, "show-tango", "Tango AI"],
  ];
  for (const [rx, cmd, label] of navMap) {
    if (rx.test(t)) return { kind: "relay", cmd, label };
  }

  // Relay: pay merchant
  const m =
    t.match(/pay\s+(?:rm\s*)?(\d+(?:\.\d+)?)\s+(?:at|to|for)?\s*(kopi corner|seven mart|mrt touch pay)/) ||
    t.match(/pay\s+(kopi corner|seven mart|mrt touch pay)\s+(?:rm\s*)?(\d+(?:\.\d+)?)/);
  if (m) {
    const amtStr = /^[0-9]/.test(m[1]) ? m[1] : m[2];
    const nameStr = /^[0-9]/.test(m[1]) ? m[2] : m[1];
    const amount = parseFloat(amtStr);
    const name = nameStr.replace(/\b\w/g, (c) => c.toUpperCase());
    return { kind: "relay", cmd: "pay-merchant", payload: { amount, name }, label: `Pay RM${amount} @ ${name}` };
  }

  // Relay: pay Rizwan
  const r =
    t.match(/(?:pay|send|transfer)\s+(?:rm\s*)?(\d+(?:\.\d+)?)\s+(?:to\s+)?rizwan/) ||
    t.match(/(?:pay|send|transfer)\s+rizwan\s+(?:rm\s*)?(\d+(?:\.\d+)?)/);
  if (r) {
    const amount = parseFloat(r[1]);
    return { kind: "relay", cmd: "pay-rizwan", payload: { amount }, label: `Pay Rizwan RM${amount}` };
  }

  // Generic "pay RM N" → default merchant on phone
  const p = t.match(/pay\s+(?:rm\s*)?(\d+(?:\.\d+)?)/);
  if (p) {
    const amount = parseFloat(p[1]);
    return { kind: "relay", cmd: "pay-merchant", payload: { amount, name: "Kopi Corner" }, label: `Pay RM${amount}` };
  }

  return null;
}

function Controller() {
  const params = useSearchParams();
  // Default to "DEMO" room for demo purposes
  const room = (params.get("room") || "DEMO").toUpperCase();

  const [view, setView] = useState<View>("loading");
  const [menuIndex, setMenuIndex] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [heard, setHeard] = useState<string>("");
  const [lastLabel, setLastLabel] = useState<string>("");
  const [showConnectPopup, setShowConnectPopup] = useState(false);

  const [online, setOnline] = useState(true);
  const [now, setNow] = useState<string>("");
  const [state, setState] = useState<RoomState | null>(null);
  const [approval, setApproval] = useState<GuardianApproval | null>(null);
  const [stress, setStress] = useState<{ bpm: number; reason?: string } | null>(null);

  const recogRef = useRef<any>(null);
  const esRef = useRef<EventSource | null>(null);
  const revertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Loading screen → connect popup → menu
  useEffect(() => {
    if (view === "loading") {
      const t1 = setTimeout(() => {
        setShowConnectPopup(true);
      }, 1500);
      const t2 = setTimeout(() => {
        setShowConnectPopup(false);
        setView("menu");
      }, 3000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [view]);

  // Clock
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      );
    tick();
    const iv = setInterval(tick, 15_000);
    return () => clearInterval(iv);
  }, []);

  // Online indicator
  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // SSE subscription for guardian-approval pushes from the phone
  useEffect(() => {
    if (!room || typeof window === "undefined") return;
    const es = new EventSource(`/api/remote?room=${encodeURIComponent(room)}`);
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.cmd === "guardian-approval" && data.payload) {
          setApproval(data.payload as GuardianApproval);
          setView("guardian");
          try { (navigator as any).vibrate?.([80, 40, 80]); } catch {}
        } else if (data.cmd === "guardian-decision") {
          // Phone made a decision — close watch approval popup if open
          setApproval(null);
          setView((cur) => (cur === "guardian" ? "balance" : cur));
        } else if (data.cmd === "stress-alert" && data.payload) {
          setStress({
            bpm: Number(data.payload.bpm) || 124,
            reason: String(data.payload.reason || ""),
          });
          setView("stress");
          try { (navigator as any).vibrate?.([60, 40, 60, 40, 60]); } catch {}
        } else if (data.cmd === "stress-clear") {
          setStress(null);
          setView((cur) => (cur === "stress" ? "balance" : cur));
        }
      } catch {}
    };
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [room]);

  const sendDecision = useCallback(
    async (decision: "approve" | "block" | "freeze") => {
      if (!room || !approval) return;
      try {
        await fetch("/api/remote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room,
            cmd: "guardian-decision",
            payload: { id: approval.id, decision },
          }),
        });
      } catch {}
      setApproval(null);
      setLastLabel(
        decision === "approve"
          ? "Transaction approved"
          : decision === "block"
          ? "Transaction blocked"
          : "Wallet frozen"
      );
      setView("sent");
    },
    [room, approval]
  );

  // Poll state (balance, notifications) every 3s when paired
  const lastNotifIdRef = useRef<string | null>(null);
  const [popupNotif, setPopupNotif] = useState<{ id: string; title: string; body?: string } | null>(null);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/remote/state?room=${encodeURIComponent(room)}`);
        const s = (await res.json()) as RoomState;
        if (!cancelled) {
          setState(s);
          // Detect new notifications and show popup
          const latest = s.notifications?.[0];
          if (latest && latest.id !== lastNotifIdRef.current) {
            // First load: just record id, don't popup
            if (lastNotifIdRef.current !== null) {
              setPopupNotif(latest);
              try { (navigator as any).vibrate?.([100, 50, 100]); } catch {}
              setTimeout(() => setPopupNotif((cur) => (cur?.id === latest.id ? null : cur)), 4000);
            }
            lastNotifIdRef.current = latest.id;
          }
        }
      } catch {}
    };
    load();
    const iv = setInterval(load, 2_000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [room]);

  // Auto-revert some transient views back to menu
  useEffect(() => {
    if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
    if (view === "sent" || view === "error") {
      revertTimerRef.current = setTimeout(() => setView("menu"), 1600);
    }
  }, [view]);

  const send = useCallback(
    async (cmd: string, payload: any, label: string) => {
      if (!room) return;
      setStatus("sending");
      setLastLabel(label);
      try {
        const res = await fetch("/api/remote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room, cmd, payload }),
        });
        const d = await res.json().catch(() => ({}));
        setStatus(d?.ok ? "ok" : "err");
        setView(d?.ok ? "sent" : "error");
        setTimeout(() => setStatus("idle"), 900);
      } catch {
        setStatus("err");
        setView("error");
      }
    },
    [room],
  );

  const handlePhrase = useCallback(
    (phrase: string) => {
      setHeard(phrase);
      const parsed = interpret(phrase);
      if (!parsed) {
        setView("error");
        setLastLabel("Didn't catch that");
        return;
      }
      setLastLabel(parsed.label);
      if (parsed.kind === "local") {
        setView(parsed.view);
      } else {
        send(parsed.cmd, parsed.payload, parsed.label);
      }
    },
    [send],
  );

  const startMic = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setHeard("Voice not supported");
      setView("error");
      return;
    }
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) handlePhrase(transcript);
      else setView("menu");
    };
    r.onerror = () => setView("menu");
    r.onend = () => {
      // If nothing happened, go back to idle
      setView((v) => (v === "listening" ? "menu" : v));
    };
    recogRef.current = r;
    setHeard("");
    setView("listening");
    try {
      r.start();
    } catch {
      setView("menu");
    }
  }, [handlePhrase]);

  const stopMic = useCallback(() => {
    try { recogRef.current?.stop?.(); } catch {}
  }, []);

  const statusDot = useMemo(() => {
    if (status === "sending") return "bg-sky-400";
    if (status === "ok") return "bg-emerald-400";
    if (status === "err") return "bg-rose-400";
    return "bg-zinc-600";
  }, [status]);

  // ---------- render ----------
  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-4 select-none">
      <div className="hidden md:block text-white/60 text-xs mb-4">
        Tango Watch · voice-first · only Pay / Balance / Notifications run on-watch
      </div>

      {/* Watch body (round) */}
      <div className="relative">
        {/* Side button */}
        <div className="absolute right-[-14px] top-1/2 -translate-y-1/2 w-3 h-14 bg-zinc-700 rounded" />
        <div className="w-[320px] h-[320px] rounded-full border-[10px] border-zinc-900 shadow-2xl relative bg-zinc-950">
          <div className="absolute inset-2 rounded-full bg-black overflow-hidden">
            {/* Top status row */}
            <div className="absolute top-3 inset-x-0 flex items-center justify-center gap-2 text-[10px] text-white/60">
              <span>{now || "--:--"}</span>
              {online ? (
                <Wifi className="w-3 h-3 text-emerald-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-rose-400" />
              )}
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
              {room && <span className="text-tng-blue font-bold tracking-wider">{room}</span>}
            </div>

            {view === "loading" ? (
              <LoadingFace />
            ) : showConnectPopup ? (
              <ConnectPopup />
            ) : view === "menu" ? (
              <MenuFace
                index={menuIndex}
                setIndex={setMenuIndex}
                balance={state?.balance ?? null}
                notifications={state?.notifications ?? []}
                onTango={startMic}
              />
            ) : view === "listening" ? (
              <ListeningFace heard={heard} onCancel={() => { stopMic(); setView("menu"); }} />
            ) : view === "pay" ? (
              <PayFace onBack={() => setView("menu")} />
            ) : view === "balance" ? (
              <BalanceFace balance={state?.balance ?? null} onBack={() => setView("menu")} />
            ) : view === "notifications" ? (
              <NotificationsFace items={state?.notifications ?? []} onBack={() => setView("menu")} />
            ) : view === "tango" ? (
              <TangoFace onBack={() => setView("menu")} onTap={startMic} heard={heard} />
            ) : view === "guardian" && approval ? (
              <GuardianApprovalFace approval={approval} onDecide={sendDecision} />
            ) : view === "stress" && stress ? (
              <StressFace bpm={stress.bpm} reason={stress.reason} />
            ) : view === "sent" ? (
              <SentFace label={lastLabel} />
            ) : (
              <ErrorFace label={lastLabel || "Not understood"} />
            )}

            {/* Notification popup overlay */}
            {popupNotif && (
              <button
                onClick={() => setPopupNotif(null)}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in"
              >
                <div className="w-[85%] bg-white rounded-2xl p-3 shadow-2xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-md bg-tng-blue flex items-center justify-center">
                      <Bell className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-tng-blue uppercase tracking-wide">Tango</span>
                  </div>
                  <div className="text-xs font-bold text-gray-900 leading-tight">
                    {popupNotif.title}
                  </div>
                  {popupNotif.body && (
                    <div className="text-[10px] text-gray-600 mt-0.5 leading-snug">
                      {popupNotif.body}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-[9px] text-white/60">tap to dismiss</div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Swipe hint */}
      <div className="mt-4 text-center text-[10px] text-white/50">
        Swipe to select · Tap to open
      </div>
    </div>
  );
}

/* -------- Faces -------- */

function LoadingFace() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <Image
        src="/favicon.png"
        alt="Tango"
        width={64}
        height={64}
        className="animate-pulse"
      />
      <div className="text-[11px] text-white/60">Loading...</div>
    </div>
  );
}

function ConnectPopup() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6">
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <Wifi className="w-8 h-8 text-emerald-400" />
      </div>
      <div className="text-sm font-semibold text-white">Connected</div>
      <div className="text-[10px] text-white/60">Phone paired successfully</div>
    </div>
  );
}

type PageId = "balance" | "pay" | "notifications" | "tango";
const pageOrder: PageId[] = ["balance", "pay", "notifications", "tango"];

function MenuFace({
  index,
  setIndex,
  balance,
  notifications,
  onTango,
}: {
  index: number;
  setIndex: (i: number) => void;
  balance: number | null;
  notifications: { id: string; ts: number; title: string; body?: string }[];
  onTango: () => void;
}) {
  const pageId = pageOrder[index];
  const prev = () => setIndex((index - 1 + pageOrder.length) % pageOrder.length);
  const next = () => setIndex((index + 1) % pageOrder.length);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
      {/* Page content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {pageId === "balance" && <BalancePage balance={balance} />}
        {pageId === "pay" && <PayPage />}
        {pageId === "notifications" && <NotificationsPage items={notifications} />}
        {pageId === "tango" && <TangoPage onTap={onTango} />}
      </div>

      {/* Left arrow */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 z-10"
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>
      {/* Right arrow */}
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 z-10"
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </button>

      {/* Page dots */}
      <div className="absolute bottom-6 flex gap-1.5 z-10">
        {pageOrder.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/30"}`}
          />
        ))}
      </div>
    </div>
  );
}

function BalancePage({ balance }: { balance: number | null }) {
  const formatted =
    balance == null
      ? "—"
      : "RM" +
        balance.toLocaleString("en-MY", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  return (
    <div className="flex flex-col items-center text-center px-6">
      <div className="flex items-center gap-1 text-[10px] text-white/70 mb-2">
        <Wallet className="w-3 h-3 text-tng-blue" />
        <span className="font-semibold">Balance</span>
      </div>
      <div className="text-[10px] text-white/50">eWallet</div>
      <div className="text-2xl font-bold mt-0.5 bg-gradient-to-br from-sky-300 to-tng-blue bg-clip-text text-transparent">
        {formatted}
      </div>
      <div className="mt-1 text-[9px] text-white/40">live from your phone</div>
    </div>
  );
}

function PayPage() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1 text-[10px] text-white/70 mb-1.5">
        <QrIcon className="w-3 h-3 text-tng-blue" />
        <span className="font-semibold">Pay</span>
      </div>
      <div className="p-1.5 rounded-xl bg-tng-blue">
        <div className="bg-white p-1 rounded-lg">
          <FakeQR size={120} color="#0057d9" />
        </div>
      </div>
      <div className="mt-1.5 text-[9px] text-white/60">show to merchant</div>
    </div>
  );
}

function NotificationsPage({ items }: { items: { id: string; ts: number; title: string; body?: string }[] }) {
  return (
    <div className="flex flex-col items-center w-full px-6">
      <div className="flex items-center gap-1 text-[10px] text-white/70 mb-2">
        <Bell className="w-3 h-3 text-tng-blue" />
        <span className="font-semibold">Alerts</span>
      </div>
      {items.length === 0 ? (
        <div className="text-[10px] text-white/40 mt-4">No alerts yet</div>
      ) : (
        <div className="w-full space-y-1 max-h-[120px] overflow-y-auto no-scrollbar">
          {items.slice(0, 4).map((n) => (
            <div key={n.id} className="bg-white/8 rounded-lg px-2 py-1.5 text-left">
              <div className="text-[10px] font-semibold text-white truncate">{n.title}</div>
              {n.body && <div className="text-[9px] text-white/60 truncate">{n.body}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TangoPage({ onTap }: { onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
    >
      <div className="flex items-center gap-1 text-[10px] text-white/70">
        <Sparkles className="w-3 h-3 text-tng-blue" />
        <span className="font-semibold">Tango AI</span>
      </div>
      <GeminiSpark size={48} />
      <div className="text-white/90 text-xs font-medium">Ask Tango</div>
      <div className="text-[9px] text-white/50">tap to speak</div>
    </button>
  );
}

function TangoFace({ onBack, onTap, heard }: { onBack: () => void; onTap: () => void; heard: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-900">
      <FaceHeader icon={<Sparkles className="w-3 h-3" />} title="Tango AI" onBack={onBack} />
      <button
        onClick={onTap}
        className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
      >
        <GeminiSpark size={56} />
        <div className="text-white/90 text-sm font-medium">Ask Tango</div>
        <div className="text-[9px] text-white/50">tap to speak</div>
      </button>
      {heard && (
        <div className="absolute bottom-12 text-[10px] text-white/80 px-4 text-center truncate max-w-full">
          "{heard}"
        </div>
      )}
    </div>
  );
}

function ListeningFace({ heard, onCancel }: { heard: string; onCancel: () => void }) {
  return (
    <button
      onClick={onCancel}
      className="absolute inset-0 flex flex-col items-center justify-center gap-3"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-tng-blue/30 animate-ping" />
        <div className="w-14 h-14 rounded-full bg-tng-blue flex items-center justify-center relative">
          <Mic className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="text-[11px] text-white/70">Listening…</div>
      {heard && <div className="text-[10px] text-white/90 px-6 text-center truncate max-w-full">“{heard}”</div>}
      <div className="absolute bottom-6 text-[9px] text-white/40">tap to cancel</div>
    </button>
  );
}

function FaceHeader({ icon, title, onBack }: { icon: React.ReactNode; title: string; onBack: () => void }) {
  return (
    <div className="absolute top-9 inset-x-0 flex items-center justify-center gap-1 text-[10px] text-white/70">
      <button onClick={onBack} className="absolute left-8" aria-label="Back">
        <ArrowLeft className="w-3.5 h-3.5 text-white/70" />
      </button>
      <span className="text-tng-blue">{icon}</span>
      <span className="font-semibold">{title}</span>
    </div>
  );
}

function PayFace({ onBack }: { onBack: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <FaceHeader icon={<QrIcon className="w-3 h-3" />} title="Pay" onBack={onBack} />
      <div className="p-1.5 rounded-xl bg-tng-blue mt-1">
        <div className="bg-white p-1 rounded-lg">
          <FakeQR size={140} color="#0057d9" />
        </div>
      </div>
      <div className="mt-2 text-[9px] text-white/60">show to merchant</div>
    </div>
  );
}

function BalanceFace({ balance, onBack }: { balance: number | null; onBack: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
      <FaceHeader icon={<Wallet className="w-3 h-3" />} title="Balance" onBack={onBack} />
      <div className="text-[10px] text-white/50">eWallet</div>
      <div className="text-3xl font-bold mt-1 bg-gradient-to-br from-sky-300 to-tng-blue bg-clip-text text-transparent">
        {balance == null ? "—" : `RM${balance.toFixed(2)}`}
      </div>
      <div className="mt-1 text-[9px] text-white/40">live from your phone</div>
    </div>
  );
}

function NotificationsFace({
  items, onBack,
}: { items: { id: string; ts: number; title: string; body?: string }[]; onBack: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col pt-12 pb-5 px-6">
      <FaceHeader icon={<Bell className="w-3 h-3" />} title="Notifications" onBack={onBack} />
      <div className="mt-2 flex-1 overflow-y-auto no-scrollbar space-y-1.5">
        {items.length === 0 && (
          <div className="text-center text-[10px] text-white/40 mt-6">No notifications yet</div>
        )}
        {items.slice(0, 6).map((n) => (
          <div key={n.id} className="bg-zinc-900 border border-white/5 rounded-lg px-2 py-1.5">
            <div className="text-[9px] text-white/50">{n.body || "—"}</div>
            <div className="text-[10px] text-white truncate">{n.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuardianApprovalFace({
  approval,
  onDecide,
}: {
  approval: GuardianApproval;
  onDecide: (d: "approve" | "block" | "freeze") => void;
}) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-tng-blue to-indigo-700 flex flex-col items-center pt-9 pb-3 px-4 text-center">
      <div className="flex items-center gap-1 text-[10px] font-semibold text-white/90">
        <ShieldAlert className="w-3 h-3" /> UNUSUAL · RISK {approval.riskScore}
      </div>
      <div className="mt-1 text-[9px] text-white/70">
        Tango Guardian
      </div>
      <div className="mt-1.5 text-xl font-bold text-white leading-none">
        RM{approval.amount.toFixed(2)}
      </div>
      <div className="text-[10px] text-white/85 truncate max-w-full">
        → {approval.recipientName}
      </div>
      <div className="mt-1.5 text-[9px] text-white/85 leading-snug px-1 line-clamp-2">
        {approval.reasons.slice(0, 2).join(" · ")}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-1.5 w-full">
        <button
          onClick={() => onDecide("block")}
          className="bg-white/15 hover:bg-white/25 text-white rounded-lg py-1.5 flex flex-col items-center gap-0.5 border border-white/20"
        >
          <Ban className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">Reject</span>
        </button>
        <button
          onClick={() => onDecide("approve")}
          className="bg-white text-tng-blue rounded-lg py-1.5 flex flex-col items-center gap-0.5 shadow-md"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">Approve</span>
        </button>
      </div>
    </div>
  );
}

function StressFace({ bpm, reason }: { bpm: number; reason?: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-rose-700 via-rose-600 to-red-800 flex flex-col items-center pt-9 pb-3 px-4 text-center overflow-hidden">
      {/* Two pulsing aura rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-44 h-44 rounded-full bg-white/10"
          style={{ animation: "stressPulse 1.1s ease-out infinite" }}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-32 h-32 rounded-full bg-white/15"
          style={{ animation: "stressPulse 1.1s ease-out 0.35s infinite" }}
        />
      </div>

      <div className="flex items-center gap-1 text-[10px] font-semibold text-white/95 z-10">
        <Heart className="w-3 h-3 fill-white" /> ELEVATED HEART RATE
      </div>
      <div className="mt-0.5 text-[9px] text-white/70 z-10">Tango Guardian</div>

      <div className="mt-auto mb-auto z-10 flex flex-col items-center">
        <div
          className="relative flex items-center justify-center"
          style={{ animation: "stressBeat 0.85s ease-in-out infinite" }}
        >
          <Heart className="w-16 h-16 text-white fill-white drop-shadow-[0_0_12px_rgba(255,80,80,0.8)]" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-white leading-none tabular-nums">
            {bpm}
          </span>
          <span className="text-[10px] font-semibold text-white/80">BPM</span>
        </div>
      </div>

      <div className="z-10 text-[9px] text-white/85 leading-snug px-2 line-clamp-2 mb-1">
        {reason || "Take a deep breath before paying."}
      </div>

      <style jsx>{`
        @keyframes stressBeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.18); }
          30% { transform: scale(0.98); }
          45% { transform: scale(1.12); }
        }
        @keyframes stressPulse {
          0% { transform: scale(0.7); opacity: 0.55; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function SentFace({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
      <GeminiSpark size={40} />
      <div className="text-[11px] text-white/80">Opening on phone…</div>
      <div className="text-[10px] text-emerald-400/80 truncate max-w-full">{label}</div>
    </div>
  );
}

function ErrorFace({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center px-6">
      <div className="text-rose-400 text-xs">Hmm…</div>
      <div className="text-[10px] text-white/70">{label}</div>
    </div>
  );
}

export default function RemotePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-black text-white/60 flex items-center justify-center">
          Loading…
        </div>
      }
    >
      <Controller />
    </Suspense>
  );
}
