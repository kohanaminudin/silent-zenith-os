"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  KeyRound,
  X,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ZenithLogo, formatCompactUSD } from "./brand-and-chart";

export type StaffOrUserRole = "owner" | "super_admin" | "moderator" | "user";

export interface UserProfileRecord {
  id: string;
  email: string;
  full_name: string | null;
  role: StaffOrUserRole;
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
 * 1. Halaman Login, Register, Lupa Password & Reset Password Baru
 */
export function AuthScreen({
  onSuccess,
  initialRecoveryMode = false,
}: {
  onSuccess: () => void;
  initialRecoveryMode?: boolean;
}) {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "update_password">(
    initialRecoveryMode ? "update_password" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      const redirectUrl =
        typeof window !== "undefined" ? `${window.location.origin}/` : undefined;

      if (mode === "register") {
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
          setInfoMsg("Akun berhasil dibuat! Cek inbox email kamu untuk link verifikasi.");
          setMode("login");
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });
        if (error) throw error;
        setInfoMsg(
          "Link pemulihan password telah dikirim ke email kamu. Klik link tersebut untuk membuat password baru."
        );
      } else if (mode === "update_password") {
        if (password !== confirmPassword) {
          throw new Error("Konfirmasi password tidak cocok.");
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setInfoMsg("Password berhasil diperbarui! Mengalihkan ke dashboard...");
        setTimeout(() => onSuccess(), 1000);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess();
      }
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : "";
      if (rawMsg.toLowerCase().includes("rate limit")) {
        setErrorMsg(
          "Batas pengiriman email sementara tercapai (maks. 2x/jam pada server default). Silakan tunggu beberapa menit sebelum mencoba lagi."
        );
      } else {
        setErrorMsg(rawMsg || "Terjadi kesalahan autentikasi.");
      }
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
              {mode === "login" && "Masuk ke workspace compounding pribadi Anda"}
              {mode === "register" && "Buat akun baru untuk memulai misi $1 Miliar"}
              {mode === "forgot" && "Masukkan email terdaftar untuk menerima link reset password"}
              {mode === "update_password" && "Buat password baru untuk mengamankan akun Anda"}
            </p>
          </div>
        </div>

        {(mode === "login" || mode === "register") && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === "login" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === "register" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>
        )}

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

          {(mode === "login" || mode === "register" || mode === "forgot") && (
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
          )}

          {(mode === "login" || mode === "register" || mode === "update_password") && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-zinc-400">
                  {mode === "update_password" ? "Password Baru (Min. 6 karakter)" : "Password"}
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="text-xs text-emerald-400 hover:underline cursor-pointer"
                  >
                    Lupa password?
                  </button>
                )}
              </div>
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
          )}

          {mode === "update_password" && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Ulangi Password Baru</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === "login" && "Masuk ke Dashboard"}
                {mode === "register" && "Daftar Sekarang"}
                {mode === "forgot" && "Kirim Link Reset Password"}
                {mode === "update_password" && "Simpan Password Baru"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke halaman Login
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
}

/**
 * 2. Modal Pengaturan Akun & Ganti Password (Settings Modal)
 */
export function AccountSettingsModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  onNotify,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileRecord;
  onProfileUpdated: (newName: string) => void;
  onNotify: (msg: string) => void;
}) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);

    try {
      // 1. Update nama profil jika berubah
      if (fullName.trim() && fullName !== profile.full_name) {
        const { error: profErr } = await supabase
          .from("user_profiles")
          .update({ full_name: fullName.trim() })
          .eq("id", profile.id);
        if (profErr) throw profErr;
        onProfileUpdated(fullName.trim());
      }

      // 2. Update password jika diisi
      if (newPassword) {
        if (newPassword.length < 6) {
          throw new Error("Password baru minimal 6 karakter.");
        }
        if (newPassword !== confirmNewPassword) {
          throw new Error("Konfirmasi password baru tidak sama.");
        }
        const { error: pwErr } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (pwErr) throw pwErr;
      }

      setNewPassword("");
      setConfirmNewPassword("");
      onNotify("Pengaturan akun & password berhasil diperbarui!");
      onClose();
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold">Pengaturan Akun & Keamanan</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {err && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {err}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Email Akun</label>
                <input
                  type="text"
                  disabled
                  value={profile.email}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950/60 text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Nama Tampilan</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                />
              </div>

              <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
                <p className="text-xs font-semibold text-zinc-400">
                  Ganti Password (Kosongkan jika tidak ingin mengubah)
                </p>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Password Baru</label>
                  <input
                    type="password"
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    minLength={6}
                    placeholder="Ulangi password baru"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * 3. Panel Eksklusif Super Admin
 */
interface SuperAdminPanelProps {
  currentUserRole: StaffOrUserRole;
  allUsers: UserProfileRecord[];
  currentAnnouncement: string;
  onRefreshUsers: () => Promise<void>;
  onPostAnnouncement: (msg: string) => Promise<void>;
  onNotify: (msg: string) => void;
}

export function SuperAdminPanel({
  currentUserRole,
  allUsers,
  currentAnnouncement,
  onRefreshUsers,
  onPostAnnouncement,
  onNotify,
}: SuperAdminPanelProps) {
  const [broadcastText, setBroadcastText] = useState(currentAnnouncement);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const isOwner = currentUserRole === "owner";
  const isSuperAdmin = currentUserRole === "super_admin";
  const isModerator = currentUserRole === "moderator";

  const totalCommunityCapital = allUsers.reduce(
    (sum, u) => sum + (u.latest_balance ?? Number(u.initial_capital)),
    0
  );

  const canSuspendTarget = (target: UserProfileRecord) => {
    if (target.role === "owner") return false;
    if (isOwner) return true;
    if (isSuperAdmin) return target.role === "moderator" || target.role === "user";
    if (isModerator) return target.role === "user";
    return false;
  };

  const handleToggleSuspend = async (user: UserProfileRecord) => {
    if (!canSuspendTarget(user)) {
      onNotify("Anda tidak memiliki izin untuk mengubah status akun ini.");
      return;
    }
    setBusyUserId(user.id);
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_suspended: !user.is_suspended })
      .eq("id", user.id);

    if (error) {
      onNotify(error.message);
    } else {
      await onRefreshUsers();
      onNotify(
        !user.is_suspended
          ? `Akun ${user.email} dinonaktifkan sementara.`
          : `Akun ${user.email} diaktifkan kembali.`
      );
    }
    setBusyUserId(null);
  };

  const handleSetRole = async (user: UserProfileRecord, nextRole: StaffOrUserRole) => {
    if (user.role === "owner" || nextRole === "owner") {
      onNotify("Role OWNER bersifat mutlak dan dilindungi sistem.");
      return;
    }
    if (!isOwner && !(isSuperAdmin && (nextRole === "moderator" || nextRole === "user") && user.role !== "super_admin")) {
      onNotify("Anda tidak memiliki otoritas untuk menetapkan role ini.");
      return;
    }

    setBusyUserId(user.id);
    const { error } = await supabase
      .from("user_profiles")
      .update({ role: nextRole })
      .eq("id", user.id);

    if (error) {
      onNotify(error.message);
    } else {
      await onRefreshUsers();
      onNotify(`Role ${user.email} diperbarui menjadi ${nextRole.toUpperCase()}.`);
    }
    setBusyUserId(null);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPostAnnouncement(broadcastText);
  };

  const headerTitle = isOwner
    ? "Owner Command Center"
    : isSuperAdmin
    ? "Super Admin Command Center"
    : "Moderator Assistant Panel";

  const headerBadge = isOwner
    ? "Immutable Root Owner"
    : isSuperAdmin
    ? "Super Admin Access"
    : "Assistant Moderator";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-zinc-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight flex flex-wrap items-center gap-2">
              {headerTitle}
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {headerBadge}
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isModerator
                ? "Mode Asisten: Pantau telemetri komunitas, kelola pengumuman, dan moderasi akun user."
                : "Kendali manajemen pengguna, delegasi asisten moderator, dan telemetri komunitas."}
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

      {/* Global Broadcast */}
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
            placeholder="Tulis pengumuman, catatan disiplin risk, atau update sistem..."
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

      {/* Tabel Direktori Pengguna */}
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
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 text-xs text-zinc-500 bg-zinc-50/50 dark:bg-zinc-950/50">
                <th className="py-3 px-4 font-medium">Pengguna</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Modal Awal</th>
                <th className="py-3 px-4 font-medium">Saldo Terkini</th>
                <th className="py-3 px-4 font-medium">Target Akhir</th>
                <th className="py-3 px-4 font-medium">Sesi Jurnal</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Kontrol Hak Akses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 tabular-nums">
              {allUsers.map((u) => {
                const targetIsOwner = u.role === "owner";
                const targetIsAdmin = u.role === "super_admin";
                const targetIsMod = u.role === "moderator";

                return (
                  <tr key={u.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                    <td className="py-3 px-4">
                      <div className="font-medium">{u.full_name || "Trader"}</div>
                      <div className="text-xs text-zinc-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          targetIsOwner
                            ? "bg-gradient-to-r from-amber-500/25 to-emerald-500/25 text-amber-400 border border-amber-400/50"
                            : targetIsAdmin
                            ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                            : targetIsMod
                            ? "bg-violet-500/15 text-violet-400 border border-violet-500/30"
                            : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        {(targetIsOwner || targetIsAdmin) && <Crown className="w-3 h-3" />}
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
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {targetIsOwner ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Lock className="w-3 h-3" /> Dilindungi Sistem
                        </span>
                      ) : (
                        <>
                          {/* Kontrol Delegasi Moderator (Bisa dilakukan oleh Owner & Super Admin untuk akun user/moderator) */}
                          {(isOwner || (isSuperAdmin && !targetIsAdmin)) && (
                            <button
                              type="button"
                              disabled={busyUserId === u.id}
                              onClick={() =>
                                handleSetRole(u, targetIsMod ? "user" : "moderator")
                              }
                              className="px-2.5 py-1 rounded-lg text-xs border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 cursor-pointer"
                            >
                              {targetIsMod ? "Copot Moderator" : "Jadikan Moderator"}
                            </button>
                          )}

                          {/* Kontrol Delegasi Super Admin (HANYA bisa dilakukan oleh OWNER) */}
                          {isOwner && (
                            <button
                              type="button"
                              disabled={busyUserId === u.id}
                              onClick={() =>
                                handleSetRole(u, targetIsAdmin ? "user" : "super_admin")
                              }
                              className="px-2.5 py-1 rounded-lg text-xs border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                            >
                              {targetIsAdmin ? "Turunkan Admin" : "Angkat Super Admin"}
                            </button>
                          )}

                          {/* Tombol Suspend sesuai hierarki wewenang */}
                          {canSuspendTarget(u) ? (
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
                          ) : (
                            isModerator && (
                              <span className="text-[11px] text-zinc-500 italic">
                                Akses Terbatas
                              </span>
                            )
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}