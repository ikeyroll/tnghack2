"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShieldAlert, Watch, Lock, X, AlertTriangle, CheckCircle2,
  Loader2, Ban,
} from "lucide-react";
import { useGuardian } from "@/lib/guardian";
import { fmtRM } from "@/lib/utils";
import { useApp } from "@/lib/store";

type Decision = "approve" | "block" | "freeze";

export default function RiskApprovalSheet() {
  const { pendingApproval, setPendingApproval, freezeWallet, pushAudit } =
    useGuardian();
  const { confirmAmount, pairCode, logAction } = useApp();
  const [waiting, setWaiting] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);

  const open = !!pendingApproval;
  const a = pendingApproval;

  useEffect(() => {
    if (!open) {
      setWaiting(false);
      setDecision(null);
    }
  }, [open]);

  // When the sheet opens for a high-risk approval, broadcast it to the watch
  useEffect(() => {
    if (!a || !pairCode) return;
    setWaiting(true);
    fetch("/api/remote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: pairCode,
        cmd: "guardian-approval",
        payload: {
          id: a.id,
          recipientName: a.recipientName,
          amount: a.amount,
          riskScore: a.riskScore,
          riskLevel: a.riskLevel,
          reasons: a.reasons,
        },
      }),
    }).catch(() => {});
  }, [a?.id, pairCode]);

  // Listen for watch decision via SSE bridge events on window
  useEffect(() => {
    if (!open) return;
    function onDecision(e: any) {
      const d = e?.detail?.decision as Decision | undefined;
      if (!d || !a) return;
      handleDecision(d, "watch");
    }
    window.addEventListener("guardian-decision", onDecision as any);
    return () =>
      window.removeEventListener("guardian-decision", onDecision as any);
  }, [open, a?.id]);

  function handleDecision(d: Decision, source: "phone" | "watch") {
    if (!a) return;
    setDecision(d);
    setWaiting(false);
    if (d === "approve") {
      pushAudit({
        kind: "approved",
        summary: `Approved ${fmtRM(a.amount)} → ${a.recipientName} (${source})`,
        details: { riskScore: a.riskScore, source },
      });
      logAction({
        type: "transfer",
        summary: `Risk-approved transfer ${fmtRM(a.amount)} to ${a.recipientName}`,
        details: { riskScore: a.riskScore, approvedBy: source },
      });
      setTimeout(() => {
        setPendingApproval(undefined);
        confirmAmount();
      }, 700);
    } else if (d === "block") {
      pushAudit({
        kind: "blocked",
        summary: `Blocked ${fmtRM(a.amount)} → ${a.recipientName} (${source})`,
        details: { riskScore: a.riskScore, source },
      });
      logAction({
        type: "scam-blocked",
        summary: `Blocked suspicious ${fmtRM(a.amount)} to ${a.recipientName}`,
        details: { riskScore: a.riskScore, blockedBy: source },
      });
      setTimeout(() => setPendingApproval(undefined), 1200);
    } else if (d === "freeze") {
      freezeWallet(`Wallet frozen after suspicious ${fmtRM(a.amount)} attempt`);
      logAction({
        type: "scam-blocked",
        summary: `Wallet frozen after suspicious transfer attempt`,
        details: { riskScore: a.riskScore, frozenBy: source },
      });
      setTimeout(() => setPendingApproval(undefined), 1400);
    }
  }

  if (!a) return null;

  const palette =
    a.riskLevel === "critical"
      ? { bg: "from-red-600 to-red-700", chip: "bg-red-100 text-red-700" }
      : a.riskLevel === "high"
      ? { bg: "from-amber-600 to-red-600", chip: "bg-amber-100 text-amber-700" }
      : { bg: "from-tng-blue to-indigo-600", chip: "bg-sky-100 text-sky-700" };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 bg-black/65 z-[74]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl z-[75] overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26 }}
          >
            <div
              className={`bg-gradient-to-br ${palette.bg} text-white px-4 pt-4 pb-5`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  <div>
                    <div className="font-bold leading-tight">
                      Suspicious transaction
                    </div>
                    <div className="text-[11px] text-white/85">
                      Tango Guardian flagged this payment
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setPendingApproval(undefined)}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold leading-none">
                    {fmtRM(a.amount)}
                  </div>
                  <div className="text-xs text-white/85 mt-0.5">
                    to {a.recipientName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wide text-white/75">
                    Risk score
                  </div>
                  <div className="text-2xl font-bold">{a.riskScore}</div>
                </div>
              </div>
            </div>

            <div className="px-4 pt-4 pb-5">
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${palette.chip}`}
              >
                <AlertTriangle className="w-3 h-3" /> {a.riskLevel.toUpperCase()} RISK
              </div>

              <ul className="mt-3 space-y-1.5">
                {a.reasons.map((r, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-700 flex items-start gap-2"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>

              <div className="mt-4 bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-start gap-2">
                <Watch className="w-4 h-4 text-tng-blue mt-0.5" />
                <div className="text-[12px] text-sky-900 flex-1">
                  <div className="font-semibold">
                    {waiting && !decision
                      ? "Waiting for watch confirmation…"
                      : "Approve or block from your watch"}
                  </div>
                  <div className="opacity-80">
                    Your paired smartwatch can approve, block, or freeze the wallet.
                  </div>
                </div>
                {waiting && !decision && (
                  <Loader2 className="w-4 h-4 text-tng-blue animate-spin" />
                )}
              </div>

              {decision && (
                <DecisionBanner decision={decision} />
              )}

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Action
                  intent="ok"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  label="Approve"
                  onClick={() => handleDecision("approve", "phone")}
                  disabled={!!decision}
                />
                <Action
                  intent="warn"
                  icon={<Ban className="w-4 h-4" />}
                  label="Block"
                  onClick={() => handleDecision("block", "phone")}
                  disabled={!!decision}
                />
                <Action
                  intent="danger"
                  icon={<Lock className="w-4 h-4" />}
                  label="Freeze"
                  onClick={() => handleDecision("freeze", "phone")}
                  disabled={!!decision}
                />
              </div>

              <div className="text-[10px] text-gray-400 text-center mt-3">
                Decision is logged in your security audit trail.
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Action({
  intent,
  icon,
  label,
  onClick,
  disabled,
}: {
  intent: "ok" | "warn" | "danger";
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const cls =
    intent === "ok"
      ? "bg-emerald-600 text-white"
      : intent === "warn"
      ? "bg-amber-500 text-white"
      : "bg-red-600 text-white";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`py-2.5 rounded-xl font-semibold text-sm flex flex-col items-center gap-0.5 ${cls} ${
        disabled ? "opacity-50" : "active:opacity-90"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DecisionBanner({ decision }: { decision: Decision }) {
  const map = {
    approve: {
      cls: "bg-emerald-50 border-emerald-200 text-emerald-800",
      icon: <CheckCircle2 className="w-4 h-4" />,
      text: "Approved — proceeding to verification",
    },
    block: {
      cls: "bg-amber-50 border-amber-200 text-amber-900",
      icon: <Ban className="w-4 h-4" />,
      text: "Transaction blocked",
    },
    freeze: {
      cls: "bg-red-50 border-red-200 text-red-800",
      icon: <Lock className="w-4 h-4" />,
      text: "Wallet frozen — financial kill switch engaged",
    },
  } as const;
  const m = map[decision];
  return (
    <div
      className={`mt-3 border rounded-xl p-2.5 text-sm font-semibold flex items-center gap-2 ${m.cls}`}
    >
      {m.icon}
      {m.text}
    </div>
  );
}
