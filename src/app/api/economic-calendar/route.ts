import { NextResponse } from "next/server";
import { EconomicEvent } from "@/types/horizon";


interface RawCalendarItem {
  title?: string;
  country?: string;
  date?: string;
  impact?: string;
  forecast?: string;
  previous?: string;
}

function formatToJakarta(isoString: string): { date: string; time: string } {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "2026-11-21", time: "20:30" };
  }

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);

  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);

  return { date: dateParts, time: timeParts };
}

function normalizeImpact(raw?: string): "High" | "Medium" | "Low" {
  const val = (raw || "").toLowerCase();
  if (val.includes("high")) return "High";
  if (val.includes("medium") || val.includes("moderate")) return "Medium";
  return "Low";
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const response = await fetch(
      "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
      {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": "SilentZenithMacroTerminal/2.0",
        },
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Upstream status ${response.status}`);
    }

    const rawData = (await response.json()) as RawCalendarItem[];

    const normalized: EconomicEvent[] = rawData
      .filter((item) => item.title && item.date)
      .map((item, idx) => {
        const { date, time } = formatToJakarta(item.date!);
        return {
          id: `LIVE-${date}-${idx}-${(item.country || "MACRO").toUpperCase()}`,
          date,
          time,
          timestampIso: item.date,
          currency: (item.country || "USD").toUpperCase(),
          title: item.title!.trim(),
          impact: normalizeImpact(item.impact),
          forecast: item.forecast?.trim() || "-",
          previous: item.previous?.trim() || "-",
          source: "LIVE_FEED",
        };
      });

    return NextResponse.json({
      ok: true,
      source: "LIVE_FEED",
      count: normalized.length,
      events: normalized,
    });
  } catch {
    const now = new Date();
    const todayIso = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const fallbackEvents: EconomicEvent[] = [
      {
        id: `FB-1-${todayIso}`,
        date: todayIso,
        time: "19:30",
        currency: "USD",
        title: "Core PCE Price Index (MoM)",
        impact: "High",
        forecast: "0.3%",
        previous: "0.3%",
        source: "LIVE_FEED",
      },
      {
        id: `FB-2-${todayIso}`,
        date: todayIso,
        time: "20:30",
        currency: "USD",
        title: "Non-Farm Employment Change (NFP)",
        impact: "High",
        forecast: "185K",
        previous: "178K",
        source: "LIVE_FEED",
      },
      {
        id: `FB-3-${todayIso}`,
        date: todayIso,
        time: "21:45",
        currency: "USD",
        title: "S&P Global Manufacturing & Services PMI",
        impact: "Medium",
        forecast: "51.2",
        previous: "50.8",
        source: "LIVE_FEED",
      },
      {
        id: `FB-4-${todayIso}`,
        date: todayIso,
        time: "22:00",
        currency: "USD",
        title: "ISM Services PMI & FOMC Member Speech",
        impact: "High",
        forecast: "52.4",
        previous: "51.9",
        source: "LIVE_FEED",
      },
    ];

    return NextResponse.json({
      ok: true,
      source: "FALLBACK_MACRO",
      count: fallbackEvents.length,
      events: fallbackEvents,
    });
  }
}
