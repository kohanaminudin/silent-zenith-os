import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "TELEGRAM_BOT_TOKEN belum dikonfigurasi." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const chatId = String(body.chatId || "").trim();
    const type = String(body.type || "CUSTOM");
    const payload = body.payload || {};

    if (!chatId) {
      return NextResponse.json(
        { ok: false, error: "Chat ID kosong." },
        { status: 400 }
      );
    }

    let message = "";

    if (type === "TRADE_LOGGED") {
      const isWin = Number(payload.pnl) >= 0;
      const badge =
        payload.status === "OPEN"
          ? "🟡 POSISI TERBUKA"
          : isWin
          ? "🟢 TRADE CLOSED — PROFIT"
          : "🔴 TRADE CLOSED — LOSS";

      message = [
        `<b>${badge}</b>`,
        ``,
        `• <b>Pair:</b> ${payload.pair} (${payload.direction})`,
        `• <b>Lot:</b> ${payload.lot} | <b>Setup:</b> ${payload.setup || "-"}`,
        `• <b>Entry / Exit:</b> ${payload.entry} → ${payload.exit || "OPEN"}`,
        `• <b>Realized P&L:</b> <b>${isWin ? "+" : ""}$${Number(
          payload.pnl
        ).toFixed(2)}</b> (${payload.rMultiple}R)`,
        `• <b>Saldo Terbaru:</b> $${Number(payload.newBalance).toFixed(2)}`,
        ``,
        `<i>Dicatat otomatis oleh Silent Zenith Assistant.</i>`,
      ].join("\n");
    } else if (type === "WITHDRAWAL_LOGGED") {
      message = [
        `<b>💸 WITHDRAWAL PROFIT TERCATAT</b>`,
        ``,
        `• <b>Nominal WD:</b> $${Number(payload.amountUsd).toFixed(2)}`,
        `• <b>Estimasi IDR:</b> Rp ${Number(payload.amountIdr).toLocaleString(
          "id-ID"
        )}`,
        `• <b>Sisa Saldo Trading:</b> $${Number(payload.newBalance).toFixed(2)}`,
        `• <b>Tanggal:</b> ${payload.date}`,
        ``,
        `<i>Disiplin mengamankan profit adalah kunci compounding jangka panjang.</i>`,
      ].join("\n");
    } else if (type === "DEPOSIT_LOGGED") {
      message = [
        `<b>💰 TOP-UP DEPOSIT MODAL TERCATAT</b>`,
        ``,
        `• <b>Nominal Deposit:</b> +$${Number(payload.amountUsd).toFixed(2)}`,
        `• <b>Setara IDR:</b> Rp ${Number(payload.amountIdr).toLocaleString(
          "id-ID"
        )}`,
        `• <b>Total Modal Disetor:</b> $${Number(
          payload.totalDeposited
        ).toFixed(2)}`,
        `• <b>Balance Aktif Terbaru:</b> <b>$${Number(
          payload.newBalance
        ).toFixed(2)}</b>`,
        `• <b>Target Utama:</b> $${Number(payload.targetUsd).toLocaleString(
          "en-US"
        )}`,
        ``,
        `<i>Modal tercatat di Arus Kas & kalkulator lot otomatis menyesuaikan.</i>`,
      ].join("\n");
    } else if (type === "TARGET_UPDATED") {
      message = [
        `<b>🎯 PARAMETER MODAL & TARGET DIPERBARUI</b>`,
        ``,
        `• <b>Modal Deposit Awal:</b> $${Number(
          payload.initialCapitalUsd
        ).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        `• <b>Target Saldo Akhir:</b> <b>$${Number(
          payload.targetCapitalUsd
        ).toLocaleString("en-US", { minimumFractionDigits: 2 })}</b>`,
        `• <b>Aturan Risiko / Target Siklus:</b> ${payload.riskPct}% Risk / +${payload.targetPct}% Target`,
        ``,
        `<i>Asisten siap mengawal progres compounding Anda menuju target.</i>`,
      ].join("\n");
    } else if (type === "DAILY_BRIEFING") {
      message = String(payload.message || "");
    } else {
      message = String(payload.message || "Notifikasi Silent Zenith OS");
    }

    const tgRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    const data = await tgRes.json();
    if (!tgRes.ok || !data.ok) {
      return NextResponse.json(
        { ok: false, error: data.description || "Gagal mengirim ke Telegram." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, messageId: data.result?.message_id });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Server error.",
      },
      { status: 500 }
    );
  }
}