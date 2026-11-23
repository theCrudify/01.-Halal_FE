import "server-only";
import { cache } from "react";
import { Meta, type RawMeta } from "./meta-model";
import { getServices } from "./services/services";

/** Configuration from the database, fetched once per request. */
export const getMeta = cache(async () => new Meta(await (await getServices()).api.request<RawMeta>("/meta")));
