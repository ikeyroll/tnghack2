"use client";
import { useState } from "react";
import { ArrowLeft, Store } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtRM } from "@/lib/utils";

export default function MerchantPay() {
  const { merchantName, setScreen, amount, setAmount, balance, deductBalance, logAction } = useApp();
  const [local, setLocal] = useState(amount ? amount.toFixed(2) : "");
  const [note, setNote] = useState("");

  const num = parseFloat(local.replace(/[^\d.]/g, ""));
  const valid = !isNaN(num) && num > 0 && num <= balance;

  const handleConfirm = () => {
    if (!valid || !merchantName) return;
    setAmount(num);
    deductBalance(num);
    logAction({
      type: "watch-merchant",
      summary: `Paid ${fmtRM(num)} at ${merchantName}`,
      details: { amount: num, merchant: merchantName },
    });
    setScreen("home");
  };

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="tng-blue text-white px-4 pt-10 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen("scan")} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Pay</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4">
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-tng-sky flex items-center justify-center">
            <Store className="w-5 h-5 text-tng-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {merchantName || "Merchant"}
            </div>
          </div>
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
          <div className="text-xs text-gray-500 mt-1">
            Balance: {fmtRM(balance)}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-xs text-gray-500">Payment Details (optional)</div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 mt-1">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 25))}
              className="w-full bg-transparent outline-none text-gray-900"
            />
          </div>
          <div className="text-right text-[10px] text-gray-400">{note.length}/25</div>
        </div>
      </div>

      <div className="px-4 pb-4 bg-white border-t border-gray-100 pt-3">
        <button
          disabled={!valid || !merchantName}
          onClick={handleConfirm}
          className={`w-full py-3 rounded-full font-semibold ${
            valid && merchantName
              ? "bg-tng-blue text-white shadow-md"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
