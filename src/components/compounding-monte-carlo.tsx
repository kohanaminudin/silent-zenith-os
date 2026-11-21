"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Play, Save, Dices, BookmarkCheck } from "lucide-react";
import {
  MonteCarloParams,
  SavedCompoundingScenario,
} from "@/types/horizon";
import {
  runDeterministicCompounding,
  runMonteCarloSimulation,
} from "@/lib/monte-carlo";

export function CompoundingAndMonteCarloView({
  defaultInitialUsd,
  defaultTargetUsd,
  savedScenarios,
  onSaveScenario,
}: {
  defaultInitialUsd: number;
  defaultTargetUsd: number;
  savedScenarios: SavedCompoundingScenario[];
  onSaveScenario: (scenario: SavedCompoundingScenario) => void;
}) {
  // 1. State Compounding Plan Deterministik
  const [targetUsd, setTargetUsd] = useState(defaultTargetUsd || 1000000);
  const [initialUsd, setInitialUsd] = useState(Math.max(10, defaultInitialUsd || 100));
  const [returnPerCyclePct, setReturnPerCyclePct] = useState(5);
  const [frequency, setFrequency] = useState<"Harian" | "Mingguan" | "Bulanan">(
    "Mingguan"
  );
  const [wdMode, setWdMode] = useState<"none" | "dynamic_pct" | "fixed">(
    "dynamic_pct"
  );
  const [wdCapPct, setWdCapPct] = useState(50);
  const [feePerCycle, setFeePerCycle] = useState(0);
  const [scenarioName, setScenarioName] = useState("Rencana Utama");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const schedule = useMemo(
    () =>
      runDeterministicCompounding({
        targetUsd,
        initialUsd,
        returnPerCyclePct,
        wdMode,
        wdCapPct,
        feePerCycle,
      }),
    [targetUsd, initialUsd, returnPerCyclePct, wdMode, wdCapPct, feePerCycle]
  );

  const totalWdEstimated = useMemo(
    () => schedule.reduce((sum, r) => sum + r.withdrawal, 0),
    [schedule]
  );
  const lastCycle = schedule[schedule.length - 1];
  const totalPages = Math.max(1, Math.ceil(schedule.length / pageSize));
  const paginatedRows = schedule.slice((page - 1) * pageSize, page * pageSize);

  const handleSaveScenario = () => {
    onSaveScenario({
      id: `SCN-${Date.now()}`,
      name: scenarioName.trim() || "Skenario Kustom",
      targetUsd,
      initialUsd,
      returnPerCyclePct,
      frequency,
      wdMode,
      wdCapPct,
      feePerCycle,
    });
  };

  // 2. State Simulator Monte Carlo (17 Parameter sesuai PDF halaman 11)
  const [mcParams, setMcParams] = useState<MonteCarloParams>({
    initialCapital: 100,
    baseRiskPct: 1,
    winRatePct: 50,
    rewardRiskRatio: 2,
    stopLossPips: 20,
    pipValuePerLot: 10,
    maxLot: 50,
    commissionPerLot: 7,
    spreadSlippagePips: 1,
    drawdownThresholdPct: 10,
    marginLimitUsd: 0,
    wdIntervalTrades: 20,
    wdProfitSharePct: 30,
    ruinThresholdPct: 50,
    totalTrades: 250,
    tradesPerCycle: 5,
    iterations: 500,
    reduceRiskOnDrawdown: true,
    periodicWithdrawal: false,
  });

  const [mcSeed, setMcSeed] = useState(1);

  const mcResult = useMemo(() => {
    void mcSeed;
    return runMonteCarloSimulation(mcParams);
  }, [mcParams, mcSeed]);

  const unitLabel =
    frequency === "Harian"
      ? "hari"
      : frequency === "Mingguan"
      ? "minggu"
      : "bulan";

  return (
    <div className="space-y-8">
      {/* ====================================================================
          BAGIAN A: COMPOUNDING PLAN DETERMINISTIK
      ==================================================================== */}
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Compounding Plan</h1>
            <p className="text-sm text-slate-400 mt-1">
              Atur parameter lalu simulasikan target — hasil adalah proyeksi ilustratif, bukan janji imbal hasil.
            </p>
          </div>

          {savedScenarios.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {savedScenarios.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setTargetUsd(sc.targetUsd);
                    setInitialUsd(sc.initialUsd);
                    setReturnPerCyclePct(sc.returnPerCyclePct);
                    setFrequency(sc.frequency);
                    setWdMode(sc.wdMode);
                    setWdCapPct(sc.wdCapPct);
                    setFeePerCycle(sc.feePerCycle);
                    setScenarioName(sc.name);
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:border-indigo-500"
                >
                  <BookmarkCheck className="h-3.5 w-3.5 text-emerald-400" />
                  {sc.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Form Parameter */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Target (USD)</label>
              <input
                type="number"
                value={targetUsd}
                onChange={(e) => {
                  setTargetUsd(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Modal Awal (USD)</label>
              <input
                type="number"
                value={initialUsd}
                onChange={(e) => {
                  setInitialUsd(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Return/Siklus (%)</label>
              <input
                type="number"
                step="0.1"
                value={returnPerCyclePct}
                onChange={(e) => {
                  setReturnPerCyclePct(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Frekuensi</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              >
                <option value="Harian">Harian</option>
                <option value="Mingguan">Mingguan</option>
                <option value="Bulanan">Bulanan</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Mode WD</label>
              <select
                value={wdMode}
                onChange={(e) => setWdMode(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              >
                <option value="none">Tanpa WD (100% Compound)</option>
                <option value="dynamic_pct">Dinamis (% profit)</option>
                <option value="fixed">Nominal Tetap ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">
                {wdMode === "fixed" ? "Nominal WD / Siklus ($)" : "Cap WD (% dari profit)"}
              </label>
              <input
                type="number"
                value={wdCapPct}
                onChange={(e) => setWdCapPct(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Biaya / Siklus (USD)</label>
              <input
                type="number"
                value={feePerCycle}
                onChange={(e) => setFeePerCycle(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Nama Skenario</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white"
            >
              <Play className="h-3.5 w-3.5" /> Simulasikan
            </button>
            <button
              type="button"
              onClick={handleSaveScenario}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200"
            >
              <Save className="h-3.5 w-3.5" /> Simpan Skenario
            </button>
          </div>
        </div>

        {/* Estimasi Pencapaian & Kurva Pertumbuhan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-3.5">
            <h2 className="text-base font-semibold text-white">Estimasi Pencapaian</h2>
            <div>
              <span className="text-xs text-slate-400">Lama Estimasi</span>
              <div className="text-lg font-bold text-white">
                {schedule.length} {unitLabel}{" "}
                <span className="text-xs font-normal text-slate-400">
                  (±{" "}
                  {(
                    schedule.length /
                    (frequency === "Harian" ? 260 : frequency === "Mingguan" ? 52 : 12)
                  ).toFixed(1)}{" "}
                  tahun)
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400">Jumlah Siklus</span>
              <div className="text-lg font-bold text-emerald-400">{schedule.length}x</div>
            </div>
            <div>
              <span className="text-xs text-slate-400">Balance Akhir (Estimasi)</span>
              <div className="text-lg font-bold text-white">
                ${(lastCycle?.endBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400">Total WD (Estimasi)</span>
              <div className="text-lg font-bold text-amber-300">
                ${totalWdEstimated.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#111827] p-5">
            <h2 className="text-base font-semibold text-white mb-3">
              Kurva Pertumbuhan (Proyeksi)
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={schedule}>
                  <defs>
                    <linearGradient id="detCurve" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="cycle" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="endBalance"
                    name="Saldo Akhir ($)"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#detCurve)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabel Siklus dengan Pagination */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/95 text-slate-400 uppercase border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Siklus</th>
                  <th className="px-4 py-3">Saldo Awal</th>
                  <th className="px-4 py-3">Return</th>
                  <th className="px-4 py-3">L/R Kotor</th>
                  <th className="px-4 py-3">Biaya</th>
                  <th className="px-4 py-3">L/R Bersih</th>
                  <th className="px-4 py-3">Deposit</th>
                  <th className="px-4 py-3">Withdrawal</th>
                  <th className="px-4 py-3">Saldo Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                {paginatedRows.map((r) => (
                  <tr key={r.cycle} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium">
                      {r.cycle} {unitLabel}
                    </td>
                    <td className="px-4 py-2.5">${r.startBalance.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-emerald-400">
                      {r.returnPct.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5">${r.grossPnl.toLocaleString()}</td>
                    <td className="px-4 py-2.5">${r.fee.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-emerald-400">
                      ${r.netPnl.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">$0.00</td>
                    <td className="px-4 py-2.5 text-amber-300">
                      ${r.withdrawal.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-white">
                      ${r.endBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
            <span>
              Siklus {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, schedule.length)} dari {schedule.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-slate-700 px-2.5 py-1 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span>
                Hal {page}/{totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded border border-slate-700 px-2.5 py-1 disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          BAGIAN B: SIMULATOR MONTE CARLO (Halaman 11-13 PDF)
      ==================================================================== */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Dices className="h-5 w-5 text-indigo-400" />
              Monte Carlo Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Simulasi probabilistik ratusan hingga ribuan skenario acak berdasarkan Win Rate, Risk:Reward, komisi, slippage, dan aturan drawdown.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMcSeed((s) => s + 1)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white"
          >
            <Play className="h-3.5 w-3.5" /> Simulasikan Monte Carlo
          </button>
        </div>

        {/* 17 Parameter Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { label: "Modal awal Monte Carlo (USD)", key: "initialCapital" },
            { label: "Risiko dasar (%)", key: "baseRiskPct" },
            { label: "Win rate (%)", key: "winRatePct" },
            { label: "Rasio reward/risk", key: "rewardRiskRatio" },
            { label: "Stop loss (pip)", key: "stopLossPips" },
            { label: "Nilai pip per lot (USD)", key: "pipValuePerLot" },
            { label: "Lot maksimum", key: "maxLot" },
            { label: "Komisi per lot (USD)", key: "commissionPerLot" },
            { label: "Spread dan slippage (pip)", key: "spreadSlippagePips" },
            { label: "Ambang drawdown (%)", key: "drawdownThresholdPct" },
            { label: "Interval WD (trade)", key: "wdIntervalTrades" },
            { label: "Porsi laba untuk WD (%)", key: "wdProfitSharePct" },
            { label: "Ambang risiko kehancuran (%)", key: "ruinThresholdPct" },
            { label: "Jumlah trade", key: "totalTrades" },
            { label: "Trade per siklus", key: "tradesPerCycle" },
            { label: "Iterasi Monte Carlo", key: "iterations" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-[11px] text-slate-400 mb-1 truncate">
                {field.label}
              </label>
              <input
                type="number"
                step="any"
                value={(mcParams as any)[field.key]}
                onChange={(e) =>
                  setMcParams({
                    ...mcParams,
                    [field.key]: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-6 text-xs text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mcParams.reduceRiskOnDrawdown}
              onChange={(e) =>
                setMcParams({
                  ...mcParams,
                  reduceRiskOnDrawdown: e.target.checked,
                })
              }
              className="rounded border-slate-600 bg-slate-800 text-indigo-500"
            />
            <span>Kurangi risiko 50% saat drawdown melebihi ambang</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mcParams.periodicWithdrawal}
              onChange={(e) =>
                setMcParams({
                  ...mcParams,
                  periodicWithdrawal: e.target.checked,
                })
              }
              className="rounded border-slate-600 bg-slate-800 text-indigo-500"
            />
            <span>Withdrawal berkala (di atas High-Water Mark)</span>
          </label>
        </div>

        {/* 8 KPI Hasil Monte Carlo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5">
            <span className="text-[11px] text-slate-400">Median saldo akhir</span>
            <div className="mt-1 text-lg font-bold text-emerald-400">
              ${mcResult.medianEndBalance.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5">
            <span className="text-[11px] text-slate-400">P5 saldo akhir (Terburuk 5%)</span>
            <div className="mt-1 text-lg font-bold text-white">
              ${mcResult.p5EndBalance.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5">
            <span className="text-[11px] text-slate-400">P95 max drawdown</span>
            <div className="mt-1 text-lg font-bold text-amber-400">
              {mcResult.p95MaxDrawdownPct}%
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5">
            <span className="text-[11px] text-slate-400">Risiko kehancuran</span>
            <div className="mt-1 text-lg font-bold text-rose-400">
              {mcResult.ruinRiskPct}%
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5">
            <span className="text-[11px] text-slate-400">Median kas ditarik</span>
            <div className="mt-1 text-base font-bold text-white">
              ${mcResult.medianCashWithdrawn.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5">
            <span className="text-[11px] text-slate-400">Rata-rata rentetan rugi</span>
            <div className="mt-1 text-base font-bold text-white">
              {mcResult.avgMaxLosingStreak} trade
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5">
            <span className="text-[11px] text-slate-400">Rata-rata max drawdown</span>
            <div className="mt-1 text-base font-bold text-white">
              {mcResult.avgMaxDrawdownPct}%
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5">
            <span className="text-[11px] text-slate-400">Rentetan rugi maksimum</span>
            <div className="mt-1 text-base font-bold text-rose-300">
              {mcResult.worstLosingStreak} trade
            </div>
          </div>
        </div>

        {/* Fan Chart P5 - P95 + Median + Sample Path */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mcResult.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="trade" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="p95"
                name="Persentil 95 ($)"
                stroke="none"
                fill="#10B981"
                fillOpacity={0.14}
              />
              <Area
                type="monotone"
                dataKey="p75"
                name="Persentil 75 ($)"
                stroke="none"
                fill="#10B981"
                fillOpacity={0.22}
              />
              <Line
                type="monotone"
                dataKey="median"
                name="Median ($)"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="p5"
                name="Persentil 5 ($)"
                stroke="#F43F5E"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="samplePath"
                name="Contoh Jalur ($)"
                stroke="#818CF8"
                strokeWidth={1.2}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Rincian Per Siklus (Halaman 12-13 PDF) */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          <h3 className="text-sm font-semibold text-white">
            Rincian Jalur Simulasi per Siklus
          </h3>
          {mcResult.sampleCycles.map((cyc) => (
            <div
              key={cyc.cycleNumber}
              className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-white">
                <span>
                  Siklus {cyc.cycleNumber}. {cyc.tradeRangeLabel}
                </span>
                <span className="text-slate-400 font-normal">
                  {cyc.wins} menang, {cyc.losses} kalah • Drawdown {cyc.drawdownPct}%
                </span>
              </div>
              <div className="mt-1.5 text-slate-300 leading-relaxed">
                Saldo awal ${cyc.startBalance.toFixed(2)} • Return{" "}
                <span
                  className={
                    cyc.returnPct >= 0 ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  {cyc.returnPct}%
                </span>{" "}
                • L/R kotor ${cyc.grossPnl.toFixed(2)} • Biaya ${cyc.fees.toFixed(2)} •
                L/R bersih{" "}
                <span
                  className={
                    cyc.netPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  ${cyc.netPnl.toFixed(2)}
                </span>{" "}
                • WD ${cyc.withdrawal.toFixed(2)} • Saldo akhir{" "}
                <strong className="text-white">${cyc.endBalance.toFixed(2)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}