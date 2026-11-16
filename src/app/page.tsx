"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  TrendingUp,
  Target,
  Flame,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  LogOut,
  Crown,
  LayoutDashboard,
  Megaphone,
  Loader2,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  RefreshCw,
  Calendar,
  CalendarCheck2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  CompoundingConfig,
  JournalEntryInput,
  MarketType,
} from "@/types/compounding";
import {
  aggregateJournalsByDate,
  computeDashboardMetrics,
  computeJournals,
  generateDynamicRoadmap,
} from "@/lib/compounding-engine";
import {
  AnimatedCurrency,
  CompoundingTrajectoryChart,
  ZenithLogo,
  formatCompactUSD,
} from "@/components/brand-and-chart";
import {
  AccountSettingsModal,
  AuthScreen,
  SuperAdminPanel,
  UserProfileRecord,
} from "@/components/auth-and-admin";

const TODAY_YMD = new Date().toISOString().split("T")[0];

const DEFAULT_CONFIG: CompoundingConfig = {
  initialCapital: 49.33,
  targetCapital: 1000000000,
  dailyTargetPct: 0.1,
  riskPerDayPct: 0.05,
  selectedDay: 1,
  startDate: TODAY_YMD,
  marketType: "forex",
};

const TARGET_PRESETS = [
  { label: "$1M", value: 1_000_000 },
  { label: "$10M", value: 10_000_000 },
  { label: "$100M", value: 100_000_000 },
  { label: "$1B", value: 1_000_000_000 },
];

const MARKET_OPTIONS: { id: MarketType; label: string; scheduleNote: string }[] = [
  { id: "forex", label: "Forex (5 Hari/Mgg)", scheduleNote: "Senin–Jumat (Skip Sabtu & Minggu)" },
  { id: "stocks", label: "Saham (5 Hari/Mgg)", scheduleNote: "Hari Bursa Senin–Jumat" },
  { id: "crypto", label: "Crypto (7 Hari/Mgg)", scheduleNote: "24/7 Non-Stop Setiap Hari" },
];

export default function CompoundingDashboardPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [activeView, setActiveView] = useState<"workspace" | "admin">("workspace");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [config, setConfig] = useState<CompoundingConfig>(DEFAULT_CONFIG);
  const [journals, setJournals] = useState<JournalEntryInput[]>([]);
  const [newPnl, setNewPnl] = useState<string>("");
  const [newDate, setNewDate] = useState<string>(TODAY_YMD);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [roadmapFilter, setRoadmapFilter] = useState<"ALL" | "PASSED" | "ACTIVE">("ALL");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [allUsers, setAllUsers] = useState<UserProfileRecord[]>([]);
  const [announcement, setAnnouncement] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadAdminDirectory = useCallback(async () => {
    const { data: profilesData } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: allJournalsData } = await supabase
      .from("daily_journals")
      .select("user_id, pnl_amount");

    if (profilesData) {
      const enriched = profilesData.map((p: UserProfileRecord) => {
        const userEntries = (allJournalsData || []).filter((j) => j.user_id === p.id);
        const totalPnl = userEntries.reduce((acc, cur) => acc + Number(cur.pnl_amount), 0);
        return {
          ...p,
          latest_balance: Number(p.initial_capital) + totalPnl,
          sessions_count: userEntries.length,
        };
      });
      setAllUsers(enriched);
    }
  }, []);

  const bootstrapSession = useCallback(async () => {
    setAuthLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setUserId(null);
      setProfile(null);
      setAuthLoading(false);
      return;
    }

    const uid = session.user.id;
    setUserId(uid);

    const { data: prof } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (prof) {
      const typedProf = prof as UserProfileRecord & {
        start_date?: string;
        market_type?: MarketType;
      };
      setProfile(typedProf);
      setConfig({
        initialCapital: Number(typedProf.initial_capital),
        targetCapital: Number(typedProf.target_capital),
        dailyTargetPct: Number(typedProf.daily_target_pct),
        riskPerDayPct: Number(typedProf.risk_per_day_pct),
        selectedDay: Number(typedProf.selected_day),
        startDate: typedProf.start_date || TODAY_YMD,
        marketType: typedProf.market_type || "forex",
      });

      if (
        typedProf.role === "owner" ||
        typedProf.role === "super_admin" ||
        typedProf.role === "moderator"
      ) {
        await loadAdminDirectory();
      }
    }

    const { data: journalRows } = await supabase
      .from("daily_journals")
      .select("*")
      .eq("user_id", uid)
      .order("execution_date", { ascending: true })
      .order("session_number", { ascending: true });

    if (journalRows) {
      setJournals(
        journalRows.map((r) => ({
          id: r.id,
          sessionNumber: r.session_number,
          executionDate: r.execution_date,
          pnlAmount: Number(r.pnl_amount),
          notes: r.notes || "",
        }))
      );
    }

    const { data: ann } = await supabase
      .from("system_announcements")
      .select("message")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setAnnouncement(ann?.message || "");
    setAuthLoading(false);
  }, [loadAdminDirectory]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("nexus_compounding_theme");
    if (savedTheme) setDarkMode(savedTheme === "dark");

    bootstrapSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
        setAuthLoading(false);
      } else {
        bootstrapSession();
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [bootstrapSession]);

  useEffect(() => {
    localStorage.setItem("nexus_compounding_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const syncConfigToCloud = async (nextConfig: CompoundingConfig) => {
    setConfig(nextConfig);
    if (!userId) return;
    await supabase
      .from("user_profiles")
      .update({
        initial_capital: nextConfig.initialCapital,
        target_capital: nextConfig.targetCapital,
        daily_target_pct: nextConfig.dailyTargetPct,
        risk_per_day_pct: nextConfig.riskPerDayPct,
        selected_day: nextConfig.selectedDay,
        start_date: nextConfig.startDate,
        market_type: nextConfig.marketType,
      })
      .eq("id", userId);
  };

  const { roadmap, computedJournals, dailySummaries, metrics } = useMemo(() => {
    const initialRoadmap = generateDynamicRoadmap(config, config.initialCapital, []);
    const computed = computeJournals(config, journals, initialRoadmap);
    const summaries = aggregateJournalsByDate(computed);
    const latestBal =
      computed.length > 0 ? computed[computed.length - 1].endBalance : config.initialCapital;
    const finalRoadmap = generateDynamicRoadmap(config, latestBal, summaries);
    const finalMetrics = computeDashboardMetrics(config, finalRoadmap, computed);

    return {
      roadmap: finalRoadmap,
      computedJournals: computed,
      dailySummaries: summaries,
      metrics: finalMetrics,
    };
  }, [config, journals]);

  const drawdownAnalysis = useMemo(() => {
    const isUnderInitial = metrics.currentBalance < config.initialCapital;
    if (!isUnderInitial) return null;

    const deficitAmount = config.initialCapital - metrics.currentBalance;
    const drawdownPct = (deficitAmount / config.initialCapital) * 100;
    const safeBalance = Math.max(0.01, metrics.currentBalance);
    const recoveryGainNeededPct = ((config.initialCapital - safeBalance) / safeBalance) * 100;
    const sessionsToRecoverAtTarget =
      config.dailyTargetPct > 0
        ? Math.ceil(
            Math.log(config.initialCapital / safeBalance) /
              Math.log(1 + config.dailyTargetPct)
          )
        : 0;
    const defensiveRiskPct = Number((config.riskPerDayPct * 0.5).toFixed(4));

    return {
      deficitAmount,
      drawdownPct,
      recoveryGainNeededPct,
      sessionsToRecoverAtTarget,
      defensiveRiskPct,
    };
  }, [metrics.currentBalance, config.initialCapital, config.dailyTargetPct, config.riskPerDayPct]);

  const filteredRoadmap = useMemo(() => {
    if (roadmapFilter === "PASSED") {
      return roadmap.filter((r) => r.status === "TERLAMPAUI (Aman)");
    }
    if (roadmapFilter === "ACTIVE") {
      return roadmap.filter((r) => r.status !== "TERLAMPAUI (Aman)").slice(0, 25);
    }
    return roadmap;
  }, [roadmap, roadmapFilter]);

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const parsed = parseFloat(newPnl);
    if (Number.isNaN(parsed)) return;

    const nextSession =
      journals.length > 0
        ? Math.max(...journals.map((j) => j.sessionNumber)) + 1
        : 1;

    const { data, error } = await supabase
      .from("daily_journals")
      .insert({
        user_id: userId,
        session_number: nextSession,
        execution_date: newDate,
        pnl_amount: parsed,
      })
      .select()
      .single();

    if (error) {
      triggerToast("Gagal menyimpan sesi ke cloud.");
      return;
    }

    const projectedBalance = metrics.currentBalance + parsed;
    setJournals((prev) =>
      [
        ...prev,
        {
          id: data.id,
          sessionNumber: data.session_number,
          executionDate: data.execution_date,
          pnlAmount: Number(data.pnl_amount),
        },
      ].sort((a, b) => a.executionDate.localeCompare(b.executionDate))
    );
    setNewPnl("");

    if (projectedBalance < config.initialCapital) {
      triggerToast(
        `PERINGATAN DRAWDOWN: Saldo turun ke ${formatCompactUSD(projectedBalance)}!`
      );
    } else {
      triggerToast(
        `Entry tanggal ${newDate} (${parsed >= 0 ? `+$${parsed}` : `-$${Math.abs(parsed)}`}) tersimpan!`
      );
    }

    if (
      profile?.role === "owner" ||
      profile?.role === "super_admin" ||
      profile?.role === "moderator"
    ) {
      loadAdminDirectory();
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!userId) return;
    await supabase.from("daily_journals").delete().eq("id", id);
    const updated = journals
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, sessionNumber: idx + 1 }));
    setJournals(updated);
    triggerToast("Entry dihapus dari cloud.");

    if (
      profile?.role === "owner" ||
      profile?.role === "super_admin" ||
      profile?.role === "moderator"
    ) {
      loadAdminDirectory();
    }
  };

  const handleApplyDefensiveRisk = async () => {
    if (!drawdownAnalysis) return;
    await syncConfigToCloud({
      ...config,
      riskPerDayPct: Math.max(0.005, drawdownAnalysis.defensiveRiskPct),
    });
    triggerToast(
      `Mode Defensif aktif! Batas risk diturunkan menjadi ${(
        Math.max(0.005, drawdownAnalysis.defensiveRiskPct) * 100
      ).toFixed(2)}% per hari.`
    );
  };

  const handleRebaseCapitalToCurrent = async () => {
    if (!userId || metrics.currentBalance <= 0) return;
    await supabase.from("daily_journals").delete().eq("user_id", userId);
    setJournals([]);
    await syncConfigToCloud({
      ...config,
      initialCapital: Number(metrics.currentBalance.toFixed(2)),
      startDate: TODAY_YMD,
      selectedDay: 1,
    });
    triggerToast(
      `Basis modal diperbarui ke ${formatCompactUSD(metrics.currentBalance)} mulai hari ini!`
    );
  };

  const handlePostAnnouncement = async (msg: string) => {
    if (!userId) return;
    await supabase.from("system_announcements").update({ is_active: false }).eq("is_active", true);
    if (msg.trim()) {
      await supabase.from("system_announcements").insert({
        message: msg.trim(),
        is_active: true,
        created_by: userId,
      });
    }
    setAnnouncement(msg.trim());
    triggerToast(
      msg.trim() ? "Pengumuman global dipublikasikan!" : "Banner pengumuman disembunyikan."
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setProfile(null);
    setIsPasswordRecovery(false);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const roadmapSheetData = roadmap.map((r) => ({
      Tanggal: r.dateStr,
      Hari: r.dayName,
      "Sesi Ke-": r.day,
      Fase: r.phase,
      "Modal Awal ($)": Number(r.startBalance.toFixed(2)),
      "Target Profit ($)": Number(r.targetProfit.toFixed(2)),
      "Target Saldo Akhir ($)": Number(r.targetEndBalance.toFixed(2)),
      "Net Aktual Tanggal Ini ($)":
        r.dailyNetPnlOnDate !== undefined ? Number(r.dailyNetPnlOnDate.toFixed(2)) : "",
      Status: r.status,
    }));

    const journalSheetData = computedJournals.map((j) => ({
      "Entry Ke-": j.sessionNumber,
      Tanggal: j.executionDate,
      "Saldo Awal ($)": Number(j.startBalance.toFixed(2)),
      "Profit / Loss ($)": Number(j.pnlAmount.toFixed(2)),
      "Saldo Akhir ($)": Number(j.endBalance.toFixed(2)),
      "Checkpoint Aman": j.safeDayAchieved,
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(roadmapSheetData), "Roadmap Kalender");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(journalSheetData), "Jurnal Harian");
    XLSX.writeFile(wb, `SilentZenith_${config.startDate}_to_${metrics.estimatedEndDateStr}.xlsx`);
    triggerToast("File Excel (.xlsx) berhasil diunduh!");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const journalSheetName =
          wb.SheetNames.find((n) => n.toLowerCase().includes("jurnal")) || wb.SheetNames[0];
        const ws = wb.Sheets[journalSheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

        const toInsert: {
          user_id: string;
          session_number: number;
          execution_date: string;
          pnl_amount: number;
        }[] = [];

        rows.forEach((row) => {
          const pnlVal = Number(
            row["Profit / Loss ($)"] ?? row["Total Profit / Loss Hari Ini ($)"] ?? NaN
          );
          const dateVal = String(row["Tanggal"] || newDate);
          if (!Number.isNaN(pnlVal) && pnlVal !== 0) {
            toInsert.push({
              user_id: userId,
              session_number: journals.length + toInsert.length + 1,
              execution_date: dateVal,
              pnl_amount: pnlVal,
            });
          }
        });

        if (toInsert.length > 0) {
          await supabase.from("daily_journals").insert(toInsert);
          await bootstrapSession();
          triggerToast(`${toInsert.length} entry berhasil diimpor ke database!`);
        }
      } catch {
        triggerToast("Format file Excel tidak dikenali.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#09090B] text-zinc-200 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
        <p className="text-xs text-zinc-400">Memuat Silent Zenith OS...</p>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return (
      <AuthScreen
        initialRecoveryMode
        onSuccess={() => {
          setIsPasswordRecovery(false);
          bootstrapSession();
        }}
      />
    );
  }

  if (!userId || !profile) {
    return <AuthScreen onSuccess={bootstrapSession} />;
  }

  if (profile.is_suspended) {
    return (
      <div className="min-h-[100dvh] bg-[#09090B] text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md p-8 rounded-3xl bg-zinc-900 border border-rose-500/30 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold">Akun Dinonaktifkan Sementara</h2>
          <p className="text-xs text-zinc-400">
            Akses akun Anda telah ditangguhkan oleh Administrator. Hubungi tim pengelola sistem untuk aktivasi ulang.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
          >
            Keluar Akun
          </button>
        </div>
      </div>
    );
  }

  const isOwner = profile.role === "owner";
  const isSuperAdmin = profile.role === "super_admin";
  const isModerator = profile.role === "moderator";
  const hasStaffPanelAccess = isOwner || isSuperAdmin || isModerator;
  const visibleUsersCount = isOwner
    ? allUsers.length
    : allUsers.filter((u) => u.role !== "owner").length;
  const activeMarketInfo = MARKET_OPTIONS.find((m) => m.id === config.marketType)!;

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-[100dvh] bg-zinc-50 text-zinc-900 dark:bg-[#09090B] dark:text-zinc-100 transition-colors duration-300 selection:bg-emerald-500/30">
        {announcement && (
          <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2">
            <Megaphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="line-clamp-2">{announcement}</span>
          </div>
        )}

        <AccountSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          profile={profile}
          onProfileUpdated={(newName) => setProfile({ ...profile, full_name: newName })}
          onNotify={triggerToast}
        />

        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-medium shadow-xl border border-zinc-700/80 max-w-md ml-auto"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navbar */}
        <header className="sticky top-0 z-30 safe-top border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-[#09090B]/85 backdrop-blur-xl transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <ZenithLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xs sm:text-sm font-bold tracking-tight uppercase truncate">
                    Silent Zenith
                  </h1>
                  {isOwner ? (
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-emerald-500/20 text-amber-400 border border-amber-400/50 shrink-0">
                      <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Owner
                    </span>
                  ) : isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0">
                      <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Super Admin
                    </span>
                  ) : isModerator ? (
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 shrink-0">
                      <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Moderator
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                      Member
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {profile.full_name} • Target{" "}
                  <span className="font-semibold text-emerald-500">
                    {formatCompactUSD(config.targetCapital)}
                  </span>
                </p>
              </div>
            </div>

            {hasStaffPanelAccess && (
              <div className="hidden md:inline-flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveView("workspace")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeView === "workspace"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                      : "text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Workspace Saya</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("admin")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeView === "admin"
                      ? isModerator
                        ? "bg-violet-500 text-white shadow-xs"
                        : "bg-amber-500 text-zinc-950 shadow-xs"
                      : isModerator
                      ? "text-violet-400 hover:bg-violet-500/10"
                      : "text-amber-500 hover:bg-amber-500/10"
                  }`}
                >
                  {isModerator ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <Crown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isModerator ? "Moderator Panel" : "Admin Panel"} ({visibleUsersCount})
                  </span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportExcel}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Import Excel"
                className="hidden sm:inline-flex p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                title="Export Excel"
                className="hidden sm:inline-flex p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                aria-label="Ganti Tema"
                title="Ganti Tema"
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Pengaturan Akun"
                title="Pengaturan Akun & Ganti Password"
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Keluar Akun"
                title="Keluar Akun"
                className="p-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {hasStaffPanelAccess && (
            <div className="md:hidden px-4 py-2 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/90 dark:bg-zinc-950/90">
              <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveView("workspace")}
                  className={`py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    activeView === "workspace"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                      : "text-zinc-500"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Workspace Saya</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("admin")}
                  className={`py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    activeView === "admin"
                      ? isModerator
                        ? "bg-violet-500 text-white shadow-xs"
                        : "bg-amber-500 text-zinc-950 shadow-xs"
                      : isModerator
                      ? "text-violet-400"
                      : "text-amber-500"
                  }`}
                >
                  {isModerator ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <Crown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isModerator ? "Moderator Panel" : "Admin Panel"} ({visibleUsersCount})
                  </span>
                </button>
              </div>
            </div>
          )}
        </header>

        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 safe-bottom space-y-5 sm:space-y-8">
          {hasStaffPanelAccess && activeView === "admin" ? (
            <SuperAdminPanel
              currentUserRole={profile.role}
              allUsers={allUsers}
              currentAnnouncement={announcement}
              onRefreshUsers={loadAdminDirectory}
              onPostAnnouncement={handlePostAnnouncement}
              onNotify={triggerToast}
            />
          ) : (
            <>
              {/* DRAWDOWN ALERT BANNER */}
              <AnimatePresence>
                {drawdownAnalysis && (
                  <motion.section
                    initial={{ opacity: 0, y: -14, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -14 }}
                    className="p-4 sm:p-6 rounded-2xl bg-rose-500/[0.08] border border-rose-500/40 shadow-lg shadow-rose-500/5 space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-500 shrink-0 mt-0.5">
                          <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xs sm:text-sm font-bold text-rose-500 uppercase tracking-wide">
                              Peringatan Drawdown — Saldo Di Bawah Modal Awal!
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 tabular-nums">
                              Defisit -{formatCompactUSD(drawdownAnalysis.deficitAmount)} (-
                              {drawdownAnalysis.drawdownPct.toFixed(2)}%)
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1.5 leading-relaxed">
                            Saldo aktual kamu{" "}
                            <strong className="text-rose-500">
                              {formatCompactUSD(metrics.currentBalance)}
                            </strong>{" "}
                            (di bawah basis modal{" "}
                            <strong>{formatCompactUSD(config.initialCapital)}</strong>). Untuk kembali
                            impas (BEP), dibutuhkan pertumbuhan bersih{" "}
                            <strong className="text-amber-500">
                              +{drawdownAnalysis.recoveryGainNeededPct.toFixed(2)}%
                            </strong>{" "}
                            atau sekitar{" "}
                            <strong>
                              {drawdownAnalysis.sessionsToRecoverAtTarget} hari trading konsisten
                            </strong>{" "}
                            pada target {(config.dailyTargetPct * 100).toFixed(1)}%/hari.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleApplyDefensiveRisk}
                          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Pangkas Risk 50% ({(drawdownAnalysis.defensiveRiskPct * 100).toFixed(2)}%)
                        </button>
                        <button
                          type="button"
                          onClick={handleRebaseCapitalToCurrent}
                          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Reset Modal ke {formatCompactUSD(metrics.currentBalance)}
                        </button>
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Bento KPI Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                <div
                  className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border shadow-xs transition-colors ${
                    drawdownAnalysis
                      ? "border-rose-500/50 ring-1 ring-rose-500/20"
                      : "border-zinc-200/80 dark:border-zinc-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
                    <span>Saldo Aktual Terkini</span>
                    <TrendingUp
                      className={`w-4 h-4 ${
                        drawdownAnalysis ? "text-rose-500" : "text-emerald-500"
                      }`}
                    />
                  </div>
                  <div
                    className={`mt-2.5 sm:mt-3 text-2xl font-bold tracking-tight tabular-nums ${
                      drawdownAnalysis ? "text-rose-500" : ""
                    }`}
                  >
                    <AnimatedCurrency value={metrics.currentBalance} />
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500">
                    Buffer Aman:{" "}
                    <span
                      className={`font-semibold ${
                        metrics.safeBufferAmount >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {metrics.safeBufferAmount >= 0
                        ? `+${formatCompactUSD(metrics.safeBufferAmount)}`
                        : formatCompactUSD(metrics.safeBufferAmount)}
                    </span>
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                  <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
                    <span>Target Hari Ini ({(config.dailyTargetPct * 100).toFixed(1)}%)</span>
                    <Target className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="mt-2.5 sm:mt-3 text-2xl font-bold tracking-tight tabular-nums">
                    <AnimatedCurrency value={metrics.targetProfitToday} />
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500 truncate">
                    Target {metrics.selectedDateLabel}:{" "}
                    {formatCompactUSD(metrics.selectedDayEndTarget)}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                  <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
                    <span>Batas Maksimal Risk ({(config.riskPerDayPct * 100).toFixed(1)}%)</span>
                    <Flame className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2.5 sm:mt-3 text-2xl font-bold tracking-tight tabular-nums">
                    <AnimatedCurrency value={metrics.maxRiskToday} />
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500">
                    Daya Tahan SL Beruntun:{" "}
                    <span className="font-semibold">{metrics.consecutiveLossEndurance}x</span>
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                  <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
                    <span>Estimasi Tanggal Target</span>
                    <CalendarCheck2 className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="mt-2.5 sm:mt-3 text-xl sm:text-2xl font-bold tracking-tight">
                    {metrics.estimatedEndDateLabel}
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500 truncate">
                    {metrics.totalDaysRequired} Hari Trading • {activeMarketInfo.label}
                  </p>
                </div>
              </section>

              {/* Chart Berbasis Tanggal Kalender */}
              <CompoundingTrajectoryChart
                roadmap={roadmap}
                journals={computedJournals}
                initialCapital={config.initialCapital}
              />

              {/* Controls & Form */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">1. Kalender & Parameter Misi</h2>
                    <button
                      type="button"
                      onClick={() => syncConfigToCloud(DEFAULT_CONFIG)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 py-1 px-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                  </div>

                  {/* Pilihan Instrumen Market */}
                  <div className="space-y-1.5">
                    <label className="block text-xs text-zinc-500">Instrumen & Jadwal Pasar</label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
                      {MARKET_OPTIONS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => syncConfigToCloud({ ...config, marketType: m.id })}
                          className={`py-2 px-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            config.marketType === m.id
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-zinc-500 hover:text-zinc-200"
                          }`}
                        >
                          {m.id === "forex"
                            ? "Forex (5H)"
                            : m.id === "stocks"
                            ? "Saham (5H)"
                            : "Crypto (7H)"}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-zinc-500">{activeMarketInfo.scheduleNote}</p>
                  </div>

                  {/* Tanggal Mulai & Estimasi Tanggal Selesai */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        value={config.startDate}
                        onChange={(e) =>
                          syncConfigToCloud({
                            ...config,
                            startDate: e.target.value || TODAY_YMD,
                          })
                        }
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Estimasi Selesai</label>
                      <div className="w-full px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-500 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{metrics.estimatedEndDateLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Target Akhir */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <label className="text-xs text-zinc-500">Target Akhir ($)</label>
                      <div className="flex items-center gap-1">
                        {TARGET_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() =>
                              syncConfigToCloud({ ...config, targetCapital: preset.value })
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                              config.targetCapital === preset.value
                                ? "bg-emerald-600 text-white"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="1000"
                      value={config.targetCapital}
                      onChange={(e) =>
                        syncConfigToCloud({
                          ...config,
                          targetCapital: Math.max(
                            config.initialCapital + 1,
                            parseFloat(e.target.value) || 0
                          ),
                        })
                      }
                      className="w-full px-3 py-2 text-sm font-semibold tabular-nums rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">Modal Awal ($)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={config.initialCapital}
                        onChange={(e) =>
                          syncConfigToCloud({
                            ...config,
                            initialCapital: Math.max(1, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-full px-2.5 py-2 text-sm tabular-nums rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">Target/Hari (%)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        value={(config.dailyTargetPct * 100).toFixed(1)}
                        onChange={(e) =>
                          syncConfigToCloud({
                            ...config,
                            dailyTargetPct: Math.max(0.1, (parseFloat(e.target.value) || 0) / 100),
                          })
                        }
                        className="w-full px-2.5 py-2 text-sm tabular-nums rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">Risk/Hari (%)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        value={(config.riskPerDayPct * 100).toFixed(1)}
                        onChange={(e) =>
                          syncConfigToCloud({
                            ...config,
                            riskPerDayPct: Math.max(0.1, (parseFloat(e.target.value) || 0) / 100),
                          })
                        }
                        className="w-full px-2.5 py-2 text-sm tabular-nums rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Catat Entry Per Tanggal */}
                <div className="lg:col-span-2 flex flex-col justify-between gap-4">
                  <form
                    onSubmit={handleAddSession}
                    className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <h2 className="text-sm font-semibold">2. Catat Profit / Minus Per Tanggal</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Beberapa entry di tanggal yang sama otomatis dijumlahkan menjadi Net Harian.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setNewPnl(String(Number(metrics.targetProfitToday.toFixed(2))))
                          }
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-500 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" /> +Target 1x
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setNewPnl(String(Number((metrics.targetProfitToday * 2).toFixed(2))))
                          }
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-500 cursor-pointer"
                        >
                          +Target 2x
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setNewPnl(String(-Number(metrics.maxRiskToday.toFixed(2))))
                          }
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-500 cursor-pointer"
                        >
                          -Max SL
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Tanggal Trading</label>
                        <input
                          type="date"
                          required
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Profit / Minus ($)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          required
                          placeholder="Contoh: 5.20 atau -2.10"
                          value={newPnl}
                          onChange={(e) => setNewPnl(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Simpan ke Tanggal Ini
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Ringkasan Net Per Tanggal */}
                  {dailySummaries.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Rekap Net Profit / Minus Per Tanggal ({dailySummaries.length} Hari Aktif)
                        </h3>
                      </div>
                      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 tabular-nums">
                        {dailySummaries.map((daySum) => (
                          <div
                            key={daySum.dateStr}
                            className={`min-w-[145px] p-3 rounded-xl border shrink-0 ${
                              daySum.netPnl >= 0
                                ? "bg-emerald-500/[0.06] border-emerald-500/25"
                                : "bg-rose-500/[0.06] border-rose-500/25"
                            }`}
                          >
                            <div className="text-[11px] text-zinc-500">
                              {daySum.dayName}, {daySum.dateLabel}
                            </div>
                            <div
                              className={`text-sm font-bold mt-1 ${
                                daySum.netPnl >= 0 ? "text-emerald-500" : "text-rose-500"
                              }`}
                            >
                              {daySum.netPnl >= 0
                                ? `+${formatCompactUSD(daySum.netPnl)}`
                                : formatCompactUSD(daySum.netPnl)}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              Saldo: {formatCompactUSD(daySum.endBalance)} ({daySum.sessionsCount}x)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Tabel Jurnal Detail */}
              <section className="rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold">3. Log Transaksi Eksekusi Harian</h2>
                    <span className="text-xs text-zinc-500">
                      {computedJournals.length} Entry Tercatat
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:hidden">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Import
                    </button>
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Excel
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 text-xs text-zinc-500 bg-zinc-50/50 dark:bg-zinc-950/50">
                        <th className="py-3 px-3 sm:px-4 font-medium">Entry</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Tanggal</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Saldo Awal</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Batas Risk</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Target Profit</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Profit / Minus</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Return</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Saldo Akhir</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Status Checkpoint</th>
                        <th className="py-3 px-3 sm:px-4 font-medium text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 tabular-nums">
                      {computedJournals.map((row) => {
                        const isDeficit = row.endBalance < config.initialCapital;
                        const achievedDate =
                          row.safeDayAchieved > 0
                            ? roadmap[row.safeDayAchieved - 1]?.dateLabel
                            : null;
                        return (
                          <tr
                            key={row.id}
                            className={`transition-colors ${
                              isDeficit
                                ? "bg-rose-500/[0.04] hover:bg-rose-500/[0.08]"
                                : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                            }`}
                          >
                            <td className="py-3 px-3 sm:px-4 font-medium">#{row.sessionNumber}</td>
                            <td className="py-3 px-3 sm:px-4 text-zinc-500">{row.executionDate}</td>
                            <td className="py-3 px-3 sm:px-4">
                              {formatCompactUSD(row.startBalance)}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-amber-500">
                              {formatCompactUSD(row.maxRiskAmount)}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-sky-500">
                              {formatCompactUSD(row.targetProfitAmount)}
                            </td>
                            <td
                              className={`py-3 px-3 sm:px-4 font-semibold ${
                                row.pnlAmount >= 0 ? "text-emerald-500" : "text-rose-500"
                              }`}
                            >
                              {row.pnlAmount >= 0
                                ? `+${formatCompactUSD(row.pnlAmount)}`
                                : formatCompactUSD(row.pnlAmount)}
                            </td>
                            <td className="py-3 px-3 sm:px-4">
                              {(row.dailyReturnPct * 100).toFixed(2)}%
                            </td>
                            <td
                              className={`py-3 px-3 sm:px-4 font-semibold ${
                                isDeficit ? "text-rose-500" : ""
                              }`}
                            >
                              {formatCompactUSD(row.endBalance)}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-xs">
                              {isDeficit ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-semibold">
                                  <AlertTriangle className="w-3 h-3" />
                                  Defisit -
                                  {formatCompactUSD(config.initialCapital - row.endBalance)}
                                </span>
                              ) : achievedDate ? (
                                <span className="text-emerald-500 font-medium">
                                  Setara Target {achievedDate}
                                </span>
                              ) : (
                                <span className="text-zinc-400">Menuju Target Pertama</span>
                              )}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(row.id)}
                                className="p-2 text-zinc-400 hover:text-rose-500 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Tabel Roadmap Berbasis Tanggal Kalender */}
              <section className="rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">
                      4. Jadwal Compounding Kalender ({roadmap[0]?.dateLabel} —{" "}
                      {metrics.estimatedEndDateLabel})
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {activeMarketInfo.scheduleNote} • Total {metrics.totalDaysRequired} Hari
                      Trading menuju {formatCompactUSD(config.targetCapital)}
                    </p>
                  </div>
                  <div className="inline-flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 overflow-x-auto no-scrollbar max-w-full">
                    {[
                      { id: "ALL", label: `Semua (${roadmap.length})` },
                      { id: "ACTIVE", label: "Target Berikutnya" },
                      { id: "PASSED", label: `Terlampaui (${metrics.safeDayAchieved})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setRoadmapFilter(tab.id as "ALL" | "PASSED" | "ACTIVE")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer ${
                          roadmapFilter === tab.id
                            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                            : "text-zinc-500"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm whitespace-nowrap">
                    <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-500">
                      <tr>
                        <th className="py-3 px-3 sm:px-4 font-medium">Tanggal</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Fase</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Modal Awal</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Target Profit</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Target Saldo Akhir</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Net Aktual Tgl Ini</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 tabular-nums">
                      {filteredRoadmap.map((r) => {
                        const isDay1Deficit = r.day === 1 && Boolean(drawdownAnalysis);
                        return (
                          <tr key={r.day} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                            <td className="py-2.5 px-3 sm:px-4">
                              <div className="font-semibold">{r.dateLabel}</div>
                              <div className="text-[11px] text-zinc-500">
                                {r.dayName} • Sesi #{r.day}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 text-xs text-zinc-500">{r.phase}</td>
                            <td className="py-2.5 px-3 sm:px-4">
                              {formatCompactUSD(r.startBalance)}
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 text-emerald-500">
                              +{formatCompactUSD(r.targetProfit)}
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 font-semibold">
                              {formatCompactUSD(r.targetEndBalance)}
                            </td>
                            <td className="py-2.5 px-3 sm:px-4">
                              {r.dailyNetPnlOnDate !== undefined ? (
                                <span
                                  className={`font-semibold ${
                                    r.dailyNetPnlOnDate >= 0 ? "text-emerald-500" : "text-rose-500"
                                  }`}
                                >
                                  {r.dailyNetPnlOnDate >= 0
                                    ? `+${formatCompactUSD(r.dailyNetPnlOnDate)}`
                                    : formatCompactUSD(r.dailyNetPnlOnDate)}
                                </span>
                              ) : (
                                <span className="text-xs text-zinc-400">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 sm:px-4">
                              {isDay1Deficit ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                                  <AlertTriangle className="w-3 h-3" /> DEFISIT MODAL
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    r.status === "TERLAMPAUI (Aman)"
                                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                      : r.status === "SEDANG DIJALANI"
                                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                  }`}
                                >
                                  {r.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}