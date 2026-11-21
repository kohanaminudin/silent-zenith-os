"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  Send,
  Target,
  RefreshCw,
  Radio,
} from "lucide-react";
import {
  AppSettings,
  BudgetItem,
  CashflowEntry,
  DebtItem,
  EconomicEvent,
  PeriodicReviewSnapshot,
  TradeItem,
  WithdrawalRecord,
} from "@/types/horizon";
import {
  AnimatedMetric,
  EconomistMacroBanner,
} from "@/components/motion-primitives";

/* ============================================================================
   1. DASHBOARD OVERVIEW VIEW (Economist & Institutional Grade)
============================================================================ */
export function DashboardOverviewView({
  settings,
  trades,
  withdrawals,
  budgets,
  debts,
  events,
  onNavigate,
}: {
  settings: AppSettings;
  trades: TradeItem[];
  withdrawals: WithdrawalRecord[];
  budgets: BudgetItem[];
  debts: DebtItem[];
  events: EconomicEvent[];
  onNavigate: (tab: any) => void;
}) {
  const [convAmount, setConvAmount] = useState("100");
  const [convDir, setConvDir] = useState<"USD_TO_IDR" | "IDR_TO_USD">(
    "USD_TO_IDR"
  );

  const realizedPnl = useMemo(
    () =>
      trades.filter((t) => t.status !== "OPEN").reduce((s, t) => s + t.pnl, 0),
    [trades]
  );
  const totalWd = useMemo(
    () => withdrawals.reduce((s, w) => s + w.amountUsd, 0),
    [withdrawals]
  );
  const currentBalance = Number(
    (settings.initialCapitalUsd + realizedPnl - totalWd).toFixed(2)
  );
  const progressPct =
    settings.targetCapitalUsd > 0
      ? Math.max(0, (currentBalance / settings.targetCapitalUsd) * 100)
      : 0;

  const monthlyBudgetIdr = useMemo(
    () => budgets.filter((b) => b.active).reduce((s, b) => s + b.amountIdr, 0),
    [budgets]
  );
  const weeklyBudgetIdr = Math.round(monthlyBudgetIdr / 4.33);
  const totalDebtIdr = useMemo(
    () => debts.reduce((s, d) => s + d.remainingIdr, 0),
    [debts]
  );

  const nextMilestone = useMemo(() => {
    const steps = [
      100,
      200,
      500,
      1000,
      2500,
      5000,
      10000,
      25000,
      50000,
      100000,
      500000,
      settings.targetCapitalUsd,
    ];
    return steps.find((s) => s > currentBalance) ?? settings.targetCapitalUsd;
  }, [currentBalance, settings.targetCapitalUsd]);

  const weeklyWdRecommendation = useMemo(() => {
    const eligible = Math.max(0, realizedPnl - totalWd);
    return Number((eligible * (settings.wdCapRatioPct / 100)).toFixed(2));
  }, [realizedPnl, totalWd, settings.wdCapRatioPct]);

  const nextHighImpact = useMemo(
    () => events.find((e) => e.impact === "High"),
    [events]
  );

  const convertedText = useMemo(() => {
    const v = parseFloat(convAmount) || 0;
    if (convDir === "USD_TO_IDR") {
      return `Rp ${(v * settings.jisdorRate).toLocaleString("id-ID", {
        maximumFractionDigits: 0,
      })}`;
    }
    return `$ ${(v / settings.jisdorRate).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [convAmount, convDir, settings.jisdorRate]);

  const curveData = useMemo(() => {
    const base = Math.max(10, currentBalance);
    return Array.from({ length: 12 }, (_, i) => ({
      week: `Mgg ${i + 1}`,
      proyeksi: Number((base * Math.pow(1.05, i + 1)).toFixed(2)),
    }));
  }, [currentBalance]);

  return (
    <div className="space-y-6">
      <EconomistMacroBanner
        jisdorRate={settings.jisdorRate}
        nextHighImpactEvent={nextHighImpact}
        onOpenCalendar={() => onNavigate("calendar")}
      />

      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Ringkasan proyek trading, performa, dan rencana menuju $
          {settings.targetCapitalUsd.toLocaleString("en-US")}
        </p>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Balance Saat Ini</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            <AnimatedMetric value={currentBalance} prefix="$" />
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono">
            ≈ Rp {(currentBalance * settings.jisdorRate).toLocaleString("id-ID")}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Equity</span>
            <TrendingUp className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            <AnimatedMetric value={currentBalance} prefix="$" />
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Unrealized: $0.00 (posisi tertutup)
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total WD (Aktual)</span>
            <Wallet className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            <AnimatedMetric value={totalWd} prefix="$" />
          </div>
          <div className="mt-1 text-xs text-slate-500">Realisasi dari ledger</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Progress Target</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            <AnimatedMetric value={progressPct} suffix="%" />
          </div>
          <div className="mt-1 text-xs text-slate-500">
            dari ${settings.targetCapitalUsd.toLocaleString("en-US")}
          </div>
        </div>
      </div>

      {/* Pertumbuhan Balance + Ringkasan Mingguan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0E1424] p-5">
          <h2 className="text-base font-semibold text-white">Pertumbuhan Balance</h2>
          <p className="text-xs text-slate-400 mb-4">
            Aktual vs Proyeksi (ilustratif 5%/mgg)
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curveData}>
                <defs>
                  <linearGradient id="dashCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="week" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A0F1D",
                    borderColor: "#334155",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="proyeksi"
                  name="Proyeksi ($)"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#dashCurve)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">
                Ringkasan Mingguan
              </h2>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                Berjalan
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Total Trade</span>
                <span className="font-semibold text-white">{trades.length}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">P&L Realisasi</span>
                <span
                  className={`font-semibold font-mono ${
                    realizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {realizedPnl >= 0 ? "+" : ""}${realizedPnl.toFixed(2)} (Rp{" "}
                  {(realizedPnl * settings.jisdorRate).toLocaleString("id-ID")})
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Deposit</span>
                <span className="font-semibold font-mono text-white">
                  ${settings.initialCapitalUsd.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Withdrawal</span>
                <span className="font-semibold font-mono text-white">
                  ${totalWd.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("journal")}
            className="mt-5 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition"
          >
            Catat Trade di Jurnal &rarr;
          </button>
        </div>
      </div>

      {/* Bottom Row: Konversi USD-IDR & Rencana & Target */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-white">
              Konversi USD - IDR
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              JISDOR BI: 1 USD = Rp {settings.jisdorRate.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Arah konversi</label>
              <select
                value={convDir}
                onChange={(e) => setConvDir(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              >
                <option value="USD_TO_IDR">USD ke IDR</option>
                <option value="IDR_TO_USD">IDR ke USD</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Nominal</label>
              <input
                type="number"
                value={convAmount}
                onChange={(e) => setConvAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Hasil estimasi</label>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-mono font-bold text-emerald-300">
                {convertedText}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5">
          <h2 className="text-base font-semibold text-white mb-4">
            Rencana & Target
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-slate-400">Target Balance Berikutnya</span>
              <div className="mt-1 text-base font-mono font-bold text-emerald-400">
                ${nextMilestone.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500">
                Milestone ${nextMilestone.toLocaleString("en-US")}
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-slate-400">Rencana WD Minggu Ini</span>
              <div className="mt-1 text-base font-mono font-bold text-white">
                ${weeklyWdRecommendation.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-500">
                Rekomendasi profit-only
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-slate-400">Kebutuhan Bulanan</span>
              <div className="mt-1 text-sm font-mono font-bold text-white">
                Rp {monthlyBudgetIdr.toLocaleString("id-ID")}
              </div>
              <span className="text-[11px] text-slate-500">
                Rp {weeklyBudgetIdr.toLocaleString("id-ID")}/minggu
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-slate-400">Sisa Hutang</span>
              <div className="mt-1 text-sm font-mono font-bold text-amber-300">
                Rp {totalDebtIdr.toLocaleString("id-ID")}
              </div>
              <button
                onClick={() => onNavigate("debts")}
                className="text-[11px] text-indigo-400 hover:underline mt-0.5"
              >
                Kelola di menu Hutang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   2. WITHDRAWAL PLAN (WD) VIEW
============================================================================ */
export function WithdrawalPlanView({
  settings,
  realizedPnl,
  withdrawals,
  budgets,
  todayStr,
  onAddWithdrawal,
  onUpdateRules,
}: {
  settings: AppSettings;
  realizedPnl: number;
  withdrawals: WithdrawalRecord[];
  budgets: BudgetItem[];
  todayStr: string;
  onAddWithdrawal: (wd: WithdrawalRecord) => void;
  onUpdateRules: (capRatioPct: number, reserveUsd: number) => void;
}) {
  const [wdAmountInput, setWdAmountInput] = useState("");
  const [editingRules, setEditingRules] = useState(false);
  const [capInput, setCapInput] = useState(String(settings.wdCapRatioPct));
  const [reserveInput, setReserveInput] = useState(String(settings.cashReserveUsd));

  const totalWdUsed = useMemo(
    () => withdrawals.reduce((s, w) => s + w.amountUsd, 0),
    [withdrawals]
  );
  const availableCash = Math.max(
    0,
    settings.initialCapitalUsd + realizedPnl - totalWdUsed
  );
  const highWaterMark = Math.max(
    settings.initialCapitalUsd,
    settings.initialCapitalUsd + realizedPnl
  );
  const eligibleProfit = Math.max(0, realizedPnl - totalWdUsed);
  const capByRatio = eligibleProfit * (settings.wdCapRatioPct / 100);

  const monthlyBudgetIdr = budgets
    .filter((b) => b.active)
    .reduce((s, b) => s + b.amountIdr, 0);
  const weeklyBudgetUsd =
    monthlyBudgetIdr > 0
      ? monthlyBudgetIdr / 4.33 / settings.jisdorRate
      : capByRatio;
  const capAboveReserve = Math.max(0, availableCash - settings.cashReserveUsd);

  const recommendedWd = Math.max(
    0,
    Number(Math.min(capByRatio, weeklyBudgetUsd, capAboveReserve).toFixed(2))
  );

  const handleRequestWd = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(wdAmountInput) || recommendedWd;
    if (amt <= 0 || amt > availableCash) return;
    onAddWithdrawal({
      id: `WD-${Date.now()}`,
      date: todayStr || "2026-11-21",
      amountUsd: amt,
      rateIdr: settings.jisdorRate,
      note: "Penarikan profit mingguan",
    });
    setWdAmountInput("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdrawal Plan (WD)</h1>
        <p className="text-sm text-slate-400 mt-1">
          Rencanakan penarikan laba trading dan catat dana yang diterima dari broker.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-6 space-y-5">
          <div>
            <span className="text-xs text-slate-400">Rekomendasi WD Minggu Ini</span>
            <div className="mt-1 text-3xl font-mono font-bold text-emerald-400">
              ${recommendedWd.toFixed(2)}
            </div>
            <div className="text-xs font-mono text-slate-400">
              ≈ Rp {(recommendedWd * settings.jisdorRate).toLocaleString("id-ID")}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditingRules(!editingRules)}
              className="rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200"
            >
              Edit Aturan
            </button>
          </div>

          {editingRules && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Cap Rasio Profit (%)
                  </label>
                  <input
                    type="number"
                    value={capInput}
                    onChange={(e) => setCapInput(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Reserve Kas Minimal ($)
                  </label>
                  <input
                    type="number"
                    value={reserveInput}
                    onChange={(e) => setReserveInput(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdateRules(Number(capInput) || 50, Number(reserveInput) || 0);
                  setEditingRules(false);
                }}
                className="rounded bg-indigo-600 px-3 py-1.5 font-semibold text-white"
              >
                Terapkan Aturan
              </button>
            </div>
          )}

          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
            <div className="font-semibold text-white mb-2">Dasar Perhitungan</div>
            {[
              { label: "Laba Kumulatif (P&L trading)", val: `$${realizedPnl.toFixed(2)}` },
              { label: "High-Water Mark", val: `$${highWaterMark.toFixed(2)}` },
              { label: "Profit Eligibel", val: `$${eligibleProfit.toFixed(2)}` },
              {
                label: `Cap Rasio (${settings.wdCapRatioPct}%)`,
                val: `$${capByRatio.toFixed(2)}`,
              },
              {
                label: "Cap Kebutuhan Mingguan",
                val: `$${weeklyBudgetUsd.toFixed(2)}`,
              },
              {
                label: "Cap Kas di Atas Reserve",
                val: `$${capAboveReserve.toFixed(2)}`,
              },
              { label: "Jatah WD Terpakai", val: `$${totalWdUsed.toFixed(2)}` },
              { label: "Kas Tersedia", val: `$${availableCash.toFixed(2)}` },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between py-1.5 border-b border-slate-800/60"
              >
                <span className="text-slate-400">{row.label}</span>
                <span className="font-mono font-semibold text-white">{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {recommendedWd > 0 ? (
            <form
              onSubmit={handleRequestWd}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Pengajuan WD Tersedia (Profit-Only Eligible)</span>
              </div>
              <p className="text-xs text-slate-300">
                Anda dapat menarik hingga <strong>${recommendedWd.toFixed(2)}</strong>{" "}
                tanpa mengganggu modal inti dan cadangan kas.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  max={availableCash}
                  placeholder={`Default: ${recommendedWd.toFixed(2)}`}
                  value={wdAmountInput}
                  onChange={(e) => setWdAmountInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white"
                >
                  Ajukan & Catat WD
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Pengajuan WD belum tersedia</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 list-disc pl-4 leading-relaxed">
                {eligibleProfit <= 0 && (
                  <li>
                    Profit eligibel di atas modal awal & WD sebelumnya belum positif.
                  </li>
                )}
                {capAboveReserve <= 0 && (
                  <li>
                    Kas tersedia tidak melebihi batas Reserve Kas ($
                    {settings.cashReserveUsd}).
                  </li>
                )}
                {monthlyBudgetIdr <= 0 && (
                  <li>
                    Anggaran aktif belum memiliki nominal kebutuhan di menu Kebutuhan Bulanan.
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5">
            <h3 className="text-sm font-semibold text-white mb-3">
              Riwayat Penarikan (WD) Aktual
            </h3>
            {withdrawals.length === 0 ? (
              <p className="text-xs text-slate-500">
                Belum ada penarikan dana tercatat.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 p-3"
                  >
                    <div>
                      <div className="font-mono font-semibold text-white">
                        ${w.amountUsd.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-400">{w.date}</div>
                    </div>
                    <div className="text-emerald-400 font-mono font-medium">
                      Rp {(w.amountUsd * w.rateIdr).toLocaleString("id-ID")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. KEUANGAN PRIBADI (Kebutuhan Bulanan, Hutang, Arus Kas)
============================================================================ */
export function PersonalFinanceModule({
  mode,
  budgets,
  debts,
  cashflows,
  todayStr,
  onAddBudget,
  onDeleteBudget,
  onAddDebt,
  onDeleteDebt,
  onAddCashflow,
}: {
  mode: "monthly-needs" | "debts" | "cashflow";
  budgets: BudgetItem[];
  debts: DebtItem[];
  cashflows: CashflowEntry[];
  todayStr: string;
  onAddBudget: (item: BudgetItem) => void;
  onDeleteBudget: (id: string) => void;
  onAddDebt: (item: DebtItem) => void;
  onDeleteDebt: (id: string) => void;
  onAddCashflow: (item: CashflowEntry) => void;
}) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [installment, setInstallment] = useState("");
  const [cfType, setCfType] = useState<"DEPOSIT" | "EXPENSE" | "INCOME">(
    "INCOME"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount) || 0;
    if (!label.trim() || num <= 0) return;

    if (mode === "monthly-needs") {
      onAddBudget({
        id: `BDG-${Date.now()}`,
        category: label.trim(),
        amountIdr: num,
        active: true,
      });
    } else if (mode === "debts") {
      onAddDebt({
        id: `DBT-${Date.now()}`,
        creditor: label.trim(),
        remainingIdr: num,
        monthlyInstallmentIdr: parseFloat(installment) || 0,
      });
    } else {
      onAddCashflow({
        id: `CF-${Date.now()}`,
        date: todayStr || "2026-11-21",
        type: cfType,
        description: label.trim(),
        amountUsd: Number((num / 18269).toFixed(2)),
        amountIdr: num,
      });
    }

    setLabel("");
    setAmount("");
    setInstallment("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {mode === "monthly-needs"
            ? "Kebutuhan Bulanan"
            : mode === "debts"
            ? "Hutang & Kewajiban"
            : "Arus Kas (Ledger)"}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {mode === "monthly-needs"
            ? "Anggaran bulanan yang otomatis menentukan Cap Kebutuhan Mingguan pada Withdrawal Plan."
            : mode === "debts"
            ? "Pantau sisa kewajiban agar target finansial dan psikologi trading tetap terukur."
            : "Rekapitulasi arus masuk dan keluar dana pribadi serta akun trading."}
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 space-y-5">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 text-xs">
          {mode === "cashflow" && (
            <select
              value={cfType}
              onChange={(e) => setCfType(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            >
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
              <option value="DEPOSIT">Deposit Broker</option>
            </select>
          )}
          <input
            type="text"
            placeholder={
              mode === "debts"
                ? "Nama kreditur / cicilan..."
                : "Kategori / keterangan..."
            }
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            required
          />
          <input
            type="number"
            placeholder="Nominal (Rp)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-44 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono"
            required
          />
          {mode === "debts" && (
            <input
              type="number"
              placeholder="Cicilan / bulan (Rp)"
              value={installment}
              onChange={(e) => setInstallment(e.target.value)}
              className="w-44 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono"
            />
          )}
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 font-semibold text-white"
          >
            + Tambah
          </button>
        </form>

        {mode === "monthly-needs" && (
          <div className="divide-y divide-slate-800 text-xs">
            {budgets.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-3">
                <span className="font-medium text-slate-200">{b.category}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-white">
                    Rp {b.amountIdr.toLocaleString("id-ID")}
                  </span>
                  <button
                    onClick={() => onDeleteBudget(b.id)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {mode === "debts" && (
          <div className="divide-y divide-slate-800 text-xs">
            {debts.length === 0 ? (
              <p className="py-4 text-slate-500">
                Tidak ada catatan hutang aktif.
              </p>
            ) : (
              debts.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-slate-200">{d.creditor}</div>
                    <div className="text-[11px] text-slate-500">
                      Cicilan: Rp {d.monthlyInstallmentIdr.toLocaleString("id-ID")}
                      /bln
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-amber-300">
                      Rp {d.remainingIdr.toLocaleString("id-ID")}
                    </span>
                    <button
                      onClick={() => onDeleteDebt(d.id)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {mode === "cashflow" && (
          <div className="divide-y divide-slate-800 text-xs">
            {cashflows.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-semibold text-white">{c.description}</span>
                  <span className="ml-2 font-mono text-[11px] text-slate-500">
                    {c.date}
                  </span>
                </div>
                <span
                  className={`font-mono font-bold ${
                    c.type === "EXPENSE" ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {c.type === "EXPENSE" ? "-" : "+"}Rp{" "}
                  {c.amountIdr.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   4. KALENDER TRADING & AUTO-SYNC LIVE ECONOMIC NEWS TERMINAL
============================================================================ */
export function CalendarModule({
  trades,
  events,
  todayStr,
  isSyncingNews,
  newsFeedStatus,
  onSyncLiveNews,
  onAddEvent,
}: {
  trades: TradeItem[];
  events: EconomicEvent[];
  todayStr: string;
  isSyncingNews: boolean;
  newsFeedStatus: string;
  onSyncLiveNews: () => void;
  onAddEvent: (ev: EconomicEvent) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<number>(21);
  const [currencyFilter, setCurrencyFilter] = useState<string>("ALL");
  const [impactFilter, setImpactFilter] = useState<string>("ALL");

  const [evTitle, setEvTitle] = useState("");
  const [evDate, setEvDate] = useState(todayStr || "2026-11-21");
  const [evTime, setEvTime] = useState("20:30");
  const [evCurrency, setEvCurrency] = useState("USD");
  const [evImpact, setEvImpact] = useState<"High" | "Medium" | "Low">("High");

  const dailyPnlMap = useMemo(() => {
    const map: Record<number, number> = {};
    trades
      .filter((t) => t.status !== "OPEN" && t.date.startsWith("2026-11"))
      .forEach((t) => {
        const d = parseInt(t.date.slice(8, 10), 10);
        if (!Number.isNaN(d)) map[d] = (map[d] || 0) + t.pnl;
      });
    return map;
  }, [trades]);

  const monthTotal = Object.values(dailyPnlMap).reduce((a, b) => a + b, 0);
  const bestDayEntry = Object.entries(dailyPnlMap).sort(
    ([, a], [, b]) => b - a
  )[0];

  const filteredNews = useMemo(() => {
    return events.filter((ev) => {
      if (currencyFilter !== "ALL" && ev.currency !== currencyFilter)
        return false;
      if (impactFilter !== "ALL" && ev.impact !== impactFilter) return false;
      return true;
    });
  }, [events, currencyFilter, impactFilter]);

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim()) return;
    onAddEvent({
      id: `MAN-${Date.now()}`,
      date: evDate,
      time: evTime,
      currency: evCurrency,
      title: evTitle.trim(),
      impact: evImpact,
      forecast: "-",
      previous: "-",
      source: "MANUAL",
    });
    setEvTitle("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Kalender Trading & Rilis Ekonomi
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sinkronisasi otomatis jadwal makroekonomi global (WIB) & heatmap P&L
            harian
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <button
            type="button"
            onClick={onSyncLiveNews}
            disabled={isSyncingNews}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-3.5 py-2 font-semibold text-white transition"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isSyncingNews ? "animate-spin" : ""}`}
            />
            {isSyncingNews ? "Menarik Jadwal..." : "Sync Live News"}
          </button>
          <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono font-semibold text-emerald-300">
            Bulan ini: {monthTotal >= 0 ? "+" : ""}${monthTotal.toFixed(2)}
          </span>
          {bestDayEntry && (
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-slate-300">
              Terbaik: +${bestDayEntry[1].toFixed(2)} (Tgl {bestDayEntry[0]})
            </span>
          )}
        </div>
      </div>

      {/* Institutional Live Economic Feed Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0E1424] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <h2 className="text-sm font-bold text-white">
              Live Economic Calendar Feed (Zona Waktu WIB)
            </h2>
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
              {newsFeedStatus}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white"
            >
              <option value="ALL">Semua Mata Uang</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (Pound)</option>
              <option value="JPY">JPY (Yen)</option>
              <option value="AUD">AUD</option>
              <option value="CAD">CAD</option>
            </select>

            <select
              value={impactFilter}
              onChange={(e) => setImpactFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white"
            >
              <option value="ALL">Semua Dampak</option>
              <option value="High">High Impact</option>
              <option value="Medium">Medium Impact</option>
              <option value="Low">Low Impact</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/95 text-slate-400 uppercase border-b border-slate-800 sticky top-0">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Waktu (WIB)</th>
                <th className="px-4 py-3">CCY</th>
                <th className="px-4 py-3">Dampak</th>
                <th className="px-4 py-3">Indikator Makroekonomi</th>
                <th className="px-4 py-3">Forecast</th>
                <th className="px-4 py-3">Previous</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredNews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada jadwal rilis berita sesuai filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredNews.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                      {ev.date}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-sky-300">
                      {ev.time}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-white">
                      {ev.currency}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          ev.impact === "High"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : ev.impact === "Medium"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {ev.impact}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-white">
                      {ev.title}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-emerald-300">
                      {ev.forecast || "-"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">
                      {ev.previous || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom: Monthly P&L Grid + Tambah Catatan Event Manual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0E1424] p-5">
          <div className="flex items-center justify-between mb-4 text-sm font-semibold text-white">
            <ChevronLeft className="h-4 w-4 text-slate-500" />
            <span>November 2026 — Heatmap P&L Harian</span>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase text-slate-500 mb-2">
            <div>Sen</div>
            <div>Sel</div>
            <div>Rab</div>
            <div>Kam</div>
            <div>Jum</div>
            <div>Sab</div>
            <div>Min</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
              const pnl = dailyPnlMap[day];
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[68px] rounded-lg border p-2 text-left transition ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/15"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                  }`}
                >
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    {day}
                  </span>
                  {pnl !== undefined && (
                    <div
                      className={`mt-1.5 rounded px-1 py-0.5 font-mono text-[10px] font-bold ${
                        pnl >= 0
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <CalendarIcon className="h-4 w-4 text-amber-400" />
            <span>Tambah Catatan Makro Manual</span>
          </div>
          <p className="text-xs text-slate-400">
            Tambahkan jadwal pidato gubernur bank sentral atau catatan khusus ke
            tabel kalender di atas.
          </p>

          <form onSubmit={handleAddManual} className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={evDate}
                onChange={(e) => setEvDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white"
              />
              <input
                type="time"
                value={evTime}
                onChange={(e) => setEvTime(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={evCurrency}
                onChange={(e) => setEvCurrency(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="IDR">IDR</option>
              </select>
              <select
                value={evImpact}
                onChange={(e) => setEvImpact(e.target.value as any)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white"
              >
                <option value="High">High Impact</option>
                <option value="Medium">Medium Impact</option>
                <option value="Low">Low Impact</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Judul agenda ekonomi..."
              value={evTitle}
              onChange={(e) => setEvTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Simpan ke Kalender
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   5. REVIEW PERIODIK, TARGET PROJECT & PENGATURAN
============================================================================ */
export function PeriodicReviewModule({
  snapshots,
  currentBalance,
  initialCapital,
  totalWd,
  todayStr,
  onSaveSnapshot,
}: {
  snapshots: PeriodicReviewSnapshot[];
  currentBalance: number;
  initialCapital: number;
  totalWd: number;
  todayStr: string;
  onSaveSnapshot: (snap: PeriodicReviewSnapshot) => void;
}) {
  const [activeType, setActiveType] = useState<
    "Harian" | "Mingguan" | "Bulanan" | null
  >(null);
  const [disciplineScore, setDisciplineScore] = useState(95);
  const [summaryNotes, setSummaryNotes] = useState("");

  const handleLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeType) return;
    const growth =
      initialCapital > 0
        ? (((currentBalance - initialCapital) / initialCapital) * 100).toFixed(
            2
          )
        : "0.00";

    onSaveSnapshot({
      id: `REV-${Date.now()}`,
      period: todayStr || "2026-11-21",
      type: activeType,
      status: "Terkunci (Immutable)",
      wdActualUsd: totalWd,
      compoundedLabel: `${
        Number(growth) >= 0 ? "+" : ""
      }${growth}% ($${currentBalance.toFixed(2)})`,
      disciplineScore,
      summaryNotes,
    });
    setSummaryNotes("");
    setActiveType(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Laporan & Review Periodik</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review periodik dengan snapshot yang tersimpan permanen
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["Harian", "Mingguan", "Bulanan"] as const).map((type) => (
          <div
            key={type}
            className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-semibold text-white">Review {type}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Audit kepatuhan SOP & emosi
              </div>
            </div>
            <button
              onClick={() => setActiveType(type)}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Buka/lanjutkan
            </button>
          </div>
        ))}
      </div>

      {activeType && (
        <form
          onSubmit={handleLock}
          className="rounded-xl border border-indigo-500/40 bg-[#0E1424] p-5 space-y-4 text-xs"
        >
          <h2 className="text-sm font-bold text-white">
            Kunci Snapshot Review {activeType} ({todayStr})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">
                Skor Disiplin SOP (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={disciplineScore}
                onChange={(e) => setDisciplineScore(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">
                Evaluasi & Perbaikan
              </label>
              <input
                type="text"
                placeholder="Catatan kualitas entry, manajemen risiko, dan psikologi..."
                value={summaryNotes}
                onChange={(e) => setSummaryNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white"
            >
              Simpan & Kunci Immutable
            </button>
            <button
              type="button"
              onClick={() => setActiveType(null)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-slate-800 bg-[#0E1424] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">
            Riwayat Review (snapshot tertutup immutable)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/95 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">WD Aktual</th>
                <th className="px-4 py-3">Compounded</th>
                <th className="px-4 py-3">Discipline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {snapshots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Belum ada review periodik.
                  </td>
                </tr>
              ) : (
                snapshots.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-mono font-medium text-white">
                      {s.period}
                    </td>
                    <td className="px-4 py-3">{s.type}</td>
                    <td className="px-4 py-3 text-emerald-400">{s.status}</td>
                    <td className="px-4 py-3 font-mono">
                      ${s.wdActualUsd.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      {s.compoundedLabel}
                    </td>
                    <td className="px-4 py-3 font-mono text-sky-300">
                      {s.disciplineScore}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function TargetProjectModule({
  currentBalance,
  initialCapital,
  targetBalance,
}: {
  currentBalance: number;
  initialCapital: number;
  targetBalance: number;
}) {
  const milestones = [
    100,
    200,
    500,
    1000,
    2500,
    5000,
    10000,
    25000,
    50000,
    100000,
    500000,
    targetBalance,
  ]
    .filter((v, idx, arr) => v >= initialCapital && arr.indexOf(v) === idx)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Target Project</h1>
        <p className="text-sm text-slate-400 mt-1">
          Pelacakan milestone bertahap menuju ${targetBalance.toLocaleString("en-US")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {milestones.map((m, idx) => {
          const achieved = currentBalance >= m;
          const pct = Math.min(100, Math.max(0, (currentBalance / m) * 100));
          return (
            <div
              key={m}
              className={`rounded-xl border p-5 ${
                achieved
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-slate-800 bg-[#0E1424]"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">
                  Milestone #{idx + 1}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${
                    achieved
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <Target className="h-3 w-3" />
                  {achieved ? "Tercapai" : `${pct.toFixed(1)}%`}
                </span>
              </div>
              <div className="mt-2 text-2xl font-mono font-bold text-white">
                ${m.toLocaleString("en-US")}
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    achieved ? "bg-emerald-400" : "bg-indigo-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SettingsModule({
  settings,
  onSaveSettings,
}: {
  settings: AppSettings;
  onSaveSettings: (next: AppSettings) => void;
}) {
  const [form, setForm] = useState<AppSettings>(settings);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pengaturan</h1>
          <p className="text-sm text-slate-400 mt-1">
            Profil, preferensi tampilan, integrasi, dan konfigurasi project.
          </p>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-semibold text-white"
        >
          Simpan Semua Pengaturan
        </button>
      </div>

      {savedToast && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
          Pengaturan berhasil disimpan ke sistem!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 space-y-3">
          <h2 className="text-base font-semibold text-white">
            Profil & Preferensi
          </h2>
          <div>
            <label className="block text-slate-400 mb-1">Nama</label>
            <input
              type="text"
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={form.userEmail}
              onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">
              Kurs Referensi USD-IDR
            </label>
            <input
              type="number"
              value={form.jisdorRate}
              onChange={(e) =>
                setForm({ ...form, jisdorRate: Number(e.target.value) || 18269 })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 space-y-3">
          <h2 className="text-base font-semibold text-white">
            Project & Telegram
          </h2>
          <div>
            <label className="block text-slate-400 mb-1">Nama Project</label>
            <input
              type="text"
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Modal Awal (USD)</label>
              <input
                type="number"
                value={form.initialCapitalUsd}
                onChange={(e) =>
                  setForm({
                    ...form,
                    initialCapitalUsd: Number(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">
                Target Utama (USD)
              </label>
              <input
                type="number"
                value={form.targetCapitalUsd}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targetCapitalUsd: Number(e.target.value) || 1000000,
                  })
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Chat ID Telegram</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan Chat ID dari bot /id"
                value={form.telegramChatId}
                onChange={(e) =>
                  setForm({ ...form, telegramChatId: e.target.value })
                }
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300">
                <Send className="h-3.5 w-3.5 text-indigo-400" /> Bot Siap
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}