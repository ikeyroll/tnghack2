"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type StressLevel = "normal" | "elevated" | "high";

export type DeviceTrust = {
  phoneNearby: boolean;
  watchWorn: boolean;
  heartbeatDetected: boolean;
  trustScore: number; // 0-100
};

export type WalletStatus = "active" | "frozen";

export type GuardianAuditEntry = {
  id: string;
  ts: number;
  kind:
    | "approval-required"
    | "approved"
    | "blocked"
    | "frozen"
    | "unfrozen"
    | "stress-changed"
    | "trust-changed"
    | "intel-detected";
  summary: string;
  details?: Record<string, any>;
};

export type RiskAction =
  | "allow"
  | "require_confirmation"
  | "require_watch_approval"
  | "block";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type PendingApproval = {
  id: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
  createdAt: number;
};

export type GuardianState = {
  stress: StressLevel;
  deviceTrust: DeviceTrust;
  walletStatus: WalletStatus;
  pendingApproval?: PendingApproval;
  audit: GuardianAuditEntry[];

  setStress: (s: StressLevel) => void;
  setDeviceTrust: (t: Partial<DeviceTrust>) => void;
  setPendingApproval: (a?: PendingApproval) => void;
  freezeWallet: (reason?: string) => void;
  unfreezeWallet: () => void;
  pushAudit: (e: Omit<GuardianAuditEntry, "id" | "ts">) => void;
  clearAudit: () => void;
};

function computeTrust(t: Omit<DeviceTrust, "trustScore">): number {
  let score = 100;
  if (!t.phoneNearby) score -= 35;
  if (!t.watchWorn) score -= 30;
  if (!t.heartbeatDetected) score -= 15;
  return Math.max(0, score);
}

export const useGuardian = create<GuardianState>()(
  persist(
    (set, get) => ({
      stress: "normal",
      deviceTrust: {
        phoneNearby: true,
        watchWorn: true,
        heartbeatDetected: true,
        trustScore: 100,
      },
      walletStatus: "active",
      audit: [],

      setStress: (s) => {
        const prev = get().stress;
        set({ stress: s });
        if (prev !== s) {
          get().pushAudit({
            kind: "stress-changed",
            summary: `Stress level: ${s}`,
            details: { from: prev, to: s },
          });
        }
      },

      setDeviceTrust: (t) => {
        const cur = get().deviceTrust;
        const merged = { ...cur, ...t };
        const score = computeTrust(merged);
        const next = { ...merged, trustScore: score };
        set({ deviceTrust: next });
        // Auto-freeze when trust collapses
        if (score < 40 && get().walletStatus !== "frozen") {
          set({ walletStatus: "frozen" });
          get().pushAudit({
            kind: "frozen",
            summary: "Wallet frozen — device trust collapsed",
            details: next,
          });
        } else {
          get().pushAudit({
            kind: "trust-changed",
            summary: `Trust score ${score}`,
            details: next,
          });
        }
      },

      setPendingApproval: (a) => set({ pendingApproval: a }),

      freezeWallet: (reason = "Manual freeze") => {
        if (get().walletStatus === "frozen") return;
        set({ walletStatus: "frozen" });
        get().pushAudit({ kind: "frozen", summary: reason });
      },

      unfreezeWallet: () => {
        if (get().walletStatus === "active") return;
        set({ walletStatus: "active" });
        get().pushAudit({ kind: "unfrozen", summary: "Wallet unfrozen" });
      },

      pushAudit: (e) =>
        set((state) => ({
          audit: [
            {
              id: "g" + Date.now() + Math.random().toString(36).slice(2, 6),
              ts: Date.now(),
              ...e,
            },
            ...state.audit,
          ].slice(0, 80),
        })),

      clearAudit: () => set({ audit: [] }),
    }),
    {
      name: "tango-guardian-state-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? (undefined as any) : window.localStorage
      ),
      partialize: (s) =>
        ({
          stress: s.stress,
          deviceTrust: s.deviceTrust,
          walletStatus: s.walletStatus,
          audit: s.audit,
        }) as any,
    }
  )
);

export type RiskScoreResponse = {
  riskScore: number;
  riskLevel: RiskLevel;
  action: RiskAction;
  reasons: string[];
  factors: {
    amountRisk: number;
    recipientRisk: number;
    timeRisk: number;
    stressRisk: number;
    deviceTrustRisk: number;
    scamMessageRisk: number;
  };
  risk: "low" | "medium" | "high";
  multiplier: number;
  avg: number;
};

export async function scoreTransaction(
  recipientId: string,
  amount: number,
  opts?: { scamMessageRisk?: number }
): Promise<RiskScoreResponse> {
  const g = useGuardian.getState();
  const res = await fetch("/api/risk-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientId,
      amount,
      stressLevel: g.stress,
      deviceTrust: g.deviceTrust,
      scamMessageRisk: opts?.scamMessageRisk ?? 0,
    }),
  });
  return res.json();
}
