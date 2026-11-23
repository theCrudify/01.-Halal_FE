import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { EntityForm } from "@/components/entity-form";
import { DetailGrid, FileLink, fmtDate, fmtDateTime, LinkButton, PageHeader, Section } from "@/components/ui";
import { reportFields } from "@/lib/forms";
import { getServices } from "@/lib/services/services";
import { getMeta } from "@/lib/meta";
import { requireUser } from "@/lib/session";

export default async function ReportDetailPage({ params }: PageProps<"/reports/[id]">) {
  await requireUser();
  const s = await getServices();
  const [meta, r, departments] = await Promise.all([getMeta(), s.reports.get(Number((await params).id)), s.departments.options()]);
  return (
    <>
      <Link href="/reports" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Kembali ke laporan
      </Link>
      <PageHeader
        title={`${meta.name("report_types", r.report_type)} · ${meta.plantLabel(r.plant)}`}
        description={`${fmtDate(r.period_start)} – ${fmtDate(r.period_end)}`}
        actions={
          <>
            {meta.can("admin") && <DeleteButton resource="reports" id={r.id} redirectTo="/reports" itemName={meta.name("report_types", r.report_type)} />}
          </>
        }
      />
      <Section title="Ringkasan">
        <DetailGrid
          items={[
            ["Auditor", r.auditor_name],
            ["Auditee", r.auditee_name],
            ["Jumlah temuan", r.findings],
            ["Ringkasan", r.summary],
            ["Tindak lanjut / feedback", r.feedback_note],
            ["File laporan", <FileLink key="f" id={r.file_id} />],
            ["File feedback", <FileLink key="fb" id={r.feedback_file_id} />],
            ["Dibuat", `${r.created_by_name ?? "-"} · ${fmtDateTime(r.created_at)}`],
          ]}
        />
      </Section>
      {meta.can("report.manage") && (
        <Section title="Ubah laporan">
          <EntityForm fields={reportFields(meta, departments, true)} defaults={r} target={{ resource: "reports", op: "update", id: r.id }} />
        </Section>
      )}
    </>
  );
}
