import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  const rawList =
    process.env.ADMIN_EMAILS || "kohanaminudin@gmail.com";
  const allowed = rawList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("adminEmail");

    if (!isAuthorizedAdmin(adminEmail)) {
      return NextResponse.json(
        { ok: false, error: "Akses ditolak. Bukan akun Admin." },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    const [subsRes, logsRes, broadcastsRes] = await Promise.all([
      supabase
        .from("telegram_subscribers")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("telegram_alert_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(25),
      supabase
        .from("admin_broadcast_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

    return NextResponse.json({
      ok: true,
      subscribers: subsRes.data || [],
      recentLogs: logsRes.data || [],
      broadcasts: broadcastsRes.data || [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Gagal memuat data admin.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const adminEmail = String(body.adminEmail || "").trim();

    if (!isAuthorizedAdmin(adminEmail)) {
      return NextResponse.json(
        { ok: false, error: "Akses ditolak. Bukan akun Admin." },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();
    const action = String(body.action || "");

    if (action === "TOGGLE_SUBSCRIBER") {
      const { id, isActive } = body;
      const { error } = await supabase
        .from("telegram_subscribers")
        .update({ is_active: Boolean(isActive), updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "UPDATE_FILTER") {
      const { id, impactFilter } = body;
      const { error } = await supabase
        .from("telegram_subscribers")
        .update({ impact_filter: impactFilter, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "DELETE_SUBSCRIBER") {
      const { id } = body;
      const { error } = await supabase
        .from("telegram_subscribers")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "BROADCAST_MESSAGE") {
      const title = String(body.title || "PENGUMUMAN SILENT ZENITH").trim();
      const message = String(body.message || "").trim();
      if (!message) {
        return NextResponse.json(
          { ok: false, error: "Isi pesan broadcast tidak boleh kosong." },
          { status: 400 }
        );
      }

      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) {
        return NextResponse.json(
          { ok: false, error: "TELEGRAM_BOT_TOKEN belum diatur." },
          { status: 500 }
        );
      }

      const { data: activeSubs, error: subErr } = await supabase
        .from("telegram_subscribers")
        .select("chat_id")
        .eq("is_active", true);

      if (subErr) throw new Error(subErr.message);

      const formatted = [
        `<b>📢 ${title.toUpperCase()}</b>`,
        ``,
        message,
        ``,
        `<i>— Silent Zenith Command Center</i>`,
      ].join("\n");

      let delivered = 0;
      await Promise.allSettled(
        (activeSubs || []).map(async (sub) => {
          const res = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: sub.chat_id,
                text: formatted,
                parse_mode: "HTML",
                disable_web_page_preview: true,
              }),
            }
          );
          const json = await res.json();
          if (res.ok && json.ok) delivered += 1;
        })
      );

      await supabase.from("admin_broadcast_logs").insert({
        admin_email: adminEmail,
        title,
        message,
        recipients_count: delivered,
      });

      return NextResponse.json({
        ok: true,
        delivered,
        totalTargets: activeSubs?.length || 0,
      });
    }

    return NextResponse.json(
      { ok: false, error: "Aksi tidak dikenali." },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Operasi admin gagal.",
      },
      { status: 500 }
    );
  }
}