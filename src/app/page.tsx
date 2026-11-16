"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  TrendingUp,
  Target,
  Activity,
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
  Wrench,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  CompoundingConfig,
  JournalEntryInput,
} from "@/types/compounding";
import {
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

const DEFAULT_CONFIG: CompoundingConfig = {
  initialCapital: 49.33,
  targetCapital: 1000000000,
  dailyTargetPct: 0.1,
  riskPerDayPct: 0.05,
  selectedDay: 1,
};

const TARGET_PRESETS = [
  { label: "$1M", value: 1_000_000 },
  { label: "$10M", value: 10_000_000 },
  { label: "$100M", value: 100_000_000 },
  { label: "$1B", value: 1_000_000_000 },
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
  const [newDate, setNewDate] = useState<string>("");
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
      setProfile(prof as UserProfileRecord);
      setConfig({
        initialCapital: Number(prof.initial_capital),
        targetCapital: Number(prof.target_capital),
        dailyTargetPct: Number(prof.daily_target_pct),
        riskPerDayPct: Number(prof.risk_per_day_pct),
        selectedDay: Number(prof.selected_day),
      });

      if (prof.role === "super_admin") {
        await loadAdminDirectory();
      }
    }

    const { data: journalRows } = await supabase
      .from("daily_journals")
      .select("*")
      .eq("user_id", uid)
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
    setNewDate(new Date().toISOString().split("T")[0]);
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
      })
      .eq("id", userId);
  };

  const roadmap = useMemo(() => {
    const baseRoadmap = generateDynamicRoadmap(config, config.initialCapital);
    const provisional = computeJournals(config, journals, baseRoadmap);
    const latestBal =
      provisional.length > 0
        ? provisional[provisional.length - 1].endBalance
        : config.initialCapital;
    return generateDynamicRoadmap(config, latestBal);
  }, [config, journals]);

  const computedJournals = useMemo(
    () => computeJournals(config, journals, roadmap),
    [config, journals, roadmap]
  );

  const metrics = useMemo(
    () => computeDashboardMetrics(config, roadmap, computedJournals),
    [config, roadmap, computedJournals]
  );

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
    setJournals((prev) => [
      ...prev,
      {
        id: data.id,
        sessionNumber: data.session_number,
        executionDate: data.execution_date,
        pnlAmount: Number(data.pnl_amount),
      },
    ]);
    setNewPnl("");

    if (projectedBalance < config.initialCapital) {
      triggerToast(
        `PERINGATAN DRAWDOWN: Saldo turun ke ${formatCompactUSD(projectedBalance)}!`
      );
    } else {
      triggerToast(
        `Sesi #${nextSession} (${parsed >= 0 ? `+$${parsed}` : `-$${Math.abs(parsed)}`}) tersimpan!`
      );
    }
    if (profile?.role === "super_admin") loadAdminDirectory();
  };

  const handleDeleteSession = async (id: string) => {
    if (!userId) return;
    await supabase.from("daily_journals").delete().eq("id", id);
    const updated = journals
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, sessionNumber: idx + 1 }));
    setJournals(updated);
    triggerToast("Sesi dihapus dari cloud.");
    if (profile?.role === "super_admin") loadAdminDirectory();
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
      selectedDay: 1,
    });
    triggerToast(
      `Basis modal diperbarui ke ${formatCompactUSD(metrics.currentBalance)}. Siklus baru dimulai!`
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
    triggerToast(msg.trim() ? "Pengumuman global dipublikasikan!" : "Banner pengumuman disembunyikan.");
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
      DAY: `Day ${r.day}`,
      Fase: r.phase,
      "Modal Awal ($)": Number(r.startBalance.toFixed(2)),
      "Target Profit ($)": Number(r.targetProfit.toFixed(2)),
      "Target Saldo Akhir ($)": Number(r.targetEndBalance.toFixed(2)),
      "Pertumbuhan (%)": `${(r.cumulativeGrowthPct * 100).toFixed(2)}%`,
      Status: r.status,
    }));

    const journalSheetData = computedJournals.map((j) => ({
      "Sesi Ke-": j.sessionNumber,
      Tanggal: j.executionDate,
      "Saldo Awal ($)": Number(j.startBalance.toFixed(2)),
      "Profit / Loss ($)": Number(j.pnlAmount.toFixed(2)),
      "Saldo Akhir ($)": Number(j.endBalance.toFixed(2)),
      "Day Aman": j.safeDayAchieved,
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(roadmapSheetData), "Roadmap Dinamis");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(journalSheetData), "Jurnal Harian");
    XLSX.writeFile(wb, `SilentZenith_Day1_to_Day${metrics.totalDaysRequired}.xlsx`);
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
          if (!Number.isNaN(pnlVal) && pnlVal !== 0) {
            toInsert.push({
              user_id: userId,
              session_number: journals.length + toInsert.length + 1,
              execution_date: newDate,
              pnl_amount: pnlVal,
            });
          }
        });

        if (toInsert.length > 0) {
          await supabase.from("daily_journals").insert(toInsert);
          await bootstrapSession();
          triggerToast(`${toInsert.length} sesi berhasil diimpor ke database!`);
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
            Akses akun Anda telah ditangguhkan oleh Super Admin. Hubungi administrator sistem untuk aktivasi ulang.
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

  const isSuperAdmin = profile.role === "super_admin";

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-[100dvh] bg-zinc-50 text-zinc-900 dark:bg-[#09090B] dark:text-zinc-100 transition-colors duration-300 selection:bg-emerald-500/30">
        {/* Global Broadcast Banner */}
        {announcement && (
          <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2">
            <Megaphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="line-clamp-2">{announcement}</span>
          </div>
        )}

        {/* Modal Pengaturan & Ganti Password */}
        <AccountSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          profile={profile}
          onProfileUpdated={(newName) => setProfile({ ...profile, full_name: newName })}
          onNotify={triggerToast}
        />

        {/* Toast Notification (Responsif di Mobile & Desktop) */}
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

        {/* Navbar Adaptif (iOS Safe-Area + Mobile/Tablet/Desktop) */}
        <header className="sticky top-0 z-30 safe-top border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-[#09090B]/85 backdrop-blur-xl transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <ZenithLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xs sm:text-sm font-bold tracking-tight uppercase truncate">
                    Silent Zenith
                  </h1>
                  {isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
                      <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden xs:inline">Super</span> Admin
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                      Member
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {profile.full_name} •{" "}
                  <span className="font-semibold text-emerald-500">
                    {formatCompactUSD(config.targetCapital)}
                  </span>
                </p>
              </div>
            </div>

            {/* Switcher Desktop/Tablet */}
            {isSuperAdmin && (
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
                      ? "bg-amber-500 text-zinc-950 shadow-xs"
                      : "text-amber-500 hover:bg-amber-500/10"
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Admin Panel ({allUsers.length})</span>
                </button>
              </div>
            )}

            {/* Action Buttons (Touch-Friendly >= 40px) */}
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

          {/* Mobile Sub-Navigation Bar untuk Super Admin (Layar HP < 768px) */}
          {isSuperAdmin && (
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
                      ? "bg-amber-500 text-zinc-950 shadow-xs"
                      : "text-amber-500"
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Admin Panel ({allUsers.length})</span>
                </button>
              </div>
            </div>
          )}
        </header>

        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 safe-bottom space-y-5 sm:space-y-8">
          {isSuperAdmin && activeView === "admin" ? (
            <SuperAdminPanel
              allUsers={allUsers}
              currentAnnouncement={announcement}
              onRefreshUsers={loadAdminDirectory}
              onPostAnnouncement={handlePostAnnouncement}
              onNotify={triggerToast}
            />
          ) : (
            <>
              {/* DRAWDOWN ALERT & RECOVERY PROTOCOL BANNER */}
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
                              {drawdownAnalysis.sessionsToRecoverAtTarget} sesi profit konsisten
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

              {/* Bento KPI Grid (1 kolom HP -> 2 kolom Tablet -> 4 kolom Desktop) */}
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
                  <p className="mt-1.5 text-xs text-zinc-500">
                    Target Day {config.selectedDay}: {formatCompactUSD(metrics.selectedDayEndTarget)}
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
                    Daya Tahan SL Beruntun: <span className="font-semibold">{metrics.consecutiveLossEndurance}x</span>
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                  <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
                    <span>Posisi Day Aman</span>
                    <Activity className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="mt-2.5 sm:mt-3 text-2xl font-bold tracking-tight tabular-nums">
                    Day {metrics.safeDayAchieved}{" "}
                    <span className="text-sm font-normal text-zinc-400">/ {metrics.totalDaysRequired}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500 truncate">
                    Target Akhir: <span className="font-semibold">{formatCompactUSD(config.targetCapital)}</span>
                  </p>
                </div>
              </section>

              {/* Chart */}
              <CompoundingTrajectoryChart
                roadmap={roadmap}
                journals={computedJournals}
                initialCapital={config.initialCapital}
              />

              {/* Controls & Form */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">1. Parameter Misi & Risk</h2>
                    <button
                      type="button"
                      onClick={() => syncConfigToCloud(DEFAULT_CONFIG)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 py-1 px-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <label className="text-xs text-zinc-500">Target Akhir ($)</label>
                      <div className="flex items-center gap-1">
                        {TARGET_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => syncConfigToCloud({ ...config, targetCapital: preset.value })}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
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
                          targetCapital: Math.max(config.initialCapital + 1, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-full px-3 py-2.5 text-sm font-semibold tabular-nums rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Modal Awal ($)</label>
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
                        className="w-full px-3 py-2.5 text-sm tabular-nums rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Pilih Day (1-{metrics.totalDaysRequired})
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={metrics.totalDaysRequired}
                        value={config.selectedDay}
                        onChange={(e) =>
                          syncConfigToCloud({
                            ...config,
                            selectedDay: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="w-full px-3 py-2.5 text-sm tabular-nums rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Target Harian (%)</label>
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
                        className="w-full px-3 py-2.5 text-sm tabular-nums rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Risk per Hari (%)</label>
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
                        className="w-full px-3 py-2.5 text-sm tabular-nums rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                      />
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleAddSession}
                  className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col justify-between space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <h2 className="text-sm font-semibold">2. Catat Hasil Sesi Eksekusi Baru</h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Tersimpan aman secara real-time di akun cloud Anda.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewPnl(String(Number(metrics.targetProfitToday.toFixed(2))))}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-500 cursor-pointer inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> +Target 1x
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPnl(String(Number((metrics.targetProfitToday * 2).toFixed(2))))}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-500 cursor-pointer"
                      >
                        +Target 2x
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPnl(String(-Number(metrics.maxRiskToday.toFixed(2))))}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-500 cursor-pointer"
                      >
                        -Max SL
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Tanggal Eksekusi</label>
                      <input
                        type="date"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Profit / Loss ($)</label>
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
                        <Plus className="w-4 h-4" /> Simpan Sesi
                      </button>
                    </div>
                  </div>
                </form>
              </section>

              {/* Tabel Jurnal (Dilengkapi tombol Import/Export mobile-friendly) */}
              <section className="rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold">3. Jurnal Eksekusi Harian</h2>
                    <span className="text-xs text-zinc-500">{computedJournals.length} Sesi Tercatat</span>
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
                        <th className="py-3 px-3 sm:px-4 font-medium">Sesi</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Tanggal</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Saldo Awal</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Batas Risk</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Target Profit</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Profit / Loss</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Return</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Saldo Akhir</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Status Checkpoint</th>
                        <th className="py-3 px-3 sm:px-4 font-medium text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 tabular-nums">
                      {computedJournals.map((row) => {
                        const isDeficit = row.endBalance < config.initialCapital;
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
                            <td className="py-3 px-3 sm:px-4">{formatCompactUSD(row.startBalance)}</td>
                            <td className="py-3 px-3 sm:px-4 text-amber-500">{formatCompactUSD(row.maxRiskAmount)}</td>
                            <td className="py-3 px-3 sm:px-4 text-sky-500">{formatCompactUSD(row.targetProfitAmount)}</td>
                            <td
                              className={`py-3 px-3 sm:px-4 font-semibold ${
                                row.pnlAmount >= 0 ? "text-emerald-500" : "text-rose-500"
                              }`}
                            >
                              {row.pnlAmount >= 0
                                ? `+${formatCompactUSD(row.pnlAmount)}`
                                : formatCompactUSD(row.pnlAmount)}
                            </td>
                            <td className="py-3 px-3 sm:px-4">{(row.dailyReturnPct * 100).toFixed(2)}%</td>
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
                                  Defisit -{formatCompactUSD(config.initialCapital - row.endBalance)}
                                </span>
                              ) : (
                                <span className="text-emerald-500 font-medium">
                                  Aman s/d Day {row.safeDayAchieved}
                                </span>
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

              {/* Tabel Roadmap */}
              <section className="rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">
                      4. Roadmap Compounding Dinamis (Day 1 — Day {metrics.totalDaysRequired})
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Menuju {formatCompactUSD(config.targetCapital)}
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
                        <th className="py-3 px-3 sm:px-4 font-medium">Day</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Fase</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Modal Awal</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Target Profit</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Target Saldo Akhir</th>
                        <th className="py-3 px-3 sm:px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 tabular-nums">
                      {filteredRoadmap.map((r) => {
                        const isDay1Deficit = r.day === 1 && Boolean(drawdownAnalysis);
                        return (
                          <tr key={r.day} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                            <td className="py-2.5 px-3 sm:px-4 font-medium">Day {r.day}</td>
                            <td className="py-2.5 px-3 sm:px-4 text-xs text-zinc-500">{r.phase}</td>
                            <td className="py-2.5 px-3 sm:px-4">{formatCompactUSD(r.startBalance)}</td>
                            <td className="py-2.5 px-3 sm:px-4 text-emerald-500">
                              +{formatCompactUSD(r.targetProfit)}
                            </td>
                            <td className="py-2.5 px-3 sm:px-4 font-semibold">{formatCompactUSD(r.targetEndBalance)}</td>
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