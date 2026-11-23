"use client";

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldAlert,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { useActionState, useState } from "react";
import { login, loginAsMaster, type FormState } from "../actions";

const DEMO_ACCOUNTS = [
  { nik: "admin", role: "Master Admin", desc: "Akses Penuh / Superuser", badge: "All Access", highlight: true },
  { nik: "10001", role: "Tim Halal", desc: "Input & Kelola Bahan", badge: "Requester" },
  { nik: "10003", role: "Penyelia", desc: "Review & Validasi Dokumen", badge: "Reviewer 1" },
  { nik: "10005", role: "QA Lead", desc: "Approval Akhir & Rilis Bahan", badge: "Approver" },
];

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(login, {});
  const [bypassState, bypassAction, bypassPending] = useActionState<FormState, FormData>(loginAsMaster, {});

  const [employeeCode, setEmployeeCode] = useState(String(state.values?.employee_code ?? ""));
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSelectAccount = (nik: string) => {
    setEmployeeCode(nik);
    setPassword("Halal@2026");
  };

  return (
    <div className="space-y-6">
      {/* --- MASTER BYPASS SECTION --- */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 p-4 shadow-sm shadow-emerald-950/5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-700/20">
              <Zap className="size-4 fill-white" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">Akses Cepat Master</span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  Dev Bypass
                </span>
              </div>
              <p className="text-[12px] text-ink-2">Buka seluruh menu & izin sistem tanpa ketik sandi.</p>
            </div>
          </div>
        </div>

        <form action={bypassAction} className="mt-3">
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            disabled={bypassPending || pending}
            className="group relative flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-semibold text-white shadow transition-all hover:bg-emerald-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bypassPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Membuka Akses Master…</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4 text-emerald-200 transition-transform group-hover:scale-110" />
                <span>Masuk Sekarang sebagai Master Admin (Bypass)</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {bypassState.message && (
          <p className="mt-2 text-center text-xs text-red-600">{bypassState.message}</p>
        )}

        {/* Quick Autofill Pills */}
        <div className="mt-4 pt-3 border-t border-emerald-900/10">
          <div className="flex items-center justify-between text-[11px] font-medium text-ink-3 mb-2">
            <span>Pilih akun demo untuk autofill:</span>
            <span className="text-[10px] text-emerald-700 font-mono">Pass: Halal@2026</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = employeeCode === acc.nik;
              return (
                <button
                  key={acc.nik}
                  type="button"
                  onClick={() => handleSelectAccount(acc.nik)}
                  className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-100/60 text-emerald-950 font-semibold ring-1 ring-emerald-600/30"
                      : "border-line bg-white/70 text-ink-2 hover:border-emerald-300 hover:bg-white"
                  }`}
                >
                  <div className="truncate pr-1">
                    <span className="block truncate font-medium text-[11.5px]">{acc.role}</span>
                    <span className="block text-[10px] text-ink-3 font-mono">{acc.nik}</span>
                  </div>
                  <span className="rounded bg-paper-2 px-1.5 py-0.5 text-[9px] font-medium text-ink-3">
                    {acc.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- DIVIDER --- */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-line" />
        <span className="absolute bg-surface px-3 text-[11px] uppercase tracking-wider text-ink-3">
          Atau Masuk Manual
        </span>
      </div>

      {/* --- MANUAL LOGIN FORM --- */}
      <form action={formAction} className="space-y-4">
        {state.message && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold">Gagal Masuk</p>
              <p className="text-red-700">{state.message}</p>
            </div>
          </div>
        )}

        <input type="hidden" name="next" value={next} />

        {/* NIK Input */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink" htmlFor="employee_code">
            <span>Nomor Induk Karyawan (NIK)</span>
            <span className="text-[11px] font-normal text-ink-3">Contoh: admin atau 10001</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-3">
              <User className="size-4" />
            </div>
            <input
              id="employee_code"
              name="employee_code"
              type="text"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="Masukkan NIK Anda"
              className="input h-10 w-full pl-9 pr-3 text-[13px] font-mono tracking-tight"
              autoComplete="username"
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold text-ink" htmlFor="password">
              Password
            </label>
            <span className="text-[11px] text-ink-3">Default: <code className="rounded bg-paper px-1 font-mono text-emerald-800">Halal@2026</code></span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-3">
              <Lock className="size-4" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="input h-10 w-full pl-9 pr-10 text-[13px]"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-3 hover:text-ink"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending || bypassPending}
          className="btn btn-primary h-10 w-full justify-center gap-2 font-semibold shadow-sm transition-all"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Memverifikasi Akun…</span>
            </>
          ) : (
            <>
              <span>Masuk Sistem</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
