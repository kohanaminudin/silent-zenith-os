"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppSidebarLayout, NavSectionId } from "@/components/app-sidebar";
import { CompoundingAndMonteCarloView } from "@/components/compounding-monte-carlo";
import { JournalAndAnalyticsModule } from "@/components/journal-and-analytics";
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

const DEFAULT_SETTINGS: AppSettings = {
  projectName: "Silent Zenith",
  initialCapitalUsd: 100,
  targetCapitalUsd: 1000000,
  userName: "Kohan Aminudin",
  userEmail: "kohanaminudin@gmail.com",
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

export default function SilentZenithFullOSPage() {
  const [activeTab, setActiveTab] = useState<NavSectionId>("dashboard");
  const [todayStr, setTodayStr] = useState<string>("");

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [trades, setTrades] = useState<TradeItem[]>([
    {
      id: "TRD-INIT-01",
      date: "2026-11-16",
      account: "Akun Utama (USD)",
      pair: "XAUUSD",
      direction: "Buy (Long)",
      lot: 0.1,
      entry: 2612.5,
      sl: 2605.0,
      tp: 2628.0,
      exit: 2628.0,
      commission: 0,
      rMultiple: 2.07,
      pnl: 87.27,
      status: "WIN",
      session: "London-NY Overlap",
      timeframe: "M15/H1",
      setup: "ICT Liquidity Sweep + Engulfing",
      marketContext: "HTF Bullish BOS + SSL Sweep sesi London",
      notes: "Eksekusi disiplin sesuai SOP",
      checklist: {
        plan: true,
        slSet: true,
        rrMin: true,
        noNews: true,
        calmMind: true,
      },
    },
  ]);

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
    {
      id: "B-2",
      category: "Kebutuhan Operasional Bulanan",
      amountIdr: 2000000,
      active: true,
    },
  ]);
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [cashflows, setCashflows] = useState<CashflowEntry[]>([
    {
      id: "CF-1",
      date: "2026-11-16",
      type: "DEPOSIT",
      description: "Modal Awal Akun Trading",
      amountUsd: 100,
      amountIdr: 1826900,
    },
  ]);

  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isSyncingNews, setIsSyncingNews] = useState<boolean>(false);
  const [newsFeedStatus, setNewsFeedStatus] = useState<string>("Menunggu sync");
  const [reviews, setReviews] = useState<PeriodicReviewSnapshot[]>([]);

  const { latestAlertBanner, dismissAlertBanner } = useNewsAlertWatcher({
    events,
    settings,
  });

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

  useEffect(() => {
    const isoToday = new Date().toISOString().split("T")[0];
    setTodayStr(isoToday);

    try {
      const raw = localStorage.getItem("silent_zenith_horizon_v3");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.trades) setTrades(parsed.trades);
        if (parsed.scenarios) setScenarios(parsed.scenarios);
        if (parsed.withdrawals) setWithdrawals(parsed.withdrawals);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.debts) setDebts(parsed.debts);
        if (parsed.cashflows) setCashflows(parsed.cashflows);
        if (parsed.reviews) setReviews(parsed.reviews);
      }
    } catch {}

    syncLiveEconomicNews();
  }, [syncLiveEconomicNews]);

  useEffect(() => {
    if (!todayStr) return;
    try {
      localStorage.setItem(
        "silent_zenith_horizon_v3",
        JSON.stringify({
          settings,
          trades,
          scenarios,
          withdrawals,
          budgets,
          debts,
          cashflows,
          reviews,
        })
      );
    } catch {}
  }, [
    todayStr,
    settings,
    trades,
    scenarios,
    withdrawals,
    budgets,
    debts,
    cashflows,
    reviews,
  ]);

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
      isOwner={true}
      highImpactCount={highImpactCount}
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

        {(activeTab === "journal" || activeTab === "analytics") && (
          <JournalAndAnalyticsModule
            mode={activeTab}
            trades={trades}
            currentBalance={currentBalance}
            todayStr={todayStr}
            onAddTrade={(t) => setTrades((prev) => [t, ...prev])}
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
            onAddWithdrawal={(wd) => {
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
            }}
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
          <SettingsModule settings={settings} onSaveSettings={setSettings} />
        )}
      </PageTransitionShell>
    </AppSidebarLayout>
  );
}