"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Shield, X, Activity, Watch, Smartphone, HeartPulse, Lock,
  Unlock, AlertTriangle, TrendingUp, Receipt, ScrollText, Zap,
  CheckCircle2, ShieldAlert, ShieldCheck,
} from "lucide-react";
import { useGuardian, type StressLevel } from "@/lib/guardian";
import { FINANCIAL_INTEL } from "@/lib/intel";

type Tab = "overview" | "intel" | "audit";

export default function GuardianCenter({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    stress, setStress, deviceTrust, setDeviceTrust,
    walletStatus, freezeWallet, unfreezeWallet, audit,
  } = useGuardian();
  const [tab, setTab] = useState<Tab>("overview");

  const trustColor =
    deviceTrust.trustScore >= 80
      ? "text-emerald-600"
      : deviceTrust.trustScore >= 50
      ? "text-amber-600"
      : "text-red-600";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 bg-black/55 z-[68]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 top-12 bg-white rounded-t-3xl z-[69] flex flex-col overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28 }}
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 bg-gradient-to-br from-tng-blue to-indigo-700 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <div>
                    <div className="font-bold leading-tight">Tango Guardian</div>
                    <div className="text-[11px] text-white/80 leading-tight">
                      Wearable AI Financial Defense
                    </div>
                  </div>
                </div>
                <button onClick={onClose} aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Stat label="Trust" value={`${deviceTrust.trustScore}`} />
                <Stat
                  label="Wallet"
                  value={walletStatus === "frozen" ? "Frozen" : "Active"}
                  intent={walletStatus === "frozen" ? "danger" : "ok"}
                />
                <Stat
                  label="Stress"
                  value={stress[0].toUpperCase() + stress.slice(1)}
                  intent={
                    stress === "high"
                      ? "danger"
                      : stress === "elevated"
                      ? "warn"
                      : "ok"
                  }
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {(["overview", "intel", "audit"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-sm font-semibold capitalize ${
                    tab === t
                      ? "text-tng-blue border-b-2 border-tng-blue"
                      : "text-gray-500"
                  }`}
                >
                  {t === "intel" ? "Intelligence" : t}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3">
              {tab === "overview" && (
                <div className="space-y-4">
                  {/* Wallet status */}
                  <Section
                    title="Wallet defense"
                    icon={
                      walletStatus === "frozen" ? (
                        <Lock className="w-4 h-4 text-red-600" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      )
                    }
                  >
                    {walletStatus === "frozen" ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
                        <div className="font-semibold flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4" /> Wallet frozen
                        </div>
                        <div className="text-[12px] mt-1">
                          All outgoing transactions are blocked. Verify your devices and
                          unfreeze when secure.
                        </div>
                        <button
                          onClick={unfreezeWallet}
                          className="mt-3 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Unfreeze wallet
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
                        <div className="font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Defenses active
                        </div>
                        <div className="text-[12px] mt-1">
                          Real-time risk scoring, watch approval, and stress-aware control are running.
                        </div>
                        <button
                          onClick={() => freezeWallet("Manual kill switch from Guardian Center")}
                          className="mt-3 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Lock className="w-3.5 h-3.5" /> Freeze wallet
                        </button>
                      </div>
                    )}
                  </Section>

                  {/* Device trust */}
                  <Section
                    title="Mutual device trust"
                    icon={<Activity className={`w-4 h-4 ${trustColor}`} />}
                    right={
                      <span className={`text-sm font-bold ${trustColor}`}>
                        {deviceTrust.trustScore}/100
                      </span>
                    }
                  >
                    <Toggle
                      icon={<Smartphone className="w-4 h-4 text-tng-blue" />}
                      label="Phone nearby"
                      sub="Phone within Bluetooth range of watch"
                      value={deviceTrust.phoneNearby}
                      onChange={(v) => setDeviceTrust({ phoneNearby: v })}
                    />
                    <Toggle
                      icon={<Watch className="w-4 h-4 text-tng-blue" />}
                      label="Watch worn"
                      sub="Wrist contact detected on smartwatch"
                      value={deviceTrust.watchWorn}
                      onChange={(v) => setDeviceTrust({ watchWorn: v })}
                    />
                    <Toggle
                      icon={<HeartPulse className="w-4 h-4 text-rose-500" />}
                      label="Heartbeat detected"
                      sub="Live physiological signal from wearer"
                      value={deviceTrust.heartbeatDetected}
                      onChange={(v) => setDeviceTrust({ heartbeatDetected: v })}
                    />
                    <div className="text-[11px] text-gray-500 mt-2">
                      If trust drops below 40, the wallet auto-freezes.
                    </div>
                  </Section>

                  {/* Stress-aware control */}
                  <Section
                    title="Stress-aware payment control"
                    icon={<Zap className="w-4 h-4 text-amber-500" />}
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {(["normal", "elevated", "high"] as StressLevel[]).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setStress(lvl)}
                          className={`py-2 rounded-xl text-xs font-semibold border ${
                            stress === lvl
                              ? lvl === "high"
                                ? "bg-red-600 border-red-600 text-white"
                                : lvl === "elevated"
                                ? "bg-amber-500 border-amber-500 text-white"
                                : "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-white border-gray-200 text-gray-700"
                          }`}
                        >
                          {lvl[0].toUpperCase() + lvl.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-2 leading-snug">
                      We use simulated wearable physiological signals as an additional risk
                      input — not a medical diagnosis.
                    </div>
                  </Section>
                </div>
              )}

              {tab === "intel" && (
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-500 mb-1 leading-snug">
                    Cross-bank financial intelligence — we unify fragmented financial signals across your accounts.
                  </div>
                  {FINANCIAL_INTEL.map((it) => (
                    <IntelCard key={it.id} item={it} />
                  ))}
                </div>
              )}

              {tab === "audit" && (
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-500 mb-1">
                    Financial security audit trail (latest first).
                  </div>
                  {audit.length === 0 && (
                    <div className="text-sm text-gray-400 text-center py-8">
                      No security events yet.
                    </div>
                  )}
                  {audit.map((e) => (
                    <div
                      key={e.id}
                      className="bg-white border border-gray-200 rounded-xl p-3 flex items-start gap-2"
                    >
                      <ScrollText className="w-4 h-4 text-tng-blue mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">
                          {e.summary}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {new Date(e.ts).toLocaleString()} · {e.kind}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Stat({
  label,
  value,
  intent = "ok",
}: {
  label: string;
  value: string;
  intent?: "ok" | "warn" | "danger";
}) {
  const color =
    intent === "danger"
      ? "text-red-200"
      : intent === "warn"
      ? "text-amber-200"
      : "text-white";
  return (
    <div className="bg-white/10 rounded-xl py-2">
      <div className={`text-base font-bold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-white/70">
        {label}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          {icon}
          {title}
        </div>
        {right}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Toggle({
  icon,
  label,
  sub,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 active:bg-gray-50"
    >
      <div className="w-9 h-9 rounded-lg bg-tng-sky/60 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <div className="text-[11px] text-gray-500">{sub}</div>
      </div>
      <div
        className={`w-10 h-6 rounded-full relative transition-colors ${
          value ? "bg-emerald-500" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow ${
            value ? "left-[18px]" : "left-0.5"
          }`}
        />
      </div>
    </button>
  );
}

function IntelCard({ item }: { item: (typeof FINANCIAL_INTEL)[number] }) {
  const palette =
    item.severity === "alert"
      ? "bg-red-50 border-red-200 text-red-900"
      : item.severity === "warn"
      ? "bg-amber-50 border-amber-200 text-amber-900"
      : "bg-sky-50 border-sky-200 text-sky-900";
  const Icon =
    item.severity === "alert"
      ? AlertTriangle
      : item.severity === "warn"
      ? TrendingUp
      : Receipt;
  return (
    <div className={`border rounded-xl p-3 ${palette}`}>
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-sm">{item.title}</div>
            {item.delta && (
              <div className="text-[10px] font-bold opacity-80">{item.delta}</div>
            )}
          </div>
          <div className="text-[12px] mt-0.5 opacity-90">{item.detail}</div>
        </div>
      </div>
    </div>
  );
}
