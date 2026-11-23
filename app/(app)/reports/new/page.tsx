import { EntityForm } from "@/components/entity-form";
import { LinkButton, PageHeader, Section } from "@/components/ui";
import { reportFields } from "@/lib/forms";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import { requireUser } from "@/lib/session";

export default async function NewReportPage() {
  const user = await requireUser();
  const [meta, departments] = await Promise.all([getMeta(), (await getServices()).departments.options()]);
  return (
    <>
      <PageHeader title="Tambah laporan berkala" actions={<LinkButton href="/reports">Batal</LinkButton>} />
      <Section title="Data laporan">
        <EntityForm fields={reportFields(meta, departments, false)} defaults={{ findings: 0, auditor_name: user.name }} target={{ resource: "reports", op: "create", redirectTo: "/reports/:id?ok=Laporan%20ditambahkan" }} />
      </Section>
    </>
  );
}
