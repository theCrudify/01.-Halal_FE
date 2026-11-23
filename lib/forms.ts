import type { FieldSpec } from "@/components/entity-form";
import type { Meta } from "./meta-model";
import type { Option as IdOption } from "./services/types";

// Form field configs. Every option list comes from master data (meta) or relation tables (id options) — none is in code.

export const fromIds = (list: IdOption[], withCode = false) => list.map((o) => ({ value: String(o.id), label: withCode ? `${o.code} · ${o.name}` : o.name }));

type Relations = { suppliers: IdOption[]; manufacturers: IdOption[]; products: IdOption[]; lines: IdOption[]; departments: IdOption[] };

export const materialFields = (meta: Meta, r: Relations): FieldSpec[] => {
  const critical = meta.active("material_types").filter((t) => t.requires_certificate).map((t) => t.name);
  const expiring = meta.active("halal_bodies").filter((h) => h.requires_expiry).map((h) => h.name);
  const registration = meta.active("halal_bodies").filter((h) => h.requires_registration).map((h) => h.name);
  return [
    { name: "plant", label: "Plant", type: "select", required: true, options: meta.plantOptions(), section: "Identitas bahan", sectionHint: "Sesuai master material SAP" },
    { name: "category", label: "Kategori", type: "select", options: meta.options("categories"), hint: "Kosongkan untuk bahan umum (uncategorized)" },
    { name: "material_code", label: "Kode material (SAP)", required: true },
    { name: "material_desc", label: "Deskripsi material", required: true },
    { name: "material_type", label: "Jenis bahan", type: "select", required: true, options: meta.options("material_types"), hint: critical.length ? `Wajib sertifikat halal: ${critical.join(", ")}` : undefined },
    { section: "Supplier & produsen", sectionHint: "Produsen harus tertelusur untuk bahan yang wajib bersertifikat", name: "supplier_id", label: "Supplier", type: "select", options: fromIds(r.suppliers, true) },
    { name: "manufacturer_id", label: "Produsen", type: "select", options: fromIds(r.manufacturers), hint: "Negara asal mengikuti master produsen" },
    {
      section: "Sertifikat halal",
      sectionHint: [expiring.length && `Wajib tanggal kedaluwarsa: ${expiring.join(", ")}`, registration.length && `Wajib registrasi BPJPH: ${registration.join(", ")}`].filter(Boolean).join(" · ") || undefined,
      name: "halal_body",
      label: "Lembaga penerbit",
      type: "select",
      options: meta.options("halal_bodies"),
    },
    { name: "lph", label: "LPH", type: "select", options: meta.options("lph") },
    { name: "cert_number", label: "Nomor sertifikat halal" },
    { name: "bpjph_reg_number", label: "No. registrasi BPJPH (sertifikat luar negeri)" },
    { name: "expired_date", label: "Tanggal kedaluwarsa", type: "date" },
    { name: "release_until", label: "Release until", type: "date" },
    { section: "Penggunaan & distribusi", name: "product_id", label: "Produk", type: "select", options: fromIds(r.products) },
    { name: "line_id", label: "Line produksi", type: "select", options: fromIds(r.lines) },
    { name: "distributed_to", label: "Didistribusikan ke", type: "checkboxes", options: fromIds(r.departments), wide: true },
    { section: "Lampiran & catatan", name: "certificate_file", label: "File sertifikat halal", type: "file", hint: critical.length ? `Wajib untuk ${critical.join(", ")}` : undefined },
    { name: "attachment_file", label: "Lampiran (spesifikasi / COA)", type: "file" },
    { name: "packaging_file", label: "Foto kemasan / label", type: "file" },
    { name: "note", label: "Catatan pengajuan", type: "textarea", wide: true },
  ];
};

export const certificateFields = (meta: Meta, products: IdOption[], isEdit: boolean): FieldSpec[] => {
  const nonExpiring = meta.active("halal_bodies").filter((h) => !h.requires_expiry).map((h) => h.name);
  return [
    { name: "certificate_number", label: "Nomor sertifikat halal", required: true, section: "Identitas sertifikat" },
    { name: "halal_body", label: "Penerbit", type: "select", required: true, options: meta.options("halal_bodies") },
    { name: "category", label: "Kategori", type: "select", required: true, options: meta.options("categories") },
    { name: "site", label: "Site", type: "select", required: true, options: meta.options("sites") },
    { name: "lph", label: "LPH", type: "select", options: meta.options("lph") },
    { name: "fatwa_number", label: "No. ketetapan halal" },
    {
      name: "issue_date",
      label: "Tanggal terbit",
      type: "date",
      required: true,
      section: "Masa berlaku & lingkup",
      sectionHint: nonExpiring.length ? `Kosongkan “Berlaku sampai” untuk ${nonExpiring.join(", ")} (berlaku selama tidak ada perubahan komposisi / PPH)` : undefined,
    },
    { name: "valid_until", label: "Berlaku sampai", type: "date" },
    { name: "product_ids", label: "Produk yang dicakup", type: "checkboxes", required: true, options: fromIds(products, true), wide: true },
    { name: "scope_note", label: "Catatan lingkup", type: "textarea", wide: true },
    { name: "file", label: "File sertifikat", type: "file", required: !isEdit, hint: isEdit ? "Kosongkan jika file tidak berubah" : undefined },
    { name: "note", label: isEdit ? "Alasan perubahan" : "Catatan", type: "textarea" },
  ];
};

export const manualFields = (meta: Meta, departments: IdOption[], isEdit: boolean): FieldSpec[] => [
  { name: "doc_number", label: "Nomor dokumen", required: true },
  { name: "criteria", label: "Kriteria SJPH", type: "select", required: true, options: meta.options("sjph_criteria") },
  { name: "title", label: "Judul dokumen", required: true, wide: true },
  { name: "department_id", label: "Pemilik dokumen", type: "select", options: fromIds(departments) },
  ...(isEdit ? [] : [{ name: "file", label: "File dokumen", type: "file" as const, required: true }]),
  { name: "access", label: "Akses departemen", type: "checkboxes", options: fromIds(departments), wide: true, hint: "Departemen yang boleh melihat dokumen (role dengan hak “lihat semua manual” selalu bisa)" },
  { name: "remarks", label: "Keterangan", type: "textarea", wide: true },
];

export const revisionFields: FieldSpec[] = [
  { name: "file", label: "File revisi", type: "file", required: true },
  { name: "remarks", label: "Uraian perubahan", type: "textarea", required: true },
];

export const reportFields = (meta: Meta, departments: IdOption[], isEdit: boolean): FieldSpec[] => [
  { name: "report_type", label: "Jenis laporan", type: "select", required: true, options: meta.options("report_types"), section: "Periode & pelaksana" },
  { name: "plant", label: "Plant", type: "select", required: true, options: meta.plantOptions() },
  { name: "period_start", label: "Awal periode", type: "date", required: true },
  { name: "period_end", label: "Akhir periode", type: "date", required: true },
  { name: "auditor_name", label: "Auditor", required: true, hint: "Bisa auditor internal atau LPH / BPJPH" },
  { name: "auditee_department_id", label: "Auditee (departemen)", type: "select", options: fromIds(departments) },
  { name: "findings", label: "Jumlah temuan", type: "number", required: true, section: "Hasil" },
  { name: "file", label: "File laporan", type: "file", required: !isEdit, hint: isEdit ? "Kosongkan jika file tidak berubah" : undefined },
  { name: "summary", label: "Ringkasan", type: "textarea", wide: true },
  { name: "feedback_note", label: "Tindak lanjut / feedback", type: "textarea", wide: true },
  { name: "feedback_file", label: "File feedback", type: "file" },
];

export const userFields = (meta: Meta, departments: IdOption[], isEdit: boolean): FieldSpec[] => [
  { name: "employee_code", label: "NIK", required: true },
  { name: "name", label: "Nama", required: true },
  { name: "email", label: "Email", type: "email" },
  { name: "role", label: "Role", type: "select", required: true, options: meta.options("roles") },
  { name: "department_id", label: "Departemen", type: "select", options: fromIds(departments) },
  { name: "site", label: "Site", type: "select", options: meta.options("sites"), hint: "Kosongkan untuk akses semua site" },
  { name: "password", label: isEdit ? "Password baru" : "Password", type: "password", required: !isEdit, hint: isEdit ? "Kosongkan jika tidak diganti" : "Minimal 8 karakter" },
  { name: "is_active", label: "Status", type: "checkbox", placeholder: "Aktif" },
];
