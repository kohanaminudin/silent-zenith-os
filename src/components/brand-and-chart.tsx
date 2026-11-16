"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ComputedJournalRow, RoadmapRow } from "@/types/compounding";

/**
 * Format angka mata uang USD secara ringkas dan presisi
 */
export function formatCompactUSD(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 100_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Logo Identitas Visual Silent Zenith OS
 */
export function ZenithLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 via-sky-500/15 to-zinc-900 border border-emerald-500/30 shadow-inner ${className}`}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
      >
        <path
          d="M5 23L12.5 15.5L17.5 19.5L27 9"
          stroke="url(#zenithLogoGrad)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="27" cy="9" r="2.5" fill="#10B981" />
        <defs>
          <linearGradient id="zenithLogoGrad" x1="5" y1="23" x2="27" y2="9" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * Angka Mata Uang dengan Transisi Halus saat Nilai Berubah
 */
export function AnimatedCurrency({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevRef = useRef<number>(value);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    if (Math.abs(end - start) < 0.001) {
      setDisplayValue(end);
      return;
    }

    const duration = 420;
    const startTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + (end - start) * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        prevRef.current = end;
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <span>{formatCompactUSD(displayValue)}</span>;
}

/**
 * Grafik Kurva Pertumbuhan Berbasis Tanggal Kalender & Jadwal Pasar
 */
export function CompoundingTrajectoryChart({
  roadmap,
  journals,
  initialCapital,
}: {
  roadmap: RoadmapRow[];
  journals: ComputedJournalRow[];
  initialCapital: number;
}) {
  const [scaleMode, setScaleMode] = useState<"log" | "linear">("log");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const chartPoints = useMemo(() => {
    const visibleDays = Math.max(25, Math.min(roadmap.length, journals.length + 25));
    const slice = roadmap.slice(0, visibleDays);

    return slice.map((row) => ({
      day: row.day,
      dateLabel: row.dateLabel,
      shortDateLabel: row.shortDateLabel,
      dayName: row.dayName,
      phase: row.phase,
      target: row.targetEndBalance,
      actual: row.actualBalanceOnDate ?? null,
      dailyNetPnl: row.dailyNetPnlOnDate ?? null,
    }));
  }, [roadmap, journals]);

  const width = 820;
  const height = 270;
  const padLeft = 68;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const allValues = chartPoints.flatMap((p) =>
    p.actual !== null ? [p.target, p.actual] : [p.target]
  );
  const minVal = Math.max(1, Math.min(initialCapital * 0.85, ...allValues));
  const maxVal = Math.max(minVal * 1.2, ...allValues);

  const transformY = (val: number) => {
    const safeVal = Math.max(1, val);
    if (scaleMode === "log") {
      const logMin = Math.log10(minVal);
      const logMax = Math.log10(maxVal);
      const ratio = (Math.log10(safeVal) - logMin) / Math.max(0.0001, logMax - logMin);
      return padTop + plotH - ratio * plotH;
    }
    const ratio = (safeVal - minVal) / Math.max(0.0001, maxVal - minVal);
    return padTop + plotH - ratio * plotH;
  };

  const getX = (idx: number) =>
    padLeft + (idx / Math.max(1, chartPoints.length - 1)) * plotW;

  const targetPath = chartPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${transformY(p.target).toFixed(1)}`)
    .join(" ");

  const areaPath = `${targetPath} L ${getX(chartPoints.length - 1).toFixed(1)} ${(
    padTop + plotH
  ).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const actualPoints = chartPoints
    .map((p, i) => (p.actual !== null ? { ...p, idx: i } : null))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const actualPath = actualPoints
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${getX(p.idx).toFixed(1)} ${transformY(p.actual!).toFixed(1)}`
    )
    .join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    if (scaleMode === "log") {
      const logMin = Math.log10(minVal);
      const logMax = Math.log10(maxVal);
      return Math.pow(10, logMin + t * (logMax - logMin));
    }
    return minVal + t * (maxVal - minVal);
  });

  const activePoint =
    hoverIdx !== null ? chartPoints[hoverIdx] : chartPoints[Math.min(9, chartPoints.length - 1)];

  const firstDate = chartPoints[0]?.shortDateLabel || "";
  const lastDate = chartPoints[chartPoints.length - 1]?.shortDateLabel || "";

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">
              Proyeksi Kurva Kalender ({firstDate} — {lastDate})
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Arahkan kursor ke titik tanggal untuk melihat target vs saldo akhir per tanggal
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 self-start">
          <button
            type="button"
            onClick={() => setScaleMode("log")}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              scaleMode === "log"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Logaritmik
          </button>
          <button
            type="button"
            onClick={() => setScaleMode("linear")}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              scaleMode === "linear"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Linear
          </button>
        </div>
      </div>

      {activePoint && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/70 dark:border-zinc-800/70 text-xs tabular-nums">
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
            {activePoint.dayName}, {activePoint.dateLabel}{" "}
            <span className="text-zinc-500 font-normal">(Sesi #{activePoint.day})</span>
          </span>
          <span>
            Target Ideal:{" "}
            <strong className="text-sky-500">{formatCompactUSD(activePoint.target)}</strong>
          </span>
          <span>
            Saldo Aktual:{" "}
            <strong className="text-emerald-500">
              {activePoint.actual !== null ? formatCompactUSD(activePoint.actual) : "Belum dicatat"}
            </strong>
          </span>
          {activePoint.dailyNetPnl !== null && (
            <span>
              Net Hari Itu:{" "}
              <strong
                className={activePoint.dailyNetPnl >= 0 ? "text-emerald-500" : "text-rose-500"}
              >
                {activePoint.dailyNetPnl >= 0
                  ? `+${formatCompactUSD(activePoint.dailyNetPnl)}`
                  : formatCompactUSD(activePoint.dailyNetPnl)}
              </strong>
            </span>
          )}
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[540px] h-auto select-none overflow-visible"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="zenithAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {yTicks.map((val, i) => {
            const y = transformY(val);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-zinc-400 text-[11px] font-mono"
                >
                  {formatCompactUSD(val)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#zenithAreaGrad)" />
          <motion.path
            d={targetPath}
            fill="none"
            stroke="#0EA5E9"
            strokeWidth={2.5}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />

          {actualPath && (
            <motion.path
              d={actualPath}
              fill="none"
              stroke="#10B981"
              strokeWidth={3}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          )}

          {actualPoints.map((p) => (
            <circle
              key={p.day}
              cx={getX(p.idx)}
              cy={transformY(p.actual!)}
              r={4.5}
              className="fill-emerald-500 stroke-white dark:stroke-zinc-950"
              strokeWidth={2}
            />
          ))}

          {chartPoints.map((p, i) => {
            const x = getX(i);
            const showLabel = i === 0 || (i + 1) % 5 === 0 || i === chartPoints.length - 1;
            return (
              <g key={p.day}>
                {showLabel && (
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-zinc-400 text-[10px] font-mono"
                  >
                    {p.shortDateLabel}
                  </text>
                )}
                {hoverIdx === i && (
                  <line
                    x1={x}
                    y1={padTop}
                    x2={x}
                    y2={padTop + plotH}
                    stroke="#71717A"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                )}
                <rect
                  x={x - plotW / chartPoints.length / 2}
                  y={padTop}
                  width={plotW / chartPoints.length}
                  height={plotH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIdx(i)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}