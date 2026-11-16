"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { RoadmapRow, ComputedJournalRow } from "@/types/compounding";

export function formatCompactUSD(val: number): string {
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

/**
 * 1. Custom Animated SVG Brand Logo: SILENT ZENITH
 */
export function ZenithLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 rounded-xl bg-emerald-500/20 blur-md" />
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-full"
      >
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="11"
          className="fill-zinc-900 dark:fill-zinc-950 stroke-emerald-500/40"
          strokeWidth="1.5"
        />
        <motion.path
          d="M9 27H31"
          stroke="url(#zenithGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.path
          d="M10 24C15 24 19 21 22 16C24.5 12 27 10 30 9"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
        <motion.circle
          cx="30"
          cy="9"
          r="2.5"
          fill="#34D399"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.5, delay: 1.1 }}
        />
        <defs>
          <linearGradient id="zenithGrad" x1="9" y1="27" x2="31" y2="27" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" stopOpacity="0.2" />
            <stop offset="0.5" stopColor="#10B981" />
            <stop offset="1" stopColor="#34D399" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * 2. Smooth Animated Currency Counter
 */
export function AnimatedCurrency({ value }: { value: number }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 90, damping: 18 });
  const display = useTransform(spring, (current) => formatCompactUSD(current));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

/**
 * 3. Interactive Compounding Trajectory Chart (Fixed Deterministic Rounding)
 */
interface TrajectoryChartProps {
  roadmap: RoadmapRow[];
  journals: ComputedJournalRow[];
  initialCapital: number;
}

export function CompoundingTrajectoryChart({
  roadmap,
  journals,
  initialCapital,
}: TrajectoryChartProps) {
  const [scaleMode, setScaleMode] = useState<"log" | "linear">("log");
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const visibleLimit = Math.min(roadmap.length, Math.max(25, journals.length + 15));
  const sliceData = roadmap.slice(0, visibleLimit);

  const width = 820;
  const height = 270;
  const padLeft = 68;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 36;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const actualBalances = sliceData.map((_, idx) => {
    if (idx < journals.length) return journals[idx].endBalance;
    return null;
  });

  const allValues = [
    initialCapital,
    ...sliceData.map((d) => d.targetEndBalance),
    ...actualBalances.filter((v): v is number => v !== null),
  ];

  const minVal = Math.max(1, Math.min(...allValues) * 0.9);
  const maxVal = Math.max(...allValues) * 1.08;

  // Pembulatan deterministik 2 desimal mencegah perbedaan floating-point SSR vs Client
  const round2 = (n: number) => Number(n.toFixed(2));

  const getY = (val: number) => {
    const safeVal = Math.max(1, val);
    if (scaleMode === "log") {
      const logMin = Math.log10(minVal);
      const logMax = Math.log10(maxVal);
      const ratio = (Math.log10(safeVal) - logMin) / Math.max(0.0001, logMax - logMin);
      return round2(padTop + plotH - ratio * plotH);
    }
    const ratio = (safeVal - minVal) / Math.max(0.0001, maxVal - minVal);
    return round2(padTop + plotH - ratio * plotH);
  };

  const getX = (index: number) => {
    if (sliceData.length <= 1) return padLeft;
    return round2(padLeft + (index / (sliceData.length - 1)) * plotW);
  };

  const targetPoints = sliceData.map((d, i) => `${getX(i)},${getY(d.targetEndBalance)}`);
  const targetPath = `M ${targetPoints.join(" L ")}`;
  const targetAreaPath = `${targetPath} L ${getX(sliceData.length - 1)},${padTop + plotH} L ${getX(0)},${padTop + plotH} Z`;

  const validActuals = actualBalances
    .map((val, idx) => (val !== null ? { x: getX(idx), y: getY(val), val, idx } : null))
    .filter((p): p is { x: number; y: number; val: number; idx: number } => p !== null);

  const actualPath =
    validActuals.length > 0
      ? `M ${validActuals.map((p) => `${p.x},${p.y}`).join(" L ")}`
      : "";

  const activePoint = hoverDay !== null ? sliceData[hoverDay] : null;
  const activeActual =
    hoverDay !== null && hoverDay < journals.length ? journals[hoverDay].endBalance : null;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">
              Proyeksi Kurva Pertumbuhan (Day 1 — Day {visibleLimit})
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Arahkan kursor ke titik hari untuk membandingkan target compounding vs saldo riil Anda
          </p>
        </div>

        <div className="inline-flex p-1 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 self-start">
          <button
            type="button"
            onClick={() => setScaleMode("log")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              scaleMode === "log"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Logaritmik
          </button>
          <button
            type="button"
            onClick={() => setScaleMode("linear")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              scaleMode === "linear"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Linear
          </button>
        </div>
      </div>

      {/* Interactive Tooltip Bar */}
      <div className="h-9 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-xs">
        {activePoint ? (
          <div className="flex flex-wrap items-center gap-4 tabular-nums">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              Day {activePoint.day} ({activePoint.phase})
            </span>
            <span className="text-sky-600 dark:text-sky-400">
              Target Ideal: <strong>{formatCompactUSD(activePoint.targetEndBalance)}</strong>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Saldo Aktual:{" "}
              <strong>{activeActual !== null ? formatCompactUSD(activeActual) : "Belum dicatat"}</strong>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-5 text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Target Ideal Compounding
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Saldo Aktual Jurnal
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] select-none">
          <defs>
            <linearGradient id="targetFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = round2(padTop + t * plotH);
            const val =
              scaleMode === "log"
                ? Math.pow(10, Math.log10(maxVal) - t * (Math.log10(maxVal) - Math.log10(minVal)))
                : maxVal - t * (maxVal - minVal);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  className="stroke-zinc-200 dark:stroke-zinc-800/80"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={round2(y + 4)}
                  textAnchor="end"
                  className="fill-zinc-400 text-[10px] tabular-nums"
                >
                  {formatCompactUSD(val).replace(".00", "")}
                </text>
              </g>
            );
          })}

          <path d={targetAreaPath} fill="url(#targetFill)" />
          <motion.path
            d={targetPath}
            fill="none"
            stroke="#0EA5E9"
            strokeWidth="2.2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />

          {validActuals.length > 1 && (
            <motion.path
              d={actualPath}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.8"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          )}

          {validActuals.map((pt) => (
            <g key={pt.idx}>
              <circle cx={pt.x} cy={pt.y} r="6" className="fill-emerald-500/20" />
              <circle
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                className="fill-emerald-500 stroke-white dark:stroke-zinc-950"
                strokeWidth="1.5"
              />
            </g>
          ))}

          {hoverDay !== null && (
            <line
              x1={getX(hoverDay)}
              y1={padTop}
              x2={getX(hoverDay)}
              y2={padTop + plotH}
              className="stroke-zinc-400 dark:stroke-zinc-600"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {sliceData.map((d, i) => {
            const x = getX(i);
            const sliceW = round2(plotW / Math.max(1, sliceData.length));
            return (
              <g key={d.day}>
                {(i === 0 || (i + 1) % 5 === 0 || i === sliceData.length - 1) && (
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-zinc-400 text-[10px] tabular-nums"
                  >
                    D{d.day}
                  </text>
                )}
                <rect
                  x={round2(x - sliceW / 2)}
                  y={padTop}
                  width={sliceW}
                  height={plotH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverDay(i)}
                  onMouseLeave={() => setHoverDay(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}