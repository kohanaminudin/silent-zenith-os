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
    }),
  });
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

    // Perintah /id -> tampilkan Chat ID langsung
    if (text === "/id") {
      await replyTelegram(
        chatId,
        [
          `🆔 <b>Telegram Chat ID Anda:</b>`,
          `<code>${chatId}</code>`,
          ``,
          `Salin angka di atas ke menu <b>Pengaturan → Chat ID Telegram</b> di aplikasi Silent Zenith, atau kirim:`,
          `<code>/start email_akun_anda@gmail.com</code>`,
        ].join("\n")
      );
      return NextResponse.json({ ok: true });
    }

    // Perintah /start atau /start email@domain.com
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
              `✅ <b>Berhasil Terhubung!</b>`,
              ``,
              `Akun <b>${emailArg}</b> telah ditautkan dengan Chat ID <code>${chatId}</code>.`,
              `Anda akan menerima peringatan berita ekonomi <b>15 menit sebelum rilis (WIB)</b>.`,
            ].join("\n")
          );
          return NextResponse.json({ ok: true });
        }
      }

      await replyTelegram(
        chatId,
        [
          `👋 Halo <b>${firstName}</b>, selamat datang di <b>Silent Zenith Macro Bot</b>.`,
          ``,
          `🆔 Chat ID Anda: <code>${chatId}</code>`,
          ``,
          `Untuk mengaktifkan alert berita otomatis 15 menit sebelum rilis, ketik:`,
          `<code>/start email_terdaftar_anda@gmail.com</code>`,
          `atau tempel Chat ID di atas pada menu <b>Pengaturan</b> di web.`,
        ].join("\n")
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}