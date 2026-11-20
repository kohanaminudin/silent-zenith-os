"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Play,
  Send,
  Upload,
} from "lucide-react";

/* ============================================================================
   1. DASHBOARD OVERVIEW VIEW (Sesuai Halaman 1-2 PDF)
============================================================================ */
export function DashboardOverviewView({
  currentBalance,
  targetBalance,
  initialCapital,
  tradesCount,
  weeklyPnl,
  totalWd,
  onNavigate,
}: {
  currentBalance: number;
  targetBalance: number;
  initialCapital: number;
  tradesCount: number;
  weeklyPnl: number;
  totalWd: number;
  onNavigate: (tab: any) => void;
}) {
  const [usdInput, setUsdInput] = useState<string>("100");
  const [direction, setDirection] = useState<"USD_TO_IDR" | "IDR_TO_USD">(
    "USD_TO_IDR"
  );
  const jisdorRate = 18269; // Referensi kurs JISDOR

  const convertedValue = useMemo(() => {
    const val = parseFloat(usdInput) || 0;
    if (direction === "USD_TO_IDR") {
      return `Rp ${(val * jisdorRate).toLocaleString("id-ID", {
        maximumFractionDigits: 0,
      })}`;
    }
    return `$ ${(val / jisdorRate).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [usdInput, direction]);

  const progressPct =
    targetBalance > 0 ? (currentBalance / targetBalance) * 100 : 0;
  const nextMilestone =
    currentBalance < 200
      ? 200
      : currentBalance < 500
      ? 500
      : currentBalance < 1000
      ? 1000
      : Math.ceil((currentBalance * 1.5) / 500) * 500;

  const projectionData = useMemo(() => {
    const base = currentBalance > 0 ? currentBalance : Math.max(initialCapital, 50);
    return Array.from({ length: 12 }, (_, idx) => {
      const week = idx + 1;
      const projected = Number((base * Math.pow(1.05, week)).toFixed(2));
      return {
        label: `Mgg ${week}`,
        proyeksi: projected,
        aktual: idx === 0 ? currentBalance : null,
      };
    });
  }, [currentBalance, initialCapital]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Ringkasan proyek trading, performa, dan rencana menuju $
          {targetBalance.toLocaleString("en-US")}
        </p>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Balance Saat Ini</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            ${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            ≈ Rp {(currentBalance * jisdorRate).toLocaleString("id-ID")}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Equity</span>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            ${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Unrealized: $0.00 (posisi tertutup)
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total WD (Aktual)</span>
            <Wallet className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            ${totalWd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Realisasi dari ledger
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Progress Target</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {progressPct.toFixed(2)}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            dari ${targetBalance.toLocaleString("en-US")}
          </div>
        </div>
      </div>

      {/* Main Chart + Weekly Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Pertumbuhan Balance
              </h2>
              <p className="text-xs text-slate-400">
                Aktual vs Proyeksi (ilustratif 5%/mgg)
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="emeraldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
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
                  dataKey="proyeksi"
                  name="Proyeksi ($)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill="url(#emeraldFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ringkasan Mingguan */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">
                Ringkasan Mingguan
              </h2>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                Berjalan
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Total Trade</span>
                <span className="font-semibold text-white">{tradesCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">P&L Realisasi</span>
                <span
                  className={`font-semibold ${
                    weeklyPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {weeklyPnl >= 0 ? "+" : ""}${weeklyPnl.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Modal Awal</span>
                <span className="font-semibold text-white">
                  ${initialCapital.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Withdrawal</span>
                <span className="font-semibold text-white">
                  ${totalWd.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("journal")}
            className="mt-5 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition"
          >
            Buka Jurnal Trading &rarr;
          </button>
        </div>
      </div>

      {/* Bottom Row: Konversi USD-IDR & Rencana Target */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Konversi USD-IDR */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">
              Konversi USD - IDR
            </h2>
            <span className="text-[11px] text-slate-400">
              JISDOR BI: 1 USD = Rp {jisdorRate.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Arah Konversi
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
              >
                <option value="USD_TO_IDR">USD ke IDR</option>
                <option value="IDR_TO_USD">IDR ke USD</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Nominal
              </label>
              <input
                type="number"
                value={usdInput}
                onChange={(e) => setUsdInput(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Hasil Estimasi
              </label>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300">
                {convertedValue}
              </div>
            </div>
          </div>
        </div>

        {/* Rencana & Target */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="text-base font-semibold text-white mb-4">
            Rencana & Target
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-[11px] text-slate-400">
                Target Balance Berikutnya
              </span>
              <div className="mt-1 text-lg font-bold text-emerald-400">
                ${nextMilestone.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500">
                Milestone ${nextMilestone}
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-[11px] text-slate-400">
                Rencana WD Minggu Ini
              </span>
              <div className="mt-1 text-lg font-bold text-white">$0.00</div>
              <span className="text-[11px] text-slate-500">
                Rekomendasi profit-only
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   2. COMPOUNDING & MONTE CARLO SIMULATOR VIEW (Halaman 6-13 PDF)
============================================================================ */
export function CompoundingSimulatorView() {
  const [startCapital, setStartCapital] = useState(100);
  const [targetCapital, setTargetCapital] = useState(1000000);
  const [returnPerCycle, setReturnPerCycle] = useState(10);
  const [wdCapPct, setWdCapPct] = useState(0);

  const schedule = useMemo(() => {
    const rows: {
      cycle: number;
      start: number;
      gross: number;
      wd: number;
      end: number;
    }[] = [];
    let bal = Math.max(startCapital, 1);
    const rate = Math.max(returnPerCycle, 0.5) / 100;
    const wdRatio = Math.min(Math.max(wdCapPct, 0), 90) / 100;

    for (let i = 1; i <= 250; i++) {
      const gross = bal * rate;
      const wd = gross * wdRatio;
      const end = bal + gross - wd;
      rows.push({
        cycle: i,
        start: Number(bal.toFixed(2)),
        gross: Number(gross.toFixed(2)),
        wd: Number(wd.toFixed(2)),
        end: Number(end.toFixed(2)),
      });
      bal = end;
      if (bal >= targetCapital) break;
    }
    return rows;
  }, [startCapital, targetCapital, returnPerCycle, wdCapPct]);

  const lastRow = schedule[schedule.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Compounding Plan</h1>
        <p className="text-sm text-slate-400 mt-1">
          Atur parameter lalu simulasikan target — proyeksi deterministik &
          evaluasi pertumbuhan siklus.
        </p>
      </div>

      {/* Parameter Form */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Target (USD)
            </label>
            <input
              type="number"
              value={targetCapital}
              onChange={(e) => setTargetCapital(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Modal Awal (USD)
            </label>
            <input
              type="number"
              value={startCapital}
              onChange={(e) => setStartCapital(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Return / Siklus (%)
            </label>
            <input
              type="number"
              value={returnPerCycle}
              onChange={(e) => setReturnPerCycle(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Cap WD (% dari profit)
            </label>
            <input
              type="number"
              value={wdCapPct}
              onChange={(e) => setWdCapPct(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* Summary + Growth Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <h2 className="text-base font-semibold text-white">
            Estimasi Pencapaian
          </h2>
          <div>
            <span className="text-xs text-slate-400">Jumlah Siklus</span>
            <div className="text-2xl font-bold text-emerald-400">
              {schedule.length}x Siklus
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400">
              Balance Akhir (Estimasi)
            </span>
            <div className="text-xl font-bold text-white">
              ${lastRow?.end.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Proyeksi deterministik dari parameter Anda. Performa aktual
            bergantung pada hasil trading nyata di jurnal.
          </p>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="text-base font-semibold text-white mb-3">
            Kurva Pertumbuhan (Proyeksi)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={schedule}>
                <defs>
                  <linearGradient id="compCurve" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="end"
                  name="Saldo Akhir ($)"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#compCurve)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table Rincian Siklus */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase border-b border-slate-800 sticky top-0">
              <tr>
                <th className="px-4 py-3">Siklus</th>
                <th className="px-4 py-3">Saldo Awal</th>
                <th className="px-4 py-3">Return</th>
                <th className="px-4 py-3">L/R Bersih</th>
                <th className="px-4 py-3">Withdrawal</th>
                <th className="px-4 py-3">Saldo Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-200">
              {schedule.slice(0, 50).map((row) => (
                <tr key={row.cycle} className="hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-medium">Siklus #{row.cycle}</td>
                  <td className="px-4 py-2.5">${row.start.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-emerald-400">
                    {returnPerCycle.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 text-emerald-400">
                    +${row.gross.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-amber-300">
                    ${row.wd.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-white">
                    ${row.end.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. WITHDRAWAL PLAN (WD) VIEW (Halaman 14 PDF)
============================================================================ */
export function WithdrawalPlanView({
  cumulativePnl,
  availableCash,
}: {
  cumulativePnl: number;
  availableCash: number;
}) {
  const eligibleProfit = Math.max(0, cumulativePnl);
  const recommendedWd = eligibleProfit * 0.5;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdrawal Plan (WD)</h1>
        <p className="text-sm text-slate-400 mt-1">
          Rencanakan penarikan laba trading dan catat dana yang diterima dari
          broker.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
          <div className="text-xs font-medium text-slate-400">
            Rekomendasi WD Minggu Ini
          </div>
          <div className="text-3xl font-bold text-emerald-400">
            ${recommendedWd.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400">
            ≈ Rp {(recommendedWd * 18269).toLocaleString("id-ID")}
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Laba Kumulatif (P&L)</span>
              <span className="font-semibold text-white">
                ${cumulativePnl.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cap Rasio (50%)</span>
              <span className="font-semibold text-white">
                ${recommendedWd.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Kas Tersedia</span>
              <span className="font-semibold text-white">
                ${availableCash.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Aturan Disiplin Penarikan (Profit-Only)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300 list-disc pl-4 leading-relaxed">
            <li>
              Laba kumulatif harus positif di atas High-Water Mark sebelum WD
              diajukan.
            </li>
            <li>
              Maksimal penarikan adalah 50% dari profit bersih mingguan agar
              compounding tetap berjalan.
            </li>
            <li>
              Pastikan Buffer Aman / Reserve Kas tetap terjaga untuk menahan
              potensi drawdown beruntun.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   4. KEUANGAN PRIBADI & MODUL PENDUKUNG (Kebutuhan, Hutang, Arus Kas, Kalender, Settings)
============================================================================ */
export function PersonalFinanceView({
  mode,
}: {
  mode: "monthly-needs" | "debts" | "cashflow";
}) {
  const [items, setItems] = useState([
    { id: 1, title: "Operasional & Internet Trading", amount: 500000 },
    { id: 2, title: "Dana Darurat Keluarga", amount: 1500000 },
  ]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const titles = {
    "monthly-needs": {
      h1: "Kebutuhan Bulanan",
      sub: "Kelola anggaran bulanan sebagai acuan target minimal penarikan profit.",
    },
    debts: {
      h1: "Manajemen Hutang & Cicilan",
      sub: "Catat kewajiban finansial agar psikologi trading tetap terukur.",
    },
    cashflow: {
      h1: "Arus Kas (Ledger)",
      sub: "Pencatatan deposit, withdrawal broker, dan arus dana pribadi.",
    },
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    setItems([
      ...items,
      { id: Date.now(), title, amount: parseFloat(amount) || 0 },
    ]);
    setTitle("");
    setAmount("");
  };

  const totalIdr = items.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{titles[mode].h1}</h1>
        <p className="text-sm text-slate-400 mt-1">{titles[mode].sub}</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
        <div className="text-xs text-slate-400">Total Tercatat</div>
        <div className="text-2xl font-bold text-emerald-400 mt-1">
          Rp {totalIdr.toLocaleString("id-ID")}
        </div>

        <form onSubmit={addItem} className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Keterangan pos..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
          />
          <input
            type="number"
            placeholder="Nominal (IDR)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full sm:w-48 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white"
          >
            + Tambah
          </button>
        </form>

        <div className="mt-5 divide-y divide-slate-800">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span className="text-slate-200">{item.title}</span>
              <span className="font-semibold text-white">
                Rp {item.amount.toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsAndIntegrationsView({
  targetBalance,
  onUpdateTarget,
}: {
  targetBalance: number;
  onUpdateTarget: (newTarget: number) => void;
}) {
  const [targetInput, setTargetInput] = useState(String(targetBalance));
  const [chatId, setChatId] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTarget(Number(targetInput) || 1000000);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pengaturan</h1>
        <p className="text-sm text-slate-400 mt-1">
          Profil, preferensi tampilan, integrasi MT5, notifikasi Telegram, dan
          konfigurasi project.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Konfigurasi Project */}
        <form
          onSubmit={handleSave}
          className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4"
        >
          <h2 className="text-base font-semibold text-white">
            Konfigurasi Project
          </h2>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Nama Project
            </label>
            <input
              type="text"
              defaultValue="Silent Zenith"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Target Utama (USD)
            </label>
            <input
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white"
          >
            Simpan Project
          </button>
          {savedNotice && (
            <span className="ml-3 text-xs text-emerald-400 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Tersimpan
            </span>
          )}
        </form>

        {/* Integrasi MT5 & Telegram */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <h2 className="text-base font-semibold text-white">
            Sinkronisasi MT5 & Notifikasi Telegram
          </h2>
          <div className="rounded-lg border border-dashed border-slate-700 p-4 text-center">
            <Upload className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs text-slate-300">
              Unggah Trade History MT5 (.xlsx / .csv)
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Otomatis melewati entri duplikat
            </p>
          </div>

          <div className="pt-2">
            <label className="block text-xs text-slate-400 mb-1">
              Chat ID Telegram
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: 123456789"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white"
              >
                <Send className="h-3.5 w-3.5" /> Hubungkan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}