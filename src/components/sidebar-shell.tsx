"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpenCheck,
  TrendingUp,
  ListChecks,
  Calculator,
  BarChart3,
  History,
  FileSpreadsheet,
  Sliders,
  ShieldAlert,
  UserCog,
  Crown,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { NavSectionId } from "@/types/trading-system";
import { ZenithLogo, formatCompactUSD } from "./brand-and-chart";
import { StaffOrUserRole } from "./auth-and-admin";

interface NavItem {
  id: NavSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

export function SidebarShell({
  activeNav,
  onSelectNav,
  userName,
  userRole,
  currentBalance,
  targetCapital,
  progressPct,
  hasStaffAccess,
  staffCount,
  onLogout,
  children,
}: {
  activeNav: NavSectionId;
  onSelectNav: (id: NavSectionId) => void;
  userName: string;
  userRole: StaffOrUserRole;
  currentBalance: number;
  targetCapital: number;
  progressPct: number;
  hasStaffAccess: boolean;
  staffCount: number;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("zenith_sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("zenith_sidebar_collapsed", String(next));
      return next;
    });
  };

  const navGroups: NavGroup[] = [
    {
      section: "OVERVIEW",
      items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      section: "TRADING SYSTEM",
      items: [
        { id: "jurnal-trading", label: "Jurnal Trading", icon: BookOpenCheck },
        { id: "compounding-journal", label: "Compounding Journal", icon: TrendingUp },
        { id: "checklist-analisis", label: "Checklist Analisis", icon: ListChecks },
        { id: "lot-recommendation", label: "Lot Recommendation", icon: Calculator },
      ],
    },
    {
      section: "PERFORMANCE",
      items: [
        { id: "trading-statistics", label: "Trading Statistics", icon: BarChart3 },
        { id: "trade-history", label: "Trade History", icon: History },
        { id: "performance-reports", label: "Performance Reports", icon: FileSpreadsheet },
      ],
    },
    {
      section: "SETTINGS",
      items: [
        { id: "sop-settings", label: "Trading SOP Settings", icon: Sliders },
        { id: "risk-settings", label: "Risk Management Settings", icon: ShieldAlert },
        { id: "profile-preferences", label: "Profile & Preferences", icon: UserCog },
        ...(hasStaffAccess
          ? [
              {
                id: "admin-panel" as NavSectionId,
                label: userRole === "moderator" ? "Moderator Panel" : "Command Admin",
                icon: userRole === "moderator" ? ShieldCheck : Crown,
                badge: String(staffCount),
              },
            ]
          : []),
      ],
    },
  ];

  const handleNavClick = (id: NavSectionId) => {
    onSelectNav(id);
    setMobileOpen(false);
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const isCompact = !isMobile && collapsed;

    return (
      <div className="flex flex-col h-full bg-[#0D1322] border-r border-slate-800/80 text-slate-200 select-none">
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <ZenithLogo className="w-8 h-8 shrink-0" />
            {!isCompact && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-white truncate">
                    SILENT ZENITH
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  Trading & Compounding OS
                </p>
              </div>
            )}
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleCollapse}
              title={collapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer"
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.section} className="space-y-1">
              {!isCompact && (
                <div className="px-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-slate-500">
                  {group.section}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    title={isCompact ? item.label : undefined}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-xs"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-violet-400" : "text-slate-400"
                        }`}
                      />
                      {!isCompact && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isCompact && item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Project Progress & User Footer (Horizon Style) */}
        <div className="p-3 border-t border-slate-800/80 space-y-3 shrink-0 bg-[#0A0F1D]">
          {!isCompact && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Project Progress</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  {Math.min(100, Math.max(0, progressPct)).toFixed(2)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(2, progressPct))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
                <span>{formatCompactUSD(currentBalance)}</span>
                <span>Target {formatCompactUSD(targetCapital)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 px-1">
            {!isCompact && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{userName}</p>
                <p className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">
                  {userRole}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={onLogout}
              title="Keluar Akun"
              className="p-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer shrink-0 mx-auto"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[#080D1A] text-slate-100 flex">
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ${
          collapsed ? "w-[74px]" : "w-64"
        }`}
      >
        <div className="fixed top-0 bottom-0 left-0 z-30 transition-all duration-300" style={{ width: collapsed ? 74 : 256 }}>
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            <SidebarContent isMobile />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Context Bar */}
        <header className="sticky top-0 z-20 h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-[#0B1120]/90 backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 hidden sm:block">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs font-semibold text-white sm:hidden truncate">
                Silent Zenith OS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 tabular-nums">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Balance:</span>
              <span className="font-bold text-emerald-400">
                {formatCompactUSD(currentBalance)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectNav("lot-recommendation")}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              + Kalkulator & Trade Baru
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}