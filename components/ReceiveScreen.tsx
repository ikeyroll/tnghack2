"use client";
import { ArrowLeft, Download } from "lucide-react";
import { useApp } from "@/lib/store";

const TABS = ["Transfer", "Receive", "Money Packet", "Gift"] as const;

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
        <div key={i} className={on ? "" : "bg-white"} style={{ background: on ? color : "#fff" }} />
      ))}
    </div>
  );
}

export default function ReceiveScreen() {
  const { setScreen } = useApp();
  return (
    <div className="h-full w-full bg-[#eef1f6] flex flex-col overflow-hidden">
      <div className="bg-tng-blue text-white px-4 pt-10 pb-3 flex flex-col">
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
              onClick={() => t === "Transfer" && setScreen("transfer-recipient")}
              className={`text-sm pb-2 ${t === "Receive" ? "font-semibold border-b-2 border-yellow-400" : "text-white/80"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

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
    </div>
  );
}
