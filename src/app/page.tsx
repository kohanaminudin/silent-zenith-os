"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AppSidebarLayout, NavSectionId } from "@/components/app-sidebar";
import { CompoundingAndMonteCarloView } from "@/components/compounding-monte-carlo";
import { JournalAndAnalyticsModule } from "@/components/journal-and-analytics";
import { AssistantHubModule } from "@/components/assistant-hub";
import { AdminPanelModule } from "@/components/admin-panel";
import { AuthGate } from "@/components/auth-gate";
import {
  CalendarModule,
  DashboardOverviewView,
  PeriodicReviewModule,
  PersonalFinanceModule,
  SettingsModule,
  TargetProjectModule,
  WithdrawalPlanView,
} from "@/components/finance-and-ops";
import { PageTransitionShell } from "@/components/motion-primitives";
import { useNewsAlertWatcher } from "@/lib/use-news-alert-watcher";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  AppSettings,
  BudgetItem,
  CashflowEntry,
  DebtItem,
  EconomicEvent,
  PeriodicReviewSnapshot,
  SavedCompoundingScenario,
  TradeItem,
  WithdrawalRecord,
} from "@/types/horizon";

function createInitialSettings(email: string, name: string): AppSettings {
  return {
    projectName: "Silent Zenith",
    initialCapitalUsd: 100,
    targetCapitalUsd: 1000000,
    userName: name || email.split("@")[0],
    userEmail: email,
    timezone: "Asia/Jakarta (WIB)",
    language: "Bahasa Indonesia",
    jisdorRate: 18269,
    wdCapRatioPct: 50,
    cashReserveUsd: 100,
    telegramChatId: "",
    quietHoursStart: 22,
    quietHoursEnd: 7,
    telegramEnabled: false,
  };
}

export default function SilentZenithFullOSPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [workspaceReady, setWorkspaceReady] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<NavSectionId>("dashboard");
  const [todayStr, setTodayStr] = useState<string>("");

  const [settings, setSettings] = useState<AppSettings>(() =>
    createInitialSettings("", "")
  );
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [scenarios, setScenarios] = useState<SavedCompoundingScenario[]>([
    {
      id: "SCN-DEFAULT",
      name: "Rencana Utama",
      targetUsd: 1000000,
      initialUsd: 100,
      returnPerCyclePct: 5,
      frequency: "Mingguan",
      wdMode: "dynamic_pct",
      wdCapPct: 50,
      feePerCycle: 0,
    },
  ]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([
    {
      id: "B-1",
      category: "Koneksi Internet & VPS Trading",
      amountIdr: 500000,
      active: true,
    },
  ]);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [cashflows, setCashflows] = useState<CashflowEntry[]>([]);
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isSyncingNews, setIsSyncingNews] = useState<boolean>(false);
  const [newsFeedStatus, setNewsFeedStatus] = useState<string>("Menunggu sync");
  const [reviews, setReviews] = useState<PeriodicReviewSnapshot[]>([]);

  const { latestAlertBanner, dismissAlertBanner } = useNewsAlertWatcher({
    events,
    settings,
  });

  // 1. Cek Sesi Login Supabase
  useEffect(() => {
    const supabase = getSupabaseBrowser();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthChecking(false);
      if (!nextSession) {
        setWorkspaceReady(false);
        setActiveTab("dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncLiveEconomicNews = useCallback(async () => {
    setIsSyncingNews(true);
    try {
      const res = await fetch("/api/economic-calendar", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat kalender");
      const json = await res.json();
      if (Array.isArray(json.events)) {
        setEvents((prev) => {
          const manualEvents = prev.filter((e) => e.source === "MANUAL");
          return [...manualEvents, ...json.events];
        });
        setNewsFeedStatus(
          json.source === "LIVE_FEED"
            ? `Live Feed (${json.count} rilis minggu ini)`
            : `Macro Schedule (${json.count} rilis)`
        );
      }
    } catch {
      setNewsFeedStatus("Offline Mode");
    } finally {
      setIsSyncingNews(false);
    }
  }, []);

  // 2. Muat Workspace Terisolasi Khusus User yang Sedang Login
  useEffect(() => {
    if (!session?.user?.email) return;

    const isoToday = new Date().toISOString().split("T")[0];
    setTodayStr(isoToday);

    const user = session.user;
    const userEmail = user.email!.toLowerCase();
    const displayName =
      (user.user_metadata?.full_name as string) || userEmail.split("@")[0];
    const localKey = `sz_workspace_v4_${user.id}`;

    const hydrateFromPayload = (parsed: any) => {
      const baseSettings = createInitialSettings(userEmail, displayName);
      setSettings({
        ...baseSettings,
        ...(parsed?.settings || {}),
        userEmail, // Selalu kunci email sesuai sesi login
      });
      setTrades(Array.isArray(parsed?.trades) ? parsed.trades : []);
      if (Array.isArray(parsed?.scenarios) && parsed.scenarios.length > 0) {
        setScenarios(parsed.scenarios);
      }
      setWithdrawals(
        Array.isArray(parsed?.withdrawals) ? parsed.withdrawals : []
      );
      if (Array.isArray(parsed?.budgets)) setBudgets(parsed.budgets);
      setDebts(Array.isArray(parsed?.debts) ? parsed.debts : []);
      setCashflows(
        Array.isArray(parsed?.cashflows)
          ? parsed.cashflows
          : [
              {
                id: "CF-INIT",
                date: isoToday,
                type: "DEPOSIT",
                description: "Modal Awal Akun Trading",
                amountUsd: 100,
                amountIdr: 1826900,
              },
            ]
      );
      setReviews(Array.isArray(parsed?.reviews) ? parsed.reviews : []);
    };

    const loadUserWorkspace = async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data } = await supabase
          .from("user_workspaces")
          .select("payload")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.payload && Object.keys(data.payload).length > 0) {
          hydrateFromPayload(data.payload);
        } else {
          const rawLocal = localStorage.getItem(localKey);
          hydrateFromPayload(rawLocal ? JSON.parse(rawLocal) : {});
        }
      } catch {
        const rawLocal = localStorage.getItem(localKey);
        hydrateFromPayload(rawLocal ? JSON.parse(rawLocal) : {});
      } finally {
        setWorkspaceReady(true);
      }
    };

    loadUserWorkspace();
    syncLiveEconomicNews();
  }, [session, syncLiveEconomicNews]);

  // 3. Simpan Otomatis ke LocalStorage & Cloud Supabase per User
  useEffect(() => {
    if (!workspaceReady || !session?.user?.email) return;

    const user = session.user;
    const localKey = `sz_workspace_v4_${user.id}`;
    const payload = {
      settings: { ...settings, userEmail: user.email!.toLowerCase() },
      trades,
      scenarios,
      withdrawals,
      budgets,
      debts,
      cashflows,
      reviews,
    };

    try {
      localStorage.setItem(localKey, JSON.stringify(payload));
    } catch {}

    const timer = setTimeout(() => {
      const supabase = getSupabaseBrowser();
      supabase
        .from("user_workspaces")
        .upsert(
          {
            user_id: user.id,
            user_email: user.email!.toLowerCase(),
            payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .then(() => {});
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    workspaceReady,
    session,
    settings,
    trades,
    scenarios,
    withdrawals,
    budgets,
    debts,
    cashflows,
    reviews,
  ]);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
  };

  const realizedPnl = useMemo(
    () =>
      trades.filter((t) => t.status !== "OPEN").reduce((s, t) => s + t.pnl, 0),
    [trades]
  );
  const totalWd = useMemo(
    () => withdrawals.reduce((s, w) => s + w.amountUsd, 0),
    [withdrawals]
  );
  const currentBalance = Number(
    (settings.initialCapitalUsd + realizedPnl - totalWd).toFixed(2)
  );
  const highImpactCount = useMemo(
    () => events.filter((e) => e.impact === "High").length,
    [events]
  );

  // Loading & Auth Gate
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#060911] text-slate-400 flex items-center justify-center text-xs font-mono">
        Memverifikasi sesi Silent Zenith OS...
      </div>
    );
  }

  if (!session?.user?.email) {
    return <AuthGate />;
  }

  if (!workspaceReady) {
    return (
      <div className="min-h-screen bg-[#060911] text-slate-400 flex items-center justify-center text-xs font-mono">
        Memuat workspace pribadi {session.user.email}...
      </div>
    );
  }

  const loggedInEmail = session.user.email.trim().toLowerCase();
  const isAdminUser = loggedInEmail === "kohanaminudin@gmail.com";

  const handleAddTradeWithBotNotify = (t: TradeItem) => {
    setTrades((prev) => [t, ...prev]);

    if (settings.telegramEnabled && settings.telegramChatId.trim()) {
      const projectedBalance =
        t.status !== "OPEN" ? currentBalance + t.pnl : currentBalance;
      fetch("/api/telegram/notify-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: settings.telegramChatId.trim(),
          type: "TRADE_LOGGED",
          payload: {
            ...t,
            newBalance: projectedBalance,
          },
        }),
      }).catch(() => {});
    }
  };

  const handleAddWithdrawalWithBotNotify = (wd: WithdrawalRecord) => {
    setWithdrawals((prev) => [wd, ...prev]);
    setCashflows((prev) => [
      {
        id: `CF-WD-${Date.now()}`,
        date: wd.date,
        type: "WITHDRAWAL",
        description: wd.note,
        amountUsd: wd.amountUsd,
        amountIdr: wd.amountUsd * wd.rateIdr,
      },
      ...prev,
    ]);

    if (settings.telegramEnabled && settings.telegramChatId.trim()) {
      fetch("/api/telegram/notify-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: settings.telegramChatId.trim(),
          type: "WITHDRAWAL_LOGGED",
          payload: {
            amountUsd: wd.amountUsd,
            amountIdr: wd.amountUsd * wd.rateIdr,
            date: wd.date,
            newBalance: Math.max(0, currentBalance - wd.amountUsd),
          },
        }),
      }).catch(() => {});
    }
  };

  const handleImportTrades = (incoming: TradeItem[]) => {
    const existingIds = new Set(trades.map((t) => t.id));
    const uniqueNew = incoming.filter((item) => !existingIds.has(item.id));
    if (uniqueNew.length > 0) {
      setTrades((prev) => [...uniqueNew, ...prev]);
    }
    return uniqueNew.length;
  };

  return (
    <AppSidebarLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      projectName={settings.projectName}
      currentBalance={currentBalance}
      targetBalance={settings.targetCapitalUsd}
      userName={settings.userName}
      userEmail={loggedInEmail}
      isOwner={isAdminUser}
      highImpactCount={highImpactCount}
      onLogout={handleLogout}
    >
      {latestAlertBanner && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-xs text-amber-200 shadow-lg">
          <span className="font-semibold">🔔 {latestAlertBanner}</span>
          <button
            type="button"
            onClick={dismissAlertBanner}
            className="ml-4 rounded px-2 py-0.5 text-amber-300 hover:bg-amber-500/20"
          >
            Tutup
          </button>
        </div>
      )}

      <PageTransitionShell tabKey={activeTab}>
        {activeTab === "dashboard" && (
          <DashboardOverviewView
            settings={settings}
            trades={trades}
            withdrawals={withdrawals}
            budgets={budgets}
            debts={debts}
            events={events}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === "assistant" && (
          <AssistantHubModule
            settings={settings}
            currentBalance={currentBalance}
            trades={trades}
            events={events}
            todayStr={todayStr}
          />
        )}

        {(activeTab === "journal" || activeTab === "analytics") && (
          <JournalAndAnalyticsModule
            mode={activeTab}
            trades={trades}
            currentBalance={currentBalance}
            todayStr={todayStr}
            onAddTrade={handleAddTradeWithBotNotify}
            onImportTrades={handleImportTrades}
            onDeleteTrade={(id) =>
              setTrades((prev) => prev.filter((item) => item.id !== id))
            }
          />
        )}

        {activeTab === "compounding" && (
          <CompoundingAndMonteCarloView
            defaultInitialUsd={settings.initialCapitalUsd}
            defaultTargetUsd={settings.targetCapitalUsd}
            savedScenarios={scenarios}
            onSaveScenario={(sc) => setScenarios((prev) => [...prev, sc])}
          />
        )}

        {activeTab === "withdrawal" && (
          <WithdrawalPlanView
            settings={settings}
            realizedPnl={realizedPnl}
            withdrawals={withdrawals}
            budgets={budgets}
            todayStr={todayStr}
            onAddWithdrawal={handleAddWithdrawalWithBotNotify}
            onUpdateRules={(capRatioPct, reserveUsd) =>
              setSettings((prev) => ({
                ...prev,
                wdCapRatioPct: capRatioPct,
                cashReserveUsd: reserveUsd,
              }))
            }
          />
        )}

        {activeTab === "target-project" && (
          <TargetProjectModule
            currentBalance={currentBalance}
            initialCapital={settings.initialCapitalUsd}
            targetBalance={settings.targetCapitalUsd}
          />
        )}

        {(activeTab === "monthly-needs" ||
          activeTab === "debts" ||
          activeTab === "cashflow") && (
          <PersonalFinanceModule
            mode={activeTab}
            budgets={budgets}
            debts={debts}
            cashflows={cashflows}
            todayStr={todayStr}
            onAddBudget={(item) => setBudgets((prev) => [...prev, item])}
            onDeleteBudget={(id) =>
              setBudgets((prev) => prev.filter((b) => b.id !== id))
            }
            onAddDebt={(item) => setDebts((prev) => [...prev, item])}
            onDeleteDebt={(id) =>
              setDebts((prev) => prev.filter((d) => d.id !== id))
            }
            onAddCashflow={(item) => setCashflows((prev) => [item, ...prev])}
          />
        )}

        {activeTab === "calendar" && (
          <CalendarModule
            trades={trades}
            events={events}
            todayStr={todayStr}
            isSyncingNews={isSyncingNews}
            newsFeedStatus={newsFeedStatus}
            onSyncLiveNews={syncLiveEconomicNews}
            onAddEvent={(ev) => setEvents((prev) => [ev, ...prev])}
          />
        )}

        {activeTab === "periodic-review" && (
          <PeriodicReviewModule
            snapshots={reviews}
            currentBalance={currentBalance}
            initialCapital={settings.initialCapitalUsd}
            totalWd={totalWd}
            todayStr={todayStr}
            onSaveSnapshot={(snap) => setReviews((prev) => [snap, ...prev])}
          />
        )}

        {activeTab === "settings" && (
          <SettingsModule
            settings={settings}
            onSaveSettings={(next) =>
              setSettings({ ...next, userEmail: loggedInEmail })
            }
          />
        )}

        {activeTab === "admin" && isAdminUser && (
          <AdminPanelModule
            adminEmail={loggedInEmail}
            accessToken={session.access_token}
          />
        )}
      </PageTransitionShell>
    </AppSidebarLayout>
  );
}