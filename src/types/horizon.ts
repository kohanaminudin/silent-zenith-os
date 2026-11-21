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

export type TradeDirection = "Buy (Long)" | "Sell (Short)";

export type TradeStatus = "WIN" | "LOSS" | "BE" | "OPEN";

export type TradingSession = string;

export interface TradeChecklist {
  plan: boolean;
  slSet: boolean;
  rrMin: boolean;
  noNews: boolean;
  calmMind: boolean;
}

export interface TradeItem {
  id: string;
  ticket?: string;
  date: string;
  account: string;
  pair: string;
  direction: TradeDirection;
  lot: number;
  entry: number;
  sl: number;
  tp: number;
  exit: number | null;
  commission: number;
  rMultiple: number;
  pnl: number;
  status: TradeStatus;
  session: TradingSession;
  timeframe: string;
  setup: string;
  marketContext: string;
  notes: string;
  checklist: TradeChecklist;
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

export interface DeterministicCycleRow {
  cycle: number;
  startBalance: number;
  returnPct: number;
  grossPnl: number;
  deposit: number;
  withdrawal: number;
  fee: number;
  netPnl: number;
  endBalance: number;
  cumulativeWd: number;
  progressPct: number;
}

export interface MonteCarloParams {
  initialCapital: number;
  iterations: number;
  totalTrades: number;
  tradesPerCycle: number;
  winRatePct: number;
  baseRiskPct: number;
  rewardRiskRatio: number;
  stopLossPips: number;
  spreadSlippagePips: number;
  pipValuePerLot: number;
  maxLot: number;
  commissionPerLot: number;
  marginLimitUsd: number;
  ruinThresholdPct: number;
  reduceRiskOnDrawdown: boolean;
  drawdownThresholdPct: number;
  periodicWithdrawal: boolean;
  wdIntervalTrades: number;
  wdProfitSharePct: number;
}

export interface MonteCarloChartPoint {
  trade: number;
  p5: number;
  p25: number;
  median: number;
  p75: number;
  p95: number;
  samplePath: number;
}

export interface MonteCarloCycleDetail {
  cycleNumber: number;
  tradeRangeLabel: string;
  startBalance: number;
  endBalance: number;
  wins: number;
  losses: number;
  drawdownPct: number;
  grossPnl: number;
  fees: number;
  netPnl: number;
  withdrawal: number;
}

export interface MonteCarloSummary {
  medianEndBalance: number;
  p5EndBalance: number;
  p95MaxDrawdownPct: number;
  ruinRiskPct: number;
  medianCashWithdrawn: number;
  avgMaxLosingStreak: number;
  avgMaxDrawdownPct: number;
  worstLosingStreak: number;
  chartData: MonteCarloChartPoint[];
  sampleCycles: MonteCarloCycleDetail[];
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