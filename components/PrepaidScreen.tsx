"use client";
import { useState } from "react";
import { ArrowLeft, Phone, Smartphone, ShoppingBag, Receipt, Wifi, Headset, CheckCircle2, Loader2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtRM } from "@/lib/utils";

const SERVICES = [
  { icon: <Headset className="w-6 h-6 text-rose-500" />, label: "SOS Top Up" },
  { icon: <Smartphone className="w-6 h-6 text-violet-500" />, label: "Eastel Top Up" },
  { icon: <Phone className="w-6 h-6 text-sky-500" />, label: "Sell Devices" },
  { icon: <ShoppingBag className="w-6 h-6 text-emerald-500" />, label: "Buy Phones" },
  { icon: <Receipt className="w-6 h-6 text-amber-500" />, label: "Postpaid Bills" },
  { icon: <Wifi className="w-6 h-6 text-rose-600" />, label: "Hua Broadband" },
];

type Plan = {
  title: string;
  price: number;
  days: number;
  tag?: string;
  features?: string[];
  category: ("Suggested" | "Internet" | "Credit")[];
};

const PLANS: Plan[] = [
  { title: "Prepaid Reload", price: 30, days: 30, tag: "Suggested", category: ["Suggested", "Credit"] },
  { title: "Prepaid Reload", price: 35, days: 35, category: ["Suggested", "Credit"] },
  { title: "Giler Unlimited GX43", price: 43, days: 30, tag: "Level Up & Get Cashback", features: ["Unlimited Data 48 Mbps", "Unlimited Hotspot", "Unlimited Calls"], category: ["Suggested", "Internet"] },
  { title: "Internet Pass 3GB", price: 10, days: 7, category: ["Internet"] },
  { title: "Internet Pass 10GB", price: 20, days: 14, category: ["Internet"] },
  { title: "Prepaid Reload", price: 10, days: 10, category: ["Credit"] },
  { title: "Prepaid Reload", price: 50, days: 45, tag: "Best Value", category: ["Credit"] },
];

const FILTERS = ["Suggested", "Internet", "Credit"] as const;

type TopUpState = "idle" | "processing" | "success";

type HistoryEntry = {
  plan: string;
  price: number;
  date: string;
};

export default function PrepaidScreen() {
  const { setScreen, balance, deductBalance, logAction, actionLog } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Suggested");
  const [tab, setTab] = useState<"Top Up" | "Auto Renewal" | "History">("Top Up");
  const [picked, setPicked] = useState<number | null>(null);
  const [topUpState, setTopUpState] = useState<TopUpState>("idle");
  const [autoRenewal, setAutoRenewal] = useState(false);

  const filteredPlans = PLANS.filter((p) => p.category.includes(filter));
  const total = picked !== null ? PLANS[picked].price : 0;

  // Derive history from global action log
  const history = actionLog
    .filter((a) => a.type === "transfer" && a.details?.kind === "prepaid")
    .map((a) => ({ plan: a.details?.plan as string, price: a.details?.price as number, date: new Date(a.ts).toLocaleString("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) }));

  const doTopUp = () => {
    if (picked === null) return;
    const plan = PLANS[picked];
    if (plan.price > balance) return;

    setTopUpState("processing");
    setTimeout(() => {
      deductBalance(plan.price);
      logAction({ type: "transfer", summary: `Prepaid top-up: ${plan.title} ${fmtRM(plan.price)}`, details: { kind: "prepaid", plan: plan.title, price: plan.price } });
      setTopUpState("success");
      setTimeout(() => {
        setTopUpState("idle");
        setPicked(null);
      }, 2500);
    }, 1500);
  };

  return (
    <div className="h-full w-full bg-[#f2f4f8] flex flex-col">
      <div className="tng-blue text-white px-4 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen("home")} aria-label="Back"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold">MY Prepaid</h1>
        </div>
      </div>

      {/* Processing overlay */}
      {topUpState === "processing" && (
        <div className="absolute inset-0 z-50 bg-white/90 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-tng-blue animate-spin" />
          <div className="text-sm font-semibold text-gray-700">Processing top up...</div>
        </div>
      )}

      {/* Success overlay */}
      {topUpState === "success" && (
        <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-gray-900">Top Up Successful!</div>
          <div className="text-sm text-gray-500">Your prepaid has been reloaded.</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24">
        <div className="bg-white rounded-2xl shadow-sm p-3 mt-3">
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {SERVICES.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 min-w-[60px]">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">{s.icon}</div>
                <span className="text-[10px] text-gray-800 text-center font-medium leading-tight">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-center gap-1">
            <span className="w-4 h-1 rounded bg-tng-blue" />
            <span className="w-2 h-1 rounded bg-gray-300" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mt-3 p-3">
          <div className="flex gap-4 text-sm border-b border-gray-100">
            {(["Top Up", "Auto Renewal", "History"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-2 ${tab === t ? "font-semibold border-b-2 border-tng-blue text-gray-900" : "text-gray-500"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Top Up" && (
            <>
              <div className="mt-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-500 font-bold">U</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Khairol &apos;Izzul Firdaus Bin Khairol Hisam</div>
                  <div className="text-tng-blue text-sm font-semibold">+60 16 552 4675</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setPicked(null); }}
                    className={`px-3 py-1 rounded-full border text-xs font-semibold ${filter === f ? "border-tng-blue text-tng-blue bg-tng-blue/5" : "border-gray-300 text-gray-600"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="mt-3 space-y-2">
                {filteredPlans.map((p, i) => {
                  const globalIdx = PLANS.indexOf(p);
                  return (
                    <button
                      key={globalIdx}
                      onClick={() => setPicked(globalIdx)}
                      className={`w-full text-left rounded-xl p-3 bg-white border transition-all ${picked === globalIdx ? "border-tng-blue ring-2 ring-tng-blue/30" : "border-gray-200"}`}
                    >
                      {p.tag && (
                        <span className="inline-block text-[10px] font-semibold text-white bg-amber-500 px-2 py-0.5 rounded-t-md rounded-br-md mb-1">
                          {p.tag}
                        </span>
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{p.title}</div>
                          {p.features && (
                            <ul className="mt-1 text-[11px] text-gray-600 list-disc pl-4">
                              {p.features.map((f) => <li key={f}>{f}</li>)}
                            </ul>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{fmtRM(p.price)}</div>
                          <div className="mt-1 text-[10px] bg-tng-sky text-tng-blue font-semibold px-2 py-0.5 rounded">{p.days} days</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredPlans.length === 0 && (
                  <div className="py-6 text-center text-sm text-gray-400">No plans in this category</div>
                )}
              </div>
            </>
          )}

          {tab === "Auto Renewal" && (
            <div className="mt-4 px-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Auto Renewal</div>
                  <div className="text-xs text-gray-500 mt-0.5">Automatically renew your plan when it expires</div>
                </div>
                <button
                  onClick={() => setAutoRenewal(!autoRenewal)}
                  className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${autoRenewal ? "bg-tng-blue" : "bg-gray-300"}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${autoRenewal ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              {autoRenewal && (
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <div className="text-xs text-gray-700">
                    <div className="font-semibold text-gray-900">Auto renewal is active</div>
                    <div className="mt-1">Your selected plan will be automatically renewed when it expires. You will be charged from your eWallet balance.</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-500 font-bold text-xs">U</span>
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-gray-900">Prepaid Reload RM30.00</div>
                      <div className="text-gray-500">Next renewal: auto</div>
                    </div>
                  </div>
                </div>
              )}
              {!autoRenewal && (
                <div className="mt-6 text-center text-sm text-gray-400">
                  Enable auto renewal to never miss a reload.
                </div>
              )}
            </div>
          )}

          {tab === "History" && (
            <div className="mt-3">
              {history.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {history.map((h, i) => (
                    <div key={i} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{h.plan}</div>
                        <div className="text-xs text-gray-500">{h.date}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{fmtRM(h.price)}</span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Success</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-400">
                  No top-up history yet.<br />Your reload transactions will appear here.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 bg-white border-t border-gray-200 p-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-gray-500">Total amount</div>
          <div className="text-tng-blue text-xl font-bold">{fmtRM(total)}</div>
        </div>
        <button
          onClick={doTopUp}
          disabled={picked === null || topUpState !== "idle"}
          className={`px-8 py-3 rounded-full font-semibold transition-colors ${picked !== null && topUpState === "idle" ? "bg-tng-blue text-white active:bg-blue-700" : "bg-gray-200 text-gray-400"}`}
        >
          Top up
        </button>
      </div>
    </div>
  );
}
