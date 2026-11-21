"use client";

import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Plus,
  Upload,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  X,
  Calculator,
} from "lucide-react";
import {
  TradeChecklist,
  TradeDirection,
  TradeItem,
  TradeStatus,
  TradingSession,
} from "@/types/horizon";
import { AnimatedMetric } from "@/components/motion-primitives";

export function JournalAndAnalyticsModule({
  mode,
  trades,
  currentBalance,
  todayStr,
  onAddTrade,
  onImportTrades,
  onDeleteTrade,
}: {
  mode: "journal" | "analytics";
  trades: TradeItem[];
  currentBalance: number;
  todayStr: string;
  onAddTrade: (trade: TradeItem) => void;
  onImportTrades: (incoming: TradeItem[]) => number;
  onDeleteTrade: (id: string) => void;
}) {
  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [setupFilter, setSetupFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [analyticsDays, setAnalyticsDays] = useState<number>(30);

  // ICT Position Size Calculator toggle
  const [showRiskCalc, setShowRiskCalc] = useState(false);
  const [calcRiskPct, setCalcRiskPct] = useState("2");
  const [calcSlPips, setCalcSlPips] = useState("15");
  const [calcPipValue, setCalcPipValue] = useState("10");

  // Modal Form Trade Baru
  const [showNewModal, setShowNewModal] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form fields
  const [account, setAccount] = useState("Akun Utama (USD)");
  const [pair, setPair] = useState("XAUUSD");
  const [direction, setDirection] = useState<TradeDirection>("Buy (Long)");
  const [entry, setEntry] = useState("2650.00");
  const [sl, setSl] = useState("2645.00");
  const [tp, setTp] = useState("2665.00");
  const [exit, setExit] = useState("2665.00");
  const [lot, setLot] = useState("0.10");
  const [commission, setCommission] = useState("0");
  const [pnl, setPnl] = useState("50.00");
  const [tradeStatus, setTradeStatus] = useState<TradeStatus>("WIN");
  const [session, setSession] = useState<TradingSession>("London-NY Overlap");
  const [timeframe, setTimeframe] = useState("M15/H1");
  const [setup, setSetup] = useState("ICT Liquidity Sweep + Engulfing");
  const [ticket, setTicket] = useState("");
  const [marketContext, setMarketContext] = useState("");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<TradeChecklist>({
    plan: true,
    slSet: true,
    rrMin: true,
    noNews: true,
    calmMind: true,
  });

  const riskCalcOutput = useMemo(() => {
    const riskPct = Math.max(0.1, parseFloat(calcRiskPct) || 1);
    const slPips = Math.max(0.5, parseFloat(calcSlPips) || 10);
    const pipVal = Math.max(0.1, parseFloat(calcPipValue) || 10);
    const riskUsd = currentBalance * (riskPct / 100);
    const recommendedLot = Math.max(0.01, riskUsd / (slPips * pipVal));
    return {
      riskUsd,
      recommendedLot: Number(recommendedLot.toFixed(2)),
      target2R: riskUsd * 2,
      target3R: riskUsd * 3,
    };
  }, [currentBalance, calcRiskPct, calcSlPips, calcPipValue]);

  const uniqueSetups = useMemo(
    () => Array.from(new Set(trades.map((t) => t.setup).filter(Boolean))),
    [trades]
  );

  const filteredTrades = useMemo(() => {
    return trades
      .filter((t) => {
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
        if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
        if (setupFilter !== "ALL" && t.setup !== setupFilter) return false;
        return true;
      })
      .sort((a, b) =>
        sortOrder === "NEWEST"
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date)
      );
  }, [trades, startDate, endDate, statusFilter, setupFilter, sortOrder]);

  // Institutional Quant Metrics
  const metrics = useMemo(() => {
    const closed = filteredTrades.filter((t) => t.status !== "OPEN");
    const wins = closed.filter((t) => t.pnl > 0);
    const losses = closed.filter((t) => t.pnl < 0);
    const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const avgR =
      closed.length > 0
        ? closed.reduce((s, t) => s + t.rMultiple, 0) / closed.length
        : 0;
    const profitFactor =
      grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : "∞";
    const expectancy = closed.length > 0 ? totalPnl / closed.length : 0;

    // Sharpe & Sortino approximations
    const returns = closed.map((t) => t.pnl);
    const mean =
      returns.length > 0
        ? returns.reduce((a, b) => a + b, 0) / returns.length
        : 0;
    const variance =
      returns.length > 1
        ? returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) /
          (returns.length - 1)
        : 0;
    const stdDev = Math.sqrt(variance);
    const sharpe = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0;

    const downsideSq =
      returns.length > 1
        ? returns
            .filter((r) => r < 0)
            .reduce((acc, r) => acc + Math.pow(r, 2), 0) / returns.length
        : 0;
    const downsideDev = Math.sqrt(downsideSq);
    const sortino = downsideDev > 0 ? (mean / downsideDev) * Math.sqrt(252) : 0;

    return {
      totalClosed: closed.length,
      winsCount: wins.length,
      lossesCount: losses.length,
      winRate,
      avgR,
      totalPnl,
      profitFactor,
      expectancy,
      sharpe,
      sortino,
    };
  }, [filteredTrades]);

  const dailyBarData = useMemo(() => {
    const grouped: Record<string, number> = {};
    trades
      .filter((t) => t.status !== "OPEN")
      .forEach((t) => {
        grouped[t.date] = (grouped[t.date] || 0) + t.pnl;
      });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-analyticsDays)
      .map(([date, val]) => ({
        date: date.slice(5),
        pnl: Number(val.toFixed(2)),
      }));
  }, [trades, analyticsDays]);

  const sessionAlphaData = useMemo(() => {
    const sessions: TradingSession[] = [
      "Asia",
      "London",
      "New York",
      "London-NY Overlap",
    ];
    return sessions.map((sess) => {
      const items = trades.filter(
        (t) => t.status !== "OPEN" && t.session === sess
      );
      const net = items.reduce((s, t) => s + t.pnl, 0);
      return {
        session: sess === "London-NY Overlap" ? "LDN-NY" : sess,
        pnl: Number(net.toFixed(2)),
        count: items.length,
      };
    });
  }, [trades]);

  const handleSaveNewTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const entryNum = parseFloat(entry) || 0;
    const slNum = parseFloat(sl) || 0;
    const exitNum = exit ? parseFloat(exit) : null;
    const pnlNum = parseFloat(pnl) || 0;
    const commNum = parseFloat(commission) || 0;

    const riskDist = Math.abs(entryNum - slNum);
    const rewardDist =
      exitNum !== null
        ? direction === "Buy (Long)"
          ? exitNum - entryNum
          : entryNum - exitNum
        : 0;
    const rMult = riskDist > 0 ? Number((rewardDist / riskDist).toFixed(2)) : 0;

    onAddTrade({
      id: `TRD-${Date.now()}`,
      ticket: ticket.trim() || undefined,
      date: todayStr || "2026-11-21",
      account,
      pair: pair.toUpperCase(),
      direction,
      lot: parseFloat(lot) || 0.01,
      entry: entryNum,
      sl: slNum,
      tp: parseFloat(tp) || 0,
      exit: exitNum,
      commission: commNum,
      rMultiple: rMult,
      pnl: Number((pnlNum - commNum).toFixed(2)),
      status: tradeStatus,
      session,
      timeframe,
      setup,
      marketContext,
      notes,
      checklist,
    });

    setMarketContext("");
    setNotes("");
    setShowNewModal(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

        const parsed: TradeItem[] = rows
          .map((row, idx) => {
            const symbol = String(
              row.Symbol || row.Pair || row.Item || row.Instrumen || "XAUUSD"
            ).toUpperCase();
            const typeRaw = String(row.Type || row.Arah || "buy").toLowerCase();
            const profitVal = Number(row.Profit ?? row["P/L"] ?? row.PnL ?? 0);
            const lotVal = Number(row.Volume ?? row.Lot ?? 0.01);
            const openPrice = Number(row.Price ?? row.Entry ?? 0);
            const closePrice = Number(
              row["Close Price"] ?? row.Exit ?? openPrice
            );
            const ticketId = String(
              row.Ticket ?? row.Position ?? `IMP-${idx}-${file.name}`
            );

            return {
              id: `MT5-${ticketId}`,
              ticket: ticketId,
              date: String(
                row.Time || row.Date || todayStr || "2026-11-21"
              ).slice(0, 10),
              account: "Akun MT5 Import",
              pair: symbol,
              direction: (typeRaw.includes("sell")
                ? "Sell (Short)"
                : "Buy (Long)") as TradeDirection,
              lot: lotVal || 0.01,
              entry: openPrice,
              sl: Number(row["S / L"] ?? row.SL ?? 0),
              tp: Number(row["T / P"] ?? row.TP ?? 0),
              exit: closePrice,
              commission: Number(row.Commission ?? 0),
              rMultiple: profitVal > 0 ? 1.5 : profitVal < 0 ? -1 : 0,
              pnl: profitVal,
              status: (profitVal > 0
                ? "WIN"
                : profitVal < 0
                ? "LOSS"
                : "BE") as TradeStatus,
              session: "London-NY Overlap" as TradingSession,
              timeframe: "M15",
              setup: "MT5 Imported Trade",
              marketContext: "Diimpor dari MT5 Report",
              notes: `Ticket #${ticketId}`,
              checklist: {
                plan: true,
                slSet: true,
                rrMin: true,
                noNews: true,
                calmMind: true,
              },
            };
          })
          .filter((item) => !Number.isNaN(item.pnl));

        const addedCount = onImportTrades(parsed);
        setImportFeedback(
          `${addedCount} posisi baru berhasil diimpor (duplikat dilewati).`
        );
        setTimeout(() => setImportFeedback(null), 4000);
      } catch {
        setImportFeedback(
          "Gagal membaca file. Pastikan format .xlsx atau .csv valid."
        );
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {mode === "journal" ? "Jurnal Trading" : "Laporan & Analisis Kuantitatif"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {mode === "journal"
              ? "Eksekusi, audit risiko pra-trade, dan evaluasi alpha per sesi"
              : "Rasio institusional (Sharpe, Sortino, Profit Factor) & distribusi P&L"}
          </p>
        </div>

        {mode === "journal" ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowRiskCalc(!showRiskCalc)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
                showRiskCalc
                  ? "border-sky-500/50 bg-sky-500/15 text-sky-300"
                  : "border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
              }`}
            >
              <Calculator className="h-3.5 w-3.5" /> Kalkulator Lot ICT
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition"
            >
              <Upload className="h-3.5 w-3.5" /> Impor MT5
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
            >
              <Plus className="h-4 w-4" /> Tambah Trade
            </button>
          </div>
        ) : (
          <select
            value={analyticsDays}
            onChange={(e) => setAnalyticsDays(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
          >
            <option value={7}>7 hari terakhir</option>
            <option value={30}>30 hari terakhir</option>
            <option value={90}>90 hari terakhir</option>
            <option value={365}>Semua waktu</option>
          </select>
        )}
      </div>

      {/* Collapsible ICT Institutional Position Size Calculator */}
      <AnimatePresence>
        {showRiskCalc && mode === "journal" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-sky-500/30 bg-[#0E1628] p-5 text-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-sky-300 uppercase">
                  ICT / Institutional Position Size Guard (Balance: $
                  {currentBalance.toFixed(2)})
                </span>
                <button
                  onClick={() => {
                    setLot(String(riskCalcOutput.recommendedLot));
                    setShowNewModal(true);
                  }}
                  className="rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-1 font-semibold text-white"
                >
                  Pakai {riskCalcOutput.recommendedLot} Lot ke Trade Baru &rarr;
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Risiko (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calcRiskPct}
                    onChange={(e) => setCalcRiskPct(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Stop Loss (Pip)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calcSlPips}
                    onChange={(e) => setCalcSlPips(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Pip Value ($/Lot)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcPipValue}
                    onChange={(e) => setCalcPipValue(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                  <span className="text-[10px] text-emerald-300 block">
                    Lot Ideal
                  </span>
                  <span className="text-base font-mono font-bold text-white">
                    {riskCalcOutput.recommendedLot} Lot
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5">
                  <span className="text-[10px] text-slate-400 block">
                    Maks. Risiko ($)
                  </span>
                  <span className="text-base font-mono font-bold text-rose-400">
                    -${riskCalcOutput.riskUsd.toFixed(2)}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5">
                  <span className="text-[10px] text-slate-400 block">
                    Proyeksi 1:2 / 1:3
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    +${riskCalcOutput.target2R.toFixed(0)} / +$
                    {riskCalcOutput.target3R.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {importFeedback && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{importFeedback}</span>
        </div>
      )}

      {/* Filter Bar */}
      {mode === "journal" && (
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-4 space-y-3 text-xs">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Tanggal mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Tanggal akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setStatusFilter("ALL");
                setSetupFilter("ALL");
              }}
              className="rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-slate-300"
            >
              Hapus filter
            </button>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="WIN">WIN</option>
              <option value="LOSS">LOSS</option>
              <option value="BE">Break Even</option>
              <option value="OPEN">OPEN</option>
            </select>

            <select
              value={setupFilter}
              onChange={(e) => setSetupFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white"
            >
              <option value="ALL">Semua Setup</option>
              {uniqueSetups.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white"
            >
              <option value="NEWEST">Terbaru dulu</option>
              <option value="OLDEST">Terlama dulu</option>
            </select>
          </div>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5">
          <span className="text-xs text-slate-400">Total P/L</span>
          <div
            className={`mt-2 text-2xl font-bold ${
              metrics.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            <AnimatedMetric
              value={metrics.totalPnl}
              prefix={metrics.totalPnl >= 0 ? "+$" : "$"}
            />
          </div>
          <span className="text-xs text-slate-500">
            {metrics.totalClosed} trade tertutup
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5">
          <span className="text-xs text-slate-400">Win Rate</span>
          <div className="mt-2 text-2xl font-bold text-white">
            {metrics.totalClosed > 0 ? (
              <AnimatedMetric value={metrics.winRate} suffix="%" decimals={1} />
            ) : (
              "N/A"
            )}
          </div>
          <span className="text-xs text-slate-500">
            {metrics.winsCount}W / {metrics.lossesCount}L
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5">
          <span className="text-xs text-slate-400">
            {mode === "journal" ? "Rata-rata R" : "Profit Factor / Sharpe"}
          </span>
          <div className="mt-2 text-2xl font-bold text-sky-400 font-mono">
            {mode === "journal"
              ? metrics.totalClosed > 0
                ? `${metrics.avgR.toFixed(2)}R`
                : "N/A"
              : `${metrics.profitFactor} / ${metrics.sharpe.toFixed(2)}`}
          </div>
          <span className="text-xs text-slate-500">
            {mode === "journal"
              ? "Realized R-Multiple"
              : `Sortino: ${metrics.sortino.toFixed(2)}`}
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5">
          <span className="text-xs text-slate-400">Expectancy / Trade</span>
          <div
            className={`mt-2 text-2xl font-bold ${
              metrics.expectancy >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            <AnimatedMetric
              value={metrics.expectancy}
              prefix={metrics.expectancy >= 0 ? "+$" : "$"}
            />
          </div>
          <span className="text-xs text-slate-500">Rata-rata net per posisi</span>
        </div>
      </div>

      {/* Peringatan Sampel (<30 trade) */}
      {metrics.totalClosed < 30 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            Peringatan sampel: {metrics.totalClosed} trade tertutup (&lt;30) —
            interpretasi metrik dengan hati-hati.
          </span>
        </div>
      )}

      {/* Dual Chart (Mode Laporan & Analisis) */}
      {mode === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0E1424] p-5">
            <h2 className="text-base font-semibold text-white mb-4">
              P/L Harian ({analyticsDays} hari terakhir)
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0F1D",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="pnl" name="P/L Harian ($)" radius={[4, 4, 0, 0]}>
                    {dailyBarData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.pnl >= 0 ? "#10B981" : "#F43F5E"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5">
            <h2 className="text-base font-semibold text-white mb-1">
              Session Alpha Attribution
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Net P&L berdasarkan sesi likuiditas global
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionAlphaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="session" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0F1D",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="pnl" name="Session P&L ($)" radius={[4, 4, 0, 0]}>
                    {sessionAlphaData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.pnl >= 0 ? "#38BDF8" : "#F43F5E"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tabel Ledger Trade */}
      <div className="rounded-xl border border-slate-800 bg-[#0E1424] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/95 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Pair</th>
                <th className="px-4 py-3">Sesi</th>
                <th className="px-4 py-3">Arah</th>
                <th className="px-4 py-3">Lot</th>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Exit</th>
                <th className="px-4 py-3">R</th>
                <th className="px-4 py-3">P/L</th>
                <th className="px-4 py-3">Setup</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                    Belum ada trade. Klik &ldquo;+ Tambah Trade&rdquo; untuk
                    mencatat posisi pertama Anda.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 whitespace-nowrap font-mono">
                      {t.date}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">{t.pair}</td>
                    <td className="px-4 py-3 text-slate-400">{t.session}</td>
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
                    <td className="px-4 py-3 font-mono">{t.lot}</td>
                    <td className="px-4 py-3 font-mono">{t.entry}</td>
                    <td className="px-4 py-3 font-mono">{t.exit ?? "-"}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-sky-300">
                      {t.rMultiple}R
                    </td>
                    <td
                      className={`px-4 py-3 font-mono font-bold ${
                        t.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{t.setup}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onDeleteTrade(t.id)}
                        className="rounded p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                        title="Hapus trade"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Trade Baru */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0A0F1D] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Trade Baru</h2>
                  <p className="text-xs text-slate-400">
                    Catat posisi lengkap dengan konteks dan psikologi pra-trade
                  </p>
                </div>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveNewTrade} className="mt-5 space-y-5 text-xs">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Detail Posisi
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Akun</label>
                      <input
                        type="text"
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Instrumen</label>
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
                      <label className="block text-slate-400 mb-1">Lot</label>
                      <input
                        type="number"
                        step="0.01"
                        value={lot}
                        onChange={(e) => setLot(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Harga Exit</label>
                      <input
                        type="number"
                        step="any"
                        value={exit}
                        onChange={(e) => setExit(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Komisi (USD)</label>
                      <input
                        type="number"
                        step="any"
                        value={commission}
                        onChange={(e) => setCommission(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Sesi</label>
                      <select
                        value={session}
                        onChange={(e) => setSession(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      >
                        <option value="Asia">Asia</option>
                        <option value="London">London</option>
                        <option value="New York">New York</option>
                        <option value="London-NY Overlap">London-NY Overlap</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Timeframe</label>
                      <input
                        type="text"
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Ticket (ops.)</label>
                      <input
                        type="text"
                        placeholder="100123"
                        value={ticket}
                        onChange={(e) => setTicket(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">Strategi / Setup</label>
                      <input
                        type="text"
                        value={setup}
                        onChange={(e) => setSetup(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">P/L Kotor (USD)</label>
                      <input
                        type="number"
                        step="any"
                        value={pnl}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPnl(e.target.value);
                          setTradeStatus(
                            val > 0 ? "WIN" : val < 0 ? "LOSS" : "BE"
                          );
                        }}
                        className="w-full rounded-lg border border-emerald-500/50 bg-slate-900 px-3 py-2 font-bold text-emerald-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Konteks Market</label>
                    <textarea
                      rows={2}
                      placeholder="Kondisi harga, news, struktur chart..."
                      value={marketContext}
                      onChange={(e) => setMarketContext(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Alasan Entry</label>
                    <textarea
                      rows={2}
                      placeholder="Kenapa posisi ini diambil?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
                  <div className="font-semibold text-slate-300 mb-1">
                    Checklist Pra-Trade
                  </div>
                  {[
                    { key: "plan", label: "Sesuai rencana trading" },
                    { key: "slSet", label: "SL sudah ditentukan" },
                    { key: "rrMin", label: "R:R minimal 1:2" },
                    { key: "noNews", label: "Tidak trading berita penting" },
                    { key: "calmMind", label: "Kondisi psikologi stabil" },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 text-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(checklist as any)[item.key]}
                        onChange={(e) =>
                          setChecklist({
                            ...checklist,
                            [item.key]: e.target.checked,
                          })
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
                    onClick={() => setShowNewModal(false)}
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}