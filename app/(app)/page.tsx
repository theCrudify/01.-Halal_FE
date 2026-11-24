import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  FileCheck2,
  Plus,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardCharts } from "@/components/dashboard-charts";
import { daysUntil, EmptyState, fmtDate, fmtDateTime, LinkButton, timeAgo, toneDot } from "@/components/ui";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Ringkasan Eksekutif · SJH Halal" };

const tz = { timeZone: "Asia/Jakarta" } as const;
const greeting = () => {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, ...tz }).format(new Date()));
  return h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
};

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

const MoreLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="group inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors">
    <span>{children}</span>
    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
  </Link>
);

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "#3b82f6", // Blue
  PENYELIA: "#f59e0b", // Amber
  KOORDINATOR: "#ec4899", // Pink
  QA: "#8b5cf6", // Purple
  RELEASE: "#059669", // Emerald
  REJECTED: "#ef4444", // Red
  DRAFT: "#94a3b8", // Slate
};

const PLANT_COLORS: Record<string, string> = {
  "1201": "#059669", // Emerald
  "1202": "#0d9488", // Teal
  "1203": "#3b82f6", // Sky blue
};

export default async function DashboardPage() {
  const user = await requireUser();
  const s = await getServices();
  const [meta, d] = await Promise.all([getMeta(), s.dashboard.summary()]);
  const reviewer = meta.can("request.view_all");
  const w = d.windowCodes;
  const expiringHref = (code?: string | null, extra = "") => (code ? `/materials?expiry=${code}&is_active=true${extra}` : "/materials?is_active=true");

  const [tasks, expiring] = await Promise.all([
    reviewer ? s.requests.list({ scope: "tasks", pageSize: "5", sortBy: "updated_at", sortDir: "asc" }) : null,
    s.materials.list({ ...(w.upcoming && { expiry: w.upcoming }), is_active: "true", sortBy: "expired_date", sortDir: "asc", pageSize: "5" }),
  ]);

  const plants = meta.plantOptions().map((p) => p.value);
  const steps = meta.steps();
  const states = meta.active("workflow_states");
  const byStatus = (st: string) => d.materials.filter((m: any) => m.status === st).reduce((a: number, m: any) => a + m.total, 0);
  const total = d.materials.reduce((a: number, m: any) => a + m.total, 0);
  const inReview = steps.reduce((a, st) => a + byStatus(st.code), 0);
  const queue = (plant: string, step: number) => d.pipeline.find((p: any) => p.plant === plant && p.current_step === step)?.total ?? 0;
  const maxQueue = Math.max(1, ...d.pipeline.map((p: any) => p.total));
  const today = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", ...tz }).format(new Date());

  const todo = [
    reviewer && d.myTasks > 0 && (
      <Link key="t" href="/requests?scope=tasks" className="font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:decoration-emerald-700">
        {d.myTasks} request menunggu persetujuan Anda
      </Link>
    ),
    d.expiry.expired > 0 && (
      <Link key="e" href={expiringHref(w.expired)} className="font-bold text-rose-700 underline decoration-rose-300 underline-offset-4 hover:decoration-rose-700">
        {d.expiry.expired} bahan aktif bersertifikat kedaluwarsa
      </Link>
    ),
  ].filter(Boolean);

  // --- CHART DATA PREPARATION ---
  const statusChartData = states
    .map((st) => ({
      name: st.name,
      code: st.code,
      value: byStatus(st.code),
      color: STATUS_COLORS[st.code] ?? "#059669",
    }))
    .filter((s) => s.value > 0);

  const plantsList = plants.map((p, idx) => ({
    key: p,
    name: meta.name("plants", p),
    color: PLANT_COLORS[p] ?? (idx === 0 ? "#059669" : idx === 1 ? "#0d9488" : "#3b82f6"),
  }));

  const pipelineChartData = steps.map((st) => {
    const row: any = { step: meta.name("roles", st.role_code) };
    for (const p of plants) {
      row[p] = queue(p, st.step_no);
    }
    return row;
  });

  const safeCount = Math.max(0, total - (d.expiry.expired + d.expiry.expiring_30 + d.expiry.expiring_90));
  const expiryChartData = {
    expired: d.expiry.expired,
    expiring_30: d.expiry.expiring_30,
    expiring_90: d.expiry.expiring_90,
    safe: safeCount,
    total,
  };

  return (
    <div className="space-y-6">
      {/* --- WELCOME HERO BANNER --- */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-600/15 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 sm:p-8 text-white shadow-md shadow-emerald-950/10">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 right-1/3 size-60 rounded-full bg-teal-400/10 blur-2xl" aria-hidden />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-sm mb-3">
              <Sparkles className="size-3.5 text-emerald-300" />
              <span>{today}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {greeting()}, {user.name.split(" ")[0]}!
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-emerald-100/80">
              {todo.length ? (
                <>Perhatian: Ada {todo.reduce<ReactNode[]>((acc, el, i) => (i ? [...acc, " dan ", el] : [el]), [])}.</>
              ) : (
                "Semua sistem operasional halal dan workflow bahan berjalan lancar hari ini."
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/requests/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-bold text-emerald-950 shadow-md shadow-emerald-950/20 transition-all hover:bg-emerald-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="size-4 stroke-[2.5]" />
              <span>Ajukan Bahan Baru</span>
            </Link>
          </div>
        </div>
      </div>

      {/* --- STAT STRIP (4 MODERN CARDS) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Bahan Terdaftar",
            value: total,
            sub: `${byStatus(meta.terminal("release")?.code ?? "")} release · ${plants.length} plant`,
            href: "/materials",
            icon: Boxes,
            color: "emerald",
          },
          {
            label: "Sedang Direview",
            value: inReview,
            sub: `${byStatus(meta.terminal("rejected")?.code ?? "")} butuh revisi`,
            href: "/requests?scope=all",
            icon: Clock,
            color: "blue",
          },
          {
            label: "Release Bulan Ini",
            value: d.releasedThisMonth,
            sub: "Bahan baru & perubahan",
            href: `/requests?scope=all&status=${meta.terminal("release")?.code ?? ""}`,
            icon: FileCheck2,
            color: "teal",
          },
          {
            label: `SH Segera Habis`,
            value: d.expiry.expiring_30 + d.expiry.expiring_90,
            sub: `${d.expiry.expiring_30} item ≤ ${d.thresholds.soon} hari`,
            href: expiringHref(w.upcoming),
            icon: AlertTriangle,
            color: d.expiry.expiring_30 > 0 ? "rose" : "amber",
            warn: d.expiry.expiring_30 > 0,
          },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              href={k.href}
              className="card group p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{k.label}</span>
                <span
                  className={`flex size-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${
                    k.warn
                      ? "bg-rose-50 text-rose-600 ring-1 ring-rose-500/20"
                      : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20"
                  }`}
                >
                  <Icon className="size-4 stroke-[2]" />
                </span>
              </div>
              <p
                className={`num mt-3 text-3xl font-extrabold tracking-tight ${
                  k.warn ? "text-rose-600" : "text-slate-900"
                }`}
              >
                {k.value}
              </p>
              <p className="mt-1.5 text-xs text-slate-500 font-medium">{k.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* --- INTERACTIVE CHARTS & VISUAL ANALYTICS --- */}
      <DashboardCharts
        statusData={statusChartData}
        pipelineData={pipelineChartData}
        plants={plantsList}
        expiryData={expiryChartData}
        certData={d.certificates}
      />

      {/* --- TWO COLUMN DASHBOARD PANELS (TASKS & RECENT) --- */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left Column: Tasks & Expiring List */}
        <div className="space-y-6 xl:col-span-7">
          {tasks && (
            <Panel
              title="Menunggu Persetujuan Anda"
              action={<MoreLink href="/requests?scope=tasks">Task List · {d.myTasks}</MoreLink>}
            >
              {tasks.data.length === 0 ? (
                <EmptyState title="Antrian Bersih" description="Tidak ada request yang memerlukan approval Anda saat ini." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {tasks.data.map((t: any) => (
                    <li key={t.id}>
                      <Link
                        href={`/requests/${t.id}`}
                        className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3 hover:bg-emerald-50/30 transition-colors"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-slate-900">{t.material_desc}</span>
                          <span className="code block truncate text-[11px] text-slate-500 mt-0.5">
                            #{t.id} · {t.material_code} · {meta.plantLabel(t.plant)} ·{" "}
                            {t.request_type === "New" ? "Bahan Baru" : "Perubahan"}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-800 ring-1 ring-amber-600/20">
                            {meta.stepAt(t.current_step)?.name ?? `Tahap ${t.current_step}`}
                          </span>
                          <time className="num block text-[11px] text-slate-400 mt-1" title={fmtDateTime(t.updated_at)}>
                            {timeAgo(t.updated_at)}
                          </time>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}

          <Panel
            title="Sertifikat Bahan Segera Habis"
            action={<MoreLink href={expiringHref(w.upcoming, "&sortBy=expired_date&sortDir=asc")}>Lihat Semua</MoreLink>}
          >
            {expiring.data.length === 0 ? (
              <EmptyState title="Seluruh Sertifikat Aman" description={`Tidak ada sertifikat bahan aktif yang habis dalam ${d.thresholds.upcoming} hari ke depan.`} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {expiring.data.map((m: any) => {
                  const days = daysUntil(m.expired_date);
                  const isCritical = days <= d.thresholds.soon;
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/materials/${m.id}`}
                        className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3.5 px-5 py-3 hover:bg-rose-50/30 transition-colors"
                      >
                        <span
                          className={`num text-center rounded-lg p-1.5 font-bold leading-tight ${
                            isCritical
                              ? "bg-rose-100 text-rose-800 ring-1 ring-rose-500/20"
                              : "bg-amber-100 text-amber-800 ring-1 ring-amber-500/20"
                          }`}
                        >
                          <span className="block text-base">{days}</span>
                          <span className="block text-[9px] uppercase tracking-wider font-semibold">hari</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-slate-900">{m.material_desc}</span>
                          <span className="code block truncate text-[11px] text-slate-500 mt-0.5">
                            {m.material_code} · {m.manufacturer_name} · {meta.name("halal_bodies", m.halal_body)}
                          </span>
                        </span>
                        <span className="num text-xs font-semibold text-slate-500">{fmtDate(m.expired_date)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* Right Column: Pipeline Matrix & Recent Activity */}
        <div className="space-y-6 xl:col-span-5">
          <Panel title="Antrian Persetujuan per Tahap">
            <table className="w-full border-separate border-spacing-0 text-xs">
              <thead>
                <tr>
                  <th className="th">Tahap Approval</th>
                  {plants.map((p) => (
                    <th key={p} className="th text-right">
                      {meta.name("plants", p)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {steps.map((st) => (
                  <tr key={st.code} className="hover:bg-slate-50/60 transition-colors">
                    <td className="td font-medium">
                      <span className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${toneDot(st.tone)}`} aria-hidden />
                        {meta.name("roles", st.role_code)}
                      </span>
                    </td>
                    {plants.map((p) => {
                      const n = queue(p, st.step_no);
                      return (
                        <td key={p} className="td p-1.5 text-right">
                          <Link
                            href={`/requests?scope=all&plant=${p}&status=${encodeURIComponent(st.code)}`}
                            className={`num inline-block min-w-7 rounded-md px-2 py-0.5 text-center font-bold transition-all ${
                              n
                                ? "bg-emerald-100/70 text-emerald-900 hover:bg-emerald-200"
                                : "text-slate-300"
                            }`}
                            aria-label={`${meta.name("roles", st.role_code)}, ${meta.plantLabel(p)}: ${n}`}
                          >
                            {n}
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Aktivitas Alur Terbaru" action={<MoreLink href="/requests?scope=all">Semua Riwayat</MoreLink>}>
            <ol className="p-4 space-y-3">
              {d.recent.map((r: any) => (
                <li
                  key={r.id}
                  className="relative flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition-colors hover:bg-slate-100/70"
                >
                  <span
                    className={`mt-1 size-2 shrink-0 rounded-full ring-2 ring-white ${
                      r.action === "Reject"
                        ? "bg-rose-500"
                        : r.action === "Release"
                        ? "bg-emerald-600"
                        : r.action === "Approve"
                        ? "bg-teal-500"
                        : "bg-sky-500"
                    }`}
                    aria-hidden
                  />
                  <Link href={`/requests/${r.request_id}`} className="min-w-0 flex-1 group">
                    <span className="block truncate text-xs text-slate-800">
                      <span className="font-bold">{r.user_name}</span>{" "}
                      <span className="text-slate-500">
                        {r.action === "Submit"
                          ? "mengajukan"
                          : r.action === "Reject"
                          ? "menolak"
                          : r.action === "Release"
                          ? "me-release"
                          : r.action === "Resubmit"
                          ? "mengajukan ulang"
                          : "menyetujui"}
                      </span>{" "}
                      <span className="font-semibold text-emerald-800 group-hover:underline">{r.material_desc}</span>
                    </span>
                    <span className="code block truncate text-[11px] text-slate-400 mt-0.5">
                      {r.material_code} · {meta.plantLabel(r.plant)}
                    </span>
                  </Link>
                  <time className="num shrink-0 text-[10.5px] font-medium text-slate-400 pt-0.5" title={fmtDateTime(r.created_at)}>
                    {timeAgo(r.created_at)}
                  </time>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}
