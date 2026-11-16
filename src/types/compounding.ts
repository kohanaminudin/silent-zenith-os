export type MarketType = "forex" | "stocks" | "crypto";

export interface CompoundingConfig {
  initialCapital: number;
  targetCapital: number;
  dailyTargetPct: number;
  riskPerDayPct: number;
  selectedDay: number;
  startDate: string; // YYYY-MM-DD
  marketType: MarketType;
}

export type CheckpointStatus =
  | "TERLAMPAUI (Aman)"
  | "SEDANG DIJALANI"
  | "Belum Tercapai";

export interface RoadmapRow {
  day: number;
  dateStr: string; // YYYY-MM-DD
  dateLabel: string; // e.g., "16 Nov 2026"
  shortDateLabel: string; // e.g., "16 Nov"
  dayName: string; // e.g., "Senin"
  phase: string;
  startBalance: number;
  targetProfit: number;
  targetEndBalance: number;
  cumulativeGrowthPct: number;
  actualBalanceOnDate?: number;
  dailyNetPnlOnDate?: number;
  status: CheckpointStatus;
  milestoneNote: string;
}

export interface JournalEntryInput {
  id: string;
  sessionNumber: number;
  executionDate: string;
  pnlAmount: number;
  notes?: string;
}

export interface ComputedJournalRow extends JournalEntryInput {
  startBalance: number;
  maxRiskAmount: number;
  targetProfitAmount: number;
  dailyReturnPct: number;
  endBalance: number;
  safeDayAchieved: number;
  bufferFromSafeDay: number;
}

export interface DailyAggregatedSummary {
  dateStr: string;
  dateLabel: string;
  dayName: string;
  sessionsCount: number;
  netPnl: number;
  endBalance: number;
}

export interface DashboardMetrics {
  totalDaysRequired: number;
  estimatedEndDateStr: string;
  estimatedEndDateLabel: string;
  currentBalance: number;
  selectedDayStartTarget: number;
  selectedDayEndTarget: number;
  selectedDateLabel: string;
  safeBufferAmount: number;
  securityStatus: "AMAN" | "ON TRACK" | "DEFISIT";
  securityStatusLabel: string;
  safeDayAchieved: number;
  consecutiveLossEndurance: number;
  dayVariance: number;
  maxRiskToday: number;
  targetProfitToday: number;
  remainingToMillion: number;
  progressToTargetPct: number;
}