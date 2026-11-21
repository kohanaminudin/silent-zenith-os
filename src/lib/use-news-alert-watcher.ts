"use client";

import { useEffect, useRef, useState } from "react";
import { AppSettings, EconomicEvent } from "@/types/horizon";

const STORAGE_KEY = "sz_alerted_news_registry_v2";

function parseEventTimestampMs(ev: EconomicEvent): number | null {
  if (ev.timestampIso) {
    const isoMs = Date.parse(ev.timestampIso);
    if (!Number.isNaN(isoMs)) return isoMs;
  }
  if (ev.date && ev.time) {
    const wibMs = Date.parse(`${ev.date}T${ev.time}:00+07:00`);
    if (!Number.isNaN(wibMs)) return wibMs;
  }
  return null;
}

export function useNewsAlertWatcher({
  events,
  settings,
}: {
  events: EconomicEvent[];
  settings: AppSettings;
}) {
  const [latestAlertBanner, setLatestAlertBanner] = useState<string | null>(
    null
  );
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!settings.telegramEnabled || !settings.telegramChatId.trim()) return;

    const evaluateUpcomingNews = async () => {
      let alertedIds: string[] = [];
      try {
        alertedIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      } catch {
        alertedIds = [];
      }
      const alertedSet = new Set<string>(alertedIds);
      const nowMs = Date.now();

      for (const ev of events) {
        if (ev.impact === "Low") continue;

        const eventMs = parseEventTimestampMs(ev);
        if (!eventMs) continue;

        const diffMinutes = (eventMs - nowMs) / 60000;
        const uniqueKey = `${ev.date}_${ev.time}_${ev.currency}_${ev.title}`;

        if (diffMinutes >= 13.5 && diffMinutes <= 15.5) {
          if (alertedSet.has(uniqueKey) || inFlightRef.current.has(uniqueKey)) {
            continue;
          }

          inFlightRef.current.add(uniqueKey);
          const minsRounded = Math.max(1, Math.round(diffMinutes));

          try {
            const res = await fetch("/api/cron/news-alert", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chatId: settings.telegramChatId.trim(),
                event: ev,
                minutesRemaining: minsRounded,
                quietHoursStart: settings.quietHoursStart,
                quietHoursEnd: settings.quietHoursEnd,
              }),
            });

            const json = await res.json();
            if (res.ok && json.ok && !json.skipped) {
              alertedSet.add(uniqueKey);
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(Array.from(alertedSet).slice(-150))
              );
              setLatestAlertBanner(
                `Telegram Alert Terkirim: ${ev.currency} "${ev.title}" dalam ${minsRounded} menit (${ev.time} WIB)`
              );
              setTimeout(() => setLatestAlertBanner(null), 9000);
            }
          } finally {
            inFlightRef.current.delete(uniqueKey);
          }
        }
      }
    };

    evaluateUpcomingNews();
    const interval = setInterval(evaluateUpcomingNews, 30_000);
    return () => clearInterval(interval);
  }, [events, settings]);

  return {
    latestAlertBanner,
    dismissAlertBanner: () => setLatestAlertBanner(null),
  };
}