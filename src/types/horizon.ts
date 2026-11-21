export interface AppSettings {
  projectName: string;
  initialCapitalUsd: number;
  targetCapitalUsd: number;
  userName: string;
  userEmail: string;
  timezone: string;
  language: string;
  jisdorRate: number;
  wdCapRatioPct: number;
  cashReserveUsd: number;
  telegramChatId: string;
  quietHoursStart: number;
  quietHoursEnd: number;
  telegramEnabled: boolean;
  riskPerTradePct?: number;
  dailyTargetPct?: number;
  onboardingCompleted?: boolean;
}

export interface TradeItem {
  id: string;
  date: string;
  account: string;
  pair: string;
  direction: "Buy (Long)" | "Sell (Short)";
  lot: number;
  entry: number;
  sl: number;
  tp: number;
  exit: number;
  commission: number;
  rMultiple: number;
  pnl: number;
  status: "WIN" | "LOSS" | "BE" | "OPEN";
  session: string;
  timeframe: string;
  setup: string;
  marketContext: string;
  notes: string;
  checklist: {
    plan: boolean;
    slSet: boolean;
    rrMin: boolean;
    noNews: boolean;
    calmMind: boolean;
  };
}

export interface SavedCompoundingScenario {
  id: string;
  name: string;
  targetUsd: number;
  initialUsd: number;
  returnPerCyclePct: number;
  frequency: "Harian" | "Mingguan" | "Bulanan";
  wdMode: "none" | "fixed" | "dynamic_pct";
  wdCapPct: number;
  feePerCycle: number;
}

export interface WithdrawalRecord {
  id: string;
  date: string;
  amountUsd: number;
  rateIdr: number;
  note: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  amountIdr: number;
  active: boolean;
}

export interface DebtItem {
  id: string;
  creditor: string;
  remainingIdr: number;
  monthlyInstallmentIdr: number;
}

export interface CashflowEntry {
  id: string;
  date: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "EXPENSE" | "INCOME";
  description: string;
  amountUsd: number;
  amountIdr: number;
}

export interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  timestampIso?: string;
  currency: string;
  title: string;
  impact: "High" | "Medium" | "Low";
  forecast?: string;
  previous?: string;
  source?: "LIVE_FEED" | "MANUAL";
}

export interface PeriodicReviewSnapshot {
  id: string;
  period: string;
  type: "Harian" | "Mingguan" | "Bulanan";
  status: string;
  wdActualUsd: number;
  compoundedLabel: string;
  disciplineScore: number;
  summaryNotes: string;
}

export interface AssistantTask {
  id: string;
  title: string;
  category: "SOP" | "RISK" | "MACRO" | "PERSONAL";
  completed: boolean;
  dueTime?: string;
}