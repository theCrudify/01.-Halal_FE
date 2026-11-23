import { CheckCircle2, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { columnsFor, DataTable } from "@/components/data-table";
import { ListControls, QueryTabs } from "@/components/list-controls";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, fmtDateTime, Hl, LinkButton, PageHeader, timeAgo } from "@/components/ui";
import { getMeta } from "@/lib/meta";
import type { Meta } from "@/lib/meta-model";
import { getServices } from "@/lib/services/services";
import type { Row } from "@/lib/services/types";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Request & approval" };

/** Progress over the configured workflow steps (any number of steps). */
function StepProgress({ meta, status, step }: { meta: Meta; status: string; step: number }) {
  const steps = meta.steps();
  const open = meta.isOpen(status);
  const released = meta.state(status)?.kind === "release";
  const current = meta.stepAt(step);
  return (
    <span className="flex items-center gap-2.5" title={current?.name}>
      <span className="flex gap-[3px]" aria-hidden>
        {steps.map((s) => (
          <span key={s.code} className={`h-3.5 w-1.5 rounded-[2px] ${released || (open && s.step_no < step) ? "bg-accent" : open && s.step_no === step ? "bg-amber-400" : "bg-line"}`} />
        ))}
      </span>
      <span className="text-xs text-ink-2">{released ? "Selesai" : open ? meta.name("roles", current?.role_code) : "Di pengaju"}</span>
    </span>
  );
}

export default async function RequestsPage({ searchParams }: PageProps<"/requests">) {
  await requireUser();
  const meta = await getMeta();
  const params = await searchParams;
  const reviewer = meta.can("request.view_all");
  const scope = (params.scope as string) ?? (reviewer ? "tasks" : "mine");
  // Work queue order is a setting (oldest waiting first by default), unless the user sorts or searches.
  const fifo = meta.setting("task_queue_oldest_first", "true") === "true";
  const queueSort = scope === "tasks" && fifo && !params.sortBy && !params.search ? { sortBy: "updated_at", sortDir: "asc" } : {};
  const s = await getServices();
  const [result, tasks, mine] = await Promise.all([
    s.requests.list({ ...params, ...queueSort, scope }),
    reviewer ? s.requests.list({ scope: "tasks", pageSize: "1" }) : null,
    s.requests.list({ scope: "mine", pageSize: "1" }),
  ]);
  const tabs = [
    ...(reviewer ? [{ value: "tasks", label: "Task List", count: tasks!.meta.total }] : []),
    { value: "mine", label: "Request saya", count: mine.meta.total },
    ...(reviewer ? [{ value: "all", label: "Semua request" }] : []),
  ];

  const columns = columnsFor<Row>(meta, "requests", {
    material_code: {
      render: (r, q) => (
        <Link href={`/requests/${r.id}`} className="group block min-w-56">
          <span className="font-medium text-ink group-hover:underline group-hover:decoration-line-2 group-hover:underline-offset-2"><Hl text={r.material_desc} q={q} /></span>
          <span className="code block">#{r.id} · <Hl text={r.material_code} q={q} /></span>
        </Link>
      ),
    },
    request_type: { className: "whitespace-nowrap text-ink-2", render: (r) => (r.request_type === "New" ? "Bahan baru" : `Perubahan v${r.version}`) },
    plant: { className: "whitespace-nowrap text-ink-2", render: (r) => meta.plantLabel(r.plant) },
    status: { render: (r) => <StatusBadge status={r.status} /> },
    current_step: { render: (r) => <StepProgress meta={meta} status={r.status} step={r.current_step} /> },
    requested_by_name: { className: "whitespace-nowrap", render: (r, q) => <Hl text={r.requested_by_name} q={q} /> },
    updated_at: { render: (r) => <time className="num whitespace-nowrap text-ink-2" dateTime={r.updated_at} title={fmtDateTime(r.updated_at)}>{timeAgo(r.updated_at)}</time> },
  });

  return (
    <>
      <PageHeader
        eyebrow="Persetujuan bahan"
        title={meta.name("list_resources", "requests")}
        description={`Alur: ${meta.steps().map((st) => meta.name("roles", st.role_code)).join(" → ")} → ${meta.terminal("release")?.name ?? "Release"}. Penolakan mengembalikan request satu tahap.`}
        actions={<LinkButton href="/requests/new" primary icon={Plus}>Request baru</LinkButton>}
      />
      <Suspense>
        <QueryTabs name="scope" tabs={tabs} />
      </Suspense>
      <DataTable
        noun="request"
        columns={columns}
        result={result}
        params={{ ...params, scope }}
        basePath="/requests"
        toolbar={
          <Suspense>
            <ListControls filters={meta.filters("requests")} placeholder="Bahan, kode, pengaju…" />
          </Suspense>
        }
        empty={scope === "tasks" && !params.search && !params.status ? <EmptyState icon={CheckCircle2} title="Antrian kosong" description="Tidak ada request yang menunggu persetujuan Anda." /> : undefined}
      />
    </>
  );
}
