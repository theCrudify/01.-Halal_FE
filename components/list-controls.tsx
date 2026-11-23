"use client";

import { ListFilter, Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";

import type { FilterDef } from "@/lib/meta-model";
export type { FilterDef };

/** Applies a patch to the current query; any filter change returns to page 1. */
function useQueryUpdate() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const update = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) (v ? q.set(k, v) : q.delete(k));
    q.delete("page");
    // Starting a search ranks by relevance, so an earlier column sort is dropped.
    if (patch.search && !params.get("search")) {
      q.delete("sortBy");
      q.delete("sortDir");
    }
    const s = q.toString();
    startTransition(() => router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  };
  return { params, update, pending };
}

/** Compact select with an inline label ("Status  Semua ▾"), tinted and clearable when active. */
function FilterSelect({ f, value, onChange }: { f: FilterDef; value: string; onChange: (v: string) => void }) {
  const active = !!value;
  return (
    <label
      className={`relative inline-flex h-9 items-center rounded-lg border text-xs transition-all shadow-2xs ${
        active
          ? "border-emerald-500/40 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/20 font-semibold"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <span className={`pointer-events-none pl-3 pr-1 text-[11px] ${active ? "text-emerald-700" : "text-slate-400"}`}>
        {f.label}:
      </span>
      <select
        className={`h-full max-w-56 cursor-pointer appearance-none truncate bg-transparent pr-7 font-medium outline-none ${
          active ? "text-emerald-900 font-bold" : "text-slate-800"
        }`}
        style={{ fieldSizing: "content" } as React.CSSProperties}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={f.label}
      >
        <option value="">Semua</option>
        {f.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {active ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-1.5 grid size-5 place-items-center rounded-md text-emerald-700 hover:bg-emerald-200/50"
          aria-label={`Hapus filter ${f.label}`}
        >
          <X className="size-3 stroke-[2.5]" />
        </button>
      ) : (
        <svg
          className="pointer-events-none absolute right-2.5 size-3 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      )}
    </label>
  );
}

export function ListControls({
  filters = [],
  placeholder = "Cari data…",
  children,
}: {
  filters?: FilterDef[];
  placeholder?: string;
  children?: ReactNode;
}) {
  const { params, update, pending } = useQueryUpdate();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = filters.filter((f) => f.primary);
  const advanced = filters.filter((f) => !f.primary);
  const advancedActive = advanced.filter((f) => params.get(f.name)).length;
  const [showAdvanced, setShowAdvanced] = useState(advancedActive > 0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCount = filters.filter((f) => params.get(f.name)).length;
  const anything = activeCount > 0 || !!params.get("search");

  useEffect(() => setSearch(params.get("search") ?? ""), [params]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onSearch = (v: string) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ search: v.trim() || null }), 300);
  };
  const setFilter = (name: string) => (v: string) => update({ [name]: v || null });

  return (
    <div className="border-b border-slate-100 bg-white">
      <div className="flex flex-wrap items-center gap-2.5 px-4 py-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            ref={searchRef}
            className="input h-9 pl-9 pr-8"
            type="search"
            value={search}
            placeholder={placeholder}
            onChange={(e) => onSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                clearTimeout(timer.current);
                update({ search: search.trim() || null });
              }
              if (e.key === "Escape" && search) onSearch("");
            }}
            aria-label="Cari"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {pending ? (
              <Loader2 className="size-3.5 animate-spin text-emerald-600" aria-label="Memuat" />
            ) : (
              !search && <span className="kbd hidden sm:inline-flex text-[9px]" aria-hidden>/</span>
            )}
          </span>
        </div>

        {filters.length > 0 && (
          <button
            type="button"
            className="btn btn-sm sm:hidden"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <ListFilter aria-hidden /> Filter
            {activeCount > 0 && <span className="rounded-full bg-emerald-600 px-1.5 text-[9px] text-white font-bold">{activeCount}</span>}
          </button>
        )}

        <div className={`${mobileOpen ? "flex w-full flex-wrap gap-2" : "hidden"} sm:contents`}>
          {visible.map((f) => (
            <FilterSelect key={f.name} f={f} value={params.get(f.name) ?? ""} onChange={setFilter(f.name)} />
          ))}
          {advanced.length > 0 && (
            <button
              type="button"
              className={`btn btn-sm h-9 ${advancedActive ? "text-emerald-700 bg-emerald-50 border-emerald-300" : "text-slate-600"}`}
              aria-expanded={showAdvanced}
              onClick={() => setShowAdvanced((v) => !v)}
            >
              <ListFilter aria-hidden className="size-3.5" />
              <span>{showAdvanced ? "Sembunyikan Filter" : "Filter Lanjutan"}</span>
              {advancedActive > 0 && (
                <span className="rounded-full bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                  {advancedActive}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {anything && (
            <button
              type="button"
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
              onClick={() => update(Object.fromEntries([...filters.map((f) => [f.name, null]), ["search", null]]))}
            >
              Reset Filter
            </button>
          )}
          {children}
        </div>
      </div>
      {showAdvanced && advanced.length > 0 && (
        <div className={`${mobileOpen ? "flex" : "hidden sm:flex"} flex-wrap gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5`}>
          {advanced.map((f) => (
            <FilterSelect key={f.name} f={f} value={params.get(f.name) ?? ""} onChange={setFilter(f.name)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PageSizeSelect({ value }: { value: number }) {
  const { update } = useQueryUpdate();
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className="hidden sm:inline font-medium">Tampil:</span>
      <select
        className="input h-7.5 w-auto pl-2.5 pr-7 text-xs font-semibold"
        value={value}
        onChange={(e) => update({ pageSize: e.target.value })}
        aria-label="Baris per halaman"
      >
        {[10, 25, 50, 100].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Segmented tab control with badges */
export function QueryTabs({ name, tabs }: { name: string; tabs: { value: string; label: string; count?: number }[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const current = params.get(name) ?? tabs[0].value;

  return (
    <div className="mb-5 flex flex-wrap gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 w-fit shadow-2xs" role="tablist">
      {tabs.map((t) => {
        const selected = current === t.value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={selected}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150 ${
              selected
                ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => router.replace(`${pathname}?${name}=${t.value}`)}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  selected ? "bg-emerald-100 text-emerald-800" : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
