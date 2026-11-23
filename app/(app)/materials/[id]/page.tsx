import { ArrowLeft, FilePen, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { EntityForm } from "@/components/entity-form";
import { HistoryTimeline } from "@/components/history";
import { StatusBadge } from "@/components/status-badge";
import { ActiveBadge, daysUntil, DetailGrid, ExpiryCell, FileLink, fmtDate, fmtDateTime, LinkButton, PageHeader, Section, timeAgo, TypeBadge } from "@/components/ui";
import { getMeta } from "@/lib/meta";
import type { Meta } from "@/lib/meta-model";
import { getServices } from "@/lib/services/services";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Detail bahan" };

/** One-line answer to "can we use this material?", driven by master flags. */
function certificateHealth(meta: Meta, m: any) {
  const type = meta.get("material_types", m.material_type);
  const body = meta.get("halal_bodies", m.halal_body);
  if (!type?.requires_certificate) return { icon: ShieldCheck, tone: "border-teal-200 bg-teal-50 text-teal-900", title: "Tidak wajib sertifikat halal", text: `Jenis bahan: ${type?.name ?? m.material_type}.` };
  if (!m.expired_date)
    return body && !body.requires_expiry
      ? { icon: ShieldCheck, tone: "border-emerald-200 bg-emerald-50 text-emerald-900", title: `Sertifikat halal ${body.name} berlaku`, text: "Berlaku selama tidak ada perubahan komposisi bahan / PPH." }
      : { icon: ShieldQuestion, tone: "border-amber-200 bg-amber-50 text-amber-900", title: "Tanggal kedaluwarsa belum diisi", text: "Lengkapi melalui request perubahan." };
  const days = daysUntil(m.expired_date);
  const soon = Number(meta.setting("dashboard_expiring_days", "90"));
  if (days < 0) return { icon: ShieldAlert, tone: "border-red-200 bg-red-50 text-red-900", title: `Sertifikat halal kedaluwarsa ${-days} hari lalu`, text: "Minta sertifikat terbaru ke supplier lalu ajukan perubahan, atau nonaktifkan bahan." };
  if (days <= soon) return { icon: ShieldAlert, tone: "border-amber-200 bg-amber-50 text-amber-900", title: `Sertifikat halal habis dalam ${days} hari`, text: `Berlaku sampai ${fmtDate(m.expired_date)}. Siapkan pembaruan sertifikat.` };
  return { icon: ShieldCheck, tone: "border-emerald-200 bg-emerald-50 text-emerald-900", title: "Sertifikat halal berlaku", text: `Sampai ${fmtDate(m.expired_date)}.` };
}

export default async function MaterialDetailPage({ params }: PageProps<"/materials/[id]">) {
  await requireUser();
  const meta = await getMeta();
  const m = await (await getServices()).materials.get(Number((await params).id));
  const open = m.requests.find((r: any) => meta.isOpen(r.status));
  const health = certificateHealth(meta, m);
  const releaseCode = meta.terminal("release")?.code;

  return (
    <>
      <Link href="/materials" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Master list halal
      </Link>
      <PageHeader
        title={m.material_desc}
        meta={
          <>
            <span className="code">{m.material_code}</span>
            <span className="text-line-2">·</span>
            <span>{meta.plantLabel(m.plant)}</span>
            <span className="text-line-2">·</span>
            <span>{m.category ? meta.name("categories", m.category) : "Uncategorized"}</span>
            <TypeBadge name={meta.name("material_types", m.material_type)} critical={!!meta.get("material_types", m.material_type)?.requires_certificate} />
            <StatusBadge status={m.status} />
            <ActiveBadge active={m.is_active} />
          </>
        }
        actions={
          <>
            {meta.can("admin") && !open && <DeleteButton resource="materials" id={m.id} redirectTo="/materials" itemName={m.material_code} />}
            {open ? (
              <LinkButton href={`/requests/${open.id}`}>Lihat request #{open.id} yang berjalan</LinkButton>
            ) : (
              m.status === releaseCode && <LinkButton href={`/requests/new?material_id=${m.id}`} primary icon={FilePen}>Ajukan perubahan</LinkButton>
            )}
          </>
        }
      />

      <div className={`mb-5 flex gap-3 rounded-lg border px-4 py-3.5 ${health.tone}`} role="status">
        <health.icon className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="text-[13.5px] font-semibold">{health.title}</p>
          <p className="text-[13px] opacity-80">{health.text}</p>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0">
          <Section title="Data bahan" description="Versi yang sudah di-release dan berlaku untuk produksi.">
            <DetailGrid
              items={[
                ["Supplier", m.supplier_name && `${m.supplier_code} · ${m.supplier_name}`],
                ["Produsen", m.manufacturer_name],
                ["Negara asal", m.country_name],
                ["Penerbit sertifikat", meta.name("halal_bodies", m.halal_body)],
                ["LPH", meta.name("lph", m.lph)],
                ["Nomor sertifikat", m.cert_number && <span className="code">{m.cert_number}</span>],
                ["Registrasi SH luar negeri", m.bpjph_reg_number],
                ["Kedaluwarsa", <ExpiryCell key="e" date={m.expired_date} nonExpiring={meta.get("halal_bodies", m.halal_body)?.requires_expiry === false} />],
                ["Release until", <ExpiryCell key="r" date={m.release_until} />],
                ["Produk", m.product_name],
                ["Line", m.line_name],
                ["Didistribusikan ke", m.distributed_to.map((d: any) => d.name).join(", ")],
              ]}
            />
          </Section>

          <Section title="Riwayat request" description="Setiap perubahan data bahan melalui request dan approval." flush>
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="th">Versi</th>
                  <th className="th">Jenis</th>
                  <th className="th">Status</th>
                  <th className="th">Pengaju</th>
                  <th className="th">Terakhir diubah</th>
                </tr>
              </thead>
              <tbody>
                {m.requests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-paper/70">
                    <td className="td"><Link className="link" href={`/requests/${r.id}`}>v{r.version} · #{r.id}</Link></td>
                    <td className="td">{r.request_type === "New" ? "Bahan baru" : "Perubahan"}</td>
                    <td className="td"><StatusBadge status={r.status} /></td>
                    <td className="td">{r.requested_by_name}</td>
                    <td className="td num whitespace-nowrap" title={fmtDateTime(r.updated_at)}>{timeAgo(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>

        <aside className="space-y-5">
          <Section title="Dokumen">
            <ul className="space-y-2.5 text-[13px]">
              {[
                ["Sertifikat halal", m.certificate_file_id],
                ["Lampiran spesifikasi", m.attachment_file_id],
                ["Kemasan / label", m.packaging_file_id],
                ["Internal memo", m.im_file_id],
              ].map(([label, fid]) => (
                <li key={label} className="flex items-center justify-between gap-3">
                  <span className="text-ink-3">{label}</span>
                  <FileLink id={fid} label="Buka" />
                </li>
              ))}
            </ul>
          </Section>

          {meta.can("material.manage") && (
            <Section title="Status penggunaan" description="Bahan nonaktif tidak boleh dipakai produksi.">
              <EntityForm
                columns={1}
                submitLabel="Simpan"
                target={{ resource: "materials", op: "patch", id: m.id, success: "Status & catatan diperbarui" }}
                defaults={{ is_active: m.is_active, note: m.note }}
                fields={[
                  { name: "is_active", label: "Status", type: "checkbox", placeholder: "Aktif untuk produksi" },
                  { name: "note", label: "Catatan internal", type: "textarea" },
                ]}
              />
            </Section>
          )}

          <Section title="Riwayat approval">
            <HistoryTimeline items={[...m.histories].reverse().slice(-8)} />
            {m.histories.length > 8 && <p className="mt-4 text-xs text-ink-3">Menampilkan 8 aktivitas terakhir dari {m.histories.length}.</p>}
          </Section>
        </aside>
      </div>
    </>
  );
}
