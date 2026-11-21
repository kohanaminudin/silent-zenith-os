import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

async function replyTelegram(chatId: string | number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
}

async function fetchTodayMacroNewsWib(): Promise<string> {
  try {
    const res = await fetch(
      "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Feed tidak tersedia");
    const items = (await res.json()) as any[];

    const todayWib = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const filtered = items
      .filter((item) => {
        if (!item.date || !item.title) return false;
        const impact = String(item.impact || "").toLowerCase();
        if (!impact.includes("high") && !impact.includes("medium")) return false;
        const itemDateWib = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(item.date));
        return itemDateWib === todayWib;
      })
      .map((item) => {
        const timeWib = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date(item.date));
        const icon = String(item.impact).toLowerCase().includes("high")
          ? "🔴"
          : "🟠";
        return `${icon} <b>${timeWib} WIB</b> [${item.country}] — ${item.title} (Fcst: ${
          item.forecast || "-"
        })`;
      });

    if (filtered.length === 0) {
      return `📅 <b>Jadwal News (${todayWib}):</b>\nTidak ada rilis berita High/Medium Impact hari ini.`;
    }

    return [
      `📅 <b>HIGH & MEDIUM IMPACT NEWS (${todayWib} WIB)</b>`,
      ``,
      ...filtered,
      ``,
      `<i>Bot otomatis mengingatkan 15 menit sebelum rilis.</i>`,
    ].join("\n");
  } catch {
    return "⚠️ Gagal mengambil feed kalender ekonomi saat ini.";
  }
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update?.message;
    if (!message?.chat?.id || !message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = String(message.text).trim();
    const firstName = message.from?.first_name || "Trader";

    if (text === "/id") {
      await replyTelegram(
        chatId,
        [
          `🆔 <b>Telegram Chat ID Anda:</b> <code>${chatId}</code>`,
          ``,
          `Salin ke menu <b>Pengaturan</b> di Silent Zenith atau ketik:`,
          `<code>/start email_anda@gmail.com</code>`,
        ].join("\n")
      );
      return NextResponse.json({ ok: true });
    }

    if (text === "/news") {
      const newsSummary = await fetchTodayMacroNewsWib();
      await replyTelegram(chatId, newsSummary);
      return NextResponse.json({ ok: true });
    }

    if (text === "/briefing") {
      const wibNow = new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      });
      await replyTelegram(
        chatId,
        [
          `🧭 <b>SILENT ZENITH — ICT KILLZONE & SOP BRIEFING</b>`,
          `🕒 Waktu Server: <b>${wibNow} WIB</b>`,
          ``,
          `• <b>Asian Range:</b> 07:00 – 11:00 WIB (Akumulasi)`,
          `• <b>London Killzone:</b> 14:00 – 17:00 WIB (Manipulasi / Judas Swing)`,
          `• <b>NY Open Killzone:</b> 19:00 – 22:00 WIB (Ekspansi / Reversal)`,
          ``,
          `<b>Checklist Sebelum Entry:</b>`,
          `1. Konfirmasi Bias HTF (H4/H1) & Liquidity Sweep`,
          `2. Risiko maksimal terkunci sesuai aturan compounding`,
          `3. Tidak ada berita merah dalam 15 menit ke depan`,
        ].join("\n")
      );
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/risk")) {
      // Format: /risk <balance> <risk_pct> <sl_pips>
      const parts = text.split(/\s+/);
      const balance = parseFloat(parts[1]);
      const riskPct = parseFloat(parts[2]);
      const slPips = parseFloat(parts[3]);

      if (
        Number.isNaN(balance) ||
        Number.isNaN(riskPct) ||
        Number.isNaN(slPips) ||
        slPips <= 0
      ) {
        await replyTelegram(
          chatId,
          [
            `📐 <b>Kalkulator Lot & Risiko</b>`,
            `Format: <code>/risk [Saldo$] [Risk%] [SL_Pips]</code>`,
            `Contoh: <code>/risk 1000 10 25</code>`,
          ].join("\n")
        );
        return NextResponse.json({ ok: true });
      }

      const riskUsd = balance * (riskPct / 100);
      const standardLots = riskUsd / (slPips * 10);

      await replyTelegram(
        chatId,
        [
          `📐 <b>HASIL POSITION SIZING</b>`,
          ``,
          `• <b>Modal:</b> $${balance.toLocaleString("en-US")}`,
          `• <b>Risiko (${riskPct}%):</b> <b>$${riskUsd.toFixed(2)}</b>`,
          `• <b>Stop Loss:</b> ${slPips} pips`,
          `• <b>Rekomendasi Lot:</b> <b>${standardLots.toFixed(2)} Lot</b>`,
          `<i>(Asumsi $10/pip untuk Standard Lot XAUUSD/Major Pairs)</i>`,
        ].join("\n")
      );
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/start")) {
      const parts = text.split(/\s+/);
      const emailArg = parts[1]?.trim().toLowerCase();

      if (emailArg && emailArg.includes("@")) {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from("telegram_subscribers").upsert(
          {
            user_email: emailArg,
            user_name: firstName,
            chat_id: chatId,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_email" }
        );

        if (!error) {
          await replyTelegram(
            chatId,
            [
              `✅ <b>Akun Terhubung ke Asisten Silent Zenith!</b>`,
              ``,
              `• <b>Email:</b> ${emailArg}`,
              `• <b>Chat ID:</b> <code>${chatId}</code>`,
              ``,
              `Ketik /help untuk melihat semua perintah asisten pribadi Anda.`,
            ].join("\n")
          );
          return NextResponse.json({ ok: true });
        }
      }

      await replyTelegram(
        chatId,
        [
          `👋 Halo <b>${firstName}</b>, saya <b>Silent Zenith Assistant Bot</b>.`,
          `🆔 Chat ID Anda: <code>${chatId}</code>`,
          ``,
          `Hubungkan akun Anda dengan mengetik:`,
          `<code>/start email_terdaftar_anda@gmail.com</code>`,
          ``,
          `Atau ketik /help untuk daftar perintah lengkap.`,
        ].join("\n")
      );
      return NextResponse.json({ ok: true });
    }

    await replyTelegram(
      chatId,
      [
        `🤖 <b>Perintah Silent Zenith Assistant:</b>`,
        `• /news — Cek berita High & Medium Impact hari ini (WIB)`,
        `• /briefing — Jadwal ICT Killzone & SOP checklist`,
        `• /risk 1000 10 25 — Hitung ukuran lot otomatis`,
        `• /id — Lihat Telegram Chat ID Anda`,
        `• /start email@anda.com — Tautkan akun web`,
      ].join("\n")
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}