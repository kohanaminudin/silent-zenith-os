export type NavSectionId =
  | "dashboard"
  | "jurnal-trading"
  | "compounding-journal"
  | "checklist-analisis"
  | "lot-recommendation"
  | "trading-statistics"
  | "trade-history"
  | "performance-reports"
  | "sop-settings"
  | "risk-settings"
  | "profile-preferences"
  | "admin-panel";

export type TradeDirection = "BUY" | "SELL";
export type TradeStatus = "OPEN" | "WIN" | "LOSS" | "BE";

export interface SopChecklistItem {
  id: string;
  category: string;
  label: string;
  mandatory: boolean;
  enabled: boolean;
  order: number;
}

export interface SopTemplate {
  id: string;
  name: string;
  description: string;
  setupTag: string;
  items: SopChecklistItem[];
}

export interface SopSnapshotItem extends SopChecklistItem {
  checked: boolean;
}

export interface SopEvaluationSnapshot {
  templateId: string;
  templateName: string;
  completionPct: number;
  totalEnabled: number;
  completedCount: number;
  mandatoryIncompleteCount: number;
  overridden: boolean;
  items: SopSnapshotItem[];
  evaluatedAt: string;
}

export interface PositionSizingInput {
  instrument: string;
  accountEquity: number;
  accountCurrency: string;
  direction: TradeDirection;
  referencePrice: number;
  zoneUpper: number;
  zoneLower: number;
  entryLevelPct: number; // default 75
  useCustomEntry: boolean;
  customEntryPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  riskPct: number;
  contractSize: number;
  pipSize: number;
  pipValuePerLot: number; // nilai 1 pip dalam accountCurrency per 1.00 lot
  minLot: number;
  lotStep: number;
  commissionPerLot: number;
  leverage: number;
}

export interface PositionSizingResult {
  isValid: boolean;
  validationErrors: string[];
  recommendedEntry: number;
  entryZoneHigh: number;
  entryZoneLow: number;
  entryFormulaExplanation: string;
  entryDistanceFromRef: number;
  stopLossPrice: number;
  slDistancePrice: number;
  slDistancePips: number;
  riskAmountTarget: number;
  monetaryRiskPerLot: number;
  rawLotSize: number;
  recommendedLot: number;
  estimatedLossAtSl: number;
  actualRiskPct: number;
  estimatedMargin?: number;
  riskRewardRatio?: number;
  potentialProfitAtTp?: number;
}

export interface TradeJournalRecord {
  id: string;
  tradeDate: string;
  instrument: string;
  direction: TradeDirection;
  entryZoneLow?: number | null;
  entryZoneHigh?: number | null;
  recommendedEntry?: number | null;
  actualEntry: number;
  stopLoss: number;
  takeProfit?: number | null;
  exitPrice?: number | null;
  lotSize: number;
  riskPct: number;
  riskAmount: number;
  commission: number;
  actualPnl?: number | null;
  rMultiple?: number | null;
  status: TradeStatus;
  setupName: string;
  timeframe: string;
  notes: string;
  chartUrl: string;
  sopTemplateName: string;
  sopCompletionPct: number;
  sopOverridden: boolean;
  sopSnapshot: SopSnapshotItem[];
}

export interface UserTradingSettings {
  accountCurrency: string;
  defaultRiskPct: number;
  maxDailyLossPct: number;
  maxOpenTrades: number;
  minRrRatio: number;
  defaultContractSize: number;
  defaultPipSize: number;
  defaultPipValuePerLot: number;
  minLot: number;
  lotStep: number;
  commissionPerLot: number;
  leverage: number;
}

export interface TransferredTradeDraft {
  instrument: string;
  direction: TradeDirection;
  entryZoneLow: number;
  entryZoneHigh: number;
  recommendedEntry: number;
  actualEntry: number;
  stopLoss: number;
  takeProfit?: number;
  lotSize: number;
  riskPct: number;
  riskAmount: number;
  commission: number;
  sopSnapshot?: SopEvaluationSnapshot;
}