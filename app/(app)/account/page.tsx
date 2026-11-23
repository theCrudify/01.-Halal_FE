import type { Metadata } from "next";
import { EntityForm } from "@/components/entity-form";
import { DetailGrid, PageHeader, Section } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Akun" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Akun Saya" />
      <Section title="Profil">
        <DetailGrid items={[["NIK", user.employee_code], ["Nama", user.name], ["Role", user.role], ["Site", user.site]]} />
      </Section>
      <Section title="Ganti password">
        <div className="max-w-md">
          <EntityForm
            columns={1}
            target={{ resource: "auth", op: "changePassword", success: "Password berhasil diganti" }}
            fields={[
              { name: "current_password", label: "Password lama", type: "password", required: true },
              { name: "new_password", label: "Password baru", type: "password", required: true, hint: "Minimal 8 karakter" },
            ]}
          />
        </div>
      </Section>
    </>
  );
}
