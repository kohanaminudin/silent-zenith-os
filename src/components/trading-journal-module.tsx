"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  ExternalLink,
  Search,
  BarChart3,
  FileSpreadsheet,
  Save,
  Edit3,
  X,
} from "lucide-react";
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
import * as XLSX from "xlsx";
import {
  SopEvaluationSnapshot,
  TradeDirection,
  TradeJournalRecord,
  TradeStatus,
  TransferredTradeDraft,
  UserTradingSettings,
} from "@/types/trading-system";
import { computeTradingAnalytics } from "@/lib/trading-analytics";
import { formatCompactUSD } from "./brand-and-chart";

const TODAY_YMD = new Date().toISOString().split("T")[0];

export function TradingJournalModule({
  trades,
  transferDraft,
  activeSopSnapshot,
  onClearTransferDraft,
  onCreateTrade,
  onUpdateTrade,
  onDeleteTrade,
}: {
  trades: TradeJournalRecord[];
  transferDraft: TransferredTradeDraft | null;
  activeSopSnapshot: SopEvaluationSnapshot | null;
  onClearTransferDraft: () => void;
  onCreateTrade: (trade: Omit<TradeJournalRecord, "id">) => Promise<void>;
  onUpdateTrade: (trade: TradeJournalRecord) => Promise<void>;
  onDeleteTrade: (id: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState<boolean>(Boolean(transferDraft));
  const [editingTrade, setEditingTrade] = useState<TradeJournalRecord | null>(null);

  const [tradeDate, setTradeDate] = useState(TODAY_YMD);
  const [instrument, setInstrument] = useState("XAUUSD");
  const [direction, setDirection] = useState<TradeDirection>("BUY");
  const [entryZoneLow, setEntryZoneLow] = useState<string>("");
  const [entryZoneHigh, setEntryZoneHigh] = useState<string>("");
  const [recommendedEntry, setRecommendedEntry] = useState<string>("");
  const [actualEntry, setActualEntry] = useState<string>("");
  const [stopLoss, setStopLoss] = useState<string>("");
  const [takeProfit, setTakeProfit] = useState<string>("");
  const [exitPrice, setExitPrice] = useState<string>("");
  const [lotSize, setLotSize] = useState<string>("0.01");
  const [riskPct, setRiskPct] = useState<string>("1");
  const [riskAmount, setRiskAmount] = useState<string>("0");
  const [commission, setCommission] = useState<string>("0");
  const [actualPnl, setActualPnl] = useState<string>("");
  const [status, setStatus] = useState<TradeStatus>("OPEN");
  const [setupName, setSetupName] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>("M15");
  const [notes, setNotes] = useState<string>("");
  const [chartUrl, setChartUrl] = useState<string>("");

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (transferDraft) {
      setShowForm(true);
      setEditingTrade(null);
      setInstrument(transferDraft.instrument);
      setDirection(transferDraft.direction);
      setEntryZoneLow(String(transferDraft.entryZoneLow));
      setEntryZoneHigh(String(transferDraft.entryZoneHigh));
      setRecommendedEntry(String(transferDraft.recommendedEntry));
      setActualEntry(String(transferDraft.actualEntry));
      setStopLoss(String(transferDraft.stopLoss));
      setTakeProfit(transferDraft.takeProfit ? String(transferDraft.takeProfit) : "");
      setLotSize(String(transferDraft.lotSize));
      setRiskPct(String(transferDraft.riskPct));
      setRiskAmount(String(transferDraft.riskAmount));
      setCommission(String(transferDraft.commission));
      setStatus("OPEN");
      setActualPnl("");
      setExitPrice("");
    }
  }, [transferDraft]);

  const startEdit = (t: TradeJournalRecord) => {
    setEditingTrade(t);
    setShowForm(true);
    setTradeDate(t.tradeDate);
    setInstrument(t.instrument);
    setDirection(t.direction);
    setEntryZoneLow(t.entryZoneLow ? String(t.entryZoneLow) : "");
    setEntryZoneHigh(t.entryZoneHigh ? String(t.entryZoneHigh) : "");
    setRecommendedEntry(t.recommendedEntry ? String(t.recommendedEntry) : "");
    setActualEntry(String(t.actualEntry));
    setStopLoss(String(t.stopLoss));
    setTakeProfit(t.takeProfit ? String(t.takeProfit) : "");
    setExitPrice(t.exitPrice ? String(t.exitPrice) : "");
    setLotSize(String(t.lotSize));
    setRiskPct(String(t.riskPct));
    setRiskAmount(String(t.riskAmount));
    setCommission(String(t.commission));
    setActualPnl(t.actualPnl !== null && t.actualPnl !== undefined ? String(t.actualPnl) : "");
    setStatus(t.status);
    setSetupName(t.setupName || "");
    setTimeframe(t.timeframe || "");
    setNotes(t.notes || "");
    setChartUrl(t.chartUrl || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPnl = actualPnl.trim() !== "" ? parseFloat(actualPnl) : null;
    const parsedRisk = parseFloat(riskAmount) || 0;
    const computedR =
      parsedPnl !== null && parsedRisk > 0 ? Number((parsedPnl / parsedRisk).toFixed(2)) : null;

    let resolvedStatus: TradeStatus = status;
    if (parsedPnl !== null && status === "OPEN") {
      resolvedStatus = parsedPnl > 0 ? "WIN" : parsedPnl < 0 ? "LOSS" : "BE";
    }

    const snap = transferDraft?.sopSnapshot || activeSopSnapshot;

    const payload: Omit<TradeJournalRecord, "id"> = {
      tradeDate,
      instrument: instrument.toUpperCase(),
      direction,
      entryZoneLow: entryZoneLow ? parseFloat(entryZoneLow) : null,
      entryZoneHigh: entryZoneHigh ? parseFloat(entryZoneHigh) : null,
      recommendedEntry: recommendedEntry ? parseFloat(recommendedEntry) : null,
      actualEntry: parseFloat(actualEntry) || 0,
      stopLoss: parseFloat(stopLoss) || 0,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      exitPrice: exitPrice ? parseFloat(exitPrice) : null,
      lotSize: parseFloat(lotSize) || 0.01,
      riskPct: parseFloat(riskPct) || 0,
      riskAmount: parsedRisk,
      commission: parseFloat(commission) || 0,
      actualPnl: parsedPnl,
      rMultiple: computedR,
      status: resolvedStatus,
      setupName,
      timeframe,
      notes,
      chartUrl,
      sopTemplateName: editingTrade
        ? editingTrade.sopTemplateName
        : snap?.templateName || "Tanpa SOP",
      sopCompletionPct: editingTrade
        ? editingTrade.sopCompletionPct
        : snap?.completionPct ?? 0,
      sopOverridden: editingTrade
        ? editingTrade.sopOverridden
        : snap?.overridden ?? false,
      sopSnapshot: editingTrade ? editingTrade.sopSnapshot : snap?.items || [],
    };

    if (editingTrade) {
      await onUpdateTrade({ ...payload, id: editingTrade.id });
    } else {
      await onCreateTrade(payload);
    }

    setShowForm(false);
    setEditingTrade(null);
    onClearTransferDraft();
  };

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
      if (
        searchQuery.trim() &&
        !t.instrument.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.setupName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [trades, filterStatus, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white">Jurnal Trading & Log Eksekusi</h1>
          <p className="text-xs text-slate-400 mt-1">
            Catat setiap posisi beserta snapshot checklist SOP, rasio risiko, dan evaluasi hasil nyata.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTrade(null);
            setShowForm((prev) => !prev);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Tutup Form Trade" : "Tambah Trade Baru"}
        </button>
      </div>

      {/* Form Tambah / Edit Trade */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl bg-[#111827] border border-violet-500/40 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                {editingTrade
                  ? `Edit Posisi #${editingTrade.instrument} (${editingTrade.tradeDate})`
                  : transferDraft
                  ? "Draft Trade dari Lot Recommendation (Terhubung)"
                  : "Catat Posisi Trading Baru"}
              </h2>
              <p className="text-xs text-violet-300 mt-0.5">
                SOP Terlampir:{" "}
                {editingTrade
                  ? `${editingTrade.sopTemplateName} (${editingTrade.sopCompletionPct}%)`
                  : transferDraft?.sopSnapshot
                  ? `${transferDraft.sopSnapshot.templateName} (${transferDraft.sopSnapshot.completionPct}%)`
                  : activeSopSnapshot
                  ? `${activeSopSnapshot.templateName} (${activeSopSnapshot.completionPct}%)`
                  : "Belum ada snapshot SOP (isi di menu Checklist Analisis)"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTrade(null);
                onClearTransferDraft();
              }}
              className="p-2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tanggal Trade</label>
              <input
                type="date"
                required
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Instrumen / Pair</label>
              <input
                type="text"
                required
                value={instrument}
                onChange={(e) => setInstrument(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Arah</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as TradeDirection)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="BUY">BUY (Long)</option>
                <option value="SELL">SELL (Short)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Status Posisi</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TradeStatus)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="OPEN">OPEN (Berjalan)</option>
                <option value="WIN">WIN (Profit)</option>
                <option value="LOSS">LOSS (Rugi)</option>
                <option value="BE">BE (Break Even)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Harga Entry Aktual</label>
              <input
                type="number"
                step="any"
                required
                value={actualEntry}
                onChange={(e) => setActualEntry(e.target.value)}
                className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Stop Loss</label>
              <input
                type="number"
                step="any"
                required
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Take Profit</label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Harga Exit Aktual</label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Lot Size</label>
              <input
                type="number"
                step="any"
                required
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Risiko (%)</label>
              <input
                type="number"
                step="any"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Risiko Nominal ($)</label>
              <input
                type="number"
                step="any"
                value={riskAmount}
                onChange={(e) => setRiskAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-emerald-400 mb-1">
                Actual Net P/L ($)
              </label>
              <input
                type="number"
                step="any"
                placeholder="Kosongkan jika masih OPEN"
                value={actualPnl}
                onChange={(e) => setActualPnl(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold tabular-nums rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Setup / Strategi</label>
              <input
                type="text"
                placeholder="Contoh: ICT London Sweep"
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Timeframe</label>
              <input
                type="text"
                placeholder="M15 / H1"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Link Screenshot Chart (TradingView / Gambar)
              </label>
              <input
                type="url"
                placeholder="https://www.tradingview.com/x/..."
                value={chartUrl}
                onChange={(e) => setChartUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Catatan Evaluasi Trade</label>
              <input
                type="text"
                placeholder="Alasan entry, emosi, dan pelajaran dari posisi ini..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {editingTrade ? "Simpan Perubahan Trade" : "Simpan ke Jurnal Trading"}
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari pair atau nama setup..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#111827] border border-slate-800 text-white"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {["ALL", "OPEN", "WIN", "LOSS", "BE"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                filterStatus === st
                  ? "bg-violet-600 text-white"
                  : "bg-[#111827] text-slate-400 border border-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Trade Table */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Pair</th>
                <th className="py-3 px-4">Arah</th>
                <th className="py-3 px-4">Lot</th>
                <th className="py-3 px-4">Entry / SL / Exit</th>
                <th className="py-3 px-4">SOP Snapshot</th>
                <th className="py-3 px-4">P/L & R</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 tabular-nums">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    Belum ada transaksi tercatat. Gunakan tombol "Tambah Trade Baru" atau transfer dari Kalkulator Lot.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-300">{t.tradeDate}</td>
                    <td className="py-3 px-4 font-bold text-white">
                      {t.instrument}
                      {t.setupName && (
                        <span className="block text-[10px] font-normal text-slate-400">
                          {t.setupName}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          t.direction === "BUY"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-rose-500/15 text-rose-400"
                        }`}
                      >
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">{t.lotSize.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>E: {t.actualEntry}</div>
                      <div className="text-[10px] text-slate-500">
                        SL: {t.stopLoss} {t.exitPrice ? `• Ex: ${t.exitPrice}` : ""}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1 text-violet-300 font-medium">
                        {t.sopOverridden ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{t.sopCompletionPct}%</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                        {t.sopTemplateName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {t.actualPnl !== null && t.actualPnl !== undefined ? (
                        <div>
                          <span
                            className={`font-bold ${
                              t.actualPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {t.actualPnl >= 0
                              ? `+${formatCompactUSD(t.actualPnl)}`
                              : formatCompactUSD(t.actualPnl)}
                          </span>
                          {t.rMultiple !== null && t.rMultiple !== undefined && (
                            <span className="block text-[10px] text-slate-400">
                              {t.rMultiple >= 0 ? `+${t.rMultiple}R` : `${t.rMultiple}R`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === "WIN"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : t.status === "LOSS"
                            ? "bg-rose-500/15 text-rose-400"
                            : t.status === "BE"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-sky-500/15 text-sky-400"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {t.chartUrl && (
                        <a
                          href={t.chartUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex p-1.5 text-slate-400 hover:text-sky-400"
                          title="Lihat Chart"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 cursor-pointer"
                        title="Edit / Tutup Posisi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTrade(t.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

export function PerformanceAnalyticsModule({
  trades,
  startingCapital,
  mode,
}: {
  trades: TradeJournalRecord[];
  startingCapital: number;
  mode: "statistics" | "reports";
}) {
  const stats = useMemo(
    () => computeTradingAnalytics(trades, startingCapital),
    [trades, startingCapital]
  );

  const exportReportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = trades.map((t) => ({
      Tanggal: t.tradeDate,
      Instrumen: t.instrument,
      Arah: t.direction,
      Lot: t.lotSize,
      Entry: t.actualEntry,
      SL: t.stopLoss,
      Exit: t.exitPrice ?? "",
      "Risiko ($)": t.riskAmount,
      "Net P/L ($)": t.actualPnl ?? "",
      "R-Multiple": t.rMultiple ?? "",
      Status: t.status,
      "SOP Template": t.sopTemplateName,
      "SOP Score (%)": t.sopCompletionPct,
      Setup: t.setupName,
      Catatan: t.notes,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Trade History");
    XLSX.writeFile(wb, `SilentZenith_Performance_Report_${TODAY_YMD}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            {mode === "statistics" ? (
              <BarChart3 className="w-5 h-5 text-violet-400" />
            ) : (
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            )}
            {mode === "statistics"
              ? "Trading Statistics & Setup Breakdown"
              : "Performance Reports & Audit Ekspor"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Seluruh metrik dihitung 100% dari transaksi aktual yang tersimpan di jurnal Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={exportReportExcel}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
        >
          Unduh Laporan Excel (.xlsx)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <p className="text-xs text-slate-400">Total Net P/L</p>
          <p
            className={`text-2xl font-bold mt-2 ${
              stats.totalNetPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {stats.totalNetPnl >= 0
              ? `+${formatCompactUSD(stats.totalNetPnl)}`
              : formatCompactUSD(stats.totalNetPnl)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.closedTradesCount} Trade Selesai • {stats.openTradesCount} Open
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <p className="text-xs text-slate-400">Win Rate</p>
          <p className="text-2xl font-bold text-white mt-2">
            {stats.closedTradesCount > 0 ? `${stats.winRatePct.toFixed(1)}%` : "N/A"}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.wins}W / {stats.losses}L / {stats.breakevens}BE
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <p className="text-xs text-slate-400">Profit Factor</p>
          <p className="text-2xl font-bold text-sky-400 mt-2">
            {stats.profitFactor === null
              ? "N/A"
              : stats.profitFactor === Infinity
              ? "∞"
              : stats.profitFactor.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Expectancy: {formatCompactUSD(stats.expectancyPerTrade)} / trade
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800">
          <p className="text-xs text-slate-400">Kepatuhan SOP Rata-rata</p>
          <p className="text-2xl font-bold text-violet-400 mt-2">
            {stats.totalTrades > 0 ? `${stats.sopComplianceRatePct.toFixed(1)}%` : "N/A"}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Rata-rata Risiko: {stats.averageRiskPct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Charts */}
      {stats.equitySeries.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#111827] border border-slate-800 text-center text-xs text-slate-400">
          Belum cukup data trade yang ditutup (WIN/LOSS/BE) untuk menampilkan grafik kurva ekuitas.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white">Kurva Pertumbuhan Ekuitas</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.equitySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.18}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white">P/L Realisasi Harian ($)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyPnlSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="pnl" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Setup Breakdown Table */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Performa Berdasarkan Setup</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="py-3 px-4">Nama Setup</th>
                <th className="py-3 px-4">Jumlah Trade</th>
                <th className="py-3 px-4">Win Rate</th>
                <th className="py-3 px-4">Net P/L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 tabular-nums">
              {stats.setupBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    Belum ada data setup yang selesai dievaluasi.
                  </td>
                </tr>
              ) : (
                stats.setupBreakdown.map((s) => (
                  <tr key={s.setup}>
                    <td className="py-3 px-4 font-semibold text-white">{s.setup}</td>
                    <td className="py-3 px-4">{s.trades}</td>
                    <td className="py-3 px-4">{s.winRate.toFixed(1)}%</td>
                    <td
                      className={`py-3 px-4 font-bold ${
                        s.netPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {s.netPnl >= 0
                        ? `+${formatCompactUSD(s.netPnl)}`
                        : formatCompactUSD(s.netPnl)}
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

export function RiskSettingsModule({
  settings,
  onSaveSettings,
}: {
  settings: UserTradingSettings;
  onSaveSettings: (next: UserTradingSettings) => Promise<void>;
}) {
  const [form, setForm] = useState<UserTradingSettings>(settings);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSaveSettings(form);
    setSaving(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl p-6 rounded-2xl bg-[#111827] border border-slate-800 space-y-5"
    >
      <div>
        <h1 className="text-lg font-bold text-white">Risk Management & Broker Defaults</h1>
        <p className="text-xs text-slate-400 mt-1">
          Parameter default ini otomatis dimuat ke kalkulator lot dan batas disiplin risiko harian Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Default Risk / Trade (%)</label>
          <input
            type="number"
            step="0.1"
            value={form.defaultRiskPct}
            onChange={(e) => setForm({ ...form, defaultRiskPct: parseFloat(e.target.value) || 1 })}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Max Daily Loss Limit (%)</label>
          <input
            type="number"
            step="0.5"
            value={form.maxDailyLossPct}
            onChange={(e) => setForm({ ...form, maxDailyLossPct: parseFloat(e.target.value) || 3 })}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Minimal Target R:R</label>
          <input
            type="number"
            step="0.5"
            value={form.minRrRatio}
            onChange={(e) => setForm({ ...form, minRrRatio: parseFloat(e.target.value) || 2 })}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Default Minimum Lot</label>
          <input
            type="number"
            step="any"
            value={form.minLot}
            onChange={(e) => setForm({ ...form, minLot: parseFloat(e.target.value) || 0.01 })}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Default Lot Step</label>
          <input
            type="number"
            step="any"
            value={form.lotStep}
            onChange={(e) => setForm({ ...form, lotStep: parseFloat(e.target.value) || 0.01 })}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Komisi Default / Lot ($)</label>
          <input
            type="number"
            step="any"
            value={form.commissionPerLot}
            onChange={(e) =>
              setForm({ ...form, commissionPerLot: parseFloat(e.target.value) || 0 })
            }
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
      >
        {saving ? "Menyimpan..." : "Simpan Pengaturan Risk"}
      </button>
    </form>
  );
}