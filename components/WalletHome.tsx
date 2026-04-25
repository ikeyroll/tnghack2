"use client";
import { useEffect, useState } from "react";
import {
  Search, User, Check, Eye, EyeOff, Plus, ChevronRight,
  FileCheck, PieChart, Send, CreditCard, Sparkles,
  Home, ShoppingBag, DollarSign, MapPin, ScanLine,
  Palmtree, Sunrise, Wallet, Fuel, Heart, MapPinned, Watch,
  Coins, Building2, MessageSquare, Gift, AlertTriangle, XCircle, ShieldX,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtRM } from "@/lib/utils";
import { useGuardian } from "@/lib/guardian";

const DEMO_AMOUNT = 117;
const DEMO_RECIPIENT = {
  id: "merchant-yt-premium",
  name: "Yoga Premium",
  phone: "Subscription",
};

export default function WalletHome() {
  const {
    balance,
    setShowTransferSheet,
    setShowTango,
    setScreen,
    showBalance,
    setShowBalance,
    pairCode,
    setRecipient,
    setAmount,
    setNote,
    completeProcessing,
    isAppFrozen,
    setAppFrozen,
  } = useApp();
  const { setPendingApproval, pushAudit } = useGuardian();
  const [showUnauthorizedDemo, setShowUnauthorizedDemo] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [showProximityWarning, setShowProximityWarning] = useState(false);

  const sendWatchDecision = async (decision: "approve" | "block") => {
    const room = (pairCode || "DEMO").toUpperCase();
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

  const sendWatchProximity = async (alert: boolean, message?: string) => {
    const room = (pairCode || "DEMO").toUpperCase();
    try {
      await fetch("/api/remote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room,
          cmd: alert ? "proximity-alert" : "proximity-clear",
          payload: alert
            ? { message: message || "Phone out of range. Possible theft." }
            : {},
        }),
      });
    } catch {}
  };

  const handleDemoApprove = async () => {
    setPendingApproval(undefined);
    pushAudit({ kind: "approved", summary: "Demo: Yoga Premium approved" });
    setShowUnauthorizedDemo(false);
    await sendWatchDecision("approve");
    // Populate transfer state then jump to the receipt screen so the user
    // sees the same "Transfer successful" UI as a normal payment.
    setRecipient(DEMO_RECIPIENT as any);
    setAmount(DEMO_AMOUNT);
    setNote("Subscription");
    completeProcessing();
  };

  const handleDemoReject = async () => {
    setPendingApproval(undefined);
    pushAudit({ kind: "blocked", summary: "Demo: Yoga Premium blocked" });
    setShowUnauthorizedDemo(false);
    await sendWatchDecision("block");
    setShowRejectedModal(true);
  };

  // When the demo modal is open, also react to a decision made on the watch
  // (RemoteBridge dispatches a window "guardian-decision" CustomEvent).
  useEffect(() => {
    if (!showUnauthorizedDemo) return;
    function onDecision(e: any) {
      const d = e?.detail?.decision as "approve" | "block" | undefined;
      if (!d) return;
      if (d === "approve") {
        setPendingApproval(undefined);
        pushAudit({ kind: "approved", summary: "Demo: Yoga Premium approved (watch)" });
        setShowUnauthorizedDemo(false);
        setRecipient(DEMO_RECIPIENT as any);
        setAmount(DEMO_AMOUNT);
        setNote("Subscription");
        completeProcessing();
      } else if (d === "block") {
        setPendingApproval(undefined);
        pushAudit({ kind: "blocked", summary: "Demo: Yoga Premium blocked (watch)" });
        setShowUnauthorizedDemo(false);
        setShowRejectedModal(true);
      }
    }
    window.addEventListener("guardian-decision", onDecision as any);
    return () => window.removeEventListener("guardian-decision", onDecision as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUnauthorizedDemo]);

  // Simulate unauthorized payment attempt
  const triggerUnauthorizedDemo = async () => {
    const recipientName = "Yoga Premium";
    const randomAmount = 117.00; // Subscription charge after free trial

    const approval = {
      id: "demo-" + Date.now(),
      recipientId: "merchant-yt-premium",
      recipientName: recipientName,
      amount: randomAmount,
      riskScore: 93,
      riskLevel: "high" as const,
      reasons: [
        "Unexpected recurring charge detected",
        "Amount higher than usual subscription",
        "First charge after free trial ended",
      ],
      createdAt: Date.now(),
    };

    setPendingApproval(approval);
    pushAudit({
      kind: "approval-required",
      summary: `Unexpected charge: ${fmtRM(randomAmount)} to ${recipientName}`,
      details: approval,
    });

    // Send to watch via SSE (default room "DEMO" if not paired)
    const room = (pairCode || "DEMO").toUpperCase();
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

    setShowUnauthorizedDemo(true);
  };
  return (
    <div className="h-full w-full bg-[#f2f4f8] flex flex-col no-scrollbar overflow-y-auto">
      {/* Blue header */}
      <div className="tng-blue text-white px-4 pt-10 pb-5 rounded-b-[26px]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-white/15 rounded-full pl-1 pr-2.5 py-1">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-white relative">
              <div className="absolute inset-0 flex flex-col">
                <div className="flex-1 bg-red-600" /><div className="flex-1 bg-white" />
                <div className="flex-1 bg-red-600" /><div className="flex-1 bg-white" />
                <div className="flex-1 bg-red-600" /><div className="flex-1 bg-white" />
                <div className="flex-1 bg-red-600" />
              </div>
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-800 flex items-center justify-center">
                <span className="text-yellow-400 text-[7px] leading-none">★</span>
              </div>
            </div>
            <span className="text-white text-xs font-semibold">MY</span>
            <Palmtree className="w-3 h-3" />
          </div>
          <div className="flex-1 bg-white rounded-full flex items-center px-3 py-1.5">
            <Search className="w-4 h-4 text-gray-400" />
            <span className="ml-2 text-gray-800 text-sm font-medium">Pay Bills</span>
          </div>
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-white/95 flex items-center justify-center">
              <User className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0057d9]" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
          <button onClick={() => setShowBalance(!showBalance)} className="flex items-center gap-2">
            <span className="text-2xl font-bold">{showBalance ? fmtRM(balance) : "RM ••••••"}</span>
            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
        <div className="text-xs text-white/80 mt-0.5 flex items-center gap-1">
          View asset details <ChevronRight className="w-3 h-3" />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => setScreen("add-money")} className="px-3 py-1.5 rounded-full border border-white text-sm font-semibold flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add money
          </button>
          <button className="text-sm font-semibold flex items-center gap-1">
            Transactions <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={triggerUnauthorizedDemo}
            className="ml-auto px-2.5 py-1 rounded-full bg-red-500/80 text-[10px] font-bold flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3" /> Demo
          </button>
        </div>
      </div>

      {/* Unauthorized Payment Demo Modal */}
      {showUnauthorizedDemo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-tng-blue to-indigo-600 px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-white" />
              <span className="text-white font-bold">Unexpected Subscription Charge</span>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-3">
                An unexpected charge for Yoga Premium was detected. This might be a free trial ending.
              </p>
              <div className="bg-tng-sky/40 border border-tng-sky rounded-xl p-3 mb-4">
                <div className="text-xs text-tng-blue font-semibold mb-1">Transaction Details</div>
                <div className="text-lg font-bold text-gray-900">
                  {fmtRM(117)}
                </div>
                <div className="text-sm text-gray-600">To: Yoga Premium</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDemoReject}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={handleDemoApprove}
                  className="flex-1 py-2.5 rounded-xl bg-tng-blue text-white font-semibold text-sm shadow-md"
                >
                  Approve
                </button>
              </div>
              <button
                onClick={() => setShowUnauthorizedDemo(false)}
                className="w-full mt-2 py-2 text-sm text-gray-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejected Confirmation Modal */}
      {showRejectedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-tng-blue to-indigo-600 px-4 py-3 flex items-center gap-2">
              <ShieldX className="w-5 h-5 text-white" />
              <span className="text-white font-bold">Payment Rejected</span>
            </div>
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-3">
                <XCircle className="w-10 h-10 text-red-500" strokeWidth={1.8} />
              </div>
              <div className="text-base font-semibold text-gray-900">
                You blocked this charge
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {fmtRM(117)} to Yoga Premium was not paid.
              </div>
              <div className="mt-3 text-[11px] text-gray-500 leading-snug">
                Tango Guardian will keep watching your subscriptions and alert you the next
                time an unexpected charge appears.
              </div>
              <button
                onClick={() => setShowRejectedModal(false)}
                className="w-full mt-5 py-2.5 rounded-xl bg-tng-blue text-white font-semibold text-sm shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proximity Warning Modal */}
      {showProximityWarning && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-tng-blue to-blue-600 px-5 py-3.5 flex items-center gap-2.5">
              <Watch className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-base">Watch Not Nearby</span>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Phone and Watch Too Far Apart
              </h3>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Your Tango Guardian smartwatch is out of range. This could indicate theft or unauthorized access. Please authenticate to continue using this app.
              </p>
              <div className="w-full bg-blue-50 rounded-2xl p-4 mb-5">
                <div className="text-sm text-tng-blue font-bold mb-1">Security Notice</div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  Keep your watch nearby for enhanced security and fraud protection.
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProximityWarning(false);
                  setAppFrozen(false);
                  sendWatchProximity(false);
                  setScreen("auth");
                }}
                className="w-full py-3.5 rounded-full bg-tng-blue text-white font-bold text-base shadow-lg"
              >
                Authenticate
              </button>
              <button
                onClick={() => {
                  setShowProximityWarning(false);
                  setAppFrozen(true);
                  // keep watch alert visible while frozen
                }}
                className="w-full mt-3 py-3 text-base text-gray-500 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Frozen Overlay */}
      {isAppFrozen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-tng-blue to-blue-600 px-5 py-3.5 flex items-center gap-2.5">
              <ShieldX className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-base">App Locked</span>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <ShieldX className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Authentication Required
              </h3>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                The app has been locked for your security. Please authenticate with your Tango Guardian watch to continue.
              </p>
              <button
                onClick={() => {
                  setAppFrozen(false);
                  sendWatchProximity(false);
                  setScreen("auth");
                }}
                className="w-full py-3.5 rounded-full bg-tng-blue text-white font-bold text-base shadow-lg"
              >
                Authenticate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-2xl shadow-sm grid grid-cols-4 gap-1 py-3 px-2">
          <QuickAction icon={<FileCheck className="w-5 h-5 text-tng-blue" />} label="Apply" />
          <QuickAction icon={<PieChart className="w-5 h-5 text-tng-blue" />} label="Cash flow" />
          <QuickAction
            icon={<Send className="w-5 h-5 text-tng-blue" />}
            label="Transfer"
            onClick={() => setShowTransferSheet(true)}
          />
          <QuickAction 
            icon={<CreditCard className="w-5 h-5 text-tng-blue" />} 
            label="Cards" 
            onClick={() => {
              setShowProximityWarning(true);
              sendWatchProximity(true);
            }}
          />
        </div>
      </div>

      {/* Feature cards */}
      <div className="px-4 mt-3 grid grid-cols-2 gap-2.5">
        <Card title="Grow your money" sub="Start with just RM10" icon={<Sunrise className="w-6 h-6 text-emerald-500" />} />
        <Card title="BUDI95" sub="RON95 at RM1.99" icon={<Fuel className="w-6 h-6 text-amber-500" />} />
        <Card title="GOrewards" sub="7,788 pts" icon={<Gift className="w-6 h-6 text-pink-500" />} />
        <Card title="Fuel balance" sub="123 litres" icon={<Fuel className="w-6 h-6 text-blue-500" />} />
      </div>

      <div className="px-4 mt-4">
        <div className="text-sm font-semibold text-gray-900">Recommended</div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <Shortcut icon={<Watch className="w-6 h-6 text-tng-blue" />} label="Smartwatch" onClick={() => setScreen("smartwatch")} />
          <Shortcut icon={<Coins className="w-6 h-6 text-yellow-500" />} label="e-Mas" />
          <Shortcut icon={<Wallet className="w-6 h-6 text-emerald-500" />} label="WalletSafe" />
          <Shortcut icon={<Fuel className="w-6 h-6 text-cyan-600" />} label="Petrol" />
        </div>
      </div>

      <div className="px-4 mt-4 mb-28">
        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          My Favourites <span className="text-tng-blue text-xs font-semibold">Edit</span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <Shortcut icon={<Heart className="w-6 h-6 text-rose-500" />} label="Donation" onClick={() => setScreen("donation")} />
          <Shortcut icon={<MapPinned className="w-6 h-6 text-orange-500" />} label="Goal City" />
          <Shortcut icon={<DollarSign className="w-6 h-6 text-indigo-500" />} label="CashLoan" onClick={() => setScreen("cashloan")} />
          <Shortcut icon={<Building2 className="w-6 h-6 text-blue-500" />} label="ASNB" />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <Shortcut icon={<CreditCard className="w-6 h-6 text-rose-500" />} label="MY Prepaid" onClick={() => setScreen("prepaid")} />
          <Shortcut icon={<ShoppingBag className="w-6 h-6 text-amber-500" />} label="My Business" />
          <Shortcut icon={<MapPin className="w-6 h-6 text-emerald-500" />} label="Parking" />
          <Shortcut icon={<MessageSquare className="w-6 h-6 text-orange-500" />} label="Chat" />
        </div>
      </div>

      {/* Tango AI assistant FAB */}
      <button
        onClick={() => setShowTango(true)}
        className="absolute right-4 bottom-24 w-14 h-14 rounded-full bg-gradient-to-br from-tng-blue to-indigo-600 text-white shadow-xl flex items-center justify-center"
        aria-label="Open Tango AI"
      >
        <Sparkles className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-yellow-400 text-[9px] text-black font-bold px-1.5 py-0.5 rounded-full">AI</span>
      </button>

      {/* Bottom nav */}
      <div className="absolute bottom-0 inset-x-0 bg-white border-t border-gray-200 flex items-center justify-between px-6 py-2 pb-3">
        <NavItem icon={<Home className="w-5 h-5" />} label="Home" active />
        <NavItem icon={<ShoppingBag className="w-5 h-5" />} label="Shop" />
        <button
          onClick={() => setScreen("scan")}
          className="w-14 h-14 rounded-full bg-tng-blue text-white shadow-lg flex items-center justify-center -mt-8 border-4 border-white"
          aria-label="Scan"
        >
          <ScanLine className="w-6 h-6" />
        </button>
        <NavItem icon={<DollarSign className="w-5 h-5" />} label="GOfinance" />
        <NavItem icon={<MapPin className="w-5 h-5" />} label="Near Me" />
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 py-1.5 active:bg-gray-50 rounded-lg">
      {icon}
      <span className="text-xs font-medium text-gray-800">{label}</span>
    </button>
  );
}
function Card({ title, sub, icon }: { title: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-3 flex items-center gap-2">
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">{icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
        <div className="text-[11px] text-gray-500 truncate">{sub}</div>
      </div>
    </div>
  );
}
function Shortcut({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 active:opacity-70">
      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">{icon}</div>
      <span className="text-[11px] text-gray-800 font-medium truncate max-w-[64px]">{label}</span>
    </button>
  );
}
function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${active ? "text-tng-blue" : "text-gray-500"}`}>
      {icon}<span className="text-[10px] font-semibold">{label}</span>
    </div>
  );
}
