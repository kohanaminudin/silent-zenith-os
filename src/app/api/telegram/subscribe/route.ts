import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

interface SubscribeBody {
  userEmail?: string;
  userName?: string;
  chatId?: string;
  isActive?: boolean;
  impactFilter?: "HIGH_ONLY" | "HIGH_AND_MEDIUM";
  quietHoursStart?: number;
  quietHoursEnd?: number;
  sendWelcome?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubscribeBody;
    const userEmail = body.userEmail?.trim().toLowerCase();
    const chatId = body.chatId?.trim();

    if (!userEmail || !chatId) {
      return NextResponse.json(
        { ok: false, error: "Email akun dan Telegram Chat ID wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi format Chat ID Telegram (angka positif user atau negatif grup/channel)
    if (!/^-?\d{5,20}$/.test(chatId)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Format Chat ID tidak valid. Harus berupa angka (contoh: 1294819201 atau -1001234567890).",
        },
        { status: 400 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "TELEGRAM_BOT_TOKEN belum dikonfigurasi di server." },
        { status: 500 }
      );
    }

    // Jika diminta kirim pesan tes / konfirmasi aktivasi
    if (body.sendWelcome !== false) {
      const welcomeText = [
        `<b>⚡ SILENT ZENITH — NOTIFIKASI AKTIF</b>`,
        ``,
        `• <b>Akun Terdaftar:</b> ${userEmail}`,
        `• <b>Chat ID:</b> <code>${chatId}</code>`,
        `• <b>Filter Dampak:</b> ${
          body.impactFilter === "HIGH_AND_MEDIUM"
            ? "High & Medium Impact"
            : "High Impact Saja"
        }`,
        `• <b>Jadwal Alert:</b> Otomatis 15 menit sebelum rilis berita (WIB)`,
        ``,
        `<i>Anda akan menerima peringatan volatilitas makro secara otomatis.</i>`,
      ].join("\n");

      const tgRes = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeText,
            parse_mode: "HTML",
          }),
        }
      );

      const tgData = await tgRes.json();
      if (!tgRes.ok || !tgData.ok) {
        return NextResponse.json(
          {
            ok: false,
            error:
              tgData.description ||
              "Bot tidak dapat mengirim pesan ke Chat ID ini. Pastikan Anda sudah klik /start pada bot.",
          },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseAdmin();
    const { error: dbError } = await supabase
      .from("telegram_subscribers")
      .upsert(
        {
          user_email: userEmail,
          user_name: body.userName?.trim() || userEmail.split("@")[0],
          chat_id: chatId,
          is_active: body.isActive ?? true,
          impact_filter: body.impactFilter || "HIGH_ONLY",
          quiet_hours_start: Number(body.quietHoursStart ?? 22),
          quiet_hours_end: Number(body.quietHoursEnd ?? 7),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_email" }
      );

    if (dbError) {
      return NextResponse.json(
        { ok: false, error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Telegram Chat ID berhasil terdaftar untuk alert otomatis T-15 menit.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Gagal mendaftarkan Chat ID.",
      },
      { status: 500 }
    );
  }
}