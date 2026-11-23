"use client";

import { AlertTriangle, BarChart3, CheckCircle2, Clock, PieChart as PieChartIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StatusData = {
  name: string;
  code: string;
  value: number;
  color: string;
};

type PipelineStepData = {
  step: string;
  [plantName: string]: string | number;
};

type ExpiryData = {
  expired: number;
  expiring_30: number;
  expiring_90: number;
  safe: number;
  total: number;
};

type CertificateData = {
  total: number;
  valid: number;
  expiring: number;
};

export function DashboardCharts({
  statusData,
  pipelineData,
  plants,
  expiryData,
  certData,
}: {
  statusData: StatusData[];
  pipelineData: PipelineStepData[];
  plants: { key: string; name: string; color: string }[];
  expiryData: ExpiryData;
  certData: CertificateData;
}) {
  const [mounted, setMounted] = useState(false);
  const [activeChart, setActiveChart] = useState<"status" | "pipeline">("status");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="card h-80 lg:col-span-6 animate-pulse bg-slate-100/70" />
        <div className="card h-80 lg:col-span-6 animate-pulse bg-slate-100/70" />
      </div>
    );
  }

  const totalMaterials = statusData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = totalMaterials > 0 ? ((data.value / totalMaterials) * 100).toFixed(1) : "0";
      return (
        <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-xs text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </div>
          <p className="mt-1.5 text-slate-600">
            Jumlah: <span className="font-extrabold text-slate-900">{data.value}</span> bahan ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-xs text-xs">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">{label}</p>
          <div className="space-y-1">
            {payload.map((item: any) => (
              <div key={item.dataKey} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}:</span>
                </span>
                <span className="font-bold text-slate-900">{item.value} antrian</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* --- TWO CHARTS ROW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CHART 1: DONUT STATUS DISTRIBUTION */}
        <div className="card lg:col-span-5 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <PieChartIcon className="size-4 stroke-[2.2]" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Komposisi Status Bahan</h3>
                  <p className="text-[11px] text-slate-400">Distribusi seluruh master list halal</p>
                </div>
              </div>
              <Link href="/materials" className="text-xs font-semibold text-emerald-700 hover:underline">
                Master List →
              </Link>
            </div>

            {/* Donut Chart */}
            <div className="relative h-64 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center Donut Stats */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{totalMaterials}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bahan</span>
              </div>
            </div>
          </div>

          {/* Custom Status Legend List */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {statusData.map((s) => (
                <div key={s.code} className="flex items-center justify-between rounded-lg bg-slate-50/70 px-2.5 py-1.5">
                  <div className="flex items-center gap-2 truncate pr-1">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="truncate text-[11.5px] font-medium text-slate-700">{s.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 num">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 2: PIPELINE APPROVAL BAR CHART */}
        <div className="card lg:col-span-7 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <BarChart3 className="size-4 stroke-[2.2]" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Beban Antrian Approval</h3>
                  <p className="text-[11px] text-slate-400">Jumlah pengajuan per tahap & plant operasional</p>
                </div>
              </div>
              <Link href="/requests?scope=all" className="text-xs font-semibold text-emerald-700 hover:underline">
                Lihat Workflow →
              </Link>
            </div>

            {/* Bar Chart */}
            <div className="h-68 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="step"
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                    iconType="circle"
                  />
                  {plants.map((plant) => (
                    <Bar
                      key={plant.key}
                      dataKey={plant.key}
                      name={plant.name}
                      fill={plant.color}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Alur approval: Tim Halal → Penyelia → Koordinator → Quality Assurance → Release</span>
            <span className="font-semibold text-emerald-700">4 Tahapan Standar SJPH</span>
          </div>
        </div>
      </div>

      {/* --- CHART 3: COMPLIANCE & EXPIRY RISK RADAR --- */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-500/20">
              <ShieldCheck className="size-4.5 stroke-[2]" />
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Profil Risiko Masa Berlaku & Kepatuhan Sertifikat
              </h3>
              <p className="text-[11px] text-slate-500">
                Pemantauan kedaluwarsa sertifikat halal bahan aktif & sertifikat produk
              </p>
            </div>
          </div>
          <Link href="/materials?expiry=expired" className="text-xs font-bold text-rose-700 hover:underline">
            Tinjau Kedaluwarsa ({expiryData.expired}) →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card Expired */}
          <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Kedaluwarsa</span>
              <span className="size-2 rounded-full bg-rose-600 animate-ping" />
            </div>
            <p className="num mt-2 text-3xl font-black text-rose-700">{expiryData.expired}</p>
            <p className="mt-1 text-[11.5px] text-rose-800/80">Sertifikat bahan telah lewat waktu</p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-rose-200/60 overflow-hidden">
              <div
                className="h-full bg-rose-600 rounded-full"
                style={{ width: `${Math.min(100, (expiryData.expired / Math.max(1, expiryData.total)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card Expiring Soon (<= 30 days) */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Kritis (≤ 30 Hari)</span>
              <AlertTriangle className="size-4 text-amber-600" />
            </div>
            <p className="num mt-2 text-3xl font-black text-amber-800">{expiryData.expiring_30}</p>
            <p className="mt-1 text-[11.5px] text-amber-800/80">Perlu perpanjangan segera</p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-amber-200/60 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.min(100, (expiryData.expiring_30 / Math.max(1, expiryData.total)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card Expiring (31 - 90 days) */}
          <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900">Perhatian (≤ 90 Hari)</span>
              <Clock className="size-4 text-sky-600" />
            </div>
            <p className="num mt-2 text-3xl font-black text-sky-800">{expiryData.expiring_90}</p>
            <p className="mt-1 text-[11.5px] text-sky-800/80">Siapkan dokumen audit renewal</p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-sky-200/60 overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full"
                style={{ width: `${Math.min(100, (expiryData.expiring_90 / Math.max(1, expiryData.total)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card Safe / Unlimited */}
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">Aman / Valid</span>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <p className="num mt-2 text-3xl font-black text-emerald-800">{expiryData.safe}</p>
            <p className="mt-1 text-[11.5px] text-emerald-800/80">Masa berlaku masih panjang</p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-emerald-200/60 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${Math.min(100, (expiryData.safe / Math.max(1, expiryData.total)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
