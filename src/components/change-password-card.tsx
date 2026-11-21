"use client";

import React, { useState } from "react";
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export function ChangePasswordCard({ userEmail }: { userEmail: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 6) {
      setFeedback({
        ok: false,
        message: "Kata sandi baru minimal harus 6 karakter.",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setFeedback({
        ok: false,
        message: "Konfirmasi kata sandi baru tidak cocok.",
      });
      return;
    }

    if (currentPassword === newPassword) {
      setFeedback({
        ok: false,
        message: "Kata sandi baru tidak boleh sama dengan kata sandi lama.",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();

      // 1. Verifikasi kata sandi lama terlebih dahulu
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail.trim().toLowerCase(),
        password: currentPassword,
      });

      if (verifyError) {
        setFeedback({
          ok: false,
          message: "Kata sandi lama Anda salah. Silakan periksa kembali.",
        });
        setLoading(false);
        return;
      }

      // 2. Perbarui ke kata sandi baru
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setFeedback({
          ok: false,
          message: updateError.message,
        });
      } else {
        setFeedback({
          ok: true,
          message: "Kata sandi akun Anda berhasil diperbarui!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (err) {
      setFeedback({
        ok: false,
        message:
          err instanceof Error ? err.message : "Gagal memperbarui kata sandi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0E1424] p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-400" />
          <div>
            <h2 className="text-base font-bold text-white">
              Keamanan Akun & Ganti Kata Sandi
            </h2>
            <p className="text-xs text-slate-400">
              Perbarui kata sandi login untuk akun{" "}
              <span className="font-mono text-slate-300">{userEmail}</span>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPasswords((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
        >
          {showPasswords ? (
            <>
              <EyeOff className="h-3.5 w-3.5" /> Sembunyikan Sandi
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" /> Tampilkan Sandi
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            feedback.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form
        onSubmit={handleChangePassword}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs"
      >
        <div>
          <label className="block text-slate-400 mb-1.5">
            Kata Sandi Lama
          </label>
          <div className="relative">
            <Lock className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type={showPasswords ? "text" : "password"}
              placeholder="Masukkan sandi saat ini"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 mb-1.5">
            Kata Sandi Baru (Min. 6 Karakter)
          </label>
          <div className="relative">
            <KeyRound className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type={showPasswords ? "text" : "password"}
              minLength={6}
              placeholder="Masukkan sandi baru"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 mb-1.5">
            Konfirmasi Kata Sandi Baru
          </label>
          <div className="relative">
            <KeyRound className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type={showPasswords ? "text" : "password"}
              minLength={6}
              placeholder="Ulangi sandi baru"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="md:col-span-3 flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-5 py-2.5 font-semibold text-white transition"
          >
            <CheckCircle2 className="h-4 w-4" />
            {loading ? "Memverifikasi & Menyimpan..." : "Simpan Kata Sandi Baru"}
          </button>
        </div>
      </form>
    </div>
  );
}