import {
  CheckpointStatus,
  CompoundingConfig,
  ComputedJournalRow,
  DailyAggregatedSummary,
  DashboardMetrics,
  JournalEntryInput,
  MarketType,
  RoadmapRow,
} from "@/types/compounding";

const BULAN_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const HARI_ID = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
];

function parseLocalYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 12, 0, 0);
}

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatReadableDate(ymd: string): {
  full: string;
  short: string;
  dayName: string;
} {
  const dt = parseLocalYMD(ymd);
  const d = dt.getDate();
  const m = BULAN_ID[dt.getMonth()];
  const y = dt.getFullYear();
  const dayName = HARI_ID[dt.getDay()];
  return {
    full: `${d} ${m} ${y}`,
    short: `${d} ${m}`,
    dayName,
  };
}

/**
 * Menghasilkan daftar tanggal trading valid berdasarkan instrumen market:
 * - forex & stocks: Hanya Senin - Jumat (5 hari/minggu, skip Sabtu & Minggu)
 * - crypto: 7 hari/minggu (24/7)
 */
export function generateTradingDates(
  startDateStr: string,
  totalTradingDays: number,
  marketType: MarketType
): string[] {
  const dates: string[] = [];
  const cursor = parseLocalYMD(startDateStr);
  const skipWeekends = marketType === "forex" || marketType === "stocks";

  while (dates.length < totalTradingDays) {
    const dayOfWeek = cursor.getDay(); // 0 = Minggu, 6 = Sabtu
    if (!skipWeekends || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
      dates.push(formatYMD(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function calculateRequiredDays(
  initialCapital: number,
  targetCapital: number,
  dailyTargetPct: number
): number {
  if (initialCapital <= 0 || targetCapital <= initialCapital || dailyTargetPct <= 0) {
    return 1;
  }
  const exactDays =
    Math.log(targetCapital / initialCapital) / Math.log(1 + dailyTargetPct);
  return Math.min(Math.ceil(exactDays), 3650);
}

function getPhaseLabel(day: number, totalDays: number): string {
  const ratio = day / Math.max(1, totalDays);
  if (ratio <= 0.15) return "Fase 1 — Inkubasi Modal";
  if (ratio <= 0.35) return "Fase 2 — Akselerasi Awal";
  if (ratio <= 0.6) return "Fase 3 — Ekspansi Ekuitas";
  if (ratio <= 0.85) return "Fase 4 — Skala Institusional";
  return "Fase 5 — Zona Target Akhir";
}

function getMilestoneNote(
  day: number,
  totalDays: number,
  targetEndBalance: number,
  targetCapital: number
): string {
  if (day === 1) return "Sesi Pembuka — Kunci Disiplin Eksekusi";
  if (day === totalDays || targetEndBalance >= targetCapital) {
    return "TARGET AKHIR TERCAPAI";
  }
  if (targetEndBalance >= 1000 && targetEndBalance / 1.1 < 1000) return "Milestone $1.000";
  if (targetEndBalance >= 10000 && targetEndBalance / 1.1 < 10000) return "Milestone $10.000";
  if (targetEndBalance >= 100000 && targetEndBalance / 1.1 < 100000) return "Milestone $100.000";
  if (targetEndBalance >= 1000000 && targetEndBalance / 1.1 < 1000000) return "Milestone $1 Juta";
  return "Compounding Berjalan";
}

/**
 * Mengagregasi semua entri jurnal berdasarkan tanggal yang sama (net profit/minus per tanggal)
 */
export function aggregateJournalsByDate(
  computedJournals: ComputedJournalRow[]
): DailyAggregatedSummary[] {
  const map = new Map<string, DailyAggregatedSummary>();

  computedJournals.forEach((entry) => {
    const existing = map.get(entry.executionDate);
    const info = formatReadableDate(entry.executionDate);
    if (!existing) {
      map.set(entry.executionDate, {
        dateStr: entry.executionDate,
        dateLabel: info.full,
        dayName: info.dayName,
        sessionsCount: 1,
        netPnl: entry.pnlAmount,
        endBalance: entry.endBalance,
      });
    } else {
      existing.sessionsCount += 1;
      existing.netPnl += entry.pnlAmount;
      existing.endBalance = entry.endBalance;
    }
  });

  return Array.from(map.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
}

export function generateDynamicRoadmap(
  config: CompoundingConfig,
  currentBalance: number,
  dailySummaries: DailyAggregatedSummary[] = []
): RoadmapRow[] {
  const totalDays = calculateRequiredDays(
    config.initialCapital,
    config.targetCapital,
    config.dailyTargetPct
  );

  const tradingDates = generateTradingDates(
    config.startDate,
    totalDays,
    config.marketType
  );

  const summaryMap = new Map<string, DailyAggregatedSummary>();
  dailySummaries.forEach((s) => summaryMap.set(s.dateStr, s));

  const rows: RoadmapRow[] = [];
  let runningBalance = config.initialCapital;

  for (let day = 1; day <= totalDays; day++) {
    const startBalance = runningBalance;
    const targetProfit = startBalance * config.dailyTargetPct;
    const targetEndBalance = startBalance + targetProfit;
    const cumulativeGrowthPct =
      (targetEndBalance - config.initialCapital) / config.initialCapital;

    const dateStr = tradingDates[day - 1] || config.startDate;
    const dateInfo = formatReadableDate(dateStr);
    const daySummary = summaryMap.get(dateStr);

    let status: CheckpointStatus = "Belum Tercapai";
    if (currentBalance >= targetEndBalance - 0.005) {
      status = "TERLAMPAUI (Aman)";
    } else if (day === config.selectedDay) {
      status = "SEDANG DIJALANI";
    }

    rows.push({
      day,
      dateStr,
      dateLabel: dateInfo.full,
      shortDateLabel: dateInfo.short,
      dayName: dateInfo.dayName,
      phase: getPhaseLabel(day, totalDays),
      startBalance,
      targetProfit,
      targetEndBalance,
      cumulativeGrowthPct,
      actualBalanceOnDate: daySummary?.endBalance,
      dailyNetPnlOnDate: daySummary?.netPnl,
      status,
      milestoneNote: getMilestoneNote(day, totalDays, targetEndBalance, config.targetCapital),
    });

    runningBalance = targetEndBalance;
  }

  return rows;
}

export function computeJournals(
  config: CompoundingConfig,
  entries: JournalEntryInput[],
  roadmap: RoadmapRow[]
): ComputedJournalRow[] {
  let runningBalance = config.initialCapital;

  return entries.map((entry) => {
    const startBalance = runningBalance;
    const maxRiskAmount = startBalance * config.riskPerDayPct;
    const targetProfitAmount = startBalance * config.dailyTargetPct;
    const dailyReturnPct = startBalance > 0 ? entry.pnlAmount / startBalance : 0;
    const endBalance = startBalance + entry.pnlAmount;

    let safeDayAchieved = 0;
    for (const r of roadmap) {
      if (endBalance >= r.targetEndBalance - 0.005) {
        safeDayAchieved = r.day;
      } else {
        break;
      }
    }

    const safeTarget =
      safeDayAchieved > 0
        ? roadmap[safeDayAchieved - 1].targetEndBalance
        : config.initialCapital;
    const bufferFromSafeDay = endBalance - safeTarget;

    runningBalance = endBalance;

    return {
      ...entry,
      startBalance,
      maxRiskAmount,
      targetProfitAmount,
      dailyReturnPct,
      endBalance,
      safeDayAchieved,
      bufferFromSafeDay,
    };
  });
}

export function computeDashboardMetrics(
  config: CompoundingConfig,
  roadmap: RoadmapRow[],
  computedJournals: ComputedJournalRow[]
): DashboardMetrics {
  const totalDaysRequired = roadmap.length;
  const lastRow = roadmap[roadmap.length - 1];
  const estimatedEndDateStr = lastRow?.dateStr || config.startDate;
  const estimatedEndDateLabel = lastRow?.dateLabel || formatReadableDate(config.startDate).full;

  const currentBalance =
    computedJournals.length > 0
      ? computedJournals[computedJournals.length - 1].endBalance
      : config.initialCapital;

  const clampedDay = Math.min(Math.max(1, config.selectedDay), totalDaysRequired);
  const selectedRow = roadmap[clampedDay - 1] || roadmap[0];

  const selectedDayStartTarget = selectedRow ? selectedRow.startBalance : config.initialCapital;
  const selectedDayEndTarget = selectedRow ? selectedRow.targetEndBalance : config.initialCapital;
  const selectedDateLabel = selectedRow ? selectedRow.dateLabel : formatReadableDate(config.startDate).full;

  const safeBufferAmount = currentBalance - selectedDayStartTarget;

  let safeDayAchieved = 0;
  for (const r of roadmap) {
    if (currentBalance >= r.targetEndBalance - 0.005) {
      safeDayAchieved = r.day;
    } else {
      break;
    }
  }

  let securityStatus: "AMAN" | "ON TRACK" | "DEFISIT" = "ON TRACK";
  let securityStatusLabel = "ON TRACK (Sesuai Jalur)";

  if (currentBalance >= selectedDayEndTarget - 0.005) {
    securityStatus = "AMAN";
    securityStatusLabel = `AMAN (+$${safeBufferAmount.toFixed(2)} di atas target)`;
  } else if (safeBufferAmount < -0.005) {
    securityStatus = "DEFISIT";
    securityStatusLabel = `DEFISIT (-$${Math.abs(safeBufferAmount).toFixed(2)} di bawah basis)`;
  }

  const consecutiveLossEndurance =
    config.riskPerDayPct > 0 && safeBufferAmount > 0
      ? Math.floor(safeBufferAmount / (currentBalance * config.riskPerDayPct))
      : 0;

  const dayVariance = safeDayAchieved - (clampedDay - 1);
  const maxRiskToday = currentBalance * config.riskPerDayPct;
  const targetProfitToday = currentBalance * config.dailyTargetPct;
  const remainingToMillion = Math.max(0, config.targetCapital - currentBalance);
  const progressToTargetPct = Math.min(
    100,
    Math.max(
      0,
      ((currentBalance - config.initialCapital) /
        Math.max(1, config.targetCapital - config.initialCapital)) *
        100
    )
  );

  return {
    totalDaysRequired,
    currentBalance,
    selectedDayStartTarget,
    selectedDayEndTarget,
    selectedDateLabel,
    estimatedEndDateStr,
    estimatedEndDateLabel,
    safeBufferAmount,
    securityStatus,
    securityStatusLabel,
    safeDayAchieved,
    consecutiveLossEndurance,
    dayVariance,
    maxRiskToday,
    targetProfitToday,
    remainingToMillion,
    progressToTargetPct,
  };
}