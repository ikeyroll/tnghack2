"use client";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ChevronRight, CreditCard, ChevronDown, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { fmtRM } from "@/lib/utils";

const PRESETS = [100, 200, 300, 500, 1000] as const;
const AUTO_RELOAD_THRESHOLDS = [10, 20, 50, 100] as const;
const AUTO_RELOAD_AMOUNTS = [50, 100, 200, 300, 500] as const;

export default function AddMoneyScreen() {
  const { setScreen, addBalance } = useApp();
  const [selected, setSelected] = useState<number | null>(null);
  const [typedValue, setTypedValue] = useState("");
  const [success, setSuccess] = useState(false);

  // Auto reload state
  const [showAutoReload, setShowAutoReload] = useState(false);
  const [autoReloadEnabled, setAutoReloadEnabled] = useState(false);
  const [autoReloadThreshold, setAutoReloadThreshold] = useState(20);
  const [autoReloadAmount, setAutoReloadAmount] = useState(100);

  const inputRef = useRef<HTMLInputElement>(null);

  // Determine effective amount: typed value takes priority, else preset
  const parsedTyped = parseFloat(typedValue);
  const effectiveAmount = typedValue.length > 0 && !isNaN(parsedTyped)
    ? parsedTyped
    : selected ?? 0;

  const canContinue = effectiveAmount > 0 && effectiveAmount <= 10000;

  const handlePreset = (amt: number) => {
    setSelected(amt);
    setTypedValue("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty, or numbers with optional decimal
    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
      setTypedValue(val);
      setSelected(null); // deselect preset when typing
    }
  };

  const handleInputFocus = () => {
    // Clear preset selection when user taps the input
    if (selected !== null) {
      setTypedValue("");
      setSelected(null);
    }
  };

  const handleContinue = () => {
    if (!canContinue) return;
    addBalance(effectiveAmount);
    setSuccess(true);
    setTimeout(() => {
      setScreen("home");
    }, 1500);
  };

  // Display value in the input field
  const displayValue = typedValue.length > 0
    ? typedValue
    : selected !== null
      ? selected.toFixed(2)
      : "";

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Header */}
      <div className="tng-blue text-white px-4 pt-10 pb-3 flex items-center gap-3">
        <button
          onClick={() => setScreen("home")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold">Debit Card</span>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 flex flex-col overflow-y-auto no-scrollbar">
        {/* Amount input */}
        <div className="mb-1">
          <div
            className="flex items-baseline gap-1 cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            {(displayValue.length > 0) && (
              <span className="text-2xl text-gray-400 font-normal select-none">RM</span>
            )}
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={displayValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="Enter your amount"
              className="flex-1 text-xl font-normal text-gray-900 py-2 border-none outline-none bg-transparent placeholder:text-gray-400 placeholder:text-xl"
              style={{ caretColor: "#005abb" }}
            />
          </div>
          <div className="h-px bg-gray-200" />
        </div>

        {/* Preset buttons */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {PRESETS.map((amt) => (
            <button
              key={amt}
              onClick={() => handlePreset(amt)}
              className={`py-2.5 rounded-full border text-sm font-semibold transition-all duration-150 ${
                selected === amt
                  ? "border-tng-blue bg-tng-blue text-white shadow-md"
                  : "border-gray-300 bg-white text-gray-800 hover:border-tng-blue hover:text-tng-blue active:bg-blue-50"
              }`}
            >
              RM {amt.toLocaleString()}
            </button>
          ))}
          <button
            onClick={() => {
              setSelected(null);
              setTypedValue("");
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="py-2.5 rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:border-tng-blue hover:text-tng-blue active:bg-blue-50 transition-all duration-150"
          >
            Other
          </button>
        </div>

        {/* Auto reload card */}
        <button
          onClick={() => setShowAutoReload(true)}
          className="mt-6 border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3 w-full text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-tng-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900 block">Auto reload</span>
            {autoReloadEnabled && (
              <span className="text-xs text-gray-500">
                Reload {fmtRM(autoReloadAmount)} when below {fmtRM(autoReloadThreshold)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {autoReloadEnabled && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ON</span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Success message */}
        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-emerald-600 text-lg">✓</span>
            <span className="text-sm font-medium text-emerald-700">
              {fmtRM(effectiveAmount)} added successfully!
            </span>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!canContinue || success}
          className={`w-full py-3.5 rounded-full text-base font-semibold mb-6 transition-all duration-200 ${
            canContinue && !success
              ? "bg-tng-blue text-white shadow-lg shadow-blue-500/25 active:scale-[0.98]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>

      {/* ── Auto Reload Bottom Sheet ── */}
      {showAutoReload && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAutoReload(false)}
          />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl px-5 pt-4 pb-6 max-h-[80%] overflow-y-auto no-scrollbar animate-slideUp">
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Auto Reload</h2>
              <button
                onClick={() => setShowAutoReload(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-gray-900">Enable auto reload</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automatically top up when balance is low
                </p>
              </div>
              <button
                onClick={() => setAutoReloadEnabled(!autoReloadEnabled)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  autoReloadEnabled ? "bg-tng-blue" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${
                    autoReloadEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {autoReloadEnabled && (
              <>
                {/* Threshold */}
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Reload when balance falls below
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {AUTO_RELOAD_THRESHOLDS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setAutoReloadThreshold(t)}
                        className={`py-2 rounded-lg border text-sm font-semibold transition-all ${
                          autoReloadThreshold === t
                            ? "border-tng-blue bg-blue-50 text-tng-blue"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        RM {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reload amount */}
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Amount to reload
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {AUTO_RELOAD_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAutoReloadAmount(a)}
                        className={`py-2 rounded-lg border text-sm font-semibold transition-all ${
                          autoReloadAmount === a
                            ? "border-tng-blue bg-blue-50 text-tng-blue"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        RM {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4">
                  <p className="text-xs text-gray-600">
                    Your wallet will automatically reload{" "}
                    <span className="font-semibold text-tng-blue">{fmtRM(autoReloadAmount)}</span>{" "}
                    whenever your balance drops below{" "}
                    <span className="font-semibold text-tng-blue">{fmtRM(autoReloadThreshold)}</span>.
                  </p>
                </div>
              </>
            )}

            {/* Save button */}
            <button
              onClick={() => setShowAutoReload(false)}
              className="w-full py-3 rounded-full bg-tng-blue text-white font-semibold active:scale-[0.98] transition-transform"
            >
              {autoReloadEnabled ? "Save Settings" : "Done"}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
