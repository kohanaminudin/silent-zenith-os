"use client";

import React, { useMemo, useState } from "react";
import {
  Calculator,
  AlertTriangle,
  ArrowRight,
  Info,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  PositionSizingInput,
  SopEvaluationSnapshot,
  TradeDirection,
  TransferredTradeDraft,
  UserTradingSettings,
} from "@/types/trading-system";
import { calculatePositionSizing } from "@/lib/position-sizing";
import { formatCompactUSD } from "./brand-and-chart";

export function LotRecommendationModule({
  currentEquity,
  settings,
  sopSnapshot,
  onTransferToJournal,
}: {
  currentEquity: number;
  settings: UserTradingSettings;
  sopSnapshot: SopEvaluationSnapshot | null;
  onTransferToJournal: (draft: TransferredTradeDraft) => void;
}) {
  const [instrument, setInstrument] = useState("XAUUSD");
  const [equity, setEquity] = useState<string>(String(Number(currentEquity.toFixed(2))));
  const [currency, setCurrency] = useState(settings.accountCurrency || "USD");
  const [direction, setDirection] = useState<TradeDirection>("BUY");
  const [referencePrice, setReferencePrice] = useState<string>("2650.00");
  const [zoneUpper, setZoneUpper] = useState<string>("2652.00");
  const [zoneLower, setZoneLower] = useState<string>("2644.00");
  const [entryLevelPct, setEntryLevelPct] = useState<string>("75");
  const [useCustomEntry, setUseCustomEntry] = useState<boolean>(false);
  const [customEntryPrice, setCustomEntryPrice] = useState<string>("2646.00");
  const [stopLossPrice, setStopLossPrice] = useState<string>("2641.00");
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>("2662.00");
  const [riskPct, setRiskPct] = useState<string>(String(settings.defaultRiskPct || 1));

  // Spesifikasi instrumen & broker eksplisit (tidak mengarang nilai tersembunyi)
  const [contractSize, setContractSize] = useState<string>("100");
  const [pipSize, setPipSize] = useState<string>("0.1");
  const [pipValuePerLot, setPipValuePerLot] = useState<string>("10");
  const [minLot, setMinLot] = useState<string>(String(settings.minLot || 0.01));
  const [lotStep, setLotStep] = useState<string>(String(settings.lotStep || 0.01));
  const [commissionPerLot, setCommissionPerLot] = useState<string>(
    String(settings.commissionPerLot || 0)
  );
  const [leverage, setLeverage] = useState<string>(String(settings.leverage || 100));

  const applyPresetSpecs = (preset: "FX_MAJOR" | "XAUUSD" | "BTCUSD") => {
    if (preset === "FX_MAJOR") {
      setInstrument("EURUSD");
      setContractSize("100000");
      setPipSize("0.0001");
      setPipValuePerLot("10");
    } else if (preset === "XAUUSD") {
      setInstrument("XAUUSD");
      setContractSize("100");
      setPipSize("0.1");
      setPipValuePerLot("10");
    } else {
      setInstrument("BTCUSD");
      setContractSize("1");
      setPipSize("1");
      setPipValuePerLot("1");
    }
  };

  const parsedInput: PositionSizingInput = useMemo(
    () => ({
      instrument,
      accountEquity: parseFloat(equity) || 0,
      accountCurrency: currency || "USD",
      direction,
      referencePrice: parseFloat(referencePrice) || 0,
      zoneUpper: parseFloat(zoneUpper) || 0,
      zoneLower: parseFloat(zoneLower) || 0,
      entryLevelPct: parseFloat(entryLevelPct) || 75,
      useCustomEntry,
      customEntryPrice: parseFloat(customEntryPrice) || 0,
      stopLossPrice: parseFloat(stopLossPrice) || 0,
      takeProfitPrice: parseFloat(takeProfitPrice) || undefined,
      riskPct: parseFloat(riskPct) || 0,
      contractSize: parseFloat(contractSize) || 0,
      pipSize: parseFloat(pipSize) || 0,
      pipValuePerLot: parseFloat(pipValuePerLot) || 0,
      minLot: parseFloat(minLot) || 0,
      lotStep: parseFloat(lotStep) || 0,
      commissionPerLot: parseFloat(commissionPerLot) || 0,
      leverage: parseFloat(leverage) || 0,
    }),
    [
      instrument,
      equity,
      currency,
      direction,
      referencePrice,
      zoneUpper,
      zoneLower,
      entryLevelPct,
      useCustomEntry,
      customEntryPrice,
      stopLossPrice,
      takeProfitPrice,
      riskPct,
      contractSize,
      pipSize,
      pipValuePerLot,
      minLot,
      lotStep,
      commissionPerLot,
      leverage,
    ]
  );

  const result = useMemo(() => calculatePositionSizing(parsedInput), [parsedInput]);

  // Visualisasi diagram vertikal level harga
  const priceDiagramLevels = useMemo(() => {
    const candidates = [
      { label: "Take Profit (TP)", price: parsedInput.takeProfitPrice || 0, color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
      { label: "Batas Atas Zona", price: result.entryZoneHigh, color: "text-violet-300 border-violet-500/30 bg-violet-500/10" },
      { label: `Entry (${parsedInput.entryLevelPct}% Zona)`, price: result.recommendedEntry, color: "text-sky-300 border-sky-500/50 bg-sky-500/15 font-bold" },
      { label: "Batas Bawah Zona", price: result.entryZoneLow, color: "text-violet-300 border-violet-500/30 bg-violet-500/10" },
      { label: "Stop Loss (SL)", price: result.stopLossPrice, color: "text-rose-400 border-rose-500/40 bg-rose-500/10" },
    ].filter((c) => c.price > 0);

    return candidates.sort((a, b) => b.price - a.price);
  }, [parsedInput.takeProfitPrice, parsedInput.entryLevelPct, result]);

  const handleTransfer = () => {
    if (!result.isValid) return;
    onTransferToJournal({
      instrument: parsedInput.instrument.toUpperCase(),
      direction: parsedInput.direction,
      entryZoneLow: result.entryZoneLow,
      entryZoneHigh: result.entryZoneHigh,
      recommendedEntry: Number(result.recommendedEntry.toFixed(5)),
      actualEntry: Number(result.recommendedEntry.toFixed(5)),
      stopLoss: Number(result.stopLossPrice.toFixed(5)),
      takeProfit: parsedInput.takeProfitPrice
        ? Number(parsedInput.takeProfitPrice.toFixed(5))
        : undefined,
      lotSize: result.recommendedLot,
      riskPct: Number(result.actualRiskPct.toFixed(2)),
      riskAmount: Number(result.estimatedLossAtSl.toFixed(2)),
      commission: Number((result.recommendedLot * parsedInput.commissionPerLot).toFixed(2)),
      sopSnapshot: sopSnapshot || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            Position Sizing & 75% Entry Zone Calculator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Alat bantu kalkulasi ukuran lot, zona retracement 75%, dan invalidasi Stop Loss berbasis spesifikasi akun Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400">Isi Cepat Spesifikasi:</span>
          <button
            type="button"
            onClick={() => applyPresetSpecs("XAUUSD")}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 hover:border-emerald-500/50 cursor-pointer"
          >
            XAUUSD (Gold)
          </button>
          <button
            type="button"
            onClick={() => applyPresetSpecs("FX_MAJOR")}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 hover:border-emerald-500/50 cursor-pointer"
          >
            Forex Major
          </button>
          <button
            type="button"
            onClick={() => applyPresetSpecs("BTCUSD")}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 hover:border-emerald-500/50 cursor-pointer"
          >
            Crypto / CFD
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Manual Inputs */}
        <div className="lg:col-span-7 space-y-5">
          {/* A. Akun & Arah Posisi */}
          <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
            <h2 className="text-sm font-semibold text-white">1. Parameter Akun & Arah Trade</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Instrumen / Pair</label>
                <input
                  type="text"
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value.toUpperCase())}
                  placeholder="XAUUSD / EURUSD"
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Ekuitas Akun ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={equity}
                  onChange={(e) => setEquity(e.target.value)}
                  className="w-full px-3 py-2 text-sm tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Risiko per Trade (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={riskPct}
                  onChange={(e) => setRiskPct(e.target.value)}
                  className="w-full px-3 py-2 text-sm tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDirection("BUY")}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 border cursor-pointer transition-colors ${
                  direction === "BUY"
                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/50"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                <TrendingUp className="w-4 h-4" /> BUY (LONG)
              </button>
              <button
                type="button"
                onClick={() => setDirection("SELL")}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 border cursor-pointer transition-colors ${
                  direction === "SELL"
                    ? "bg-rose-600/20 text-rose-400 border-rose-500/50"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                <TrendingDown className="w-4 h-4" /> SELL (SHORT)
              </button>
            </div>
          </div>

          {/* B. Zona Entry 75% & Level SL/TP */}
          <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                2. Kalkulasi Zona Entry ({entryLevelPct}%) & Stop Loss
              </h2>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomEntry}
                  onChange={(e) => setUseCustomEntry(e.target.checked)}
                  className="accent-violet-500"
                />
                <span>Gunakan Harga Entry Manual</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Upper Boundary</label>
                <input
                  type="number"
                  step="any"
                  value={zoneUpper}
                  onChange={(e) => setZoneUpper(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Lower Boundary</label>
                <input
                  type="number"
                  step="any"
                  value={zoneLower}
                  onChange={(e) => setZoneLower(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Kedalaman Zona (%)</label>
                <input
                  type="number"
                  step="1"
                  value={entryLevelPct}
                  onChange={(e) => setEntryLevelPct(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Harga Referensi Saat Ini</label>
                <input
                  type="number"
                  step="any"
                  value={referencePrice}
                  onChange={(e) => setReferencePrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/25 text-[11px] text-violet-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <span>{result.entryFormulaExplanation}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {useCustomEntry ? "Harga Entry Manual" : `Entry Terhitung (${entryLevelPct}%)`}
                </label>
                <input
                  type="number"
                  step="any"
                  disabled={!useCustomEntry}
                  value={useCustomEntry ? customEntryPrice : result.recommendedEntry.toFixed(5)}
                  onChange={(e) => setCustomEntryPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold tabular-nums rounded-xl bg-slate-950 border border-sky-500/40 text-sky-300 disabled:opacity-80"
                />
              </div>
              <div>
                <label className="block text-xs text-rose-400 mb-1">Stop Loss (Wajib)</label>
                <input
                  type="number"
                  step="any"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold tabular-nums rounded-xl bg-slate-950 border border-rose-500/40 text-rose-300"
                />
              </div>
              <div>
                <label className="block text-xs text-emerald-400 mb-1">
                  Take Profit (Opsional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold tabular-nums rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300"
                />
              </div>
            </div>
          </div>

          {/* C. Spesifikasi Kontrak & Broker */}
          <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
            <h2 className="text-sm font-semibold text-white">
              3. Spesifikasi Instrumen & Broker (Wajib Akurat)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Contract Size</label>
                <input
                  type="number"
                  step="any"
                  value={contractSize}
                  onChange={(e) => setContractSize(e.target.value)}
                  className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Pip / Tick Size</label>
                <input
                  type="number"
                  step="any"
                  value={pipSize}
                  onChange={(e) => setPipSize(e.target.value)}
                  className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Pip Value / Lot ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  value={pipValuePerLot}
                  onChange={(e) => setPipValuePerLot(e.target.value)}
                  className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Minimum Lot</label>
                <input
                  type="number"
                  step="any"
                  value={minLot}
                  onChange={(e) => setMinLot(e.target.value)}
                  className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Lot Step</label>
                <input
                  type="number"
                  step="any"
                  value={lotStep}
                  onChange={(e) => setLotStep(e.target.value)}
                  className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Komisi / Lot ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  value={commissionPerLot}
                  onChange={(e) => setCommissionPerLot(e.target.value)}
                  className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Akun Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Leverage (1:X)</label>
                <input
                  type="number"
                  step="1"
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  className="w-full px-3 py-2 text-xs tabular-nums rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Result Summary & Visual Price-Level Diagram */}
        <div className="lg:col-span-5 space-y-5">
          {!result.isValid && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4" /> Input Belum Valid
              </div>
              <ul className="list-disc list-inside text-xs text-rose-300 space-y-1">
                {result.validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Result Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#151F34] to-[#111827] border border-slate-700/80 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs text-slate-400">Rekomendasi Ukuran Lot</p>
                <p className="text-3xl font-extrabold text-emerald-400 tabular-nums mt-1">
                  {result.recommendedLot.toFixed(2)}{" "}
                  <span className="text-sm font-semibold text-slate-400">Lot</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Maksimal Risiko SL</p>
                <p className="text-xl font-bold text-rose-400 tabular-nums mt-1">
                  -{formatCompactUSD(result.estimatedLossAtSl)}
                </p>
                <p className="text-[11px] text-slate-400">
                  ({result.actualRiskPct.toFixed(2)}% dari ekuitas)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block">Recommended Entry</span>
                <span className="text-sm font-bold text-sky-300 mt-0.5 block">
                  {result.recommendedEntry.toFixed(5)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block">Stop Loss</span>
                <span className="text-sm font-bold text-rose-400 mt-0.5 block">
                  {result.stopLossPrice.toFixed(5)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block">Jarak SL</span>
                <span className="text-sm font-semibold text-white mt-0.5 block">
                  {result.slDistancePips.toFixed(1)} Pips ({result.slDistancePrice.toFixed(4)})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block">Risk : Reward (R:R)</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                  {result.riskRewardRatio ? `1 : ${result.riskRewardRatio.toFixed(2)}` : "TP Kosong"}
                </span>
              </div>
              {result.estimatedMargin !== undefined && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 block">Estimasi Margin</span>
                  <span className="text-sm font-semibold text-slate-200 mt-0.5 block">
                    {formatCompactUSD(result.estimatedMargin)}
                  </span>
                </div>
              )}
              {result.potentialProfitAtTp !== undefined && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 block">Potensi Profit di TP</span>
                  <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                    +{formatCompactUSD(result.potentialProfitAtTp)}
                  </span>
                </div>
              )}
            </div>

            {/* Visual Price-Level Diagram */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300">
                Diagram Level Harga ({parsedInput.direction})
              </p>
              <div className="space-y-1.5 tabular-nums">
                {priceDiagramLevels.map((lvl, index) => (
                  <div
                    key={index}
                    className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${lvl.color}`}
                  >
                    <span>{lvl.label}</span>
                    <span>{lvl.price.toFixed(5)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SOP Snapshot Indicator */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                Snapshot SOP Terlampir:
              </span>
              <span className="font-semibold text-violet-300">
                {sopSnapshot
                  ? `${sopSnapshot.templateName} (${sopSnapshot.completionPct}%)`
                  : "Belum dipilih"}
              </span>
            </div>

            <button
              type="button"
              disabled={!result.isValid}
              onClick={handleTransfer}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>Transfer ke Jurnal Trading</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] text-slate-500 text-center">
              Disclaimer: Hasil di atas adalah kalkulasi matematis manajemen risiko berdasarkan input manual Anda, bukan sinyal atau saran finansial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}