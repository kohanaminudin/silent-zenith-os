"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  TrendingUp,
  Wallet,
  Target,
  Receipt,
  CreditCard,
  ArrowLeftRight,
  Calendar,
  ClipboardCheck,
  Settings,
  Bot,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";

export type NavSectionId =
  | "dashboard"
  | "assistant"
  | "journal"
  | "analytics"
  | "compounding"
  | "withdrawal"
  | "target-project"
  | "monthly-needs"
  | "debts"
  | "cashflow"
  | "calendar"
  | "periodic-review"
  | "settings"
  | "admin";

export function AppSidebarLayout({
  activeTab,
  onSelectTab,
  projectName,
  currentBalance,
  targetBalance,
  userName,
  isOwner,
  highImpactCount,
  children,
}: {
  activeTab: NavSectionId;
  onSelectTab: (tab: NavSectionId) => void;
  projectName: string;
  currentBalance: number;
  targetBalance: number;
  userName: string;
  isOwner: boolean;
  highImpactCount: number;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navGroups: {
    group: string;
    items: {
      id: NavSectionId;
      label: string;
      icon: React.ReactNode;
      badge?: string;
    }[];
  }[] = [
    {
      group: "Command & Co-Pilot",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          id: "assistant",
          label: "Asisten Pribadi",
          icon: <Bot className="h-4 w-4 text-indigo-400" />,
          badge: "AI + BOT",
        },
      ],
    },
    {
      group: "Trading & Compounding",
      items: [
        {
          id: "journal",
          label: "Jurnal Trading",
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          id: "analytics",
          label: "Analitik Performa",
          icon: <BarChart3 className="h-4 w-4" />,
        },
        {
          id: "compounding",
          label: "Compounding & Monte Carlo",
          icon: <TrendingUp className="h-4 w-4" />,
        },
        {
          id: "target-project",
          label: "Target Project",
          icon: <Target className="h-4 w-4" />,
        },
      ],
    },
    {
      group: "Keuangan & Eksekusi",
      items: [
        {
          id: "withdrawal",
          label: "Withdrawal Plan (WD)",
          icon: <Wallet className="h-4 w-4" />,
        },
        {
          id: "monthly-needs",
          label: "Kebutuhan Bulanan",
          icon: <Receipt className="h-4 w-4" />,
        },
        {
          id: "debts",
          label: "Hutang & Kewajiban",
          icon: <CreditCard className="h-4 w-4" />,
        },
        {
          id: "cashflow",
          label: "Arus Kas (Ledger)",
          icon: <ArrowLeftRight className="h-4 w-4" />,
        },
      ],
    },
    {
      group: "Makro & Audit",
      items: [
        {
          id: "calendar",
          label: "Kalender & News",
          icon: <Calendar className="h-4 w-4" />,
          badge: highImpactCount > 0 ? `${highImpactCount}` : undefined,
        },
        {
          id: "periodic-review",
          label: "Review Periodik",
          icon: <ClipboardCheck className="h-4 w-4" />,
        },
        {
          id: "settings",
          label: "Pengaturan & Bot",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
  ];

  if (isOwner) {
    navGroups.push({
      group: "Administrasi Sistem",
      items: [
        {
          id: "admin",
          label: "Admin Panel",
          icon: <ShieldAlert className="h-4 w-4 text-amber-400" />,
          badge: "OWNER",
        },
      ],
    });
  }

  const progressPct =
    targetBalance > 0
      ? Math.min(100, Math.max(0, (currentBalance / targetBalance) * 100))
      : 0;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#090D16] border-r border-slate-800/90 p-4">
      <div className="space-y-5 overflow-y-auto pr-1">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold tracking-wider uppercase text-white">
              {projectName}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              COMPOUNDING OS v4.0
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mini Equity Tracker */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-3">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Balance Aktif</span>
            <span className="font-mono text-emerald-400">
              {progressPct.toFixed(2)}%
            </span>
          </div>
          <div className="mt-1 text-base font-mono font-bold text-white">
            ${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.max(2, progressPct)}%` }}
            />
          </div>
        </div>

        {/* Nav Groups */}
        <nav className="space-y-4">
          {navGroups.map((g) => (
            <div key={g.group}>
              <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {g.group}
              </div>
              <div className="space-y-1">
                {g.items.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        active
                          ? "bg-indigo-600/20 text-white border border-indigo-500/40"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-300">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer User */}
      <div className="pt-3 border-t border-slate-800/80 text-xs">
        <div className="font-semibold text-white truncate">{userName}</div>
        <div className="text-[11px] text-emerald-400">
          ● Co-Pilot & Telegram Sync Ready
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 h-full">{sidebarContent}</div>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between border-b border-slate-800 bg-[#090D16] px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-slate-300 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold tracking-wider uppercase text-white">
            {projectName}
          </span>
          <span className="font-mono text-xs text-emerald-400">
            ${currentBalance.toFixed(0)}
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}