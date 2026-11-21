import {
  DeterministicCycleRow,
  MonteCarloChartPoint,
  MonteCarloCycleDetail,
  MonteCarloParams,
  MonteCarloSummary,
} from "@/types/horizon";

export function runDeterministicCompounding(params: {
  targetUsd: number;
  initialUsd: number;
  returnPerCyclePct: number;
  wdMode: "none" | "dynamic_pct" | "fixed";
  wdCapPct: number;
  feePerCycle: number;
  maxCycles?: number;
}): DeterministicCycleRow[] {
  const rows: DeterministicCycleRow[] = [];
  let balance = Math.max(1, params.initialUsd);
  const rate = Math.max(0.01, params.returnPerCyclePct) / 100;
  const capRatio = Math.min(95, Math.max(0, params.wdCapPct)) / 100;
  const limit = params.maxCycles ?? 500;

  for (let i = 1; i <= limit; i++) {
    const startBalance = balance;
    const grossPnl = startBalance * rate;
    const fee = Math.max(0, params.feePerCycle);
    const netPnl = grossPnl - fee;

    let withdrawal = 0;
    if (netPnl > 0) {
      if (params.wdMode === "dynamic_pct") {
        withdrawal = netPnl * capRatio;
      } else if (params.wdMode === "fixed") {
        withdrawal = Math.min(netPnl, params.wdCapPct);
      }
    }

    const endBalance = Math.max(0, startBalance + netPnl - withdrawal);
    rows.push({
      cycle: i,
      startBalance: Number(startBalance.toFixed(2)),
      returnPct: params.returnPerCyclePct,
      grossPnl: Number(grossPnl.toFixed(2)),
      fee: Number(fee.toFixed(2)),
      netPnl: Number(netPnl.toFixed(2)),
      deposit: 0,
      withdrawal: Number(withdrawal.toFixed(2)),
      endBalance: Number(endBalance.toFixed(2)),
    });

    balance = endBalance;
    if (balance >= params.targetUsd || balance <= 0) break;
  }

  return rows;
}

function getPercentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.floor((p / 100) * sortedAsc.length))
  );
  return sortedAsc[idx];
}

export function runMonteCarloSimulation(
  params: MonteCarloParams
): MonteCarloSummary {
  const iterations = Math.min(2000, Math.max(50, Math.floor(params.iterations)));
  const totalTrades = Math.min(1000, Math.max(10, Math.floor(params.totalTrades)));
  const tradesPerCycle = Math.max(1, Math.floor(params.tradesPerCycle));
  const winProb = Math.min(99, Math.max(1, params.winRatePct)) / 100;
  const ruinLevel =
    params.initialCapital * (1 - Math.min(99, Math.max(5, params.ruinThresholdPct)) / 100);

  // Matriks ekuitas per trade: [tradeIndex][iterationIndex]
  const balancesByTrade: number[][] = Array.from(
    { length: totalTrades },
    () => []
  );

  const endBalances: number[] = [];
  const maxDrawdowns: number[] = [];
  const totalWithdrawals: number[] = [];
  const maxLosingStreaks: number[] = [];
  let ruinedCount = 0;

  let samplePath: number[] = [];
  let sampleCycles: MonteCarloCycleDetail[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    let balance = Math.max(1, params.initialCapital);
    let peakBalance = balance;
    let lastWdHighWater = balance;
    let maxDdPct = 0;
    let totalWd = 0;
    let currentLossStreak = 0;
    let maxLossStreak = 0;
    let isRuined = false;

    const currentPath: number[] = [];
    const currentCycles: MonteCarloCycleDetail[] = [];

    // Tracker per siklus
    let cycleStartBal = balance;
    let cycleWins = 0;
    let cycleLosses = 0;
    let cycleGross = 0;
    let cycleFees = 0;
    let cycleWd = 0;
    let cyclePeak = balance;
    let cycleMaxDd = 0;

    for (let t = 1; t <= totalTrades; t++) {
      if (t % tradesPerCycle === 1) {
        cycleStartBal = balance;
        cycleWins = 0;
        cycleLosses = 0;
        cycleGross = 0;
        cycleFees = 0;
        cycleWd = 0;
        cyclePeak = balance;
        cycleMaxDd = 0;
      }

      if (!isRuined && balance > 0) {
        const currentDdFromPeak =
          peakBalance > 0 ? ((peakBalance - balance) / peakBalance) * 100 : 0;
        const effectiveRiskPct =
          params.reduceRiskOnDrawdown &&
          currentDdFromPeak >= params.drawdownThresholdPct
            ? params.baseRiskPct * 0.5
            : params.baseRiskPct;

        const riskUsd = balance * (effectiveRiskPct / 100);
        const slAndSpreadPips = Math.max(
          1,
          params.stopLossPips + params.spreadSlippagePips
        );
        const rawLot =
          riskUsd / (slAndSpreadPips * Math.max(0.01, params.pipValuePerLot));
        const lot = Math.min(params.maxLot, Math.max(0.01, Number(rawLot.toFixed(2))));
        const commission = lot * Math.max(0, params.commissionPerLot);

        const isWin = Math.random() < winProb;
        const gross = isWin
          ? riskUsd * Math.max(0.1, params.rewardRiskRatio)
          : -riskUsd;

        if (isWin) {
          cycleWins += 1;
          currentLossStreak = 0;
        } else {
          cycleLosses += 1;
          currentLossStreak += 1;
          if (currentLossStreak > maxLossStreak) {
            maxLossStreak = currentLossStreak;
          }
        }

        balance = Math.max(0, balance + gross - commission);
        cycleGross += gross;
        cycleFees += commission;

        // Periodic Withdrawal
        if (
          params.periodicWithdrawal &&
          params.wdIntervalTrades > 0 &&
          t % params.wdIntervalTrades === 0 &&
          balance > lastWdHighWater
        ) {
          const eligibleProfit = balance - lastWdHighWater;
          const wdAmount =
            eligibleProfit * (Math.min(100, Math.max(0, params.wdProfitSharePct)) / 100);
          balance -= wdAmount;
          totalWd += wdAmount;
          cycleWd += wdAmount;
          lastWdHighWater = balance;
        }

        if (balance > peakBalance) peakBalance = balance;
        if (balance > cyclePeak) cyclePeak = balance;

        const dd =
          peakBalance > 0 ? ((peakBalance - balance) / peakBalance) * 100 : 0;
        if (dd > maxDdPct) maxDdPct = dd;

        const cDd =
          cyclePeak > 0 ? ((cyclePeak - balance) / cyclePeak) * 100 : 0;
        if (cDd > cycleMaxDd) cycleMaxDd = cDd;

        if (balance <= ruinLevel) {
          isRuined = true;
        }
      }

      balancesByTrade[t - 1].push(balance);
      if (iter === 0) currentPath.push(Number(balance.toFixed(2)));

      if (t % tradesPerCycle === 0 || t === totalTrades) {
        const cycleIdx = Math.ceil(t / tradesPerCycle);
        const startTradeNum = (cycleIdx - 1) * tradesPerCycle + 1;
        const net = cycleGross - cycleFees;
        const retPct = cycleStartBal > 0 ? (net / cycleStartBal) * 100 : 0;
        currentCycles.push({
          cycleNumber: cycleIdx,
          tradeRangeLabel: `Trade ${startTradeNum}-${t} (${t - startTradeNum + 1} trade)`,
          wins: cycleWins,
          losses: cycleLosses,
          drawdownPct: Number(cycleMaxDd.toFixed(2)),
          startBalance: Number(cycleStartBal.toFixed(2)),
          returnPct: Number(retPct.toFixed(2)),
          grossPnl: Number(cycleGross.toFixed(2)),
          fees: Number(cycleFees.toFixed(2)),
          netPnl: Number(net.toFixed(2)),
          withdrawal: Number(cycleWd.toFixed(2)),
          endBalance: Number(balance.toFixed(2)),
        });
      }
    }

    if (isRuined) ruinedCount += 1;
    endBalances.push(balance);
    maxDrawdowns.push(maxDdPct);
    totalWithdrawals.push(totalWd);
    maxLosingStreaks.push(maxLossStreak);

    if (iter === 0) {
      samplePath = currentPath;
      sampleCycles = currentCycles;
    }
  }

  const sortedEnds = [...endBalances].sort((a, b) => a - b);
  const sortedDds = [...maxDrawdowns].sort((a, b) => a - b);
  const sortedWds = [...totalWithdrawals].sort((a, b) => a - b);

  const chartData: MonteCarloChartPoint[] = balancesByTrade.map((arr, idx) => {
    const s = [...arr].sort((a, b) => a - b);
    return {
      trade: idx + 1,
      p5: Number(getPercentile(s, 5).toFixed(2)),
      p25: Number(getPercentile(s, 25).toFixed(2)),
      median: Number(getPercentile(s, 50).toFixed(2)),
      p75: Number(getPercentile(s, 75).toFixed(2)),
      p95: Number(getPercentile(s, 95).toFixed(2)),
      samplePath: samplePath[idx] ?? Number(getPercentile(s, 50).toFixed(2)),
    };
  });

  const avgDd =
    maxDrawdowns.reduce((a, b) => a + b, 0) / Math.max(1, maxDrawdowns.length);
  const avgStreak =
    maxLosingStreaks.reduce((a, b) => a + b, 0) /
    Math.max(1, maxLosingStreaks.length);
  const worstStreak = Math.max(0, ...maxLosingStreaks);

  return {
    medianEndBalance: Number(getPercentile(sortedEnds, 50).toFixed(2)),
    p5EndBalance: Number(getPercentile(sortedEnds, 5).toFixed(2)),
    p95MaxDrawdownPct: Number(getPercentile(sortedDds, 95).toFixed(2)),
    ruinRiskPct: Number(((ruinedCount / iterations) * 100).toFixed(2)),
    medianCashWithdrawn: Number(getPercentile(sortedWds, 50).toFixed(2)),
    avgMaxLosingStreak: Number(avgStreak.toFixed(2)),
    avgMaxDrawdownPct: Number(avgDd.toFixed(2)),
    worstLosingStreak: worstStreak,
    chartData,
    sampleCycles,
  };
}