import type { NextRequest } from "next/server";
import { ApiClient } from "@/lib/api/api-client";

/** CSV export of the master list with the same filters/sort as the page. */
export async function GET(req: NextRequest) {
  const res = await (await ApiClient.forSession()).fetch(`/materials/export?${req.nextUrl.searchParams.toString()}`);
  return new Response(res.body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "text/csv", "content-disposition": res.headers.get("content-disposition") ?? "attachment" },
  });
}
