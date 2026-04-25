"use client";
import { useState } from "react";
import { ArrowLeft, Store } from "lucide-react";
import { useApp } from "@/lib/store";

export default function DonationPayScreen() {
  const { recipient, amount, setAmount, note, setNote, confirmAmount, setScreen } = useApp();
  const [local, setLocal] = useState(amount ? amount.toFixed(2) : "");

  const num = parseFloat(local.replace(/[^\d.]/g, ""));
  const valid = !isNaN(num) && num > 0;

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-[#005bbb] text-white px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => setScreen("donation")} aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Pay</h1>
      </div>

      <div className="flex-1 px-4 pt-6">
        {/* Merchant Info */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6 text-sky-500" />
          </div>
          <div className="text-gray-900 font-medium text-[15px]">
            {recipient?.name || "Tabung Pulih Bencana"}
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-gray-50 rounded-md p-3 mb-6 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Amount</div>
          <div className="flex items-baseline gap-2 border-b border-gray-300 pb-1">
            <span className="text-2xl font-bold text-[#005bbb]">RM</span>
            <input
              autoFocus
              inputMode="decimal"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="flex-1 text-2xl font-bold bg-transparent outline-none text-gray-900"
            />
          </div>
        </div>

        {/* Payment Details Input */}
        <div className="bg-gray-50 rounded-md p-3 shadow-sm border border-gray-100 relative mb-1">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 25))}
            placeholder="Payment Details (optional)"
            className="w-full bg-transparent outline-none text-gray-500 text-sm placeholder:text-gray-400 border-b border-gray-300 pb-2"
          />
        </div>
        <div className="text-right text-xs text-gray-400 pr-1 mb-8">
          {note.length}/25
        </div>

        {/* Confirm Button */}
        <div className="flex justify-center">
          <button
            disabled={!valid}
            onClick={() => {
              setAmount(num);
              confirmAmount(); // goes to "auth"
            }}
            className={`w-[85%] py-3 rounded-full font-semibold transition-colors ${
              valid ? "bg-[#005bbb] text-white shadow-md" : "bg-gray-200 text-gray-400"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
