"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, User, ShieldCheck, Gift, Info, Loader2, Lock, Watch, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtRM } from "@/lib/utils";
import { useGuardian } from "@/lib/guardian";
import { scoreTransaction } from "@/lib/guardian";

export default function TransferMoney() {
  const { recipient, amount, setAmount, note, setNote, balance, confirmAmount, setScreen, showBalance, pairCode, deductBalance } = useApp();
  const { walletStatus, setPendingApproval, pushAudit, freezeWallet } = useGuardian();
  const [local, setLocal] = useState(amount ? amount.toFixed(2) : "");
  const [scoring, setScoring] = useState(false);
  const [showBehaviorWarning, setShowBehaviorWarning] = useState(false);
  const [pendingScore, setPendingScore] = useState<any>(null);

  const room = (pairCode || "DEMO").toUpperCase();

  // Send notification to watch
  const sendWatchNotification = async (title: string, body: string) => {
    try {
      await fetch("/api/remote/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room,
          notification: { id: "n" + Date.now(), ts: Date.now(), title, body },
        }),
      });
    } catch {}
  };

  // Send approval request to watch
  const sendWatchApproval = async (approval: any) => {
    try {
      await fetch("/api/remote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room,
          cmd: "guardian-approval",
          payload: approval,
        }),
      });
    } catch {}
  };

  // Tell watch a decision was made (so its approval popup closes)
  const sendWatchDecision = async (decision: "approve" | "block") => {
    try {
      await fetch("/api/remote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room,
          cmd: "guardian-decision",
          payload: { decision },
        }),
      });
    } catch {}
  };

  useEffect(() => {
    setLocal(amount ? amount.toFixed(2) : "");
  }, [amount]);

  const num = parseFloat(local.replace(/[^\d.]/g, ""));
  // Demo: do not gate by wallet balance so AI-prefilled anomaly flow (e.g. RM500) can proceed.
  const valid = !isNaN(num) && num > 0;
  const overBalance = valid && num > balance;

  // Listen for watch decisions on the behavior-warning modal.
  // Watch approve = skip phone credentials and proceed straight to processing.
  useEffect(() => {
    if (!showBehaviorWarning || !recipient) return;
    function onDecision(e: any) {
      const d = e?.detail?.decision as "approve" | "block" | "freeze" | undefined;
      if (!d) return;
      if (d === "approve") {
        pushAudit({
          kind: "approved",
          summary: `Approved ${fmtRM(num)} → ${recipient!.name} (watch)`,
        });
        setPendingApproval(undefined);
        setShowBehaviorWarning(false);
        setPendingScore(null);
        // Skip auth screen — watch already authenticated via biometric trust
        deductBalance(num);
        sendWatchNotification("Transfer Sent", `${fmtRM(num)} to ${recipient!.name}`);
        setScreen("processing");
      } else if (d === "block") {
        pushAudit({
          kind: "blocked",
          summary: `Blocked ${fmtRM(num)} → ${recipient!.name} (watch)`,
        });
        setPendingApproval(undefined);
        setShowBehaviorWarning(false);
        setPendingScore(null);
      } else if (d === "freeze") {
        freezeWallet(`Wallet frozen after suspicious ${fmtRM(num)} attempt`);
        setPendingApproval(undefined);
        setShowBehaviorWarning(false);
        setPendingScore(null);
      }
    }
    window.addEventListener("guardian-decision", onDecision as any);
    return () => window.removeEventListener("guardian-decision", onDecision as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBehaviorWarning, recipient, num]);

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="tng-blue text-white px-4 pt-10 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen("transfer-recipient")} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Transfer Money</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4">
        <div className="text-xs text-gray-500 mt-4">Transfer to</div>
        <div className="mt-1 rounded-2xl p-4 bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-tng-sky flex items-center justify-center">
            <User className="w-5 h-5 text-tng-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {recipient ? recipient.name.toUpperCase() : "Select recipient"}
            </div>
            {recipient?.phone && <div className="text-xs text-gray-600">{recipient.phone}</div>}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-gray-700 bg-tng-sky/50 border border-tng-sky rounded-lg px-3 py-2">
          <ShieldCheck className="w-4 h-4 text-tng-blue shrink-0" />
          Always verify recipient name before transferring.
        </div>

        <div className="mt-5">
          <div className="text-xs text-gray-500">Amount</div>
          <div className="flex items-baseline gap-2 border-b border-gray-300 py-2">
            <span className="text-2xl font-semibold text-gray-400">RM</span>
            <input
              autoFocus
              inputMode="decimal"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="0.00"
              className="flex-1 text-3xl font-light outline-none placeholder:text-gray-300"
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            You can transfer up to {showBalance ? fmtRM(balance) : "RM ••••••"} <Info className="w-3 h-3 text-tng-blue" />
          </div>
          {overBalance && (
            <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              Demo mode: amount exceeds your wallet balance. The app would normally block this —
              we&apos;ll let it through for the AI anomaly demo.
            </div>
          )}
        </div>

        <button className="mt-3 px-3 py-1.5 rounded-full border border-tng-blue text-tng-blue text-xs font-semibold flex items-center gap-1">
          <Gift className="w-3.5 h-3.5" /> Send gift
        </button>

        <div className="mt-5">
          <div className="text-xs text-gray-500">What&apos;s the transfer for?</div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 mt-1">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 50))}
              className="w-full bg-transparent outline-none text-gray-900"
            />
          </div>
          <div className="text-right text-[10px] text-gray-400">{note.length}/50</div>
        </div>

        <button className="mt-3 px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 text-xs font-semibold">
          Pick a Greeting
        </button>

        <div className="mt-6 rounded-xl overflow-hidden bg-gradient-to-br from-sky-100 to-indigo-100 aspect-[16/9] flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-sm text-gray-700 font-semibold">Tango Wallet Assistant</div>
            <div className="text-[11px] text-gray-600">Fast. Safe. Smart transfers with AI.</div>
          </div>
        </div>

        <div className="h-24" />
      </div>

      <div className="px-4 pb-4 bg-white border-t border-gray-100 pt-3">
        {walletStatus === "frozen" && (
          <div className="mb-2 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Wallet is frozen. Unfreeze in Guardian Center to continue.
          </div>
        )}
        <button
          disabled={!valid || !recipient || scoring || walletStatus === "frozen"}
          onClick={async () => {
            if (!recipient) return;
            setAmount(num);
            setScoring(true);
            try {
              const score = await scoreTransaction(recipient.id, num);

              // Behaviour anomaly: amount is >= 3x the user's usual amount to this recipient.
              // Even if the global risk score lands in "allow", we still want a confirmation
              // because it deviates from the user's payment pattern.
              const usuallyPay = score.avg && score.avg > 0 ? score.avg : 0;
              const isBehaviorAnomaly =
                usuallyPay > 0 && num >= usuallyPay * 3;

              // Low risk AND no behaviour anomaly → notify watch and proceed
              if (
                score.action === "allow" &&
                score.riskLevel === "low" &&
                !isBehaviorAnomaly
              ) {
                await sendWatchNotification(
                  "Transfer Sent",
                  `${fmtRM(num)} to ${recipient.name}`
                );
                confirmAmount();
                return;
              }

              // Behaviour anomaly even though risk score is low → manual approval required
              if (
                isBehaviorAnomaly &&
                (score.action === "allow" || score.action === "require_confirmation")
              ) {
                const reasons = [
                  `You usually pay ${fmtRM(usuallyPay)} to ${recipient.name}`,
                  `This transfer is ${(num / usuallyPay).toFixed(1)}× your usual amount`,
                  ...score.reasons.filter((r) => !r.toLowerCase().includes("normal")),
                ];
                const approval = {
                  id: "p" + Date.now(),
                  recipientId: recipient.id,
                  recipientName: recipient.name,
                  amount: num,
                  riskScore: Math.max(score.riskScore, 60),
                  riskLevel: "high" as const,
                  reasons,
                  createdAt: Date.now(),
                };
                pushAudit({
                  kind: "approval-required",
                  summary: `Behaviour anomaly: ${fmtRM(num)} → ${recipient.name}`,
                  details: { usuallyPay, multiplier: num / usuallyPay },
                });
                setPendingApproval(approval);
                setPendingScore({ ...score, reasons });
                setShowBehaviorWarning(true);
                await sendWatchApproval(approval);
                return;
              }

              // High risk / unusual behavior - show warning and require approval
              if (score.action === "block") {
                const approval = {
                  id: "p" + Date.now(),
                  recipientId: recipient.id,
                  recipientName: recipient.name,
                  amount: num,
                  riskScore: score.riskScore,
                  riskLevel: score.riskLevel,
                  reasons: score.reasons,
                  createdAt: Date.now(),
                };
                pushAudit({
                  kind: "blocked",
                  summary: `Auto-blocked ${fmtRM(num)} → ${recipient.name}`,
                  details: { riskScore: score.riskScore, reasons: score.reasons },
                });
                setPendingApproval(approval);
                await sendWatchApproval(approval);
              } else if (
                score.action === "require_watch_approval" ||
                score.action === "require_confirmation"
              ) {
                const approval = {
                  id: "p" + Date.now(),
                  recipientId: recipient.id,
                  recipientName: recipient.name,
                  amount: num,
                  riskScore: score.riskScore,
                  riskLevel: score.riskLevel,
                  reasons: score.reasons,
                  createdAt: Date.now(),
                };
                pushAudit({
                  kind: "approval-required",
                  summary: `Approval required: ${fmtRM(num)} → ${recipient.name}`,
                  details: { riskScore: score.riskScore, action: score.action },
                });
                setPendingApproval(approval);
                setPendingScore(score);
                setShowBehaviorWarning(true);
                await sendWatchApproval(approval);
              } else {
                // Medium risk - notify and proceed
                await sendWatchNotification(
                  "Transfer Sent",
                  `${fmtRM(num)} to ${recipient.name}`
                );
                confirmAmount();
              }
            } catch {
              confirmAmount();
            } finally {
              setScoring(false);
            }
          }}
          className={`w-full py-3 rounded-full font-semibold flex items-center justify-center gap-2 ${
            valid && recipient && walletStatus !== "frozen"
              ? "bg-tng-blue text-white shadow-md"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          {scoring && <Loader2 className="w-4 h-4 animate-spin" />}
          {scoring ? "Scoring risk…" : "Next"}
        </button>
      </div>

      {/* Behavior Warning Modal */}
      {showBehaviorWarning && pendingScore && recipient && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full overflow-hidden animate-in slide-in-from-bottom">
            <div className="bg-gradient-to-r from-tng-blue to-indigo-600 px-4 py-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-white" />
              <span className="text-white font-bold">Unusual Payment Detected</span>
              <button
                onClick={async () => {
                  // Dismiss the warning entirely — same effect as Reject so the
                  // watch popup also clears.
                  pushAudit({
                    kind: "blocked",
                    summary: `Dismissed ${fmtRM(num)} → ${recipient.name}`,
                  });
                  await sendWatchDecision("block");
                  setPendingApproval(undefined);
                  setShowBehaviorWarning(false);
                  setPendingScore(null);
                }}
                className="ml-auto p-1 -mr-1 rounded-full hover:bg-white/15 active:bg-white/25"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-3">
                This transaction is outside your usual payment behavior.
              </p>
              <div className="bg-tng-sky/40 border border-tng-sky rounded-xl p-3 mb-3">
                <div className="text-xs text-tng-blue font-semibold mb-1">Payment Details</div>
                <div className="text-xl font-bold text-gray-900">{fmtRM(num)}</div>
                <div className="text-sm text-gray-600">To: {recipient.name}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <div className="text-xs text-gray-500 mb-1">Why this was flagged:</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  {pendingScore.reasons.slice(0, 3).map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-tng-blue mt-0.5">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-tng-sky/30 border border-tng-sky rounded-xl p-2.5 mb-4 flex items-center gap-2">
                <Watch className="w-4 h-4 text-tng-blue shrink-0" />
                <div className="flex-1 text-[11px] text-tng-blue">
                  <div className="font-semibold">Approve from phone or watch</div>
                  <div className="opacity-80">Watch approval skips phone credentials.</div>
                </div>
                <Loader2 className="w-3.5 h-3.5 text-tng-blue animate-spin" />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    pushAudit({ kind: "blocked", summary: `Blocked ${fmtRM(num)} → ${recipient.name}` });
                    // Tell the watch FIRST so its popup closes even if we navigate away.
                    await sendWatchDecision("block");
                    setPendingApproval(undefined);
                    setShowBehaviorWarning(false);
                    setPendingScore(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={async () => {
                    pushAudit({ kind: "approved", summary: `Approved ${fmtRM(num)} → ${recipient.name} (phone)` });
                    // Tell the watch FIRST so its popup closes even after we navigate away.
                    await sendWatchDecision("approve");
                    setPendingApproval(undefined);
                    setShowBehaviorWarning(false);
                    setPendingScore(null);
                    confirmAmount();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-tng-blue text-white font-semibold text-sm shadow-md"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
