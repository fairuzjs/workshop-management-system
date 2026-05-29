"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Wrench, Eye, EyeOff, Loader2, ShieldCheck, BarChart3, Clock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Username atau password salah");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Clock,
      title: "Tracking Real-time",
      desc: "Monitor progress work order secara langsung",
    },
    {
      icon: BarChart3,
      title: "Laporan Lengkap",
      desc: "Analisis keuangan dan performa bengkel",
    },
    {
      icon: ShieldCheck,
      title: "Aman & Terpercaya",
      desc: "Data terenkripsi dan tersimpan dengan aman",
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding (Desktop Only) */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 p-12 text-primary-foreground lg:flex">
        {/* Decorative */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-20 bottom-40 h-40 w-40 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Wrench className="h-6 w-6" />
            </div>
            <span className="text-lg font-bold">Workshop Management</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Kelola bengkel
              <br />
              lebih mudah &<br />
              efisien.
            </h1>
            <p className="mt-4 max-w-md text-lg text-primary-foreground/80">
              Sistem manajemen bengkel all-in-one untuk meningkatkan produktivitas dan kepuasan pelanggan.
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <b.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{b.title}</p>
                  <p className="text-sm text-primary-foreground/70">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-sm text-primary-foreground/50">
            © 2026 Workshop Management System
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile Logo */}
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Wrench className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Workshop Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk ke dashboard anda
          </p>
        </div>

        {/* Desktop Title */}
        <div className="mb-8 hidden w-full max-w-[400px] lg:block">
          <h2 className="text-2xl font-bold text-foreground">
            Selamat datang kembali
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk ke dashboard anda untuk mulai mengelola bengkel
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[400px]">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-foreground"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
            © 2026 Workshop Management System
          </p>
        </div>
      </div>
    </div>
  );
}
