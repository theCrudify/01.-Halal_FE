import { EntityForm } from "@/components/entity-form";
import { LinkButton, PageHeader, Section } from "@/components/ui";
import { manualFields } from "@/lib/forms";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";

export default async function NewManualPage() {
  const [meta, departments] = await Promise.all([getMeta(), (await getServices()).departments.options()]);
  return (
    <>
      <PageHeader title="Tambah Dokumen SJPH" actions={<LinkButton href="/manuals">Batal</LinkButton>} />
      <Section title="Data dokumen">
        <EntityForm fields={manualFields(meta, departments, false)} target={{ resource: "manuals", op: "create", redirectTo: `/manuals/:id?ok=Dokumen%20ditambahkan` }} />
      </Section>
    </>
  );
}
