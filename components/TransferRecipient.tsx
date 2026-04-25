"use client";
import { useState } from "react";
import { ArrowLeft, ChevronDown, RotateCw, User, Info, X, Download, Gift, Send } from "lucide-react";
import { useApp } from "@/lib/store";
import { RECIPIENTS, Recipient } from "@/lib/db";
import { fmtRM } from "@/lib/utils";

const TABS = ["Transfer", "Receive", "Money Packet", "Gift"] as const;
const METHODS = ["eWallet", "DuitNow", "Overseas"] as const;

// Deterministic QR mosaic (not a real QR, just visual)
function FakeQR({ size = 176, color = "black" }: { size?: number; color?: string }) {
  const cols = 25;
  const cells = Array.from({ length: cols * cols }, (_, i) => {
    const x = i % cols, y = Math.floor(i / cols);
    const on = ((x * 73856093) ^ (y * 19349663)) % 5 < 2;
    const inFinder = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17);
    return on || inFinder;
  });
  return (
    <div
      className="grid gap-[1px] bg-white p-1.5 rounded"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, width: size, height: size }}
    >
      {cells.map((on, i) => (
        <div key={i} style={{ background: on ? color : "#fff" }} />
      ))}
    </div>
  );
}

export type TransferTab = (typeof TABS)[number];

export default function TransferRecipient({ initialTab = "Transfer" }: { initialTab?: TransferTab }) {
  const { setScreen, startTransfer, balance } = useApp();
  const [tab, setTab] = useState<TransferTab>(initialTab);
  const [method, setMethod] = useState<(typeof METHODS)[number]>("eWallet");
  const [q, setQ] = useState("");

  const filtered = q
    ? RECIPIENTS.filter((r) =>
        r.name.toLowerCase().includes(q.toLowerCase()) || r.phone?.replace(/\s/g, "").includes(q.replace(/\s/g, "")),
      )
    : RECIPIENTS;

  const pick = (r: Recipient) => startTransfer(r);

  return (
    <div className="h-full w-full bg-[#eef1f6] flex flex-col">
      <div className="tng-blue text-white px-4 pt-10 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen("home")} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Transfer</h1>
        </div>
        <div className="mt-4 flex items-center justify-between">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                // Keep screen state in sync for navigation consistency
                if (t === "Transfer") setScreen("transfer-recipient");
                else if (t === "Receive") setScreen("transfer-recipient");
                else if (t === "Money Packet") setScreen("money-packet");
                else if (t === "Gift") setScreen("gift");
              }}
              className={`text-sm pb-2 ${tab === t ? "font-semibold border-b-2 border-yellow-400" : "text-white/80"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === "Transfer" && <TransferTabContent filtered={filtered} pick={pick} method={method} setMethod={setMethod} q={q} setQ={setQ} balance={balance} />}
      {tab === "Receive" && <ReceiveTabContent />}
      {tab === "Money Packet" && <MoneyPacketTabContent />}
      {tab === "Gift" && <GiftTabContent />}
    </div>
  );
}

/* ─── Transfer tab (original content) ─── */
function TransferTabContent({
  filtered, pick, method, setMethod, q, setQ, balance,
}: {
  filtered: Recipient[];
  pick: (r: Recipient) => void;
  method: (typeof METHODS)[number];
  setMethod: (m: (typeof METHODS)[number]) => void;
  q: string;
  setQ: (v: string) => void;
  balance: number;
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 bg-white">
        <div className="mt-4 grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`py-2 rounded-lg border text-sm font-semibold ${
                method === m ? "border-tng-blue text-tng-blue" : "border-gray-300 text-gray-500"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 border-b border-gray-200 pb-2">
          <button className="flex items-center gap-1 text-gray-800 font-medium text-sm">
            +60 <ChevronDown className="w-3 h-3" />
          </button>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Enter name or phone number"
            className="flex-1 outline-none text-sm py-2 placeholder:text-gray-400"
          />
          <button aria-label="Refresh contacts"><RotateCw className="w-4 h-4 text-tng-blue" /></button>
        </div>

        <div className="mt-4 bg-tng-sky/40 border border-tng-sky rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-tng-blue mt-0.5 shrink-0" />
          <div className="text-xs text-gray-700 flex-1">
            <div className="font-semibold text-gray-900">Get a Soundbox TransferMate!</div>
            <div>Get instant sound alerts when you receive money.</div>
            <div className="text-tng-blue font-semibold mt-1">Explore now</div>
          </div>
          <button aria-label="Dismiss"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="font-semibold text-gray-900">Recent</div>
          <button className="text-xs text-tng-blue font-semibold">View All</button>
        </div>
        <ul className="mt-2 divide-y divide-gray-100">
          {filtered.map((r) => (
            <li key={r.id}>
              <button onClick={() => pick(r)} className="w-full flex items-center gap-3 py-3 text-left">
                <div className="w-9 h-9 rounded-full bg-tng-sky flex items-center justify-center">
                  <User className="w-5 h-5 text-tng-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{r.name}</div>
                  {r.phone && <div className="text-xs text-gray-500">{r.phone}</div>}
                </div>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-6 text-center text-sm text-gray-500">No matching recipient</li>
          )}
        </ul>
      </div>

      <div className="bg-gray-50 py-3 text-center text-xs text-gray-600 border-t border-gray-200 flex items-center justify-center gap-1">
        Transferable eWallet balance: {fmtRM(balance)} <Info className="w-3 h-3 text-tng-blue" />
      </div>
    </>
  );
}

/* ─── Receive tab (QR code from ScanScreen) ─── */
function ReceiveTabContent() {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="text-center text-sm text-gray-600">Scan this QR code to transfer to</div>
        <div className="text-center font-bold text-gray-900 leading-tight mt-1">
          KHAIROL &apos;IZZUL FIRDAUS BIN
          <br />
          KHAIROL HISAM
        </div>

        <div className="mt-4 flex flex-col items-center">
          <div className="p-2 rounded-xl bg-rose-600">
            <div className="bg-white rounded-lg p-3 flex flex-col items-center">
              <FakeQR size={176} color="#e11d48" />
              <div className="text-center text-[10px] font-semibold text-white bg-rose-600 rounded-b-lg px-3 py-1 -mx-3 mt-2 w-[calc(100%+1.5rem)]">
                MALAYSIA NATIONAL QR
              </div>
            </div>
          </div>
        </div>

        <button className="mt-5 w-full py-2.5 rounded-full bg-tng-blue text-white font-semibold flex items-center justify-center gap-2">
          <Download className="w-4 h-4" /> Download QR code
        </button>
        <button className="mt-2 w-full py-2.5 rounded-full border border-tng-blue text-tng-blue font-semibold">
          Enter specific amount
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 bg-white rounded-xl px-3 py-2">
        <div className="w-1.5 h-5 rounded bg-rose-600" />
        <div className="text-sm font-semibold text-gray-800">DuitNow · Account number</div>
      </div>
    </div>
  );
}

/* ─── Money Packet tab ─── */
function MoneyPacketTabContent() {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
          <Send className="w-7 h-7 text-rose-500" />
        </div>
        <div className="text-lg font-bold text-gray-900">Money Packet</div>
        <div className="text-sm text-gray-500 text-center mt-2 max-w-xs">
          Send money packets to friends and family for any occasion. Spread the joy!
        </div>
        <button className="mt-5 w-full py-2.5 rounded-full bg-tng-blue text-white font-semibold">
          Create Money Packet
        </button>
      </div>

      <div className="mt-3 bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900">History</div>
          <button className="text-xs text-tng-blue font-semibold">View All</button>
        </div>
        <div className="mt-4 text-center text-sm text-gray-400 py-6">No money packets yet</div>
      </div>
    </div>
  );
}

/* ─── Gift tab ─── */
function GiftTabContent() {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <Gift className="w-7 h-7 text-amber-500" />
        </div>
        <div className="text-lg font-bold text-gray-900">Send a Gift</div>
        <div className="text-sm text-gray-500 text-center mt-2 max-w-xs">
          Surprise someone with a digital gift! Choose from vouchers, top-ups, and more.
        </div>
        <button className="mt-5 w-full py-2.5 rounded-full bg-tng-blue text-white font-semibold">
          Browse Gifts
        </button>
      </div>

      <div className="mt-3 bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900">Sent Gifts</div>
          <button className="text-xs text-tng-blue font-semibold">View All</button>
        </div>
        <div className="mt-4 text-center text-sm text-gray-400 py-6">No gifts sent yet</div>
      </div>
    </div>
  );
}
