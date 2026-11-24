import { ArrowLeft, Check, CornerUpLeft, ExternalLink, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { EntityForm } from "@/components/entity-form";
import { HistoryTimeline } from "@/components/history";
import { StatusBadge } from "@/components/status-badge";
import { FileLink, fmtDate, fmtDateTime, LinkButton, PageHeader, Section } from "@/components/ui";
import { materialFields } from "@/lib/forms";
import { getMeta } from "@/lib/meta";
import type { Meta } from "@/lib/meta-model";
import { getServices } from "@/lib/services/services";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Detail request" };

// How each proposed field is compared and displayed: master code, relation id, date, or list of ids.
type Kind = { master?: string; relation?: [liveName: string]; date?: true; list?: true };
const GROUPS: { title: string; fields: [key: string, label: string, kind?: Kind][] }[] = [
  { title: "Identitas bahan", fields: [["plant", "Plant", { master: "plants" }], ["material_code", "Kode material"], ["material_desc", "Deskripsi"], ["category", "Kategori", { master: "categories" }], ["material_type", "Jenis bahan", { master: "material_types" }]] },
  { title: "Supplier & produsen", fields: [["supplier_id", "Supplier", { relation: ["supplier_name"] }], ["manufacturer_id", "Produsen", { relation: ["manufacturer_name"] }]] },
  {
    title: "Sertifikat halal",
    fields: [["halal_body", "Penerbit", { master: "halal_bodies" }], ["lph", "LPH", { master: "lph" }], ["cert_number", "Nomor sertifikat"], ["bpjph_reg_number", "Registrasi SH luar negeri"], ["expired_date", "Kedaluwarsa", { date: true }], ["release_until", "Release until", { date: true }]],
  },
  { title: "Penggunaan", fields: [["product_id", "Produk", { relation: ["product_name"] }], ["line_id", "Line", { relation: ["line_name"] }], ["distributed_to", "Didistribusikan ke", { list: true }]] },
];
const FILES: [string, string][] = [["certificate_file_id", "Sertifikat halal"], ["attachment_file_id", "Lampiran"], ["packaging_file_id", "Kemasan"], ["im_file_id", "Internal memo"]];

const empty = <span className="text-ink-3">—</span>;
const ids = (v: unknown) => (Array.isArray(v) ? v.map((x: any) => Number(typeof x === "object" ? x.id : x)).sort((a, b) => a - b).join(",") : "");

function Stepper({ meta, status, step }: { meta: Meta; status: string; step: number }) {
  const released = meta.state(status)?.kind === "release";
  const rejected = meta.state(status)?.kind === "rejected";
  const items = [...meta.steps().map((s) => ({ n: s.step_no as number, label: meta.name("roles", s.role_code), key: s.code })), { n: Infinity, label: meta.terminal("release")?.name ?? "Release", key: "release" }];
  return (
    <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }} aria-label="Progres approval">
      {items.map((s) => {
        const done = released || (!rejected && s.n < step);
        const current = !released && !rejected && s.n === step;
        return (
          <li key={s.key} className="min-w-0" aria-current={current ? "step" : undefined}>
            <span className={`block h-1.5 rounded-full ${done ? "bg-accent" : current ? "bg-amber-400" : "bg-line"}`} />
            <span className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${done ? "text-accent-2" : current ? "text-amber-800" : "text-ink-3"}`}>
              {done && <Check className="size-3.5 shrink-0" aria-hidden />}
              <span className="truncate">{s.label}</span>
            </span>
            <span className="sr-only">{done ? "selesai" : current ? "sedang berjalan" : "belum"}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function RequestDetailPage({ params, searchParams }: PageProps<"/requests/[id]">) {
  await requireUser();
  const id = Number((await params).id);
  const s = await getServices();
  const [meta, r] = await Promise.all([getMeta(), s.requests.get(id)]);
  const d = r.data;
  const live = r.material;
  const isChange = r.request_type === "Change";
  const compare = isChange && meta.state(r.status)?.kind !== "release";

  const liveKey = (key: string, kind?: Kind) => (kind?.list ? ids(live?.[key]) : String(live?.[key] ?? ""));
  const proposedKey = (key: string, kind?: Kind) => (kind?.list ? ids(d[key]) : String(d[key] ?? ""));
  const changed = (key: string, kind?: Kind) => compare && liveKey(key, kind) !== proposedKey(key, kind);
  const changedCount = GROUPS.flatMap((g) => g.fields).filter(([k, , kind]) => changed(k, kind)).length;
  const onlyChanged = compare && changedCount > 0 && (await searchParams).all !== "1";

  const showMaster = (table: string, v: string) => (table === "plants" ? meta.plantLabel(v) : meta.name(table, v));
  const showLive = (key: string, kind?: Kind): ReactNode => {
    const v = live?.[key];
    if (kind?.list) return (v as any[])?.map((x) => x.name).join(", ") || empty;
    if (kind?.relation) return live?.[kind.relation[0]] ?? empty;
    if (v == null || v === "") return empty;
    if (kind?.master) return showMaster(kind.master, v);
    return kind?.date ? fmtDate(v) : String(v);
  };
  const showProposed = (key: string, kind?: Kind): ReactNode => {
    const v = d[key];
    if (kind?.list || kind?.relation) return r.labels[key] ?? empty;
    if (v == null || v === "") return empty;
    if (kind?.master) return showMaster(kind.master, v);
    return kind?.date ? fmtDate(v) : String(v);
  };

  const fileName = (fid?: number) => r.files.find((f: any) => f.id === fid)?.name;
  const step = meta.stepAt(r.current_step);
  const next = meta.steps().find((st) => st.step_no > r.current_step);
  const prev = meta.steps().filter((st) => st.step_no < r.current_step).at(-1);
  const relations = r.can_resubmit ? await Promise.all([s.suppliers.options(), s.manufacturers.options(), s.products.options(), s.lines.options(), s.departments.options()]) : null;

  return (
    <>
      <Link href="/requests" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Request & approval
      </Link>
      <PageHeader
        title={d.material_desc}
        meta={
          <>
            <span className="code">{d.material_code}</span>
            <span className="text-line-2">·</span>
            <span>Request #{r.id} · {isChange ? "Perubahan" : "Bahan baru"} v{r.version}</span>
            <span className="text-line-2">·</span>
            <span>{meta.plantLabel(r.plant)}</span>
            <StatusBadge status={r.status} />
          </>
        }
        actions={<LinkButton href={`/materials/${r.material_id}`} icon={ExternalLink}>Lihat bahan</LinkButton>}
      />

      <div className="card mb-5 p-4">
        <Stepper meta={meta} status={r.status} step={r.current_step} />
        {meta.state(r.status)?.kind === "rejected" && (
          <p className="mt-4 flex gap-2 rounded-md bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Request ditolak di tahap pertama. {r.can_resubmit ? "Perbaiki data di bawah lalu ajukan ulang." : "Menunggu pengaju memperbaiki dan mengajukan ulang."}
          </p>
        )}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0">
          <Section
            title="Data yang diajukan"
            description={compare ? (changedCount ? `${changedCount} field berubah dibanding data release (ditandai kuning).` : "Tidak ada perubahan data; kemungkinan hanya pembaruan file.") : undefined}
            flush
            actions={
              compare && changedCount > 0 ? (
                <Link className="btn btn-sm" href={onlyChanged ? `/requests/${r.id}?all=1` : `/requests/${r.id}`} scroll={false}>
                  {onlyChanged ? "Tampilkan semua field" : "Hanya yang berubah"}
                </Link>
              ) : undefined
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="th w-48">Field</th>
                    {compare && <th className="th">Saat ini (release)</th>}
                    <th className="th">{compare ? "Diajukan" : "Nilai"}</th>
                  </tr>
                </thead>
                {GROUPS.map((g) => ({ ...g, fields: g.fields.filter(([k, , kind]) => !onlyChanged || changed(k, kind)) }))
                  .filter((g) => g.fields.length)
                  .map((g) => (
                    <tbody key={g.title}>
                      <tr>
                        <th colSpan={compare ? 3 : 2} scope="colgroup" className="eyebrow border-b border-line/70 px-3 pb-1.5 pt-3.5 text-left">{g.title}</th>
                      </tr>
                      {g.fields.map(([k, label, kind]) => (
                        <tr key={k} className={changed(k, kind) ? "bg-amber-50/70" : ""}>
                          <th scope="row" className="td text-left font-normal text-ink-3">
                            {label}
                            {changed(k, kind) && <span className="sr-only"> (berubah)</span>}
                          </th>
                          {compare && <td className={`td ${changed(k, kind) ? "text-ink-3 line-through decoration-line-2" : ""}`}>{showLive(k, kind)}</td>}
                          <td className={`td ${changed(k, kind) ? "font-medium text-amber-900" : ""}`}>{showProposed(k, kind)}</td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                <tbody>
                  <tr>
                    <th colSpan={compare ? 3 : 2} scope="colgroup" className="eyebrow border-b border-line/70 px-3 pb-1.5 pt-3.5 text-left">Dokumen</th>
                  </tr>
                  {FILES.map(([k, label]) => (
                    <tr key={k}>
                      <th scope="row" className="td text-left font-normal text-ink-3">{label}</th>
                      {compare && <td className="td"><FileLink id={live?.[k]} /></td>}
                      <td className="td"><FileLink id={d[k]} label={fileName(d[k]) ?? "Lihat file"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {relations && (
            <Section title="Perbaiki & ajukan ulang" description="Field file yang dikosongkan akan memakai file sebelumnya." id="resubmit">
              <EntityForm
                columns={3}
                stickyActions
                submitLabel="Ajukan ulang"
                target={{ resource: "requests", op: "resubmit", id: r.id, redirectTo: `/requests/${r.id}?ok=${encodeURIComponent("Request diajukan ulang")}` }}
                defaults={d}
                fields={materialFields(meta, { suppliers: relations[0], manufacturers: relations[1], products: relations[2], lines: relations[3], departments: relations[4] })}
              />
            </Section>
          )}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-16">
          {r.can_approve && step ? (
            <section className="card overflow-hidden border-accent/30" aria-labelledby="decision-title">
              <header className="border-b border-accent/15 bg-accent-soft px-4 py-3">
                <h2 id="decision-title" className="text-[13.5px] font-semibold text-accent-2">Keputusan Anda</h2>
                <p className="mt-0.5 text-[13px] text-accent-2/80">
                  {step.name} · {meta.name("roles", step.role_code)}. {next ? `Jika disetujui, lanjut ke ${meta.name("roles", next.role_code)}.` : "Persetujuan Anda akan me-release data ke master list."}
                </p>
              </header>
              <div className="p-4">
                <EntityForm
                  columns={1}
                  submitLabel={next ? "Setujui & lanjut" : "Setujui & release"}
                  target={{ resource: "requests", op: "approve", id: r.id, redirectTo: `/requests/next?done=${encodeURIComponent(`Request #${r.id} ${next ? "disetujui" : "di-release"}`)}` }}
                  defaults={{ revision: r.revision }}
                  fields={[
                    { name: "revision", label: "", type: "hidden" },
                    ...(!prev ? [{ name: "im_file", label: "Internal memo (opsional)", type: "file" as const }] : []),
                    { name: "note", label: "Catatan (opsional)", type: "textarea", placeholder: "Mis. dokumen lengkap dan sesuai" },
                  ]}
                />
                <details className="group mt-4 border-t border-line pt-3.5">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-medium text-red-700 hover:text-red-800 [&::-webkit-details-marker]:hidden">
                    <CornerUpLeft className="size-4" aria-hidden />
                    {prev ? `Kembalikan ke ${meta.name("roles", prev.role_code)}` : "Tolak & kembalikan ke pengaju"}
                  </summary>
                  <div className="mt-3.5">
                    <EntityForm
                      columns={1}
                      danger
                      submitLabel={prev ? "Kembalikan" : "Tolak request"}
                      target={{ resource: "requests", op: "reject", id: r.id, redirectTo: `/requests/next?done=${encodeURIComponent(`Request #${r.id} dikembalikan`)}` }}
                      defaults={{ revision: r.revision }}
                      fields={[{ name: "revision", label: "", type: "hidden" }, { name: "note", label: "Alasan", type: "textarea", required: true, hint: "Wajib, minimal 5 karakter. Akan terlihat oleh pengaju." }]}
                    />
                  </div>
                </details>
              </div>
            </section>
          ) : (
            meta.isOpen(r.status) && (
              <div className="card flex gap-3 p-4 text-[13px] text-ink-2">
                <Info className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
                <p>Menunggu tindakan dari <b className="text-ink">{meta.name("roles", step?.role_code)}</b> · {meta.plantLabel(r.plant)}.</p>
              </div>
            )
          )}

          <Section title="Riwayat approval">
            <HistoryTimeline items={r.histories} />
          </Section>

          <p className="px-1 text-xs text-ink-3">Diajukan oleh {r.requested_by_name} pada {fmtDateTime(r.created_at)}.</p>
        </aside>
      </div>
    </>
  );
}
