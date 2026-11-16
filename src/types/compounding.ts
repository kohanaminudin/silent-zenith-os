export interface CompoundingConfig {
  initialCapital: number;
  targetCapital: number;
  dailyTargetPct: number;
  riskPerDayPct: number;
  selectedDay: number;
}

export type CheckpointStatus =
  | "TERLAMPAUI (Aman)"
  | "SEDANG DIJALANI"
  | "Belum Tercapai";

export interface RoadmapRow {
  day: number;
  phase: string;
  startBalance: number;
  targetProfit: number;
  targetEndBalance: number;
  cumulativeGrowthPct: number;
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

export interface DashboardMetrics {
  totalDaysRequired: number;
  currentBalance: number;
  selectedDayStartTarget: number;
  selectedDayEndTarget: number;
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