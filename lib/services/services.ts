import "server-only";
import { ApiClient } from "../api/api-client";
import { ResourceService } from "./resource.service";
import type { Row } from "./types";

export class AuthService {
  constructor(private readonly api: ApiClient) {}
  login(employee_code: string, password: string) {
    return this.api.request<{ token: string; user: Row }>(
      "/auth/login",
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ employee_code, password }) },
      { redirectOn401: false },
    );
  }
  changePassword(body: FormData) {
    return this.api.request<{ ok: true }>("/auth/change-password", { method: "POST", body });
  }
}

export class DashboardService {
  constructor(private readonly api: ApiClient) {}
  summary() {
    return this.api.request<Row & Record<string, any>>("/dashboard");
  }
}

export class MaterialService extends ResourceService {
  patch(id: number, body: FormData) {
    return this.api.request<{ ok: true }>(`${this.path}/${id}`, { method: "PATCH", body });
  }
}

export class RequestService extends ResourceService {
  approve(id: number, body: FormData) {
    return this.api.request<{ status: string }>(`${this.path}/${id}/approve`, { method: "POST", body });
  }
  reject(id: number, body: FormData) {
    return this.api.request<{ status: string }>(`${this.path}/${id}/reject`, { method: "POST", body });
  }
  resubmit(id: number, body: FormData) {
    return this.api.request<{ status: string }>(`${this.path}/${id}/resubmit`, { method: "POST", body });
  }
}

export class ManualService extends ResourceService {
  addRevision(id: number, body: FormData) {
    return this.api.request<{ revision: number }>(`${this.path}/${id}/revisions`, { method: "POST", body });
  }
}

/** All services bound to the current session's token. */
export async function getServices() {
  const api = await ApiClient.forSession();
  return {
    api,
    auth: new AuthService(api),
    dashboard: new DashboardService(api),
    materials: new MaterialService(api, "/materials"),
    requests: new RequestService(api, "/requests"),
    certificates: new ResourceService(api, "/certificates"),
    manuals: new ManualService(api, "/manuals"),
    reports: new ResourceService(api, "/reports"),
    users: new ResourceService(api, "/users"),
    departments: new ResourceService(api, "/departments"),
    countries: new ResourceService(api, "/countries"),
    suppliers: new ResourceService(api, "/suppliers"),
    lines: new ResourceService(api, "/lines"),
    products: new ResourceService(api, "/products"),
    manufacturers: new ResourceService(api, "/manufacturers"),
    /** Any CRUD resource by API path (admin pages for master & configuration tables). */
    resource: (path: string) => new ResourceService(api, path),
  };
}
export type Services = Awaited<ReturnType<typeof getServices>>;
