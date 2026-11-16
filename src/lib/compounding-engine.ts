import {
  CompoundingConfig,
  ComputedJournalRow,
  DashboardMetrics,
  JournalEntryInput,
  RoadmapRow,
} from "@/types/compounding";

export function calculateTotalDaysRequired(
  initialCapital: number,
  targetCapital: number,
  dailyTargetPct: number
): number {
  if (initialCapital <= 0 || targetCapital <= initialCapital || dailyTargetPct <= 0) {
    return 1;
  }
  return Math.ceil(Math.log(targetCapital / initialCapital) / Math.log(1 + dailyTargetPct));
}

export function generateDynamicRoadmap(
  config: CompoundingConfig,
  currentBalance: number
): RoadmapRow[] {
  const totalDays = calculateTotalDaysRequired(
    config.initialCapital,
    config.targetCapital,
    config.dailyTargetPct
  );

  const rows: RoadmapRow[] = [];
  let runningStart = config.initialCapital;

  for (let day = 1; day <= totalDays; day++) {
    const phaseIndex = Math.ceil(day / 10);
    const phaseStart = (phaseIndex - 1) * 10 + 1;
    const phaseEnd = Math.min(phaseIndex * 10, totalDays);
    const phase = `Fase ${phaseIndex} (Day ${phaseStart}-${phaseEnd})`;

    const targetProfit = runningStart * config.dailyTargetPct;
    const targetEndBalance = runningStart + targetProfit;
    const cumulativeGrowthPct = (targetEndBalance - config.initialCapital) / config.initialCapital;

    let status: RoadmapRow["status"] = "Belum Tercapai";
    if (currentBalance >= targetEndBalance) {
      status = "TERLAMPAUI (Aman)";
    } else if (currentBalance >= runningStart && currentBalance < targetEndBalance) {
      status = "SEDANG DIJALANI";
    }

    let milestoneNote = `Target saldo akhir Day ${day}. Surplus masuk ke Cadangan Dana Aman.`;
    if (day === 1) {
      milestoneNote = `Start $${config.initialCapital.toFixed(2)}. Surplus harian otomatis memperkuat buffer risiko.`;
    } else if (targetEndBalance >= config.initialCapital * 2 && runningStart < config.initialCapital * 2) {
      milestoneNote = `Milestone 2x Lipat Modal Awal ($${targetEndBalance.toFixed(2)}). Modal awal sudah aman +100%.`;
    } else if (day === totalDays) {
      milestoneNote = `TARGET FINAL $${config.targetCapital.toLocaleString("en-US")} TERCAPAI ($${targetEndBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})!`;
    }

    rows.push({
      day,
      phase,
      startBalance: runningStart,
      targetProfit,
      targetEndBalance,
      cumulativeGrowthPct,
      status,
      milestoneNote,
    });

    runningStart = targetEndBalance;
  }

  return rows;
}

export function computeJournals(
  config: CompoundingConfig,
  entries: JournalEntryInput[],
  roadmap: RoadmapRow[]
): ComputedJournalRow[] {
  const sorted = [...entries].sort((a, b) => a.sessionNumber - b.sessionNumber);
  let runningBalance = config.initialCapital;

  return sorted.map((entry) => {
    const startBalance = runningBalance;
    const maxRiskAmount = startBalance * config.riskPerDayPct;
    const targetProfitAmount = startBalance * config.dailyTargetPct;
    const dailyReturnPct = startBalance > 0 ? entry.pnlAmount / startBalance : 0;
    const endBalance = startBalance + entry.pnlAmount;

    const safeDayAchieved = roadmap.filter((r) => r.targetEndBalance <= endBalance).length;
    const referenceBalance =
      safeDayAchieved > 0
        ? roadmap[safeDayAchieved - 1].targetEndBalance
        : config.initialCapital;
    const bufferFromSafeDay = endBalance - referenceBalance;

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
  const currentBalance =
    computedJournals.length > 0
      ? computedJournals[computedJournals.length - 1].endBalance
      : config.initialCapital;

  const safeSelectedDay = Math.min(Math.max(1, config.selectedDay), totalDaysRequired);
  const selectedRow = roadmap[safeSelectedDay - 1];

  const selectedDayStartTarget = selectedRow.startBalance;
  const selectedDayEndTarget = selectedRow.targetEndBalance;
  const safeBufferAmount = currentBalance - selectedDayStartTarget;

  let securityStatus: DashboardMetrics["securityStatus"] = "DEFISIT";
  let securityStatusLabel = "DEFISIT — Di Bawah Target Awal Day Ini";

  if (currentBalance >= selectedDayEndTarget) {
    securityStatus = "AMAN";
    securityStatusLabel = "AMAN — Target Day Terpilih Sudah Terlampaui!";
  } else if (currentBalance >= selectedDayStartTarget) {
    securityStatus = "ON TRACK";
    securityStatusLabel = "ON TRACK — Berada di Jalur Day Terpilih";
  }

  const safeDayAchieved = roadmap.filter((r) => r.targetEndBalance <= currentBalance).length;

  const consecutiveLossEndurance =
    currentBalance <= selectedDayStartTarget || config.riskPerDayPct <= 0
      ? 0
      : Math.floor(
          Math.log(selectedDayStartTarget / currentBalance) /
            Math.log(1 - config.riskPerDayPct)
        );

  const dayVariance = safeDayAchieved - safeSelectedDay;
  const maxRiskToday = currentBalance * config.riskPerDayPct;
  const targetProfitToday = currentBalance * config.dailyTargetPct;
  const remainingToMillion = Math.max(0, config.targetCapital - currentBalance);
  const progressToTargetPct = Math.min(1, currentBalance / config.targetCapital);

  return {
    totalDaysRequired,
    currentBalance,
    selectedDayStartTarget,
    selectedDayEndTarget,
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
