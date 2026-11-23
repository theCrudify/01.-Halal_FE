import { EntityForm } from "@/components/entity-form";
import { LinkButton, PageHeader, Section } from "@/components/ui";
import { certificateFields } from "@/lib/forms";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";

export default async function NewCertificatePage() {
  const [meta, products] = await Promise.all([getMeta(), (await getServices()).products.options()]);
  const nonExpiring = meta.active("halal_bodies").find((h) => !h.requires_expiry)?.code;
  return (
    <>
      <PageHeader title="Tambah sertifikat halal produk" actions={<LinkButton href="/certificates">Batal</LinkButton>} />
      <Section title="Data sertifikat">
        <EntityForm fields={certificateFields(meta, products, false)} defaults={{ halal_body: nonExpiring }} target={{ resource: "certificates", op: "create", redirectTo: "/certificates/:id?ok=Sertifikat%20ditambahkan" }} />
      </Section>
    </>
  );
}
