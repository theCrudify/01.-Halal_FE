import type { Metadata } from "next";
import { EntityForm } from "@/components/entity-form";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { PageHeader, Section } from "@/components/ui";
import { materialFields } from "@/lib/forms";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Request Baru" };

export default async function NewRequestPage({ searchParams }: PageProps<"/requests/new">) {
  await requireUser();
  const materialId = Number((await searchParams).material_id) || null;
  const s = await getServices();
  const [meta, material, suppliers, manufacturers, products, lines, departments] = await Promise.all([
    getMeta(),
    materialId ? s.materials.get(materialId) : null,
    s.suppliers.options(),
    s.manufacturers.options(),
    s.products.options(),
    s.lines.options(),
    s.departments.options(),
  ]);
    const firstType = meta.active("material_types")[0]?.code;

  return (
    <>
      <Link href={material ? `/materials/${material.id}` : "/materials"} className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {material ? "Kembali ke material" : "Kembali ke master list"}
      </Link>
      <PageHeader
        title={material ? `Ajukan perubahan · ${material.material_desc}` : "Ajukan bahan baru"}
        description={
          material
            ? "Ubah field yang perlu diperbarui. Data release saat ini tetap berlaku sampai perubahan disetujui QA."
            : "Daftarkan bahan baru untuk plant Anda. Bahan baru tidak aktif sampai di-release oleh QA."
        }
      />
      <div className="mb-6 flex gap-3 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Setelah diajukan, request ditinjau berurutan oleh <b>{meta.steps().map((st) => meta.name("roles", st.role_code)).join(" → ")}</b>. Anda bisa memantau progresnya di <b>My Request</b>.
        </p>
      </div>
      <Section title="Data bahan" description="Field bertanda * wajib diisi. Aturan sertifikat menyesuaikan jenis bahan dan lembaga penerbit.">
        <EntityForm
          columns={3}
          submitLabel="Ajukan request"
          stickyActions
          secondaryAction={<Link href={material ? `/materials/${material.id}` : "/materials"} className="btn">Batal</Link>}
          target={{ resource: "requests", op: "create", redirectTo: `/requests/:id?ok=${encodeURIComponent("Request berhasil diajukan")}` }}
          defaults={{
            material_type: firstType,
            ...material,
            distributed_to: material?.distributed_to?.map((d: { id: number }) => String(d.id)) ?? [],
            request_type: material ? "Change" : "New",
            material_id: material?.id ?? "",
          }}
          fields={[
            { name: "request_type", label: "", type: "hidden" },
            { name: "material_id", label: "", type: "hidden" },
            ...materialFields(meta, { suppliers, manufacturers, products, lines, departments }),
          ]}
        />
      </Section>
    </>
  );
}
