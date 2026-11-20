"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppSidebarLayout, NavSectionId } from "@/components/app-sidebar";
import {
  DashboardOverviewView,
  CompoundingSimulatorView,
  WithdrawalPlanView,
  PersonalFinanceView,
  SettingsAndIntegrationsView,
} from "@/components/horizon-views";
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Target,
  ShieldAlert,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ============================================================================
// KOMPONEN TARGET PROJECT (Milestone Roadmap menuju Target Utama)
// ============================================================================
function TargetProjectView({
  currentBalance,
  initialCapital,
  targetBalance,
}: {
  currentBalance: number;
  initialCapital: number;
  targetBalance: number;
}) {
  const milestones = useMemo(() => {
    const steps = [100, 200, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, targetBalance];
    const uniqueSteps = Array.from(new Set(steps.filter((s) => s > initialCapital))).sort(
      (a, b) => a - b
    );
    return uniqueSteps.map((amount, index) => {
      const achieved = currentBalance >= amount;
      const pct = Math.min(100, Math.max(0, (currentBalance / amount) * 100));
      return {
        level: index + 1,
        amount,
        achieved,
        pct,
      };
    });
  }, [currentBalance, initialCapital, targetBalance]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Target Project</h1>
        <p className="text-sm text-slate-400 mt-1">
          Peta jalan milestone bertahap dari modal awal ${initialCapital.toLocaleString("en-US")} menuju $
          {targetBalance.toLocaleString("en-US")}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {milestones.map((m) => (
          <div
            key={m.amount}
            className={`rounded-xl border p-5 transition ${
              m.achieved
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-slate-800 bg-[#111827]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Milestone #{m.level}
              </span>
              {m.achieved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Tercapai
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
                  <Target className="h-3.5 w-3.5" /> Dalam Proses
                </span>
              )}
            </div>

            <div className="mt-3 text-2xl font-bold text-white">
              ${m.amount.toLocaleString("en-US")}
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  m.achieved ? "bg-emerald-400" : "bg-indigo-500"
                }`}
                style={{ width: `${m.pct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-slate-400">
              <span>Progres: {m.pct.toFixed(1)}%</span>
              <span>
                Sisa: $
                {Math.max(0, m.amount - currentBalance).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN KALENDER TRADING & KALENDER EKONOMI MANUAL (Sesuai Halaman 17 PDF)
// ============================================================================
function TradingCalendarView() {
  const [events, setEvents] = useState([
    { id: 1, date: "2026-11-20", title: "FOMC / High Impact USD News", impact: "High" },
  ]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("2026-11-20");

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    setEvents([
      ...events,
      { id: Date.now(), date: eventDate, title: eventTitle.trim(), impact: "High" },
    ]);
    setEventTitle("");
  };

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Kalender Trading</h1>
          <p className="text-sm text-slate-400 mt-1">
            P&L realisasi harian & kalender berita ekonomi penting (NFP, FOMC, CPI).
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#111827] px-3 py-1.5 text-xs text-slate-200">
          <ChevronLeft className="h-4 w-4 text-slate-400" />
          <span className="font-semibold">November 2026</span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grid Kalender Bulanan */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#111827] p-5">
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase text-slate-500 mb-3">
            <div>Sen</div>
            <div>Sel</div>
            <div>Rab</div>
            <div>Kam</div>
            <div>Jum</div>
            <div>Sab</div>
            <div>Min</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map((day) => {
              const isToday = day === 20;
              return (
                <div
                  key={day}
                  className={`min-h-[72px] rounded-lg border p-2 text-left transition ${
                    isToday
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-slate-800/90 bg-slate-900/60 hover:border-slate-700"
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      isToday ? "text-indigo-300" : "text-slate-400"
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <div className="mt-1.5 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      +$87.27
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Kalender Ekonomi Manual */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <CalendarIcon className="h-4 w-4 text-amber-400" />
            <span>Kalender Ekonomi (Manual)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Catat jadwal berita berdampak tinggi agar terhindar dari volatilitas ekstrem saat eksekusi.
          </p>

          <form onSubmit={handleAddEvent} className="space-y-2.5">
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            />
            <input
              type="text"
              placeholder="Nama rilis berita (mis. NFP, CPI, FOMC)..."
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Event
            </button>
          </form>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{ev.title}</div>
                  <div className="text-[11px] text-slate-500">{ev.date}</div>
                </div>
                <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                  {ev.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN REVIEW PERIODIK (Snapshot Immutable Harian/Mingguan/Bulanan)
// ============================================================================
function PeriodicReviewView({
  currentBalance,
  initialCapital,
}: {
  currentBalance: number;
  initialCapital: number;
}) {
  const [snapshots, setSnapshots] = useState<
    {
      id: number;
      period: string;
      type: string;
      status: string;
      compounded: string;
      discipline: string;
    }[]
  >([]);

  const createSnapshot = (type: "Harian" | "Mingguan" | "Bulanan") => {
    const today = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const growthPct = (((currentBalance - initialCapital) / initialCapital) * 100).toFixed(2);
    setSnapshots([
      {
        id: Date.now(),
        period: today,
        type,
        status: "Terkunci (Immutable)",
        compounded: `${Number(growthPct) >= 0 ? "+" : ""}${growthPct}% ($${currentBalance.toFixed(2)})`,
        discipline: "100% Sesuai SOP",
      },
      ...snapshots,
    ]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Laporan & Review Periodik</h1>
        <p className="text-sm text-slate-400 mt-1">
          Evaluasi disiplin trading periodik dengan riwayat snapshot yang tersimpan permanen.
        </p>
      </div>

      {/* 3 Kartu Trigger Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["Harian", "Mingguan", "Bulanan"] as const).map((periodType) => (
          <div
            key={periodType}
            className="rounded-xl border border-slate-800 bg-[#111827] p-5 flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-semibold text-white">
                Review {periodType}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Simpan evaluasi & skor disiplin
              </div>
            </div>
            <button
              onClick={() => createSnapshot(periodType)}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white transition"
            >
              Buat Snapshot
            </button>
          </div>
        ))}
      </div>

      {/* Tabel Riwayat Review */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">
            Riwayat Review (Snapshot Tertutup Immutable)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Periode</th>
                <th className="px-5 py-3">Jenis</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Compounded</th>
                <th className="px-5 py-3">Discipline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {snapshots.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    Belum ada review periodik. Klik tombol &ldquo;Buat Snapshot&rdquo; di atas untuk mengunci laporan.
                  </td>
                </tr>
              ) : (
                snapshots.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-white">{s.period}</td>
                    <td className="px-5 py-3">{s.type}</td>
                    <td className="px-5 py-3 text-emerald-400">{s.status}</td>
                    <td className="px-5 py-3 font-semibold">{s.compounded}</td>
                    <td className="px-5 py-3 text-indigo-300">{s.discipline}</td>
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

// ============================================================================
// KOMPONEN JURNAL TRADING & FORM + TAMBAH TRADE (Sesuai Halaman 3-5 PDF)
// ============================================================================
interface TradeEntry {
  id: string;
  date: string;
  pair: string;
  direction: "Buy (Long)" | "Sell (Short)";
  lot: number;
  entry: number;
  sl: number;
  tp: number;
  exit: number;
  rMultiple: number;
  pnl: number;
  setup: string;
  notes: string;
}

function TradingJournalAndAnalyticsView({
  mode,
  trades,
  onAddTrade,
}: {
  mode: "journal" | "analytics";
  trades: TradeEntry[];
  onAddTrade: (trade: TradeEntry) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [pair, setPair] = useState("XAUUSD");
  const [direction, setDirection] = useState<"Buy (Long)" | "Sell (Short)">("Buy (Long)");
  const [lot, setLot] = useState("0.10");
  const [entry, setEntry] = useState("2650.00");
  const [sl, setSl] = useState("2645.00");
  const [tp, setTp] = useState("2665.00");
  const [exit, setExit] = useState("2665.00");
  const [pnl, setPnl] = useState("25.00");
  const [setup, setSetup] = useState("ICT Silver Bullet / Engulfing");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState({
    plan: true,
    slSet: true,
    rrMin: true,
    noNews: true,
    calmMind: true,
  });

  const stats = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter((t) => t.pnl > 0).length;
    const losses = trades.filter((t) => t.pnl < 0).length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const totalPnl = trades.reduce((acc, t) => acc + t.pnl, 0);
    const avgR =
      total > 0 ? trades.reduce((acc, t) => acc + t.rMultiple, 0) / total : 0;
    return { total, wins, losses, winRate, totalPnl, avgR };
  }, [trades]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entryNum = parseFloat(entry) || 0;
    const slNum = parseFloat(sl) || 0;
    const exitNum = parseFloat(exit) || 0;
    const riskDist = Math.abs(entryNum - slNum);
    const rewardDist =
      direction === "Buy (Long)" ? exitNum - entryNum : entryNum - exitNum;
    const rMult = riskDist > 0 ? Number((rewardDist / riskDist).toFixed(2)) : 0;

    onAddTrade({
      id: `TRD-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      pair: pair.toUpperCase(),
      direction,
      lot: parseFloat(lot) || 0.01,
      entry: entryNum,
      sl: slNum,
      tp: parseFloat(tp) || 0,
      exit: exitNum,
      rMultiple: rMult,
      pnl: parseFloat(pnl) || 0,
      setup,
      notes,
    });
    setNotes("");
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {mode === "journal" ? "Jurnal Trading" : "Laporan & Analisis"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {mode === "journal"
              ? "Catat, evaluasi, dan tingkatkan performa eksekusi trading Anda."
              : "Evaluasi statistik performa trading dan perkembangan equity project."}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition"
        >
          <Plus className="h-4 w-4" /> Tambah Trade
        </button>
      </div>

      {/* 4 Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <span className="text-xs text-slate-400">Total Trade</span>
          <div className="mt-2 text-2xl font-bold text-white">{stats.total}</div>
          <span className="text-xs text-slate-500">
            {stats.wins}W / {stats.losses}L
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <span className="text-xs text-slate-400">Win Rate</span>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {stats.total > 0 ? `${stats.winRate.toFixed(1)}%` : "N/A"}
          </div>
          <span className="text-xs text-slate-500">Akurasi eksekusi</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <span className="text-xs text-slate-400">Rata-rata R</span>
          <div className="mt-2 text-2xl font-bold text-indigo-400">
            {stats.total > 0 ? `${stats.avgR.toFixed(2)}R` : "N/A"}
          </div>
          <span className="text-xs text-slate-500">Risk-to-Reward realisasi</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <span className="text-xs text-slate-400">Total P/L</span>
          <div
            className={`mt-2 text-2xl font-bold ${
              stats.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
          </div>
          <span className="text-xs text-slate-500">Net realized P&L</span>
        </div>
      </div>

      {/* Sample Warning Banner (Halaman 16 PDF) */}
      {stats.total < 30 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            Peringatan sampel: {stats.total} trade tertutup (&lt;30) — interpretasi metrik statistik dengan hati-hati.
          </span>
        </div>
      )}

      {/* Tabel Ledger Trade */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Pair</th>
                <th className="px-4 py-3">Arah</th>
                <th className="px-4 py-3">Lot</th>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Exit</th>
                <th className="px-4 py-3">R</th>
                <th className="px-4 py-3">P/L</th>
                <th className="px-4 py-3">Setup</th>
                <th className="px-4 py-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                    Belum ada trade. Klik &ldquo;+ Tambah Trade&rdquo; untuk mencatat posisi pertama Anda.
                  </td>
                </tr>
              ) : (
                trades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3 font-bold text-white">{t.pair}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                          t.direction.startsWith("Buy")
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3">{t.lot}</td>
                    <td className="px-4 py-3">{t.entry}</td>
                    <td className="px-4 py-3">{t.exit}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-300">
                      {t.rMultiple}R
                    </td>
                    <td
                      className={`px-4 py-3 font-bold ${
                        t.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{t.setup}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                      {t.notes || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Trade Baru + Checklist Pra-Trade (Sesuai Halaman 4-5 PDF) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0F172A] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Trade Baru</h2>
                <p className="text-xs text-slate-400">
                  Catat posisi lengkap dengan konteks dan psikologi pra-trade
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Instrumen / Pair</label>
                  <input
                    type="text"
                    value={pair}
                    onChange={(e) => setPair(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Arah</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  >
                    <option value="Buy (Long)">Buy (Long)</option>
                    <option value="Sell (Short)">Sell (Short)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Lot</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lot}
                    onChange={(e) => setLot(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Harga Entry</label>
                  <input
                    type="number"
                    step="any"
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Stop Loss Awal</label>
                  <input
                    type="number"
                    step="any"
                    value={sl}
                    onChange={(e) => setSl(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Take Profit Awal</label>
                  <input
                    type="number"
                    step="any"
                    value={tp}
                    onChange={(e) => setTp(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">P/L Realisasi ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={pnl}
                    onChange={(e) => setPnl(e.target.value)}
                    className="w-full rounded-lg border border-emerald-500/50 bg-slate-900 px-3 py-2 font-bold text-emerald-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Strategi / Setup</label>
                  <input
                    type="text"
                    value={setup}
                    onChange={(e) => setSetup(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Alasan Entry & Psikologi</label>
                  <input
                    type="text"
                    placeholder="Konfirmasi struktur market, sweep liquidity..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Checklist Pra-Trade */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
                <div className="font-semibold text-slate-300 mb-1">
                  Checklist Pra-Trade
                </div>
                {[
                  { key: "plan", label: "Sesuai rencana trading (SOP)" },
                  { key: "slSet", label: "Stop Loss sudah ditentukan sebelum entry" },
                  { key: "rrMin", label: "R:R minimal 1:2" },
                  { key: "noNews", label: "Tidak entry tepat saat berita high-impact" },
                  { key: "calmMind", label: "Kondisi psikologi stabil & fokus" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2.5 text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(checklist as any)[item.key]}
                      onChange={(e) =>
                        setChecklist({ ...checklist, [item.key]: e.target.checked })
                      }
                      className="rounded border-slate-600 bg-slate-800 text-indigo-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 font-semibold text-white"
                >
                  Simpan Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE ENTRYPOINT (SILENT ZENITH OS)
// ============================================================================
export default function SilentZenithPage() {
  const [activeTab, setActiveTab] = useState<NavSectionId>("dashboard");
  const [targetBalance, setTargetBalance] = useState<number>(1000000);
  const [initialCapital] = useState<number>(100);
  const [trades, setTrades] = useState<TradeEntry[]>([
    {
      id: "INIT-001",
      date: "2026-11-16",
      pair: "XAUUSD",
      direction: "Buy (Long)",
      lot: 0.1,
      entry: 2612.5,
      sl: 2605.0,
      tp: 2628.0,
      exit: 2628.0,
      rMultiple: 2.07,
      pnl: 87.27,
      setup: "ICT Engulfing + Liquidity Sweep",
      notes: "Eksekusi disiplin sesuai sesi London-NY overlap",
    },
  ]);

  // Sinkronisasi state dengan localStorage agar data tidak hilang saat refresh
  useEffect(() => {
    try {
      const savedTarget = localStorage.getItem("sz_target_balance");
      const savedTrades = localStorage.getItem("sz_trades_ledger");
      if (savedTarget) setTargetBalance(Number(savedTarget));
      if (savedTrades) setTrades(JSON.parse(savedTrades));
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }, []);

  const handleUpdateTarget = (newTarget: number) => {
    setTargetBalance(newTarget);
    try {
      localStorage.setItem("sz_target_balance", String(newTarget));
    } catch {}
  };

  const handleAddTrade = (newTrade: TradeEntry) => {
    const updated = [newTrade, ...trades];
    setTrades(updated);
    try {
      localStorage.setItem("sz_trades_ledger", JSON.stringify(updated));
    } catch {}
  };

  const realizedPnl = useMemo(
    () => trades.reduce((sum, t) => sum + t.pnl, 0),
    [trades]
  );
  const currentBalance = Number((initialCapital + realizedPnl).toFixed(2));

  return (
    <AppSidebarLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      projectName="Silent Zenith"
      currentBalance={currentBalance}
      targetBalance={targetBalance}
      userName="Kohan Aminudin"
      isOwner={true}
    >
      {activeTab === "dashboard" && (
        <DashboardOverviewView
          currentBalance={currentBalance}
          targetBalance={targetBalance}
          initialCapital={initialCapital}
          tradesCount={trades.length}
          weeklyPnl={realizedPnl}
          totalWd={0}
          onNavigate={setActiveTab}
        />
      )}

      {(activeTab === "journal" || activeTab === "analytics") && (
        <TradingJournalAndAnalyticsView
          mode={activeTab}
          trades={trades}
          onAddTrade={handleAddTrade}
        />
      )}

      {activeTab === "compounding" && <CompoundingSimulatorView />}

      {activeTab === "withdrawal" && (
        <WithdrawalPlanView
          cumulativePnl={realizedPnl}
          availableCash={currentBalance}
        />
      )}

      {activeTab === "target-project" && (
        <TargetProjectView
          currentBalance={currentBalance}
          initialCapital={initialCapital}
          targetBalance={targetBalance}
        />
      )}

      {(activeTab === "monthly-needs" ||
        activeTab === "debts" ||
        activeTab === "cashflow") && (
        <PersonalFinanceView mode={activeTab} />
      )}

      {activeTab === "calendar" && <TradingCalendarView />}

      {activeTab === "periodic-review" && (
        <PeriodicReviewView
          currentBalance={currentBalance}
          initialCapital={initialCapital}
        />
      )}

      {activeTab === "settings" && (
        <SettingsAndIntegrationsView
          targetBalance={targetBalance}
          onUpdateTarget={handleUpdateTarget}
        />
      )}
    </AppSidebarLayout>
  );
}