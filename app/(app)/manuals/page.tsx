import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { columnsFor, DataTable } from "@/components/data-table";
import { ListControls } from "@/components/list-controls";
import { Badge, fmtDateTime, Hl, LinkButton, PageHeader, timeAgo } from "@/components/ui";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import type { Row } from "@/lib/services/types";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Manual SJPH" };

export default async function ManualsPage({ searchParams }: PageProps<"/manuals">) {
  await requireUser();
  const params = await searchParams;
  const [meta, result] = await Promise.all([getMeta(), (await getServices()).manuals.list(params)]);
  const columns = columnsFor<Row>(meta, "manuals", {
    doc_number: { render: (r, q) => <Link className="link code" href={`/manuals/${r.id}`}><Hl text={r.doc_number} q={q} /></Link> },
    title: { render: (r, q) => <Hl text={r.title} q={q} /> },
    criteria: { render: (r) => <Badge dot={false}>{meta.name("sjph_criteria", r.criteria)}</Badge> },
    department: { render: (r, q) => <Hl text={r.department_name ?? "—"} q={q} /> },
    revision: { align: "center" },
    updated_at: { render: (r) => <time className="num whitespace-nowrap text-ink-2" title={fmtDateTime(r.updated_at)}>{timeAgo(r.updated_at)}</time> },
  });
  return (
    <>
      <PageHeader
        eyebrow="Dokumen SJPH"
        title={meta.name("list_resources", "manuals")}
        description="Dokumen Sistem Jaminan Produk Halal per kriteria SJPH."
        actions={meta.can("manual.manage") && <LinkButton href="/manuals/new" primary icon={Plus}>Dokumen</LinkButton>}
      />
      <DataTable
        noun="dokumen"
        columns={columns}
        result={result}
        params={params}
        basePath="/manuals"
        toolbar={
          <Suspense>
            <ListControls filters={meta.filters("manuals")} placeholder="No. dokumen, judul, departemen…" />
          </Suspense>
        }
      />
    </>
  );
}
