import { Check, CornerUpLeft, RotateCw, Send, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Row } from "@/lib/services/types";
import { StatusBadge } from "./status-badge";
import { fmtDateTime, timeAgo } from "./ui";

const ACTION: Record<string, { icon: LucideIcon; tone: string; label: string }> = {
  Submit: { icon: Send, tone: "bg-sky-100 text-sky-700", label: "Mengajukan" },
  Resubmit: { icon: RotateCw, tone: "bg-sky-100 text-sky-700", label: "Mengajukan ulang" },
  Approve: { icon: Check, tone: "bg-emerald-100 text-emerald-700", label: "Menyetujui" },
  Release: { icon: ShieldCheck, tone: "bg-emerald-600 text-white", label: "Release" },
  Reject: { icon: CornerUpLeft, tone: "bg-red-100 text-red-600", label: "Menolak" },
};

/** Approval timeline. */
export function HistoryTimeline({ items }: { items: Row[] }) {
  if (!items.length) return <p className="text-sm text-ink-3">Belum ada riwayat.</p>;
  return (
    <ol className="space-y-0">
      {items.map((h, i) => {
        const a = ACTION[h.action] ?? ACTION.Submit;
        return (
          <li key={h.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < items.length - 1 && <span className="absolute left-4 top-9 -bottom-0 w-px bg-line" aria-hidden />}
            <span className={`relative z-[1] grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-surface ${a.tone}`}>
              <a.icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-[13px] text-ink">
                  <span className="font-semibold">{h.user_name}</span> <span className="text-ink-3">({h.role_name ?? h.role})</span> {a.label.toLowerCase()}
                </p>
                <StatusBadge status={h.to_status} />
              </div>
              <time className="text-xs text-ink-3" dateTime={h.created_at} title={fmtDateTime(h.created_at)}>
                {fmtDateTime(h.created_at)} · {timeAgo(h.created_at)}
              </time>
              {h.note && <p className="mt-2 rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink-2">{h.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
