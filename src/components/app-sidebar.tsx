"use client";

import React, { useState } from "react";
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
  children,
}: AppSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);

  const progressPct =
    targetBalance > 0
      ? Math.min(100, Math.max(0, (currentBalance / targetBalance) * 100))
      : 0;

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const handleNav = (id: NavSectionId) => {
    onSelectTab(id);
    setMobileOpen(false);
  };

  const navItemClass = (id: NavSectionId) => {
    const isActive = activeTab === id;
    return `group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
      isActive
        ? "bg-gradient-to-r from-indigo-500/25 to-purple-500/15 text-white border border-indigo-400/30 shadow-sm"
        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent"
    }`;
  };

  const iconClass = (id: NavSectionId) =>
    activeTab === id
      ? "h-4 w-4 text-indigo-400 shrink-0"
      : "h-4 w-4 text-slate-500 group-hover:text-slate-300 shrink-0";

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#0F172A] border-r border-slate-800/90 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-white">
              {projectName}
            </span>
            <span className="block text-[10px] font-medium text-emerald-400/90">
              Compounding OS
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
          <button
            onClick={() => handleNav("dashboard")}
            className={navItemClass("dashboard")}
          >
            <LayoutDashboard className={iconClass("dashboard")} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleNav("journal")}
            className={navItemClass("journal")}
          >
            <BookOpen className={iconClass("journal")} />
            <span>Jurnal Trading</span>
          </button>
        </div>

        {/* PLAN & STRATEGI */}
        <div className="space-y-1">
          <button
            onClick={() => setPlanOpen(!planOpen)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
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
              <button
                onClick={() => handleNav("compounding")}
                className={navItemClass("compounding")}
              >
                <TrendingUp className={iconClass("compounding")} />
                <span>Compounding</span>
              </button>

              <button
                onClick={() => handleNav("withdrawal")}
                className={navItemClass("withdrawal")}
              >
                <Wallet className={iconClass("withdrawal")} />
                <span>Withdrawal (WD)</span>
              </button>

              <button
                onClick={() => handleNav("target-project")}
                className={navItemClass("target-project")}
              >
                <Target className={iconClass("target-project")} />
                <span>Target Project</span>
              </button>
            </div>
          )}
        </div>

        {/* KEUANGAN PRIBADI */}
        <div className="space-y-1">
          <button
            onClick={() => setFinanceOpen(!financeOpen)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
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
              <button
                onClick={() => handleNav("monthly-needs")}
                className={navItemClass("monthly-needs")}
              >
                <Receipt className={iconClass("monthly-needs")} />
                <span>Kebutuhan Bulanan</span>
              </button>

              <button
                onClick={() => handleNav("debts")}
                className={navItemClass("debts")}
              >
                <CreditCard className={iconClass("debts")} />
                <span>Hutang</span>
              </button>

              <button
                onClick={() => handleNav("cashflow")}
                className={navItemClass("cashflow")}
              >
                <ArrowLeftRight className={iconClass("cashflow")} />
                <span>Arus Kas</span>
              </button>
            </div>
          )}
        </div>

        {/* ANALISIS & SISTEM */}
        <div className="space-y-1 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => handleNav("analytics")}
            className={navItemClass("analytics")}
          >
            <BarChart3 className={iconClass("analytics")} />
            <span>Laporan & Analisis</span>
          </button>

          <button
            onClick={() => handleNav("calendar")}
            className={navItemClass("calendar")}
          >
            <CalendarDays className={iconClass("calendar")} />
            <span>Kalender</span>
          </button>

          <button
            onClick={() => handleNav("periodic-review")}
            className={navItemClass("periodic-review")}
          >
            <ClipboardCheck className={iconClass("periodic-review")} />
            <span>Review Periodik</span>
          </button>

          <button
            onClick={() => handleNav("settings")}
            className={navItemClass("settings")}
          >
            <Settings className={iconClass("settings")} />
            <span>Pengaturan</span>
          </button>
        </div>
      </nav>

      {/* Bottom Project Progress Card (Persis seperti PDF) */}
      <div className="p-3.5 border-t border-slate-800/80 shrink-0 bg-[#0B1120]/60">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-400">Project Progress</span>
            <span className="font-bold text-emerald-400">
              {progressPct.toFixed(2)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${Math.max(progressPct, progressPct > 0 ? 3 : 0)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {progressPct.toFixed(2)}% dari target{" "}
            <span className="text-slate-200 font-semibold">
              ${targetBalance.toLocaleString("en-US")}
            </span>
          </p>
        </div>
        <div className="mt-2.5 text-center text-[11px] text-slate-500">
          Silent Zenith OS v2.0
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0B1120] text-slate-100">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-[80vw] h-full">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        {/* Top Header Bar (Persis referensi PDF kanan atas) */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#0B1120]/90 px-4 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800"
              aria-label="Buka navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
            {isOwner && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                OWNER
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Date Badge */}
            <div className="hidden sm:flex items-center rounded-lg border border-slate-800 bg-slate-900/90 px-3.5 py-1.5 text-xs font-medium text-slate-300">
              {formattedDate}
            </div>

            {/* Notification Bell */}
            <button
              className="relative rounded-lg border border-slate-800 bg-slate-900/90 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Notifikasi Sistem"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </button>

            {/* User Avatar Pill */}
            <button
              onClick={() => handleNav("settings")}
              className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900 py-1 pl-1.5 pr-2.5 hover:border-indigo-500/50 transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
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