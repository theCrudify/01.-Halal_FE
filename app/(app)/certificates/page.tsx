import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { columnsFor, DataTable } from "@/components/data-table";
import { ListControls } from "@/components/list-controls";
import { ExpiryCell, fmtDate, Hl, LinkButton, PageHeader } from "@/components/ui";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import type { Row } from "@/lib/services/types";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sertifikat halal produk" };

export default async function CertificatesPage({ searchParams }: PageProps<"/certificates">) {
  await requireUser();
  const meta = await getMeta();
  const params = await searchParams;
  const result = await (await getServices()).certificates.list(params);
  const columns = columnsFor<Row>(meta, "certificates", {
    certificate_number: { render: (r, q) => <Link className="link code" href={`/certificates/${r.id}`}><Hl text={r.certificate_number} q={q} /></Link> },
    products: { render: (r, q) => <span className="line-clamp-2 max-w-80"><Hl text={r.product_names} q={q} />{r.scope_note && <span className="block text-xs text-ink-3">{r.scope_note}</span>}</span> },
    category: { render: (r) => meta.name("categories", r.category) },
    site: { render: (r) => meta.name("sites", r.site) },
    halal_body: { render: (r) => <>{meta.name("halal_bodies", r.halal_body)}<span className="block text-xs text-ink-3">{meta.name("lph", r.lph)}</span></> },
    issue_date: { render: (r) => <span className="num whitespace-nowrap">{fmtDate(r.issue_date)}</span> },
    valid_until: { render: (r) => <ExpiryCell date={r.valid_until} nonExpiring={meta.get("halal_bodies", r.halal_body)?.requires_expiry === false} /> },
    version: { align: "center" },
  });
  return (
    <>
      <PageHeader
        eyebrow="Dokumen SJPH"
        title={meta.name("list_resources", "certificates")}
        description="Sertifikat halal produk perusahaan dan riwayat versinya."
        actions={meta.can("certificate.manage") && <LinkButton href="/certificates/new" primary icon={Plus}>Sertifikat</LinkButton>}
      />
      <DataTable
        noun="sertifikat"
        columns={columns}
        result={result}
        params={params}
        basePath="/certificates"
        toolbar={
          <Suspense>
            <ListControls filters={meta.filters("certificates")} placeholder="No. sertifikat, produk, no. ketetapan…" />
          </Suspense>
        }
      />
    </>
  );
}
