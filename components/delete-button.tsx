"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { deleteItem } from "@/app/actions";

type Resource = Parameters<typeof deleteItem>[0];

/** Delete with a real confirmation dialog that names what will be removed. */
export function DeleteButton({ resource, id, redirectTo, label = "Hapus", itemName, path }: { resource: Resource; id: number; redirectTo: string; label?: string; itemName?: string; path?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <>
      <button type="button" className="btn btn-danger-ghost" onClick={() => dialog.current?.showModal()}>
        <Trash2 aria-hidden /> {label}
      </button>
      <dialog
        ref={dialog}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line p-0 shadow-2xl backdrop:bg-slate-950/40 backdrop:backdrop-blur-[2px]"
        aria-labelledby={`del-${id}-title`}
        onClose={() => setError(undefined)}
      >
        <div className="flex gap-4 p-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div>
            <h2 id={`del-${id}-title`} className="text-base font-semibold text-ink">Hapus {itemName ? `“${itemName}”` : "data ini"}?</h2>
            <p className="mt-1.5 text-sm text-ink-2">Data dihapus dari daftar. Data yang masih dipakai data lain tidak bisa dihapus — nonaktifkan saja.</p>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 rounded-b-xl border-t border-line bg-paper px-6 py-3.5">
          <button type="button" className="btn" onClick={() => dialog.current?.close()} autoFocus>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={pending}
            onClick={() => start(async () => setError((await deleteItem(resource, id, redirectTo, path))?.message))}
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Ya, hapus
          </button>
        </div>
      </dialog>
    </>
  );
}
