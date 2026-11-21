import { NextRequest, NextResponse } from "next/server";

interface TelegramRequestBody {
  chatId?: string;
  message?: string;
  parseMode?: "HTML" | "MarkdownV2";
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "TELEGRAM_BOT_TOKEN belum dipasang di .env.local atau Environment Variables Vercel.",
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as TelegramRequestBody;
    const chatId = body.chatId?.trim();
    const message = body.message?.trim();

    if (!chatId || !message) {
      return NextResponse.json(
        { ok: false, error: "Chat ID dan isi pesan wajib diisi." },
        { status: 400 }
      );
    }

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: body.parseMode || "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    const data = await telegramRes.json();

    if (!telegramRes.ok || !data.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            data.description ||
            "Gagal mengirim pesan. Pastikan Anda sudah klik /start pada bot atau menjadikan bot Admin Channel.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: data.result?.message_id,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan pada server Telegram.",
      },
      { status: 500 }
    );
  }
}