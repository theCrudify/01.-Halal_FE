import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { columnsFor, DataTable, hrefWith } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EntityForm, type FieldSpec } from "@/components/entity-form";
import { ListControls } from "@/components/list-controls";
import { Badge, fmtDateTime, PageHeader, Section, toneDot } from "@/components/ui";
import { fromIds } from "@/lib/forms";
import { getMeta } from "@/lib/meta";
import { parseValues, type Meta } from "@/lib/meta-model";
import { getServices } from "@/lib/services/services";
import type { Row, SchemaField } from "@/lib/services/types";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Admin" };

/**
 * One admin screen for every master / configuration table. Nothing here is table-specific:
 *  - the form comes from the table schema in the database (types, required, FKs, CHECK choices, column comments),
 *  - the list columns, filters and default sort come from list_resources / list_fields.
 */
async function formFields(meta: Meta, schema: SchemaField[], loadIds: (table: string) => Promise<{ value: string; label: string }[]>): Promise<FieldSpec[]> {
  return Promise.all(
    schema.map(async (c): Promise<FieldSpec> => {
      const base = { name: c.name, label: c.label, required: c.required && c.type !== "boolean" };
      if (c.type === "boolean") return { ...base, type: "checkbox", placeholder: "Ya" };
      if (c.name === "permissions") return { ...base, type: "checkboxes", wide: true, options: Object.entries(meta.raw.permissions).map(([value, label]) => ({ value, label: `${value} — ${label}` })) };
      if (c.name === "permission") return { ...base, type: "select", options: Object.entries(meta.raw.permissions).map(([value, label]) => ({ value, label: `${value} — ${label}` })) };
      if (c.choices) return { ...base, type: "select", options: c.choices.map((v) => ({ value: v, label: v })) };
      if (c.ref) return { ...base, type: "select", options: c.ref.column === "code" ? meta.options(c.ref.table) : await loadIds(c.ref.table) };
      if (c.type === "array") return { ...base, type: "text", hint: "Pisahkan dengan koma", wide: true };
      if (c.type === "textarea") return { ...base, type: "textarea", wide: true };
      return { ...base, type: c.type === "number" ? "number" : c.type === "date" ? "date" : "text" };
    }),
  );
}

export default async function AdminPage({ params, searchParams }: PageProps<"/admin/[resource]">) {
  await requireUser();
  const meta = await getMeta();
  const resource = (await params).resource;
  const config = meta.get("list_resources", resource);
  if (!config || !meta.can("admin")) notFound();

  const query = await searchParams;
  const base = `/admin/${resource}`;
  const s = await getServices();
  const api = s.resource(`/${resource.replace(/_/g, "-")}`);
  const editId = Number(query.edit) || null;
  const [result, schema, editing] = await Promise.all([api.list(query), api.schema(), editId ? api.get(editId) : null]);
  const showForm = !!editing || query.new === "1";
  const closeHref = hrefWith(base, query, { edit: undefined, new: undefined });

  const idOptions = async (table: string) => fromIds(await s.resource(`/${table.replace(/_/g, "-")}`).options());
  const fields = showForm ? await formFields(meta, schema, idOptions) : [];
  const refs = Object.fromEntries(schema.filter((c) => c.ref?.column === "code").map((c) => [c.name, c.ref!.table]));
  // Labels for fixed-value columns come from the list configuration ('values' filters: "value:Label|…").
  const valueLabels = Object.fromEntries(meta.fields(resource).filter((f) => f.filter_type === "values").map((f) => [f.key, Object.fromEntries(parseValues(f.filter_source).map((o) => [o.value, o.label]))]));

  // Generic cell rendering: master codes show names, booleans Ya/—, tones a swatch, arrays joined.
  const render = (key: string) => ({
    render: (r: Row) => {
      const v = r[key];
      if (key === "code" || key === "key") return <Link className="link code" href={hrefWith(base, query, { edit: r.id, new: undefined })}>{v}</Link>;
      if (typeof v === "boolean") return v ? <Badge tone="green" dot={false}>Ya</Badge> : <span className="text-ink-3">—</span>;
      if (key === "tone") return <span className="flex items-center gap-2"><span className={`size-2.5 rounded-full ${toneDot(v)}`} />{v}</span>;
      if (Array.isArray(v)) return <span className="text-xs text-ink-2">{v.join(", ") || "—"}</span>;
      if (key === "updated_at") return <span className="num text-ink-3">{fmtDateTime(v)}</span>;
      if (refs[key]) return meta.name(refs[key], v) || <span className="text-ink-3">—</span>;
      if (valueLabels[key] && v != null) return valueLabels[key][String(v)] ?? String(v);
      return v == null || v === "" ? <span className="text-ink-3">—</span> : String(v);
    },
  });
  const columns = columnsFor<Row>(meta, resource, Object.fromEntries(meta.columns(resource).map((f) => [f.key, render(f.key)])), [
    { key: "_edit", label: "", render: (r) => <Link className="text-xs font-medium text-ink-3 hover:text-ink" href={hrefWith(base, query, { edit: r.id, new: undefined })}>Ubah</Link> },
  ]);
  const title = config.name;
  const itemName = editing ? String(editing.name ?? editing.label ?? editing.key ?? editing.code ?? "") : "";

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title={title}
        description="Perubahan langsung berlaku di seluruh aplikasi. Data yang masih dipakai tidak bisa dihapus — nonaktifkan saja."
        actions={!showForm && <Link className="btn btn-primary" href={hrefWith(base, query, { new: 1 })}><Plus aria-hidden /> Tambah</Link>}
      />
      {showForm && (
        <Section
          title={editing ? `Ubah: ${itemName}` : `Tambah ${title.toLowerCase()}`}
          actions={
            <span className="flex gap-2">
              {editing && <DeleteButton resource="path" path={`/${resource.replace(/_/g, "-")}`} id={editing.id} redirectTo={closeHref} itemName={itemName} />}
              <Link className="btn" href={closeHref}>Tutup</Link>
            </span>
          }
        >
          <EntityForm
            key={editId ?? "new"}
            columns={3}
            fields={fields}
            defaults={editing ? { ...editing, permissions: editing.permissions, search_refs: editing.search_refs?.join?.(", ") } : { is_active: true }}
            target={{ resource: "path", path: `/${resource.replace(/_/g, "-")}`, op: editing ? "update" : "create", id: editing?.id, redirectTo: `${closeHref}${closeHref.includes("?") ? "&" : "?"}ok=Tersimpan` }}
          />
        </Section>
      )}
      <DataTable
        noun="data"
        columns={columns}
        result={result}
        params={query}
        basePath={base}
        toolbar={
          <Suspense>
            <ListControls filters={meta.filters(resource)} placeholder={`Cari ${title.toLowerCase()}…`} />
          </Suspense>
        }
      />
    </>
  );
}
