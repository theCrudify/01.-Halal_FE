import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { columnsFor, DataTable } from "@/components/data-table";
import { ListControls } from "@/components/list-controls";
import { fmtDate, Hl, LinkButton, PageHeader } from "@/components/ui";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import type { Row } from "@/lib/services/types";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Laporan berkala" };

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  await requireUser();
  const params = await searchParams;
  const [meta, result] = await Promise.all([getMeta(), (await getServices()).reports.list(params)]);
  const columns = columnsFor<Row>(meta, "reports", {
    report_type: { render: (r) => <Link className="link" href={`/reports/${r.id}`}>{meta.name("report_types", r.report_type)}</Link> },
    plant: { className: "whitespace-nowrap text-ink-2", render: (r) => meta.plantLabel(r.plant) },
    period_start: { render: (r) => <span className="num whitespace-nowrap">{fmtDate(r.period_start)} – {fmtDate(r.period_end)}</span> },
    auditor_name: { render: (r, q) => <><Hl text={r.auditor_name} q={q} /><span className="block text-xs text-ink-3"><Hl text={r.auditee_name} q={q} /></span></> },
    findings: { align: "center", render: (r) => <span className={`num ${r.findings ? "font-semibold text-amber-700" : "text-ink-3"}`}>{r.findings}</span> },
  });
  return (
    <>
      <PageHeader
        eyebrow="Dokumen SJPH"
        title={meta.name("list_resources", "reports")}
        description="Audit internal, kaji ulang manajemen, laporan pelaksanaan SJPH, dan audit LPH."
        actions={meta.can("report.manage") && <LinkButton href="/reports/new" primary icon={Plus}>Laporan</LinkButton>}
      />
      <DataTable
        noun="laporan"
        columns={columns}
        result={result}
        params={params}
        basePath="/reports"
        toolbar={
          <Suspense>
            <ListControls filters={meta.filters("reports")} placeholder="Auditor, auditee, ringkasan…" />
          </Suspense>
        }
      />
    </>
  );
}
