import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { EntityForm } from "@/components/entity-form";
import { DetailGrid, FileLink, fmtDateTime, LinkButton, PageHeader, Section } from "@/components/ui";
import { manualFields, revisionFields } from "@/lib/forms";
import { getServices } from "@/lib/services/services";
import { getMeta } from "@/lib/meta";
import { requireUser } from "@/lib/session";

export default async function ManualDetailPage({ params }: PageProps<"/manuals/[id]">) {
  await requireUser();
  const s = await getServices();
  const [meta, m, departments] = await Promise.all([getMeta(), s.manuals.get(Number((await params).id)), s.departments.options()]);
  const canEdit = meta.can("manual.manage");
  return (
    <>
      <Link href="/manuals" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Kembali ke Manual SJPH
      </Link>
      <PageHeader
        title={`${m.doc_number} · ${m.title}`}
        description={`${meta.name("sjph_criteria", m.criteria)} · Revisi ${m.revision}`}
        actions={
          <>
            <FileLink id={m.file_id} label="Buka dokumen terbaru" />
            {meta.can("admin") && <DeleteButton resource="manuals" id={m.id} redirectTo="/manuals" itemName={m.doc_number} />}
          </>
        }
      />
      <Section title="Informasi dokumen">
        <DetailGrid
          items={[
            ["Kriteria SJPH", meta.name("sjph_criteria", m.criteria)],
            ["Pemilik", m.department_name],
            ["Revisi", m.revision],
            ["Akses departemen", m.access.map((a: any) => a.name).join(", ") || "-"],
            ["Keterangan", m.remarks],
            ["Diperbarui", fmtDateTime(m.updated_at)],
          ]}
        />
      </Section>
      {canEdit && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Upload revisi baru">
            <EntityForm columns={1} fields={revisionFields} submitLabel="Upload revisi" target={{ resource: "manuals", op: "revision", id: m.id, success: "Revisi baru tersimpan" }} />
          </Section>
          <Section title="Ubah informasi & akses">
            <EntityForm fields={manualFields(meta, departments, true)} defaults={{ ...m, access: m.access.map((a: any) => String(a.id)) }} target={{ resource: "manuals", op: "update", id: m.id }} />
          </Section>
        </div>
      )}
      <Section title="Riwayat revisi">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Rev.</th>
              <th className="th">Uraian perubahan</th>
              <th className="th">File</th>
              <th className="th">Oleh</th>
            </tr>
          </thead>
          <tbody>
            {m.revisions.map((r: any) => (
              <tr key={r.id}>
                <td className="td font-semibold">{r.revision}</td>
                <td className="td">{r.remarks}</td>
                <td className="td"><FileLink id={r.file_id} /></td>
                <td className="td whitespace-nowrap">{r.created_by_name ?? "—"} · {fmtDateTime(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
