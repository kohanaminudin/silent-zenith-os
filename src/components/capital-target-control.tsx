"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Target,
  Wallet,
  PlusCircle,
  SlidersHorizontal,
  TrendingUp,
  X,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { AppSettings } from "@/types/horizon";

export function CapitalTargetBanner({
  settings,
  initialCapitalUsd,
  additionalDepositsUsd,
  currentBalance,
  onOpenSetup,
  onOpenTopUp,
}: {
  settings: AppSettings;
  initialCapitalUsd: number;
  additionalDepositsUsd: number;
  currentBalance: number;
  onOpenSetup: () => void;
  onOpenTopUp: () => void;
}) {
  const totalDeposited = initialCapitalUsd + additionalDepositsUsd;
  const targetUsd = Math.max(1, settings.targetCapitalUsd);
  const progressPct = Math.min(100, Math.max(0, (currentBalance / targetUsd) * 100));
  const remainingUsd = Math.max(0, targetUsd - currentBalance);
  const cycleTargetPct = settings.dailyTargetPct ?? 20;
  const riskPct = settings.riskPerTradePct ?? 10;

  const estimatedCyclesLeft = useMemo(() => {
    if (currentBalance <= 0 || currentBalance >= targetUsd || cycleTargetPct <= 0) {
      return 0;
    }
    const rate = 1 + cycleTargetPct / 100;
    return Math.ceil(Math.log(targetUsd / currentBalance) / Math.log(rate));
  }, [currentBalance, targetUsd, cycleTargetPct]);

  return (
    <div className="mb-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-[#0E1424] via-[#111931] to-[#0E1424] p-5 shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-indigo-300 uppercase">
            <Target className="h-3 w-3" />
            Misi & Parameter Modal Aktif
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            Deposit Awal{" "}
            <span className="font-mono text-sky-300">
              ${initialCapitalUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            {additionalDepositsUsd > 0 && (
              <span className="text-xs font-mono text-emerald-400 ml-2">
                (+${additionalDepositsUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })} Top-Up)
              </span>
            )}{" "}
            <span className="text-slate-500 mx-1">→</span> Target{" "}
            <span className="font-mono text-amber-300">
              ${targetUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Aturan SOP: Maksimal Risiko{" "}
            <span className="font-mono text-rose-300 font-semibold">{riskPct}%</span>{" "}
            (${((currentBalance * riskPct) / 100).toFixed(2)}/trade) • Target Siklus{" "}
            <span className="font-mono text-emerald-300 font-semibold">+{cycleTargetPct}%</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onOpenTopUp}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-3.5 py-2 font-semibold text-emerald-300 transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Top-Up Deposit
          </button>

          <button
            type="button"
            onClick={onOpenSetup}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Atur Modal & Target
          </button>
        </div>
      </div>

      {/* Progress Bar & Ringkasan Angka */}
      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between text-xs gap-2">
          <span className="text-slate-400">
            Total Modal Disetor:{" "}
            <strong className="font-mono text-white">
              ${totalDeposited.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </strong>{" "}
            (Rp {(totalDeposited * settings.jisdorRate).toLocaleString("id-ID")})
          </span>
          <span className="font-mono text-xs">
            <span className="text-emerald-400 font-bold">
              {progressPct.toFixed(2)}%
            </span>{" "}
            <span className="text-slate-400">
              • Sisa ${remainingUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              {estimatedCyclesLeft > 0
                ? ` (~${estimatedCyclesLeft} siklus @+${cycleTargetPct}%)`
                : ""}
            </span>
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(1.5, progressPct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function CapitalTargetModal({
  isOpen,
  initialMode,
  settings,
  currentBalance,
  totalDeposited,
  todayStr,
  onClose,
  onSaveCapitalAndTarget,
  onLogTopUpDeposit,
}: {
  isOpen: boolean;
  initialMode: "SETUP_TARGET" | "TOPUP_DEPOSIT";
  settings: AppSettings;
  currentBalance: number;
  totalDeposited: number;
  todayStr: string;
  onClose: () => void;
  onSaveCapitalAndTarget: (params: {
    initialCapitalUsd: number;
    targetCapitalUsd: number;
    riskPerTradePct: number;
    dailyTargetPct: number;
  }) => void;
  onLogTopUpDeposit: (params: {
    amountUsd: number;
    date: string;
    note: string;
  }) => void;
}) {
  const [tab, setTab] = useState<"SETUP_TARGET" | "TOPUP_DEPOSIT">(initialMode);

  // Form Setup Modal & Target
  const [depoAwal, setDepoAwal] = useState<string>(
    String(settings.initialCapitalUsd || 100)
  );
  const [targetAkhir, setTargetAkhir] = useState<string>(
    String(settings.targetCapitalUsd || 1000000)
  );
  const [riskPct, setRiskPct] = useState<string>(
    String(settings.riskPerTradePct ?? 10)
  );
  const [targetPct, setTargetPct] = useState<string>(
    String(settings.dailyTargetPct ?? 20)
  );

  // Form Top-Up Deposit
  const [topUpUsd, setTopUpUsd] = useState<string>("100");
  const [topUpDate, setTopUpDate] = useState<string>(todayStr);
  const [topUpNote, setTopUpNote] = useState<string>("Top-Up Deposit Modal Trading");

  useEffect(() => {
    setTab(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    setDepoAwal(String(settings.initialCapitalUsd || 100));
    setTargetAkhir(String(settings.targetCapitalUsd || 1000000));
    setRiskPct(String(settings.riskPerTradePct ?? 10));
    setTargetPct(String(settings.dailyTargetPct ?? 20));
  }, [settings]);

  useEffect(() => {
    if (todayStr) setTopUpDate(todayStr);
  }, [todayStr]);

  const previewCalc = useMemo(() => {
    const initVal = Math.max(1, parseFloat(depoAwal) || 0);
    const targVal = Math.max(initVal, parseFloat(targetAkhir) || 0);
    const tPct = Math.max(0.1, parseFloat(targetPct) || 20);
    const multiplier = targVal / initVal;
    const cyclesNeeded =
      targVal > initVal
        ? Math.ceil(Math.log(multiplier) / Math.log(1 + tPct / 100))
        : 0;
    return {
      initVal,
      targVal,
      multiplier,
      cyclesNeeded,
    };
  }, [depoAwal, targetAkhir, targetPct]);

  if (!isOpen) return null;

  const handleSubmitSetup = (e: React.FormEvent) => {
    e.preventDefault();
    const initVal = Math.max(1, parseFloat(depoAwal) || 100);
    const targVal = Math.max(initVal, parseFloat(targetAkhir) || 1000);
    const rVal = Math.min(100, Math.max(0.1, parseFloat(riskPct) || 10));
    const tVal = Math.min(500, Math.max(0.5, parseFloat(targetPct) || 20));

    onSaveCapitalAndTarget({
      initialCapitalUsd: initVal,
      targetCapitalUsd: targVal,
      riskPerTradePct: rVal,
      dailyTargetPct: tVal,
    });
    onClose();
  };

  const handleSubmitTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topUpUsd);
    if (Number.isNaN(amount) || amount <= 0) return;

    onLogTopUpDeposit({
      amountUsd: amount,
      date: topUpDate || todayStr || new Date().toISOString().split("T")[0],
      note: topUpNote.trim() || "Top-Up Deposit Modal Trading",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0E1424] p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">
              Pengaturan Modal Deposit & Targeting
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tentukan angka deposit awal, target akhir compounding, atau catat top-up modal baru.
            </p>
          </div>
          {settings.onboardingCompleted && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("SETUP_TARGET")}
            className={`rounded-lg py-2 transition ${
              tab === "SETUP_TARGET"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            1. Modal Awal & Target
          </button>
          <button
            type="button"
            onClick={() => setTab("TOPUP_DEPOSIT")}
            className={`rounded-lg py-2 transition ${
              tab === "TOPUP_DEPOSIT"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            2. + Top-Up Deposit Baru
          </button>
        </div>

        {tab === "SETUP_TARGET" ? (
          <form onSubmit={handleSubmitSetup} className="space-y-4 text-xs">
            {/* Modal Deposit Awal */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-300 font-medium">
                  Modal Deposit Awal ($ USD)
                </label>
                <span className="font-mono text-slate-400">
                  ≈ Rp{" "}
                  {(
                    (parseFloat(depoAwal) || 0) * settings.jisdorRate
                  ).toLocaleString("id-ID")}
                </span>
              </div>
              <input
                type="number"
                step="any"
                min="1"
                value={depoAwal}
                onChange={(e) => setDepoAwal(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm font-mono font-bold text-white focus:border-indigo-500 focus:outline-none"
                required
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[50, 100, 250, 500, 1000, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDepoAwal(String(preset))}
                    className="rounded-lg border border-slate-700 bg-slate-900/90 hover:border-indigo-500/50 hover:text-indigo-300 px-2.5 py-1 font-mono text-[11px] text-slate-300"
                  >
                    ${preset.toLocaleString("en-US")}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Saldo Akhir */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-300 font-medium">
                  Target Saldo Akhir ($ USD)
                </label>
                <span className="font-mono text-slate-400">
                  ≈ Rp{" "}
                  {(
                    (parseFloat(targetAkhir) || 0) * settings.jisdorRate
                  ).toLocaleString("id-ID")}
                </span>
              </div>
              <input
                type="number"
                step="any"
                min="1"
                value={targetAkhir}
                onChange={(e) => setTargetAkhir(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm font-mono font-bold text-amber-300 focus:border-indigo-500 focus:outline-none"
                required
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[1000, 5000, 10000, 50000, 100000, 1000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetAkhir(String(preset))}
                    className="rounded-lg border border-slate-700 bg-slate-900/90 hover:border-amber-500/50 hover:text-amber-300 px-2.5 py-1 font-mono text-[11px] text-slate-300"
                  >
                    ${preset.toLocaleString("en-US")}
                  </button>
                ))}
              </div>
            </div>

            {/* Risiko & Target Siklus */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">
                  Batas Risiko per Trade (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="100"
                  value={riskPct}
                  onChange={(e) => setRiskPct(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-rose-300"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Target Profit per Siklus (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="500"
                  value={targetPct}
                  onChange={(e) => setTargetPct(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-emerald-300"
                  required
                />
              </div>
            </div>

            {/* Preview Kalkulasi Roadmap */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-200">
                <TrendingUp className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>
                  Target Pertumbuhan:{" "}
                  <strong className="font-mono">
                    {previewCalc.multiplier.toFixed(1)}x
                  </strong>
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-300">
                ~{previewCalc.cyclesNeeded} Siklus (+{targetPct}%)
              </span>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 font-semibold text-white transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              Simpan Modal & Target Utama
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitTopUp} className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 flex justify-between">
              <span className="text-slate-400">Total Modal Disetor Saat Ini:</span>
              <span className="font-mono font-bold text-white">
                ${totalDeposited.toFixed(2)} (Balance: ${currentBalance.toFixed(2)})
              </span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-300 font-medium">
                  Nominal Top-Up Deposit ($ USD)
                </label>
                <span className="font-mono text-emerald-400">
                  ≈ Rp{" "}
                  {(
                    (parseFloat(topUpUsd) || 0) * settings.jisdorRate
                  ).toLocaleString("id-ID")}
                </span>
              </div>
              <input
                type="number"
                step="any"
                min="1"
                value={topUpUsd}
                onChange={(e) => setTopUpUsd(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm font-mono font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Tanggal Deposit</label>
                <input
                  type="date"
                  value={topUpDate}
                  onChange={(e) => setTopUpDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Catatan</label>
                <input
                  type="text"
                  value={topUpNote}
                  onChange={(e) => setTopUpNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between">
              <span className="text-emerald-200 flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-emerald-400" />
                Proyeksi Balance Setelah Top-Up:
              </span>
              <span className="font-mono font-bold text-emerald-300 inline-flex items-center gap-1">
                ${(currentBalance + (parseFloat(topUpUsd) || 0)).toFixed(2)}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 font-semibold text-white transition"
            >
              <PlusCircle className="h-4 w-4" />
              Catat Top-Up Deposit ke Saldo
            </button>
          </form>
        )}
      </div>
    </div>
  );
}