"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ShieldAlert,
  Users,
  Send,
  RefreshCw,
  Trash2,
  Power,
  Megaphone,
  Activity,
  CheckCircle2,
} from "lucide-react";

interface SubscriberItem {
  id: string;
  user_email: string;
  user_name: string | null;
  chat_id: string;
  role: string;
  is_active: boolean;
  impact_filter: "HIGH_ONLY" | "HIGH_AND_MEDIUM";
  quiet_hours_start: number;
  quiet_hours_end: number;
  updated_at: string;
}

interface AlertLogItem {
  id: string;
  event_key: string;
  chat_id: string;
  sent_at: string;
}

interface BroadcastLogItem {
  id: string;
  admin_email: string;
  title: string;
  message: string;
  recipients_count: number;
  created_at: string;
}

export function AdminPanelModule({ adminEmail }: { adminEmail: string }) {
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [recentLogs, setRecentLogs] = useState<AlertLogItem[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Broadcast form
  const [bcTitle, setBcTitle] = useState("MARKET & SYSTEM UPDATE");
  const [bcMessage, setBcMessage] = useState("");
  const [sendingBc, setSendingBc] = useState(false);
  const [bcStatus, setBcStatus] = useState<string | null>(null);
  const [triggeringCron, setTriggeringCron] = useState(false);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/admin/overview?adminEmail=${encodeURIComponent(adminEmail)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Gagal memuat data Admin Panel.");
      } else {
        setSubscribers(data.subscribers || []);
        setRecentLogs(data.recentLogs || []);
        setBroadcasts(data.broadcasts || []);
      }
    } catch {
      setErrorMsg("Koneksi ke API Admin gagal.");
    } finally {
      setLoading(false);
    }
  }, [adminEmail]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleToggleUser = async (sub: SubscriberItem) => {
    await fetch("/api/admin/overview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminEmail,
        action: "TOGGLE_SUBSCRIBER",
        id: sub.id,
        isActive: !sub.is_active,
      }),
    });
    loadAdminData();
  };

  const handleChangeFilter = async (
    sub: SubscriberItem,
    impactFilter: "HIGH_ONLY" | "HIGH_AND_MEDIUM"
  ) => {
    await fetch("/api/admin/overview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminEmail,
        action: "UPDATE_FILTER",
        id: sub.id,
        impactFilter,
      }),
    });
    loadAdminData();
  };

  const handleDeleteUser = async (id: string) => {
    await fetch("/api/admin/overview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminEmail,
        action: "DELETE_SUBSCRIBER",
        id,
      }),
    });
    loadAdminData();
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcMessage.trim()) return;
    setSendingBc(true);
    setBcStatus(null);
    try {
      const res = await fetch("/api/admin/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          action: "BROADCAST_MESSAGE",
          title: bcTitle,
          message: bcMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setBcStatus(`Gagal: ${data.error}`);
      } else {
        setBcStatus(
          `Broadcast terkirim ke ${data.delivered} dari ${data.totalTargets} member aktif!`
        );
        setBcMessage("");
        loadAdminData();
      }
    } finally {
      setSendingBc(false);
    }
  };

  const handleManualCronTest = async () => {
    setTriggeringCron(true);
    setBcStatus(null);
    try {
      const res = await fetch("/api/cron/news-alert?force=true");
      const data = await res.json();
      if (res.ok && data.ok) {
        setBcStatus(
          `Simulasi T-15m Alert berhasil dikirim ke Chat ID ${data.sentTo}.`
        );
      } else {
        setBcStatus(`Simulasi gagal: ${data.error}`);
      }
    } finally {
      setTriggeringCron(false);
    }
  };

  const activeCount = subscribers.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">
              Admin Command Center
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manajemen member terdaftar, kontrol bot Telegram multi-user, dan global broadcast.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleManualCronTest}
            disabled={triggeringCron}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 font-semibold text-amber-300"
          >
            <Send className="h-3.5 w-3.5" />
            {triggeringCron ? "Menguji..." : "Tes Simulasi Alert T-15m"}
          </button>
          <button
            type="button"
            onClick={loadAdminData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3.5 py-2 font-semibold text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {bcStatus && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
          {bcStatus}
        </div>
      )}

      {/* KPI Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Member Terdaftar</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-mono font-bold text-white">
            {subscribers.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {activeCount} aktif menerima bot alert
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Alert Terkirim (Log Terbaru)</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-mono font-bold text-emerald-400">
            {recentLogs.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Terkunci anti-duplikasi
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Riwayat Global Broadcast</span>
            <Megaphone className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-mono font-bold text-white">
            {broadcasts.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Admin: {adminEmail}
          </div>
        </div>
      </div>

      {/* Tabel Manajemen Member & Telegram Subscribers */}
      <div className="rounded-xl border border-slate-800 bg-[#0E1424] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            Daftar Member & Telegram Subscribers ({subscribers.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            Siapa pun yang mendaftar akan muncul otomatis di sini
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/95 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Member / Email</th>
                <th className="px-4 py-3">Telegram Chat ID</th>
                <th className="px-4 py-3">Filter News</th>
                <th className="px-4 py-3">Quiet Hours</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Belum ada subscriber Telegram yang terdaftar.
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">
                        {sub.user_name || "Member"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {sub.user_email}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sky-300">
                      {sub.chat_id}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={sub.impact_filter}
                        onChange={(e) =>
                          handleChangeFilter(sub, e.target.value as any)
                        }
                        className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-white"
                      >
                        <option value="HIGH_ONLY">High Only</option>
                        <option value="HIGH_AND_MEDIUM">High & Medium</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {sub.quiet_hours_start}:00 – {sub.quiet_hours_end}:00 WIB
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          sub.is_active
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {sub.is_active ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleToggleUser(sub)}
                        title="Aktifkan / Matikan Alert User"
                        className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2 py-1 text-[11px] text-slate-200"
                      >
                        <Power className="h-3 w-3" />
                        {sub.is_active ? "Pause" : "Aktifkan"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(sub.id)}
                        title="Hapus Subscriber"
                        className="inline-flex items-center rounded border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-1.5 text-rose-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Telegram Broadcast + Log Pengiriman */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSendBroadcast}
          className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 space-y-3 text-xs"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Megaphone className="h-4 w-4 text-amber-400" />
            <span>Global Telegram Broadcast (Kirim ke Semua Member Aktif)</span>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Judul Broadcast</label>
            <input
              type="text"
              value={bcTitle}
              onChange={(e) => setBcTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">
              Isi Pesan / Outlook Pasar / Peringatan
            </label>
            <textarea
              rows={4}
              placeholder="Contoh: Malam ini jam 20:30 WIB ada rilis NFP USD. Seluruh member harap amankan posisi sebelum rilis..."
              value={bcMessage}
              onChange={(e) => setBcMessage(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={sendingBc || activeCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-4 py-2.5 font-semibold text-white"
          >
            <Send className="h-3.5 w-3.5" />
            {sendingBc
              ? "Mengirim Broadcast..."
              : `Kirim Broadcast ke ${activeCount} Member Aktif`}
          </button>
        </form>

        <div className="rounded-xl border border-slate-800 bg-[#0E1424] p-5 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-white">
            Log Alert Otomatis Terkirim (25 Terakhir)
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentLogs.length === 0 ? (
              <p className="text-slate-500">Belum ada log pengiriman alert.</p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2"
                >
                  <div className="truncate pr-2">
                    <div className="font-medium text-slate-200 truncate">
                      {log.event_key}
                    </div>
                    <div className="text-[10px] font-mono text-sky-400">
                      Chat ID: {log.chat_id}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {new Date(log.sent_at).toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}