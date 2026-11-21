"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Send,
  ShieldCheck,
  Clock,
  Calculator,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  AppSettings,
  AssistantTask,
  EconomicEvent,
  TradeItem,
} from "@/types/horizon";

export function AssistantHubModule({
  settings,
  currentBalance,
  trades,
  events,
  todayStr,
}: {
  settings: AppSettings;
  currentBalance: number;
  trades: TradeItem[];
  events: EconomicEvent[];
  todayStr: string;
}) {
  const [wibTimeStr, setWibTimeStr] = useState<string>("");
  const [wibHour, setWibHour] = useState<number>(12);

  // Kalkulator Lot & Risiko
  const [riskPct, setRiskPct] = useState<string>("10");
  const [slPips, setSlPips] = useState<string>("25");
  const [pipValuePerLot, setPipValuePerLot] = useState<string>("10");

  // Task & SOP Guard
  const [tasks, setTasks] = useState<AssistantTask[]>([
    {
      id: "TSK-1",
      title: "Tandai HTF Liquidity (PDH/PDL & Asian High/Low) sebelum sesi London",
      category: "SOP",
      completed: false,
      dueTime: "13:30 WIB",
    },
    {
      id: "TSK-2",
      title: "Verifikasi kalender High-Impact News sebelum eksekusi posisi",
      category: "MACRO",
      completed: false,
      dueTime: "14:00 WIB",
    },
    {
      id: "TSK-3",
      title: "Kunci maksimal risiko harian 10% dari modal efektif",
      category: "RISK",
      completed: true,
    },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] =
    useState<AssistantTask["category"]>("SOP");

  const [sendingBriefing, setSendingBriefing] = useState(false);
  const [briefingFeedback, setBriefingFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("sz_assistant_tasks_v1");
    if (raw) {
      try {
        setTasks(JSON.parse(raw));
      } catch {}
    }

    const tick = () => {
      const now = new Date();
      setWibTimeStr(
        now.toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      const hr = Number(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          hour12: false,
        }).format(now)
      );
      setWibHour(hr);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const persistTasks = (next: AssistantTask[]) => {
    setTasks(next);
    try {
      localStorage.setItem("sz_assistant_tasks_v1", JSON.stringify(next));
    } catch {}
  };

  const activeKillzone = useMemo(() => {
    if (wibHour >= 7 && wibHour < 11) {
      return {
        name: "ASIAN RANGE SESSION",
        status: "Akumulasi Likuiditas (Hindari Breakout Palsu)",
        color: "text-sky-300 border-sky-500/30 bg-sky-500/10",
      };
    }
    if (wibHour >= 14 && wibHour < 17) {
      return {
        name: "LONDON OPEN KILLZONE",
        status: "High Probability — Manipulasi & Judas Swing",
        color: "text-emerald-300 border-emerald-500/40 bg-emerald-500/15",
      };
    }
    if (wibHour >= 19 && wibHour < 22) {
      return {
        name: "NEW YORK OPEN KILLZONE",
        status: "Peak Volatility — Ekspansi & Reversal Utama",
        color: "text-amber-300 border-amber-500/40 bg-amber-500/15",
      };
    }
    return {
      name: "OFF-KILLZONE / TRANSITION",
      status: "Observasi Struktur Pasar & Tunggu Konfirmasi Sesi",
      color: "text-slate-300 border-slate-700 bg-slate-800/60",
    };
  }, [wibHour]);

  const todayHighNews = useMemo(() => {
    return events.filter(
      (e) => e.impact === "High" && (!todayStr || e.date === todayStr)
    );
  }, [events, todayStr]);

  const positionCalc = useMemo(() => {
    const rPct = parseFloat(riskPct) || 0;
    const sl = parseFloat(slPips) || 0;
    const pipVal = parseFloat(pipValuePerLot) || 10;
    const maxRiskUsd = currentBalance * (rPct / 100);
    const lotSize = sl > 0 && pipVal > 0 ? maxRiskUsd / (sl * pipVal) : 0;
    const targetProfit2R = maxRiskUsd * 2;
    return {
      maxRiskUsd,
      lotSize,
      targetProfit2R,
    };
  }, [currentBalance, riskPct, slPips, pipValuePerLot]);

  const briefingText = useMemo(() => {
    const newsLines =
      todayHighNews.length > 0
        ? todayHighNews
            .map((n) => `• ${n.time} WIB [${n.currency}] ${n.title}`)
            .join("\n")
        : "• Tidak ada jadwal High-Impact News hari ini.";

    return [
      `<b>🧭 DAILY EXECUTIVE BRIEFING — ${settings.projectName.toUpperCase()}</b>`,
      `📅 Tanggal: <b>${todayStr || "Hari Ini"}</b> | 🕒 ${wibTimeStr} WIB`,
      ``,
      `<b>1. STATUS MODAL & BATAS RISIKO (${riskPct}% SOP)</b>`,
      `• Saldo Aktif: <b>$${currentBalance.toFixed(2)}</b> (Rp ${(
        currentBalance * settings.jisdorRate
      ).toLocaleString("id-ID")})`,
      `• Maksimal Risiko/Trade: <b>$${positionCalc.maxRiskUsd.toFixed(2)}</b>`,
      `• Rekomendasi Lot (SL ${slPips} pips): <b>${positionCalc.lotSize.toFixed(
        2
      )} Lot</b>`,
      `• Target Profit Harian (2R / 20%): <b>+$${positionCalc.targetProfit2R.toFixed(
        2
      )}</b>`,
      ``,
      `<b>2. RADAR BERITA HIGH-IMPACT (WIB)</b>`,
      newsLines,
      ``,
      `<b>3. STATUS KILLZONE SAAT INI</b>`,
      `• ${activeKillzone.name}: ${activeKillzone.status}`,
      ``,
      `<i>Fokus pada kualitas setup, bukan kuantitas entry.</i>`,
    ].join("\n");
  }, [
    settings,
    todayStr,
    wibTimeStr,
    riskPct,
    currentBalance,
    positionCalc,
    slPips,
    todayHighNews,
    activeKillzone,
  ]);

  const handlePushBriefingToTelegram = async () => {
    if (!settings.telegramChatId.trim()) {
      setBriefingFeedback({
        ok: false,
        text: "Chat ID Telegram belum diatur. Silakan isi di menu Pengaturan.",
      });
      return;
    }
    setSendingBriefing(true);
    setBriefingFeedback(null);
    try {
      const res = await fetch("/api/telegram/notify-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: settings.telegramChatId.trim(),
          type: "DAILY_BRIEFING",
          payload: { message: briefingText },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setBriefingFeedback({
          ok: false,
          text: json.error || "Gagal mengirim briefing ke Telegram.",
        });
      } else {
        setBriefingFeedback({
          ok: true,
          text: "Daily Executive Briefing berhasil dikirim ke Telegram Anda!",
        });
      }
    } catch {
      setBriefingFeedback({
        ok: false,
        text: "Koneksi server gagal.",
      });
    } finally {
      setSendingBriefing(false);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    persistTasks([
      {
        id: `TSK-${Date.now()}`,
        title: newTaskTitle.trim(),
        category: newTaskCategory,
        completed: false,
      },
      ...tasks,
    ]);
    setNewTaskTitle("");
  };

  const completedTasksCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      {/* Header Asisten */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">
              Asisten Pribadi & Co-Pilot Trading
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Briefing harian otomatis, kalkulator lot presisi, radar Killzone WIB, dan sinkronisasi Telegram.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePushBriefingToTelegram}
          disabled={sendingBriefing}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
        >
          <Send className="h-3.5 w-3.5" />
          {sendingBriefing
            ? "Mengirim Briefing..."
            : "Kirim Briefing Hari Ini ke Telegram"}
        </button>
      </div>

      {briefingFeedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            briefingFeedback.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {briefingFeedback.text}
        </div>
      )}

      {/* Top Row: Killzone Live Radar + Quick Risk & Lot Sizing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Killzone & Macro Radar */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                <Clock className="h-4 w-4 text-sky-400" />
                Radar Sesi ICT (WIB)
              </span>
              <span className="font-mono text-sky-300 font-bold">
                {wibTimeStr || "--:--:--"} WIB
              </span>
            </div>

            <div className={`rounded-xl border p-4 ${activeKillzone.color}`}>
              <div className="text-xs font-bold tracking-wider uppercase">
                {activeKillzone.name}
              </div>
              <div className="text-xs mt-1 opacity-90">
                {activeKillzone.status}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Asian Range</span>
                <span className="font-mono text-slate-200">07:00 – 11:00 WIB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">London Killzone</span>
                <span className="font-mono text-emerald-300">14:00 – 17:00 WIB</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">New York Killzone</span>
                <span className="font-mono text-amber-300">19:00 – 22:00 WIB</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">High-Impact News Hari Ini</span>
              <span className="font-mono font-bold text-rose-400">
                {todayHighNews.length} Agenda
              </span>
            </div>
          </div>
        </div>

        {/* Kalkulator Lot & Risiko Instan */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0E1424] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Calculator className="h-4 w-4 text-emerald-400" />
              <span>Asisten Position Sizing & Batas Risiko Harian</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Saldo Basis: ${currentBalance.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">
                Risiko per Trade (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">
                Jarak Stop Loss (Pips)
              </label>
              <input
                type="number"
                step="1"
                value={slPips}
                onChange={(e) => setSlPips(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">
                Nilai 1 Pip / 1.0 Lot ($)
              </label>
              <input
                type="number"
                step="0.1"
                value={pipValuePerLot}
                onChange={(e) => setPipValuePerLot(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <span className="text-[11px] text-emerald-300/80 uppercase font-semibold">
                Ukuran Lot Ideal
              </span>
              <div className="mt-1 text-2xl font-mono font-bold text-emerald-300">
                {positionCalc.lotSize.toFixed(2)} Lot
              </div>
              <span className="text-[11px] text-slate-400">
                Presisi sesuai SL {slPips} pips
              </span>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
              <span className="text-[11px] text-rose-300/80 uppercase font-semibold">
                Batas Rugi Maksimal
              </span>
              <div className="mt-1 text-2xl font-mono font-bold text-rose-300">
                -${positionCalc.maxRiskUsd.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-400">
                Rp {(positionCalc.maxRiskUsd * settings.jisdorRate).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
              <span className="text-[11px] text-sky-300/80 uppercase font-semibold">
                Target Profit (2R)
              </span>
              <div className="mt-1 text-2xl font-mono font-bold text-sky-300">
                +${positionCalc.targetProfit2R.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-400">
                Growth +{(Number(riskPct) * 2).toFixed(1)}% siklus
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Daily Executive Briefing Preview + SOP & Task Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Briefing Preview */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Ringkasan Intelijen Harian (Siap Kirim Telegram)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {trades.length} total trade
            </span>
          </div>

          <div
            className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans"
            dangerouslySetInnerHTML={{ __html: briefingText }}
          />
        </div>

        {/* Checklist & SOP Guard */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Checklist Disiplin & Agenda Pribadi</span>
            </div>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300">
              {completedTasksCount}/{tasks.length} Selesai
            </span>
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2 text-xs">
            <select
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-white"
            >
              <option value="SOP">SOP</option>
              <option value="RISK">RISK</option>
              <option value="MACRO">MACRO</option>
              <option value="PERSONAL">PRIBADI</option>
            </select>
            <input
              type="text"
              placeholder="Tambah agenda / aturan disiplin..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah
            </button>
          </form>

          <div className="space-y-2 text-xs max-h-72 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between rounded-lg border p-3 transition ${
                  task.completed
                    ? "border-slate-800/60 bg-slate-900/40 text-slate-500"
                    : "border-slate-800 bg-slate-900/90 text-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    persistTasks(
                      tasks.map((t) =>
                        t.id === task.id ? { ...t, completed: !t.completed } : t
                      )
                    )
                  }
                  className="flex items-center gap-2.5 text-left flex-1"
                >
                  {task.completed ? (
                    <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-500 shrink-0" />
                  )}
                  <span className={task.completed ? "line-through" : ""}>
                    {task.title}
                  </span>
                </button>

                <div className="flex items-center gap-2 ml-2">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                    {task.category}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      persistTasks(tasks.filter((t) => t.id !== task.id))
                    }
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {todayHighNews.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Perhatian: Ada {todayHighNews.length} berita High-Impact hari ini.
                Bot akan mengingatkan 15 menit sebelum rilis.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}