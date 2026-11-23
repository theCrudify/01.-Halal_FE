import { Download, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { columnsFor, DataTable } from "@/components/data-table";
import { ListControls } from "@/components/list-controls";
import { StatusBadge } from "@/components/status-badge";
import { ExpiryCell, Hl, LinkButton, PageHeader, TypeBadge } from "@/components/ui";
import { toQuery } from "@/lib/api/api-client";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import type { Row } from "@/lib/services/types";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Master list halal" };

export default async function MaterialsPage({ searchParams }: PageProps<"/materials">) {
  await requireUser();
  const meta = await getMeta();
  const params = await searchParams;
  const result = await (await getServices()).materials.list(params);
  const nonExpiring = (code?: string) => meta.get("halal_bodies", code)?.requires_expiry === false;
  const scope =
    params.category === "__none"
      ? meta.fields("materials").find((f) => f.key === "category")?.null_label
      : [params.site && meta.name("sites", String(params.site)), params.category && meta.name("categories", String(params.category))].filter(Boolean).join(" · ");

  // Columns (order, label, sortable, visibility) come from list_fields; only cell rendering is here.
  const columns = columnsFor<Row>(meta, "materials", {
    material_code: {
      render: (r, q) => (
        <Link href={`/materials/${r.id}`} className="group block min-w-56">
          <span className="font-medium text-ink group-hover:underline group-hover:decoration-line-2 group-hover:underline-offset-2"><Hl text={r.material_desc} q={q} /></span>
          <span className="code block"><Hl text={r.material_code} q={q} /> · {r.category ? meta.name("categories", r.category) : "—"}</span>
        </Link>
      ),
    },
    plant: { className: "whitespace-nowrap text-ink-2", render: (r) => meta.plantLabel(r.plant) },
    material_type: { render: (r) => <TypeBadge name={meta.name("material_types", r.material_type)} critical={!!meta.get("material_types", r.material_type)?.requires_certificate} /> },
    supplier: {
      render: (r, q) => (
        <span className="block max-w-60">
          <span className="block truncate" title={r.supplier_name}><Hl text={r.supplier_name ?? "—"} q={q} /></span>
          <span className="block truncate text-xs text-ink-3"><Hl text={[r.manufacturer_name, r.country_name].filter(Boolean).join(" · ")} q={q} /></span>
        </span>
      ),
    },
    halal_body: {
      render: (r, q) =>
        r.halal_body ? (
          <span className="block max-w-52">
            <span className="block truncate text-ink-2">{meta.name("halal_bodies", r.halal_body)}</span>
            <span className="code block truncate"><Hl text={r.cert_number} q={q} /></span>
          </span>
        ) : (
          <span className="text-xs text-ink-3">Tidak wajib</span>
        ),
    },
    expired_date: { render: (r) => <ExpiryCell date={r.expired_date} nonExpiring={nonExpiring(r.halal_body)} /> },
    status: {
      render: (r) => (
        <span className="flex flex-col items-start gap-0.5">
          <StatusBadge status={r.status} />
          {!r.is_active && <span className="text-[11px] text-ink-3">nonaktif</span>}
        </span>
      ),
    },
  });

  return (
    <>
      <PageHeader
        eyebrow={meta.name("list_resources", "materials")}
        title={scope || "Semua bahan"}
        description="Bahan per plant dan status sertifikat halalnya."
        actions={
          <>
            <a className="btn" href={`/export/materials?${toQuery(params)}`} download>
              <Download aria-hidden /> Export CSV
            </a>
            <LinkButton href="/requests/new" primary icon={Plus}>Ajukan bahan</LinkButton>
          </>
        }
      />
      <DataTable
        noun="bahan"
        columns={columns}
        result={result}
        params={params}
        basePath="/materials"
        toolbar={
          <Suspense>
            <ListControls filters={meta.filters("materials")} placeholder="Nama, kode, supplier, produsen, no. sertifikat…" />
          </Suspense>
        }
      />
    </>
  );
}
