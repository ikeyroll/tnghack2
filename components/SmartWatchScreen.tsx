"use client";
import { useState } from "react";
import { ArrowLeft, Bluetooth, Smartphone, QrCode, Shield, ChevronRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { useGuardian } from "@/lib/guardian";
import GuardianCenter from "./GuardianCenter";

export default function SmartWatchScreen() {
  const { setScreen, setShowWatchPair } = useApp();
  const { walletStatus, deviceTrust, stress } = useGuardian();
  const [guardianOpen, setGuardianOpen] = useState(false);
  const stressColor =
    stress === "high" ? "bg-red-500" : stress === "elevated" ? "bg-amber-400" : "bg-emerald-400";
  const trustColor =
    deviceTrust.trustScore >= 80
      ? "text-emerald-500"
      : deviceTrust.trustScore >= 50
      ? "text-amber-500"
      : "text-red-500";

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Header */}
      <div className="tng-blue text-white px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => setScreen("home")} aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-base font-semibold">Smartwatch</span>
      </div>

      {/* Safety banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-start gap-2">
        <span className="text-amber-500 text-sm mt-0.5">&#9888;</span>
        <span className="text-[11px] text-gray-700 leading-relaxed">
          For safety, you can only access TNG eWallet app with your smartwatch 13 hours after linking it.
        </span>
      </div>

      {/* Illustration area */}
      <div className="flex-1 flex flex-col items-center px-6 pt-6 overflow-y-auto no-scrollbar">
        <div className="w-48 h-48 rounded-full bg-gray-50 flex items-center justify-center relative">
          {/* Phone icon */}
          <div className="absolute left-6 top-8">
            <div className="w-16 h-20 rounded-xl bg-sky-100 border-2 border-sky-200 flex items-center justify-center shadow-sm">
              <Smartphone className="w-8 h-8 text-tng-blue" />
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
              <path d="M5 24 C20 -4, 40 -4, 55 24" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <polygon points="55,24 48,20 52,26" fill="#f59e0b" />
            </svg>
          </div>
          {/* Watch icon */}
          <div className="absolute right-4 bottom-6">
            <div className="w-16 h-20 rounded-xl bg-sky-100 border-2 border-sky-200 flex items-center justify-center shadow-sm">
              <QrCode className="w-8 h-8 text-tng-blue" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="mt-6 text-xl font-bold text-gray-900 text-center leading-snug">
          Turn your smartwatch into a wallet
        </h2>

        {/* Steps */}
        <div className="mt-5 w-full space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-tng-blue text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
            <span className="text-sm text-gray-800">Open TNG eWallet app on your watch.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-tng-blue text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <span className="text-sm text-gray-800">Scan the QR code to complete the linking.</span>
          </div>
        </div>

        {/* Bluetooth note */}
        <div className="mt-4 w-full flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 py-3">
          <Bluetooth className="w-5 h-5 text-tng-blue shrink-0" />
          <span className="text-sm text-gray-800">Bluetooth connection is required.</span>
        </div>

        {/* Tango Guardian Card */}
        <button
          onClick={() => setGuardianOpen(true)}
          className="mt-4 w-full flex items-center gap-3 bg-gradient-to-r from-tng-blue to-indigo-600 rounded-xl px-4 py-3 text-left shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">
              Tango Guardian {walletStatus === "frozen" ? "· Frozen" : "· Active"}
            </div>
            <div className="text-[11px] text-white/80 flex items-center gap-2">
              <span className={trustColor}>Trust {deviceTrust.trustScore}</span>
              <span className="inline-flex items-center gap-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${stressColor}`} />
                Stress {stress}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/70" />
        </button>

        <div className="flex-1" />

        {/* Bottom notes */}
        <div className="mt-6 w-full space-y-1 pb-2">
          <p className="text-[11px] text-gray-500">• Currently support Huawei wearables only.</p>
          <p className="text-[11px] text-gray-500">• You can only link 3 smartwatch per account.</p>
        </div>
      </div>

      {/* CTA button */}
      <div className="px-4 pb-6 pt-2">
        <button
          onClick={() => setShowWatchPair(true)}
          className="w-full py-3.5 rounded-full bg-tng-blue text-white text-base font-semibold shadow-md active:opacity-90"
        >
          Link a smartwatch
        </button>
      </div>

      <GuardianCenter open={guardianOpen} onClose={() => setGuardianOpen(false)} />
    </div>
  );
}
