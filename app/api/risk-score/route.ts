import { NextRequest, NextResponse } from "next/server";
import { RECIPIENTS, TRANSACTIONS, averageSentTo } from "@/lib/db";

export const runtime = "nodejs";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type RiskAction =
  | "allow"
  | "require_confirmation"
  | "require_watch_approval"
  | "block";

export type RiskFactors = {
  amountRisk: number;
  recipientRisk: number;
  timeRisk: number;
  stressRisk: number;
  deviceTrustRisk: number;
  scamMessageRisk: number;
};

export type RiskScoreResponse = {
  riskScore: number;
  riskLevel: RiskLevel;
  action: RiskAction;
  reasons: string[];
  factors: RiskFactors;
  // Backwards compat with /api/detect-risk
  risk: "low" | "medium" | "high";
  multiplier: number;
  avg: number;
};

function getHourRisk(): number {
  const h = new Date().getHours();
  if (h >= 0 && h < 5) return 45;
  if (h >= 23 || h < 6) return 25;
  return 0;
}

function getAmountRisk(recipientId: string, amount: number): number {
  const avg = averageSentTo(recipientId);
  if (avg === 0) {
    if (amount >= 1000) return 70;
    if (amount >= 500) return 45;
    if (amount >= 200) return 25;
    return 10;
  }
  const m = amount / avg;
  if (m >= 10) return 95;
  if (m >= 5) return 75;
  if (m >= 3) return 55;
  if (m >= 1.5) return 30;
  return 0;
}

function getRecipientRisk(recipientId: string): number {
  const r = RECIPIENTS.find((x) => x.id === recipientId);
  if (!r) return 80;
  const txs = TRANSACTIONS.filter((t) => t.recipientId === recipientId);
  if (txs.length === 0) return 50;
  if (txs.length <= 2) return 20;
  return 0;
}

function compute(factors: RiskFactors) {
  const w = {
    amountRisk: 0.25,
    recipientRisk: 0.2,
    timeRisk: 0.1,
    stressRisk: 0.2,
    deviceTrustRisk: 0.15,
    scamMessageRisk: 0.1,
  };
  const score = Math.round(
    factors.amountRisk * w.amountRisk +
      factors.recipientRisk * w.recipientRisk +
      factors.timeRisk * w.timeRisk +
      factors.stressRisk * w.stressRisk +
      factors.deviceTrustRisk * w.deviceTrustRisk +
      factors.scamMessageRisk * w.scamMessageRisk
  );

  let level: RiskLevel;
  let action: RiskAction;
  if (score >= 75) {
    level = "critical";
    action = "block";
  } else if (score >= 55) {
    level = "high";
    action = "require_watch_approval";
  } else if (score >= 35) {
    level = "medium";
    action = "require_confirmation";
  } else {
    level = "low";
    action = "allow";
  }
  return { score, level, action };
}

function buildReasons(
  f: RiskFactors,
  recipientId: string,
  amount: number
): string[] {
  const reasons: string[] = [];
  const avg = averageSentTo(recipientId);
  const r = RECIPIENTS.find((x) => x.id === recipientId);

  if (f.amountRisk >= 60) {
    const m = avg > 0 ? (amount / avg).toFixed(1) + "x" : "much";
    reasons.push(`Amount is ${m} higher than usual`);
  } else if (f.amountRisk >= 30) {
    reasons.push(`Amount is unusually large for this recipient`);
  }
  if (f.recipientRisk >= 50)
    reasons.push(r ? `First-time transfer to ${r.name}` : "Recipient is unfamiliar");
  else if (f.recipientRisk >= 20)
    reasons.push(`Limited transfer history with ${r?.name || "recipient"}`);

  if (f.stressRisk >= 60) reasons.push("User stress level is elevated");
  else if (f.stressRisk >= 30) reasons.push("User stress level is slightly elevated");

  if (f.deviceTrustRisk >= 50)
    reasons.push("Device trust is low — watch not detected nearby");
  else if (f.deviceTrustRisk >= 25) reasons.push("Reduced device trust");

  if (f.timeRisk >= 30) reasons.push("Unusual time for this transaction");
  if (f.scamMessageRisk >= 50)
    reasons.push("Message contains suspicious scam patterns");

  if (reasons.length === 0) reasons.push("Transaction appears normal");
  return reasons;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    recipientId,
    amount,
    stressLevel = "normal",
    deviceTrust = {
      phoneNearby: true,
      watchWorn: true,
      heartbeatDetected: true,
      trustScore: 92,
    },
    scamMessageRisk = 0,
  } = body || {};

  if (typeof recipientId !== "string" || typeof amount !== "number") {
    return NextResponse.json(
      {
        riskScore: 0,
        riskLevel: "low",
        action: "allow",
        reasons: [],
        factors: {
          amountRisk: 0,
          recipientRisk: 0,
          timeRisk: 0,
          stressRisk: 0,
          deviceTrustRisk: 0,
          scamMessageRisk: 0,
        },
        risk: "low",
        multiplier: 1,
        avg: 0,
      } satisfies RiskScoreResponse,
      { status: 200 }
    );
  }

  const stressMap: Record<string, number> = {
    normal: 0,
    elevated: 45,
    high: 80,
  };

  const dt = deviceTrust || {};
  const deviceTrustRisk = !dt.phoneNearby
    ? 65
    : !dt.watchWorn
    ? 55
    : !dt.heartbeatDetected
    ? 30
    : typeof dt.trustScore === "number" && dt.trustScore < 50
    ? 45
    : typeof dt.trustScore === "number" && dt.trustScore < 70
    ? 20
    : 0;

  const factors: RiskFactors = {
    amountRisk: getAmountRisk(recipientId, amount),
    recipientRisk: getRecipientRisk(recipientId),
    timeRisk: getHourRisk(),
    stressRisk: stressMap[stressLevel] ?? 0,
    deviceTrustRisk,
    scamMessageRisk: Math.min(100, Math.max(0, Number(scamMessageRisk) || 0)),
  };

  const { score, level, action } = compute(factors);
  const reasons = buildReasons(factors, recipientId, amount);
  const avg = averageSentTo(recipientId);
  const multiplier = avg > 0 ? amount / avg : 1;

  // Backwards-compat 3-level risk for legacy UI consumers
  const legacyRisk: "low" | "medium" | "high" =
    level === "critical" ? "high" : level;

  const resp: RiskScoreResponse = {
    riskScore: score,
    riskLevel: level,
    action,
    reasons,
    factors,
    risk: legacyRisk,
    multiplier,
    avg,
  };
  return NextResponse.json(resp);
}
