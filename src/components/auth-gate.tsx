"use client";

import React, { useEffect, useState } from "react";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type AuthMode = "LOGIN" | "REGISTER" | "FORGOT" | "RESET_PASSWORD";

export function AuthGate({
  initialMode = "LOGIN",
  onPasswordResetComplete,
}: {
  initialMode?: AuthMode;
  onPasswordResetComplete?: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMsg(null);
    setInfoMsg(null);
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const supabase = getSupabaseBrowser();
      const cleanEmail = email.trim().toLowerCase();

      if (mode === "FORGOT") {
        if (!cleanEmail) {
          setErrorMsg("Masukkan alamat email akun Anda.");
          setLoading(false);
          return;
        }

        const redirectUrl =
          typeof window !== "undefined" ? window.location.origin : undefined;

        const { error } = await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo: redirectUrl,
          }
        );

        if (error) {
          setErrorMsg(error.message);
        } else {
          setInfoMsg(
            `Tautan reset kata sandi telah dikirim ke ${cleanEmail}. Silakan periksa inbox atau folder spam email Anda.`
          );
        }
        return;
      }

      if (mode === "RESET_PASSWORD") {
        if (password.length < 6) {
          setErrorMsg("Kata sandi baru minimal 6 karakter.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg("Konfirmasi kata sandi baru tidak cocok.");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setInfoMsg("Kata sandi berhasil diperbarui! Mengalihkan ke workspace...");
          setTimeout(() => {
            if (onPasswordResetComplete) {
              onPasswordResetComplete();
            } else {
              switchMode("LOGIN");
            }
          }, 1200);
        }
        return;
      }

      if (mode === "REGISTER") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim() || cleanEmail.split("@")[0],
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (!data.session) {
          setInfoMsg(
            "Pendaftaran berhasil! Silakan cek inbox/spam email Anda untuk klik tautan konfirmasi, lalu masuk kembali."
          );
          setMode("LOGIN");
        }
        return;
      }

      // Default: LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setErrorMsg(
          error.message === "Invalid login credentials"
            ? "Email atau kata sandi salah."
            : error.message
        );
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal menghubungkan ke server autentikasi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0E1424] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-mono font-semibold text-indigo-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            SILENT ZENITH OS v4.0
          </div>

          <h1 className="text-2xl font-bold text-white">
            {mode === "LOGIN" && "Masuk ke Terminal"}
            {mode === "REGISTER" && "Buat Akun Baru"}
            {mode === "FORGOT" && "Pemulihan Kata Sandi"}
            {mode === "RESET_PASSWORD" && "Buat Kata Sandi Baru"}
          </h1>

          <p className="text-xs text-slate-400">
            {mode === "LOGIN" &&
              "Gunakan email & password akun Anda untuk mengakses jurnal, compounding, dan bot Telegram pribadi."}
            {mode === "REGISTER" &&
              "Daftar menggunakan email Anda untuk mendapatkan workspace pribadi & alert berita otomatis."}
            {mode === "FORGOT" &&
              "Masukkan email yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda."}
            {mode === "RESET_PASSWORD" &&
              "Tautan pemulihan terverifikasi. Silakan masukkan kata sandi baru untuk akun Anda."}
          </p>
        </div>

        {/* Switcher Tab Login / Register */}
        {(mode === "LOGIN" || mode === "REGISTER") && (
          <div className="grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => switchMode("LOGIN")}
              className={`rounded-lg py-2 transition ${
                mode === "LOGIN"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => switchMode("REGISTER")}
              className={`rounded-lg py-2 transition ${
                mode === "REGISTER"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Daftar Baru
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === "REGISTER" && (
            <div>
              <label className="block text-slate-400 mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {(mode === "LOGIN" || mode === "REGISTER" || mode === "FORGOT") && (
            <div>
              <label className="block text-slate-400 mb-1.5">Alamat Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {(mode === "LOGIN" ||
            mode === "REGISTER" ||
            mode === "RESET_PASSWORD") && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-400">
                  {mode === "RESET_PASSWORD"
                    ? "Kata Sandi Baru"
                    : "Kata Sandi"}
                </label>
                {mode === "LOGIN" && (
                  <button
                    type="button"
                    onClick={() => switchMode("FORGOT")}
                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Lupa kata sandi?
                  </button>
                )}
              </div>

              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-10 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  aria-label="Tampilkan atau sembunyikan kata sandi"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {mode === "RESET_PASSWORD" && (
            <div>
              <label className="block text-slate-400 mb-1.5">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <KeyRound className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 font-semibold text-white transition shadow-lg shadow-indigo-600/20"
          >
            <span>
              {loading
                ? "Memproses..."
                : mode === "LOGIN"
                ? "Masuk ke Workspace"
                : mode === "REGISTER"
                ? "Daftar & Buat Workspace"
                : mode === "FORGOT"
                ? "Kirim Tautan Reset Password"
                : "Simpan Kata Sandi Baru"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>

          {mode === "FORGOT" && (
            <button
              type="button"
              onClick={() => switchMode("LOGIN")}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800 py-2.5 font-medium text-slate-300 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Halaman Login
            </button>
          )}
        </form>
      </div>
    </div>
  );
}