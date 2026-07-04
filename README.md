# Sri Varahi Building Solutions — Sales & Profit Management System

A single-owner sales, billing, and profit management system built with Next.js 15 (App
Router), Supabase (Postgres + Auth + RLS), TanStack Query/Table, React Hook Form + Zod,
and Recharts.

## ⭐ Same-day bill edit/delete (the headline rule)

**A bill can only be edited or deleted on the calendar day it was created.** After that
it locks automatically — the only way to correct it is to **void** it (reversible-looking,
keeps history, excludes it from reports) or create a new adjustment bill.

This is enforced in **two places that share one source of truth**, so they can't drift:

- `lib/edit-window.ts` — a single `checkBillEditWindow()` function, timezone-aware
  (defaults to `Asia/Kolkata`), with an optional per-business grace window
  (`edit_window_hours`, e.g. `6` = editable until 6am the next day) for stores that
  bill past midnight.
- `actions/bills.ts` — `assertBillIsEditable()` calls that same function server-side
  before any `updateBill` / `deleteBill` runs. **This is the real enforcement** — the
  UI (Edit/Delete buttons in `app/(app)/sales/[id]/BillActions.tsx` and the sales list)
  just reflects it so people aren't shown a button that will fail.
- Direct URL access to `/sales/[id]/edit` is also blocked server-side
  (`app/(app)/sales/[id]/edit/page.tsx` redirects back to the bill if it's locked).

Change the rule per-business from **Settings → Bill Edit/Delete Window**.

## Getting started

1. **Create a Supabase project** at supabase.com.
2. **Run the migration**: in the Supabase SQL editor (or via `supabase db push` with the
   CLI), run `supabase/migrations/0001_init.sql`.
3. **Create your owner login**: Authentication → Users → Add user (email/password).
4. **Seed initial data** (optional): open `supabase/seed.sql`, replace
   `PASTE-AUTH-USER-UUID-HERE` with that user's UUID, and run it in the SQL editor. This
   creates your `businesses` row (required — every page assumes one exists), plus demo
   employees/products/a bill/an expense.
5. **Configure env vars**: copy `.env.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
   Project Settings → API.
6. **Install & run**:
   ```bash
   npm install
   npm run dev
   ```
7. Sign in at `/login` with the user you created in step 3.

### Deploying to Vercel

- Push this repo to GitHub, import it in Vercel.
- Add the same env vars from `.env.local` in Vercel → Project → Environment Variables.
- Vercel auto-detects Next.js — no build config changes needed.
- Supabase Auth: add your Vercel domain to Supabase → Authentication → URL Configuration
  → Redirect URLs (even though this app uses email/password, not OAuth redirects, it's
  good practice).

## Feature map

| Area | Where |
|---|---|
| DB schema, RLS, triggers, dashboard views | `supabase/migrations/0001_init.sql` |
| Same-day edit window logic | `lib/edit-window.ts` |
| Bill math (subtotal/profit/totals) — single source of truth | `lib/billing/calculate.ts` |
| Create/edit/delete/void a bill | `actions/bills.ts` |
| New Sale / Edit Bill form | `components/billing/BillForm.tsx` + sub-components |
| Bill list | `app/(app)/sales/page.tsx` |
| Bill detail + actions | `app/(app)/sales/[id]/page.tsx`, `BillActions.tsx` |
| Advance Orders + conversion to sale | `app/(app)/advance-orders/`, `actions/advance-orders.ts` |
| Credit Customers + recording payments | `app/(app)/credit-customers/`, `actions/credit-payments.ts` |
| Expenses | `app/(app)/expenses/`, `actions/expenses.ts` |
| Products / Employees catalogs | `app/(app)/products/`, `app/(app)/employees/` |
| Dashboard KPIs + 30-day trend chart | `app/(app)/dashboard/page.tsx` |
| Reports (Daily EOD, Monthly, Employee Performance, P&L) | `app/(app)/reports/*` |
| Print-optimized A4 report/invoice layouts (browser print-to-PDF) | `app/(print)/reports/print/*` |
| Global search across bills/products/advance orders | `app/(app)/search/page.tsx` |
| Settings: business profile, edit-window policy, backup/restore | `app/(app)/settings/`, `actions/settings.ts` |

## Design notes (see the Phase 0 analysis for full rationale)

- **Snapshot-first billing**: `bill_items` stores its own `purchase_price` /
  `selling_price` at save time — it never re-reads from `products`, so editing a
  product's default prices later never silently changes historical bills or reports.
- **`grand_total` is owner-editable** and intentionally independent from
  `subtotal - discount` (real billing has manual rounding / negotiated pricing). Both
  are stored so you can see "as computed" vs "as billed" if they ever diverge.
- **Credit vs Advance**: a "credit customer" is just a query (`bills` with
  `balance_due > 0`), not a separately maintained table that can drift out of sync.
  Advance Orders are pre-sale deposits that convert into a real bill later
  (`convertAdvanceOrderToBill`).
- **Voiding vs deleting**: voiding (any bill, any day) is the safe, always-available way
  to reverse a historical bill — it soft-deletes (`voided_at`) and excludes it from
  reports without destroying the record. Hard delete is same-day-only.
- **RLS is the real security boundary**, not just app-level checks — every table scopes
  to `business_id → owner_id = auth.uid()`, enforced at the Postgres level.
- **Backup/restore** runs as an authenticated Server Action under RLS (not a raw
  `pg_dump` / service-role export), so it's safe for a non-technical owner to trigger
  from Settings, and only ever touches their own business's data.

## Regenerating types

`types/database.types.ts` is hand-written to match the migration above. If you change
the schema, regenerate it authoritatively with the Supabase CLI:

```bash
npm run db:types
```

## A note on dependency versions

`@supabase/ssr` and `@supabase/supabase-js` are pinned to exact, mutually-tested
versions (`0.5.1` / `2.45.4`) in `package.json` rather than using `^` ranges. These two
packages' TypeScript generics are tightly coupled — a version skew between them (e.g.
letting one float to a much newer release) can silently break type inference on
`.insert()` / `.update()` calls project-wide (they'll appear to accept `never`). If you
intentionally upgrade either package, upgrade both together and re-run `npx tsc --noEmit`
to confirm the generics still resolve correctly before trusting the types.
