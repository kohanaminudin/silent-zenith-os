import { NextRequest, NextResponse } from "next/server";
import { EconomicEvent } from "@/types/horizon";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

interface RawCalendarItem {
  title?: string;
  country?: string;
  date?: string;
  impact?: string;
  forecast?: string;
  previous?: string;
}

interface SubscriberRow {
  user_email: string;
  chat_id: string;
  is_active: boolean;
  impact_filter: "HIGH_ONLY" | "HIGH_AND_MEDIUM";
  quiet_hours_start: number;
  quiet_hours_end: number;
}

function getEventEpochMs(ev: EconomicEvent): number | null {
  if (ev.timestampIso) {
    const parsedIso = Date.parse(ev.timestampIso);
    if (!Number.isNaN(parsedIso)) return parsedIso;
  }
  if (ev.date && ev.time) {
    const parsedWib = Date.parse(`${ev.date}T${ev.time}:00+07:00`);
    if (!Number.isNaN(parsedWib)) return parsedWib;
  }
  return null;
}

function formatToJakarta(isoString: string): { date: string; time: string } {
  const parsed = new Date(isoString);
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);

  return { date, time };
}

function isWithinQuietHours(startHour: number, endHour: number): boolean {
  if (startHour === endHour) return false;
  const currentWibHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );

  if (startHour > endHour) {
    return currentWibHour >= startHour || currentWibHour < endHour;
  }
  return currentWibHour >= startHour && currentWibHour < endHour;
}

function buildPreNewsMessage(
  ev: EconomicEvent,
  minutesRemaining: number
): string {
  const impactBadge =
    ev.impact === "High" ? "🔴 HIGH IMPACT" : "🟠 MEDIUM IMPACT";

  return [
    `<b>⚠️ SILENT ZENITH — MACRO NEWS ALERT (T-${minutesRemaining} MIN)</b>`,
    ``,
    `${impactBadge} | <b>${ev.currency}</b>`,
    `📌 <b>Agenda:</b> ${ev.title}`,
    `🕒 <b>Rilis:</b> ${ev.date} pukul <b>${ev.time} WIB</b>`,
    `📊 <b>Forecast:</b> ${ev.forecast || "-"}  |  <b>Previous:</b> ${ev.previous || "-"}`,
    ``,
    `<i>🛡 Protokol Risiko: Amankan SL ke Break-Even atau hindari entri baru hingga volatilitas mereda.</i>`,
  ].join("\n");
}

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN belum dikonfigurasi.");

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.description || `Gagal kirim ke ${chatId}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceTest = searchParams.get("force") === "true";
    const targetChatId = searchParams.get("chatId")?.trim();
    const querySecret = searchParams.get("secret");
    const authHeader = req.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (
      expectedSecret &&
      !forceTest &&
      authHeader !== `Bearer ${expectedSecret}` &&
      querySecret !== expectedSecret
    ) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized cron trigger." },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Mode pengujian langsung: /api/cron/news-alert?force=true&chatId=123456789
    if (forceTest) {
      let recipientChatId = targetChatId;
      if (!recipientChatId) {
        const { data: firstSub } = await supabase
          .from("telegram_subscribers")
          .select("chat_id")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        recipientChatId = firstSub?.chat_id;
      }

      if (!recipientChatId) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Tambahkan ?chatId=ID_ANDA pada URL atau daftarkan Chat ID di menu Pengaturan terlebih dahulu.",
          },
          { status: 400 }
        );
      }

      const sampleEvent: EconomicEvent = {
        id: `SIM-${Date.now()}`,
        date: new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
        }).format(new Date()),
        time: "20:30",
        currency: "USD",
        title: "Non-Farm Employment Change (NFP) [SIMULASI]",
        impact: "High",
        forecast: "185K",
        previous: "178K",
      };

      const msg = buildPreNewsMessage(sampleEvent, 15);
      await sendTelegramMessage(recipientChatId, msg);

      return NextResponse.json({
        ok: true,
        mode: "FORCE_SIMULATION",
        sentTo: recipientChatId,
      });
    }

    // 1. Ambil semua member terdaftar yang mengaktifkan notifikasi Telegram
    const { data: subscribers, error: subError } = await supabase
      .from("telegram_subscribers")
      .select(
        "user_email, chat_id, is_active, impact_filter, quiet_hours_start, quiet_hours_end"
      )
      .eq("is_active", true);

    if (subError) {
      throw new Error(`Supabase error: ${subError.message}`);
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "Belum ada member aktif dengan Telegram Chat ID.",
        sentCount: 0,
      });
    }

    // 2. Tarik jadwal berita ekonomi minggu ini
    const feedRes = await fetch(
      "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
      { cache: "no-store" }
    );
    if (!feedRes.ok) {
      throw new Error(`Gagal fetch kalender (${feedRes.status})`);
    }

    const rawItems = (await feedRes.json()) as RawCalendarItem[];
    const nowMs = Date.now();
    const upcomingEvents: { event: EconomicEvent; minsLeft: number }[] = [];

    for (const item of rawItems) {
      if (!item.title || !item.date) continue;
      const impactRaw = (item.impact || "").toLowerCase();
      if (!impactRaw.includes("high") && !impactRaw.includes("medium")) {
        continue;
      }

      const { date, time } = formatToJakarta(item.date);
      const ev: EconomicEvent = {
        id: `${date}_${time}_${(item.country || "USD").toUpperCase()}_${item.title.trim()}`,
        date,
        time,
        timestampIso: item.date,
        currency: (item.country || "USD").toUpperCase(),
        title: item.title.trim(),
        impact: impactRaw.includes("high") ? "High" : "Medium",
        forecast: item.forecast?.trim() || "-",
        previous: item.previous?.trim() || "-",
      };

      const eventMs = getEventEpochMs(ev);
      if (!eventMs) continue;

      const diffMinutes = (eventMs - nowMs) / 60000;
      if (diffMinutes >= 11 && diffMinutes <= 17) {
        upcomingEvents.push({
          event: ev,
          minsLeft: Math.max(1, Math.round(diffMinutes)),
        });
      }
    }

    if (upcomingEvents.length === 0) {
      return NextResponse.json({
        ok: true,
        subscribersCount: subscribers.length,
        sentCount: 0,
        note: "Tidak ada berita High/Medium dalam jendela 15 menit ke depan.",
      });
    }

    // 3. Broadcast paralel ke seluruh member yang memenuhi filter & bukan Quiet Hours
    let totalSent = 0;

    for (const { event, minsLeft } of upcomingEvents) {
      const msgText = buildPreNewsMessage(event, minsLeft);

      const eligibleSubs = (subscribers as SubscriberRow[]).filter((sub) => {
        if (sub.impact_filter === "HIGH_ONLY" && event.impact !== "High") {
          return false;
        }
        if (isWithinQuietHours(sub.quiet_hours_start, sub.quiet_hours_end)) {
          return false;
        }
        return true;
      });

      await Promise.allSettled(
        eligibleSubs.map(async (sub) => {
          const { error: logErr } = await supabase
            .from("telegram_alert_logs")
            .insert({
              event_key: event.id,
              chat_id: sub.chat_id,
            });

          if (logErr) return;

          await sendTelegramMessage(sub.chat_id, msgText);
          totalSent += 1;
        })
      );
    }

    return NextResponse.json({
      ok: true,
      subscribersCount: subscribers.length,
      eventsTriggered: upcomingEvents.map((e) => e.event.title),
      sentCount: totalSent,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Cron broadcast gagal.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chatId = String(body.chatId || "").trim();
    const event = body.event as EconomicEvent | undefined;
    const minutesRemaining = Number(body.minutesRemaining ?? 15);
    const quietStart = Number(body.quietHoursStart ?? 22);
    const quietEnd = Number(body.quietHoursEnd ?? 7);

    if (!chatId || !event) {
      return NextResponse.json(
        { ok: false, error: "chatId dan event wajib diisi." },
        { status: 400 }
      );
    }

    if (isWithinQuietHours(quietStart, quietEnd)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const msg = buildPreNewsMessage(event, minutesRemaining);
    await sendTelegramMessage(chatId, msg);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Gagal mengirim alert.",
      },
      { status: 500 }
    );
  }
}