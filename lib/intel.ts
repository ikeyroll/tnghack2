export type IntelSeverity = "info" | "warn" | "alert";

export type FinancialIntel = {
  id: string;
  title: string;
  detail: string;
  severity: IntelSeverity;
  category:
    | "spending"
    | "subscription"
    | "fraud"
    | "pattern"
    | "income"
    | "fees";
  delta?: string;
};

// Simulated cross-bank financial intelligence signals.
// In production these would come from unified account aggregation.
export const FINANCIAL_INTEL: FinancialIntel[] = [
  {
    id: "i1",
    title: "Spending 40% above normal",
    detail: "Your dining spend this week is 40% above your 12-week average.",
    severity: "warn",
    category: "spending",
    delta: "+40%",
  },
  {
    id: "i2",
    title: "Possible fraud pattern",
    detail:
      "3 small RM1.00 charges from unknown merchant in 2 minutes — typical card-testing pattern.",
    severity: "alert",
    category: "fraud",
    delta: "3 charges",
  },
  {
    id: "i3",
    title: "Subscription detected",
    detail:
      "We detected a recurring RM18.90 charge from StreamCo. Would you like to track it?",
    severity: "info",
    category: "subscription",
  },
  {
    id: "i4",
    title: "Repeated small transactions",
    detail:
      "5 e-wallet top-ups under RM50 in the last 24h — unusual frequency for your profile.",
    severity: "warn",
    category: "pattern",
    delta: "5x / 24h",
  },
  {
    id: "i5",
    title: "Salary credit confirmed",
    detail: "RM4,800 salary credit detected from MAYBANK. Cashflow healthy.",
    severity: "info",
    category: "income",
    delta: "+RM4,800",
  },
  {
    id: "i6",
    title: "FX fee variance",
    detail:
      "Last 2 cross-border transfers had 1.4% higher FX margin than market rate.",
    severity: "info",
    category: "fees",
    delta: "+1.4%",
  },
];
