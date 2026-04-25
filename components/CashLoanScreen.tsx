"use client";
import { useState } from "react";
import { ArrowLeft, MoreVertical, Info, Calendar, Percent, Coins, HandCoins, CheckCircle2, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtRM } from "@/lib/utils";

const DURATIONS = ["6 months", "1 year", "2 years", "3 years", "5 years"];
const EMPLOYMENT = ["Salaried", "Business owner (SSM)", "Self-employed", "Freelancer"];
const RATE = 0.0888; // 8.88% p.a.

function parseDurationYears(d: string): number {
  if (d === "6 months") return 0.5;
  return parseInt(d) || 1;
}

type CalcResult = {
  principal: number;
  totalProfit: number;
  totalPayable: number;
  monthlyInstalment: number;
  months: number;
  rate: number;
};

function calculate(amount: number, duration: string): CalcResult {
  const years = parseDurationYears(duration);
  const months = years * 12;
  const totalProfit = amount * RATE * years;
  const totalPayable = amount + totalProfit;
  const monthlyInstalment = totalPayable / months;
  return { principal: amount, totalProfit, totalPayable, monthlyInstalment, months, rate: RATE * 100 };
}

type BottomTab = "apply" | "applications";

export default function CashLoanScreen() {
  const { setScreen } = useApp();
  const [amount, setAmount] = useState(1000);
  const [duration, setDuration] = useState("3 years");
  const [income, setIncome] = useState(1400);
  const [employment, setEmployment] = useState("Business owner (SSM)");
  const [agree, setAgree] = useState(true);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>("apply");

  const doCalculate = () => {
    if (!agree) return;
    setResult(calculate(amount, duration));
    setSubmitted(false);
  };

  const doSubmit = () => {
    if (!result) doCalculate();
    setSubmitted(true);
    setTimeout(() => setBottomTab("applications"), 1500);
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="tng-blue text-white px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => setScreen("home")} aria-label="Back"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold flex-1">Financing</h1>
        <MoreVertical className="w-5 h-5" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {bottomTab === "apply" ? (
          <>
            <div className="bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-200 px-4 pt-4 pb-6 flex items-start gap-3">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                <HandCoins className="w-7 h-7 text-amber-700" />
              </div>
              <div className="text-gray-900 text-sm">
                Need extra cash? Personalise your offer with{" "}
                <span className="text-rose-500 font-bold">CashLoan</span>
              </div>
            </div>

            <div className="mx-4 -mt-6 bg-white rounded-2xl shadow-lg p-4 space-y-4">
              <Field label="Financing amount">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(Math.max(100, Math.min(150000, Number(e.target.value) || 0))); setResult(null); }}
                  className="text-right font-semibold outline-none w-24"
                />
              </Field>
              <Field label="Financing duration">
                <select
                  value={duration}
                  onChange={(e) => { setDuration(e.target.value); setResult(null); }}
                  className="text-right font-semibold outline-none bg-transparent"
                >
                  {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label={<span className="flex items-center gap-1">Monthly income <Info className="w-3 h-3 text-tng-blue" /></span>}>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(Math.max(0, Number(e.target.value) || 0))}
                  className="text-right font-semibold outline-none w-24"
                />
              </Field>
              <Field label="Employment type">
                <select
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                  className="text-right font-semibold outline-none bg-transparent"
                >
                  {EMPLOYMENT.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>

              <label className="flex items-start gap-2 pt-1">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-tng-blue" />
                <span className="text-xs text-gray-700">
                  I agree to the <span className="text-tng-blue font-semibold">CashLoan Terms and Conditions</span>.
                </span>
              </label>

              <button
                onClick={doCalculate}
                disabled={!agree}
                className={`w-full py-3 rounded-full font-semibold transition-colors ${agree ? "bg-tng-blue text-white active:bg-blue-700" : "bg-gray-200 text-gray-400"}`}
              >
                Calculate now
              </button>
            </div>

            {/* Calculation result */}
            {result && (
              <div className="mx-4 mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">Your Estimate</h3>
                  <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Monthly instalment</div>
                  <div className="text-3xl font-bold text-tng-blue mt-1">{fmtRM(result.monthlyInstalment)}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">for {result.months} months</div>
                </div>
                <div className="mt-4 space-y-2">
                  <ResultRow label="Financing amount" value={fmtRM(result.principal)} />
                  <ResultRow label="Profit rate" value={`${result.rate.toFixed(2)}% p.a.`} />
                  <ResultRow label="Total profit" value={fmtRM(result.totalProfit)} />
                  <ResultRow label="Total payable" value={fmtRM(result.totalPayable)} bold />
                </div>
                {income > 0 && result.monthlyInstalment > income * 0.6 && (
                  <div className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    ⚠️ Monthly instalment exceeds 60% of your declared income. You may not qualify.
                  </div>
                )}
              </div>
            )}

            {/* Submitted success toast */}
            {submitted && (
              <div className="mx-4 mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-semibold text-emerald-800">Application Submitted!</div>
                  <div className="text-xs text-emerald-600 mt-0.5">Your CashLoan application is being reviewed. You&apos;ll receive a notification once approved.</div>
                </div>
              </div>
            )}

            <div className="px-4 mt-6">
              <h3 className="font-semibold text-gray-900">What we offer</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Offer icon={<Coins className="w-6 h-6 text-amber-500" />} title="Financing amount" value={`${fmtRM(100).replace(".00", "")} to RM150,000`} />
                <Offer icon={<Calendar className="w-6 h-6 text-tng-blue" />} title="Financing duration" value="6 months to 5 years" />
                <Offer icon={<Percent className="w-6 h-6 text-emerald-500" />} title="Profit rate" value="From 8.88% p.a." />
                <Offer icon={<Info className="w-6 h-6 text-rose-500" />} title="Eligibility" value="Min. age 21, MY citizen" />
              </div>
              <div className="text-[11px] text-gray-400 text-center mt-4">Demo only — no real financing product.</div>
            </div>
          </>
        ) : (
          /* My Applications tab */
          <div className="px-4 py-6">
            <h3 className="font-semibold text-gray-900 text-lg">My Applications</h3>
            {submitted ? (
              <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <HandCoins className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">CashLoan</div>
                    <div className="text-xs text-gray-500">{fmtRM(amount)} · {duration}</div>
                  </div>
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Pending</span>
                </div>
                <div className="mt-3 border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Monthly</span><br /><span className="font-semibold">{result ? fmtRM(result.monthlyInstalment) : "—"}</span></div>
                  <div><span className="text-gray-500">Rate</span><br /><span className="font-semibold">8.88% p.a.</span></div>
                  <div><span className="text-gray-500">Employment</span><br /><span className="font-semibold">{employment}</span></div>
                  <div><span className="text-gray-500">Submitted</span><br /><span className="font-semibold">Just now</span></div>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center text-sm text-gray-400">
                <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                No applications yet.<br />Submit a CashLoan application to get started.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 bg-white border-t border-gray-200 grid grid-cols-2 py-2">
        <button onClick={() => { setBottomTab("apply"); if (agree && bottomTab === "apply") doSubmit(); }} className={`flex flex-col items-center ${bottomTab === "apply" ? "text-tng-blue" : "text-gray-400"}`}>
          <HandCoins className="w-5 h-5" />
          <span className="text-[11px] font-semibold">Submit now</span>
        </button>
        <button onClick={() => setBottomTab("applications")} className={`flex flex-col items-center ${bottomTab === "applications" ? "text-tng-blue" : "text-gray-400"}`}>
          <Calendar className="w-5 h-5" />
          <span className="text-[11px] font-semibold">My applications</span>
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="flex items-center gap-1 text-gray-900">{children}</div>
    </div>
  );
}
function Offer({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-3">
      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">{icon}</div>
      <div className="mt-2 text-[11px] text-gray-500">{title}</div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}
function ResultRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? "font-bold text-gray-900" : "text-gray-800"}>{value}</span>
    </div>
  );
}
