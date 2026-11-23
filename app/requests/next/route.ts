import { NextResponse, type NextRequest } from "next/server";
import { getServices } from "@/lib/services/services";

/**
 * After approve/reject: open the next task in the queue (oldest waiting first), carrying a toast message.
 * Saves reviewers a round trip through the Task List.
 */
export async function GET(req: NextRequest) {
  const done = req.nextUrl.searchParams.get("done") ?? "Tersimpan";
  const { data } = await (await getServices()).requests.list({ scope: "tasks", pageSize: "1", sortBy: "updated_at", sortDir: "asc" });
  const url = data[0] ? new URL(`/requests/${data[0].id}`, req.url) : new URL("/requests?scope=tasks", req.url);
  url.searchParams.set("ok", data[0] ? `${done} · task berikutnya` : `${done} · semua task selesai`);
  return NextResponse.redirect(url);
}
