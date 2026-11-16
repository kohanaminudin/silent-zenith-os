"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Users,
  Megaphone,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Send,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ZenithLogo, formatCompactUSD } from "./brand-and-chart";

export interface UserProfileRecord {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "super_admin";
  is_suspended: boolean;
  initial_capital: number;
  target_capital: number;
  daily_target_pct: number;
  risk_per_day_pct: number;
  selected_day: number;
  created_at: string;
  latest_balance?: number;
  sessions_count?: number;
}

/**
 * 1. Halaman Login & Pendaftaran Akun Baru
 */
export function AuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (mode === "register") {
        const redirectUrl =
          typeof window !== "undefined" ? `${window.location.origin}/` : undefined;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: fullName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (data.session) {
          onSuccess();
        } else {
          setInfoMsg("Akun berhasil dibuat! Silakan cek kotak masuk email kamu untuk konfirmasi.");
          setMode("login");
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan autentikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_55%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-zinc-900/90 border border-zinc-800/90 p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <ZenithLogo className="w-12 h-12" />
          <div>
            <h1 className="text-lg font-bold tracking-tight uppercase">Silent Zenith OS</h1>
            <p className="text-xs text-zinc-400 mt-1">
              {mode === "login"
                ? "Masuk ke workspace compounding pribadi Anda"
                : "Buat akun baru untuk memulai misi $1 Miliar"}
            </p>
          </div>
        </div>

        {/* Switcher Login / Daftar */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === "login" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mode === "register" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Nama Lengkap / Alias</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Zenith Trader"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Password (Min. 6 karakter)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Masuk ke Dashboard" : "Daftar Sekarang"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/**
 * 2. Panel Eksklusif Super Admin (Admin Tertinggi)
 */
interface SuperAdminPanelProps {
  allUsers: UserProfileRecord[];
  currentAnnouncement: string;
  onRefreshUsers: () => Promise<void>;
  onPostAnnouncement: (msg: string) => Promise<void>;
  onNotify: (msg: string) => void;
}

export function SuperAdminPanel({
  allUsers,
  currentAnnouncement,
  onRefreshUsers,
  onPostAnnouncement,
  onNotify,
}: SuperAdminPanelProps) {
  const [broadcastText, setBroadcastText] = useState(currentAnnouncement);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const totalCommunityCapital = allUsers.reduce(
    (sum, u) => sum + (u.latest_balance ?? Number(u.initial_capital)),
    0
  );

  const handleToggleSuspend = async (user: UserProfileRecord) => {
    setBusyUserId(user.id);
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_suspended: !user.is_suspended })
      .eq("id", user.id);

    if (!error) {
      await onRefreshUsers();
      onNotify(
        !user.is_suspended
          ? `Akun ${user.email} dinonaktifkan sementara.`
          : `Akun ${user.email} diaktifkan kembali.`
      );
    }
    setBusyUserId(null);
  };

  const handleToggleRole = async (user: UserProfileRecord) => {
    const nextRole = user.role === "super_admin" ? "user" : "super_admin";
    setBusyUserId(user.id);
    const { error } = await supabase
      .from("user_profiles")
      .update({ role: nextRole })
      .eq("id", user.id);

    if (!error) {
      await onRefreshUsers();
      onNotify(`Role ${user.email} diubah menjadi ${nextRole.toUpperCase()}.`);
    }
    setBusyUserId(null);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPostAnnouncement(broadcastText);
  };

  return (
    <div className="space-y-6">
      {/* Header Command Center */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-zinc-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              Super Admin Command Center
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Root Access
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Kendali penuh atas seluruh pengguna, telemetri portofolio komunitas, dan pengumuman global.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 tabular-nums">
          <div>
            <p className="text-[11px] text-zinc-500">Total Pengguna</p>
            <p className="text-xl font-bold">{allUsers.length} Akun</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Agregat Dana Komunitas</p>
            <p className="text-xl font-bold text-emerald-500">
              {formatCompactUSD(totalCommunityCapital)}
            </p>
          </div>
        </div>
      </div>

      {/* Global Broadcast System */}
      <form
        onSubmit={handleSendBroadcast}
        className="p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Megaphone className="w-4 h-4 text-amber-500" />
          <span>Broadcast Pengumuman Global ke Semua User</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Tulis pengumuman, catatan disiplin risk, atau update sistem (kosongkan untuk menyembunyikan banner)..."
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Publikasikan Banner
          </button>
        </div>
      </form>

      {/* Tabel Manajemen Seluruh Pengguna */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Direktori & Telemetri Seluruh Pengguna</h3>
          </div>
          <button
            type="button"
            onClick={onRefreshUsers}
            className="text-xs text-emerald-500 hover:underline cursor-pointer"
          >
            Refresh Data
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 text-xs text-zinc-500 bg-zinc-50/50 dark:bg-zinc-950/50">
                <th className="py-3 px-4 font-medium">Pengguna</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Modal Awal</th>
                <th className="py-3 px-4 font-medium">Saldo Terkini</th>
                <th className="py-3 px-4 font-medium">Target Akhir</th>
                <th className="py-3 px-4 font-medium">Sesi Jurnal</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Kontrol Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 tabular-nums">
              {allUsers.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-4">
                    <div className="font-medium">{u.full_name || "Trader"}</div>
                    <div className="text-xs text-zinc-500">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        u.role === "super_admin"
                          ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                          : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {u.role === "super_admin" && <Crown className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">{formatCompactUSD(Number(u.initial_capital))}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-500">
                    {formatCompactUSD(u.latest_balance ?? Number(u.initial_capital))}
                  </td>
                  <td className="py-3 px-4">{formatCompactUSD(Number(u.target_capital))}</td>
                  <td className="py-3 px-4">{u.sessions_count ?? 0} Sesi</td>
                  <td className="py-3 px-4">
                    {u.is_suspended ? (
                      <span className="inline-flex items-center gap-1 text-xs text-rose-500 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" /> Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      type="button"
                      disabled={busyUserId === u.id}
                      onClick={() => handleToggleRole(u)}
                      className="px-2.5 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      {u.role === "super_admin" ? "Jadikan User" : "Jadikan Admin"}
                    </button>
                    <button
                      type="button"
                      disabled={busyUserId === u.id}
                      onClick={() => handleToggleSuspend(u)}
                      className={`px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer ${
                        u.is_suspended
                          ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      {u.is_suspended ? "Aktifkan" : "Suspend"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}