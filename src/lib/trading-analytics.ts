import { TradeJournalRecord } from "@/types/trading-system";

export interface TradingAnalyticsSummary {
  totalTrades: number;
  closedTradesCount: number;
  openTradesCount: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRatePct: number;
  totalNetPnl: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number | null;
  expectancyPerTrade: number;
  averageRiskPct: number;
  averageRMultiple: number | null;
  sopComplianceRatePct: number;
  bestTradePnl: number | null;
  worstTradePnl: number | null;
  equitySeries: { label: string; date: string; balance: number; pnl: number }[];
  dailyPnlSeries: { date: string; pnl: number; count: number }[];
  setupBreakdown: {
    setup: string;
    trades: number;
    wins: number;
    winRate: number;
    netPnl: number;
  }[];
}

export function computeTradingAnalytics(
  trades: TradeJournalRecord[],
  startingCapital: number
): TradingAnalyticsSummary {
  const sorted = [...trades].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
  const closed = sorted.filter((t) => t.status !== "OPEN" && t.actualPnl !== null && t.actualPnl !== undefined);
  const openTradesCount = sorted.length - closed.length;

  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let totalNetPnl = 0;
  let bestTradePnl: number | null = null;
  let worstTradePnl: number | null = null;

  const rValues: number[] = [];

  closed.forEach((t) => {
    const pnl = Number(t.actualPnl || 0);
    totalNetPnl += pnl;

    if (pnl > 0) {
      wins += 1;
      grossProfit += pnl;
    } else if (pnl < 0) {
      losses += 1;
      grossLoss += Math.abs(pnl);
    } else {
      breakevens += 1;
    }

    if (bestTradePnl === null || pnl > bestTradePnl) bestTradePnl = pnl;
    if (worstTradePnl === null || pnl < worstTradePnl) worstTradePnl = pnl;

    if (t.rMultiple !== null && t.rMultiple !== undefined && Number.isFinite(t.rMultiple)) {
      rValues.push(Number(t.rMultiple));
    } else if (t.riskAmount > 0) {
      rValues.push(pnl / t.riskAmount);
    }
  });

  const winRatePct = closed.length > 0 ? (wins / closed.length) * 100 : 0;
  const profitFactor =
    grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : null;
  const expectancyPerTrade = closed.length > 0 ? totalNetPnl / closed.length : 0;

  const averageRiskPct =
    sorted.length > 0
      ? sorted.reduce((acc, t) => acc + Number(t.riskPct || 0), 0) / sorted.length
      : 0;

  const averageRMultiple =
    rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : null;

  const sopComplianceRatePct =
    sorted.length > 0
      ? sorted.reduce((acc, t) => acc + Number(t.sopCompletionPct || 0), 0) / sorted.length
      : 0;

  let runningBalance = startingCapital;
  const equitySeries = closed.map((t, idx) => {
    const pnl = Number(t.actualPnl || 0);
    runningBalance += pnl;
    return {
      label: `#${idx + 1} ${t.instrument}`,
      date: t.tradeDate,
      balance: Number(runningBalance.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
    };
  });

  const dailyMap = new Map<string, { pnl: number; count: number }>();
  closed.forEach((t) => {
    const prev = dailyMap.get(t.tradeDate) || { pnl: 0, count: 0 };
    dailyMap.set(t.tradeDate, {
      pnl: prev.pnl + Number(t.actualPnl || 0),
      count: prev.count + 1,
    });
  });

  const dailyPnlSeries = Array.from(dailyMap.entries()).map(([date, info]) => ({
    date,
    pnl: Number(info.pnl.toFixed(2)),
    count: info.count,
  }));

  const setupMap = new Map<string, { trades: number; wins: number; netPnl: number }>();
  closed.forEach((t) => {
    const key = t.setupName?.trim() || "Tanpa Setup";
    const prev = setupMap.get(key) || { trades: 0, wins: 0, netPnl: 0 };
    const pnl = Number(t.actualPnl || 0);
    setupMap.set(key, {
      trades: prev.trades + 1,
      wins: prev.wins + (pnl > 0 ? 1 : 0),
      netPnl: prev.netPnl + pnl,
    });
  });

  const setupBreakdown = Array.from(setupMap.entries()).map(([setup, info]) => ({
    setup,
    trades: info.trades,
    wins: info.wins,
    winRate: info.trades > 0 ? (info.wins / info.trades) * 100 : 0,
    netPnl: Number(info.netPnl.toFixed(2)),
  }));

  return {
    totalTrades: sorted.length,
    closedTradesCount: closed.length,
    openTradesCount,
    wins,
    losses,
    breakevens,
    winRatePct,
    totalNetPnl,
    grossProfit,
    grossLoss,
    profitFactor,
    expectancyPerTrade,
    averageRiskPct,
    averageRMultiple,
    sopComplianceRatePct,
    bestTradePnl,
    worstTradePnl,
    equitySeries,
    dailyPnlSeries,
    setupBreakdown,
  };
}