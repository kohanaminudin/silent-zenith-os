"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, Radio, ShieldAlert } from "lucide-react";
import { EconomicEvent } from "@/types/horizon";

/**
 * Angka beranimasi halus dengan tabular-nums (tanpa konflik SSR Next.js 16)
 */
export function AnimatedMetric({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState<number>(value);

  useEffect(() => {
    let frameId: number;
    const startVal = displayValue;
    const diff = value - startVal;
    if (Math.abs(diff) < 0.0001) {
      setDisplayValue(value);
      return;
    }

    const duration = 550;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = Math.min(1, (now - startTime) / duration);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setDisplayValue(startVal + diff * eased);
      if (elapsed < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatted = displayValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`tabular-nums tracking-tight ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/**
 * Transisi halaman / tab bertingkat
 */
export function PageTransitionShell({
  tabKey,
  children,
}: {
  tabKey: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      key={tabKey}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Jam Sesi Pasar Global & Detektor ICT Killzone Real-Time
 */
export function LiveSessionTelemetry() {
  const [sessionInfo, setSessionInfo] = useState<{
    wib: string;
    london: string;
    ny: string;
    killzone: string;
    active: boolean;
  } | null>(null);

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      const fmt = (tz: string) =>
        new Intl.DateTimeFormat("en-GB", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(now);

      const nyHour = Number(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "America/New_York",
          hour: "2-digit",
          hour12: false,
        }).format(now)
      );

      let killzone = "Off-Session Consolidation";
      let active = false;

      if (nyHour >= 2 && nyHour < 5) {
        killzone = "ICT London Open Killzone";
        active = true;
      } else if (nyHour >= 7 && nyHour < 11) {
        killzone = "ICT NY Open / London Overlap";
        active = true;
      } else if (nyHour >= 11 && nyHour < 13) {
        killzone = "London Close Liquidity Window";
        active = true;
      } else if (nyHour >= 19 || nyHour < 0) {
        killzone = "Asian Range Accumulation";
        active = false;
      }

      setSessionInfo({
        wib: fmt("Asia/Jakarta"),
        london: fmt("Europe/London"),
        ny: fmt("America/New_York"),
        killzone,
        active,
      });
    };

    updateClocks();
    const timer = setInterval(updateClocks, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!sessionInfo) return null;

  return (
    <div className="hidden xl:flex items-center gap-3 text-[11px] font-mono">
      <div className="flex items-center gap-2 rounded-lg border border-slate-800/90 bg-slate-900/90 px-3 py-1.5 text-slate-300">
        <Globe className="h-3.5 w-3.5 text-sky-400" />
        <span>JKT {sessionInfo.wib}</span>
        <span className="text-slate-600">|</span>
        <span>LDN {sessionInfo.london}</span>
        <span className="text-slate-600">|</span>
        <span>NYC {sessionInfo.ny}</span>
      </div>

      <div
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-sans font-semibold ${
          sessionInfo.active
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-slate-800 bg-slate-900/80 text-slate-400"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            sessionInfo.active ? "bg-emerald-400 animate-ping" : "bg-slate-500"
          }`}
        />
        <span>{sessionInfo.killzone}</span>
      </div>
    </div>
  );
}

/**
 * Institutional Economist Macro Tape
 */
export function EconomistMacroBanner({
  jisdorRate,
  nextHighImpactEvent,
  onOpenCalendar,
}: {
  jisdorRate: number;
  nextHighImpactEvent?: EconomicEvent;
  onOpenCalendar: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800/90 bg-gradient-to-r from-[#0F172A] via-[#111A2E] to-[#0F172A] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-4 font-mono">
        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          MACRO DESK
        </span>
        <span className="text-slate-300">
          USD/IDR JISDOR:{" "}
          <strong className="text-white">
            Rp {jisdorRate.toLocaleString("id-ID")}
          </strong>
        </span>
        <span className="hidden sm:inline text-slate-600">•</span>
        <span className="hidden sm:inline text-slate-300">
          REGIME: <strong className="text-sky-300">IPDA Liquidity & Rate Watch</strong>
        </span>
      </div>

      {nextHighImpactEvent ? (
        <button
          type="button"
          onClick={onOpenCalendar}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 text-[11px] text-amber-200 transition"
        >
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>
            High-Impact ({nextHighImpactEvent.currency}):{" "}
            <strong className="text-white">{nextHighImpactEvent.title}</strong> •{" "}
            {nextHighImpactEvent.date} {nextHighImpactEvent.time} WIB
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenCalendar}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
        >
          Lihat Jadwal Kalender Ekonomi &rarr;
        </button>
      )}
    </div>
  );
}