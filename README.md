# SJH Halal — Frontend (Next.js 16)

UI for the Sistem Jaminan Produk Halal. Talks to the Hono backend (`sjh-halal-be`) **server-side only**:
the JWT lives in an httpOnly cookie and never reaches the browser.

## Quick start

```bash
cp .env.example .env.local   # API_URL=http://localhost:4000 (backend)
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

Login with the seeded users from the backend README (e.g. `admin` / `Halal@2026`).

Deploy (free): Vercel, set `API_URL` to the deployed backend URL.

## Structure

```
app/
  (app)/                 authenticated pages (layout = sidebar + header)
    page.tsx             dashboard
    materials/           master list halal (list + detail)
    requests/            task list / my request / all, new request, detail (approve / reject / resubmit)
    certificates/ manuals/ reports/   list, new, detail + edit
    master/[entity]/     departments, countries, suppliers, lines, products (one config-driven page)
    users/ account/
  login/ logout/         session cookie in / out
  files/[id]/            streams attachments from the API with the session token
  export/materials/      CSV export with the current filters
  actions.ts             server actions: one form dispatcher -> service classes
lib/
  api/api-client.ts      ApiClient class (fetch + token + error mapping)
  services/              ResourceService base class + Material/Request/Manual/Auth/Dashboard services
  session.ts             cookie session, requireUser, hasRole
  forms.ts               field + filter configs per entity
  meta-model.ts          Meta helpers over /api/meta (options, labels, workflow, list columns & filters, permissions)
  meta.ts                getMeta() for server components
components/
  app-shell.tsx          sidebar (role-based menu + icons), mobile drawer, breadcrumbs, user menu
  ui.tsx                 badges, page header, sections, empty states, date/expiry formatting
  data-table.tsx         server table: sortable headers + pagination (all URL driven)
  list-controls.tsx      debounced search, filters, page size, tabs
  entity-form.tsx        config-driven form with sections, error summary + per-field errors, keeps input on error
  delete-button.tsx      confirmation dialog that names the item
proxy.ts                 redirects visitors without a session cookie to /login
```

All options, labels, colours, list columns, filters, menus and permissions come from `GET /api/meta` (database),
via `lib/meta-model.ts` (`Meta` class, server: `getMeta()`, client: `useMeta()`). `/admin/[resource]` is one generic
screen for every master/config table, built from the table schema the API reports.

Every list uses the same URL contract as the API: `?page=&pageSize=&search=&sortBy=&sortDir=&<filters>`,
so filtered/sorted views are shareable links and the browser back button works.

## UX conventions

- Status is never colour-only: badges have text + dot, expiry says "Kedaluwarsa" / "12 hari lagi".
- Max 3 filters visible; the rest under "Filter lanjutan"; active filters shown as removable chips. On phones all filters sit behind one "Filter" button.
- Press `/` to focus search. Page size lives in the table footer.
- Reviewers see the change diff first ("Hanya yang berubah") and decide in a sticky side panel.
- Missing / out-of-scope records show an in-app not-found page; unexpected errors show a retry with a support code.
