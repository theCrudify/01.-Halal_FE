import type { NextRequest } from "next/server";
import { ApiClient } from "@/lib/api/api-client";

/** Proxy for the ⌘K palette: the browser has no token, so the server adds it. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const res = await (await ApiClient.forSession()).fetch(`/search?q=${encodeURIComponent(q)}`);
  return new Response(res.body, { status: res.status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
