import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { EntityForm } from "@/components/entity-form";
import { DetailGrid, ExpiryCell, FileLink, fmtDate, fmtDateTime, LinkButton, PageHeader, Section } from "@/components/ui";
import { certificateFields } from "@/lib/forms";
import { getServices } from "@/lib/services/services";
import { getMeta } from "@/lib/meta";
import { requireUser } from "@/lib/session";

export default async function CertificateDetailPage({ params }: PageProps<"/certificates/[id]">) {
  await requireUser();
  const s = await getServices();
  const [meta, c, products] = await Promise.all([getMeta(), s.certificates.get(Number((await params).id)), s.products.options()]);
  return (
    <>
      <Link href="/certificates" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Kembali ke sertifikat
      </Link>
      <PageHeader
        title={c.certificate_number}
        description={`${meta.name("categories", c.category)} · ${meta.name("sites", c.site)} · versi ${c.version}`}
        actions={
          <>
            {meta.can("admin") && <DeleteButton resource="certificates" id={c.id} redirectTo="/certificates" itemName={c.certificate_number} />}
          </>
        }
      />
      <Section title="Data sertifikat">
        <DetailGrid
          items={[
            ["Produk", c.products.map((p: { name: string }) => p.name).join(", ")],
            ["Catatan lingkup", c.scope_note],
            ["Penerbit", meta.name("halal_bodies", c.halal_body)],
            ["LPH", meta.name("lph", c.lph)],
            ["No. ketetapan halal", c.fatwa_number],
            ["Tanggal terbit", fmtDate(c.issue_date)],
            ["Berlaku sampai", <ExpiryCell key="v" date={c.valid_until} nonExpiring={meta.get("halal_bodies", c.halal_body)?.requires_expiry === false} />],
            ["File", <FileLink key="f" id={c.file_id} />],
            ["Diperbarui", fmtDateTime(c.updated_at)],
          ]}
        />
      </Section>
      {meta.can("certificate.manage") && (
        <Section title="Perbarui sertifikat (membuat versi baru)">
          <EntityForm fields={certificateFields(meta, products, true)} defaults={{ ...c, product_ids: c.product_ids.map(String) }} target={{ resource: "certificates", op: "update", id: c.id, success: "Versi baru tersimpan" }} />
        </Section>
      )}
      <Section title="Riwayat versi">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Versi</th>
              <th className="th">Terbit / Berlaku</th>
              <th className="th">Catatan</th>
              <th className="th">File</th>
              <th className="th">Oleh</th>
            </tr>
          </thead>
          <tbody>
            {c.versions.map((v: any) => (
              <tr key={v.id}>
                <td className="td font-semibold">v{v.version}</td>
                <td className="td">{fmtDate(v.data.issue_date)} / {v.data.valid_until ? fmtDate(v.data.valid_until) : "tanpa batas"}</td>
                <td className="td">{v.data.note ?? "-"}</td>
                <td className="td"><FileLink id={v.data.file_id} /></td>
                <td className="td whitespace-nowrap">{v.created_by_name ?? "—"} · {fmtDateTime(v.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
