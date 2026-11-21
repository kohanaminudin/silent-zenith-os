"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Wallet,
  Target,
  Receipt,
  CreditCard,
  ArrowLeftRight,
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  Bell,
  Menu,
  X,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { AnimatedMetric, LiveSessionTelemetry } from "@/components/motion-primitives";

export type NavSectionId =
  | "dashboard"
  | "journal"
  | "compounding"
  | "withdrawal"
  | "target-project"
  | "monthly-needs"
  | "debts"
  | "cashflow"
  | "analytics"
  | "calendar"
  | "periodic-review"
  | "settings";

interface AppSidebarProps {
  activeTab: NavSectionId;
  onSelectTab: (tab: NavSectionId) => void;
  projectName?: string;
  currentBalance: number;
  targetBalance: number;
  userName?: string;
  isOwner?: boolean;
  highImpactCount?: number;
  children: React.ReactNode;
}

export function AppSidebarLayout({
  activeTab,
  onSelectTab,
  projectName = "Silent Zenith",
  currentBalance,
  targetBalance,
  userName = "Kohan Aminudin",
  isOwner = true,
  highImpactCount = 0,
  children,
}: AppSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    setFormattedDate(
      new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date())
    );
  }, []);

  const progressPct =
    targetBalance > 0
      ? Math.min(100, Math.max(0, (currentBalance / targetBalance) * 100))
      : 0;

  const handleNav = (id: NavSectionId) => {
    onSelectTab(id);
    setMobileOpen(false);
  };

  const renderNavButton = (
    id: NavSectionId,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    badge?: number
  ) => {
    const isActive = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => handleNav(id)}
        className={`relative group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
          isActive
            ? "text-white"
            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="silentZenithActiveNav"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/25 via-sky-500/15 to-emerald-500/10 border border-indigo-400/35 shadow-sm"
          />
        )}
        <span className="relative z-10 flex items-center gap-3">
          <Icon
            className={`h-4 w-4 shrink-0 transition-colors ${
              isActive
                ? "text-sky-400"
                : "text-slate-500 group-hover:text-slate-300"
            }`}
          />
          <span>{label}</span>
        </span>
        {badge !== undefined && badge > 0 && (
          <span className="relative z-10 rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-mono font-bold text-amber-300">
            {badge}
          </span>
        )}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#0A0F1D] border-r border-slate-800/90 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-400/30 text-emerald-400 shadow-inner">
            <Activity className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-white">
              {projectName}
            </span>
            <span className="block text-[10px] font-mono uppercase tracking-wider text-emerald-400/90">
              Macro Quant OS
            </span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Tutup menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Core Section */}
        <div className="space-y-1">
          {renderNavButton("dashboard", "Dashboard", LayoutDashboard)}
          {renderNavButton("journal", "Jurnal Trading", BookOpen)}
        </div>

        {/* PLAN & STRATEGI */}
        <div className="space-y-1">
          <button
            onClick={() => setPlanOpen(!planOpen)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
          >
            <span>Plan & Strategi</span>
            {planOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {planOpen && (
            <div className="space-y-1 pt-0.5">
              {renderNavButton("compounding", "Compounding", TrendingUp)}
              {renderNavButton("withdrawal", "Withdrawal (WD)", Wallet)}
              {renderNavButton("target-project", "Target Project", Target)}
            </div>
          )}
        </div>

        {/* KEUANGAN PRIBADI */}
        <div className="space-y-1">
          <button
            onClick={() => setFinanceOpen(!financeOpen)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
          >
            <span>Keuangan Pribadi</span>
            {financeOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {financeOpen && (
            <div className="space-y-1 pt-0.5">
              {renderNavButton("monthly-needs", "Kebutuhan Bulanan", Receipt)}
              {renderNavButton("debts", "Hutang", CreditCard)}
              {renderNavButton("cashflow", "Arus Kas", ArrowLeftRight)}
            </div>
          )}
        </div>

        {/* ANALISIS & SISTEM */}
        <div className="space-y-1 border-t border-slate-800/80 pt-3">
          {renderNavButton("analytics", "Laporan & Analisis", BarChart3)}
          {renderNavButton(
            "calendar",
            "Kalender & News",
            CalendarDays,
            highImpactCount
          )}
          {renderNavButton("periodic-review", "Review Periodik", ClipboardCheck)}
          {renderNavButton("settings", "Pengaturan", Settings)}
        </div>
      </nav>

      {/* Bottom Project Progress Card */}
      <div className="p-3.5 border-t border-slate-800/80 shrink-0 bg-[#070B14]/80">
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/90 p-3.5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-400">Project Progress</span>
            <AnimatedMetric
              value={progressPct}
              suffix="%"
              decimals={2}
              className="font-bold text-emerald-400"
            />
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.max(progressPct, progressPct > 0 ? 3 : 0)}%`,
              }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400"
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400 tabular-nums">
            {progressPct.toFixed(2)}% dari target{" "}
            <span className="text-slate-200 font-semibold">
              ${targetBalance.toLocaleString("en-US")}
            </span>
          </p>
        </div>
        <div className="mt-2.5 text-center font-mono text-[10px] tracking-wider text-slate-500">
          SILENT ZENITH TERMINAL v3.0
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#070B14] text-slate-100">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="relative z-10 w-64 max-w-[82vw] h-full"
            >
              <SidebarContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#070B14]/90 px-4 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800"
              aria-label="Buka navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
            {isOwner && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-mono font-semibold text-amber-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                OWNER DESK
              </span>
            )}
            <LiveSessionTelemetry />
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {formattedDate && (
              <div className="hidden md:flex items-center rounded-lg border border-slate-800 bg-slate-900/90 px-3.5 py-1.5 text-xs font-medium text-slate-300">
                {formattedDate}
              </div>
            )}

            <button
              onClick={() => handleNav("calendar")}
              className="relative rounded-lg border border-slate-800 bg-slate-900/90 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Kalender Berita Ekonomi"
            >
              <Bell className="h-4 w-4" />
              {highImpactCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => handleNav("settings")}
              className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900 py-1 pl-1.5 pr-2.5 hover:border-indigo-500/50 transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-xs font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 px-4 py-6 sm:px-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}