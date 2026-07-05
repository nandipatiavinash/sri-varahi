-- =========================================================================
-- Sree Vaaraahi Building Solutions — Sales & Profit Management System
-- Migration 0001: core schema, RLS, triggers, dashboard views
-- =========================================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- businesses
-- -------------------------------------------------------------------------
create table businesses (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null unique references auth.users(id) on delete cascade,
  name         text not null default 'Sree Vaaraahi Building Solutions',
  logo_url     text,
  address      text,
  phone        text,
  email        text,
  currency     text not null default 'INR',
  -- how many hours after midnight (business timezone) a bill remains editable/deletable.
  -- 0 = strictly "same calendar day only". Owner can loosen this in Settings if needed.
  edit_window_hours int not null default 0,
  timezone     text not null default 'Asia/Kolkata',
  created_at   timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- employees
-- -------------------------------------------------------------------------
create table employees (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  name         text not null,
  mobile       text,
  status       text not null default 'active' check (status in ('active','inactive')),
  created_at   timestamptz not null default now()
);
create index idx_employees_business_status on employees(business_id, status);

-- -------------------------------------------------------------------------
-- products
-- -------------------------------------------------------------------------
create table products (
  id                      uuid primary key default gen_random_uuid(),
  business_id             uuid not null references businesses(id) on delete cascade,
  name                    text not null,
  category                text not null default 'Miscellaneous',
  default_purchase_price  numeric(12,2) not null default 0,
  default_selling_price   numeric(12,2) not null default 0,
  status                  text not null default 'active' check (status in ('active','inactive')),
  created_at              timestamptz not null default now()
);
create index idx_products_business_category on products(business_id, category);
create index idx_products_business_name on products(business_id, name);

-- -------------------------------------------------------------------------
-- bills (invoice header)
-- -------------------------------------------------------------------------
create table bills (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  bill_number     text not null,
  bill_date       date not null default current_date,
  customer_name   text not null,
  customer_mobile text,
  employee_id     uuid references employees(id) on delete set null,
  subtotal        numeric(12,2) not null default 0,
  discount        numeric(12,2) not null default 0,
  grand_total     numeric(12,2) not null default 0,
  gross_profit    numeric(12,2) not null default 0,
  paid_amount     numeric(12,2) not null default 0,
  balance_due     numeric(12,2) generated always as (grand_total - paid_amount) stored,
  status          text not null default 'paid' check (status in ('paid','partial','credit','voided')),
  notes           text,
  voided_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_bills_business_date on bills(business_id, bill_date);
create index idx_bills_business_number on bills(business_id, bill_number);
create index idx_bills_business_employee on bills(business_id, employee_id);
create index idx_bills_business_status on bills(business_id, status);

-- -------------------------------------------------------------------------
-- bill_items (immutable snapshot line items)
-- -------------------------------------------------------------------------
create table bill_items (
  id                     uuid primary key default gen_random_uuid(),
  bill_id                uuid not null references bills(id) on delete cascade,
  product_id             uuid references products(id) on delete set null,
  product_name_snapshot  text not null,
  quantity               numeric(12,2) not null check (quantity > 0),
  purchase_price         numeric(12,2) not null default 0,
  selling_price          numeric(12,2) not null default 0,
  line_profit            numeric(12,2) generated always as ((selling_price - purchase_price) * quantity) stored,
  line_total             numeric(12,2) generated always as (selling_price * quantity) stored
);
create index idx_bill_items_bill on bill_items(bill_id);

-- -------------------------------------------------------------------------
-- payment_splits
-- -------------------------------------------------------------------------
create table payment_splits (
  id       uuid primary key default gen_random_uuid(),
  bill_id  uuid not null references bills(id) on delete cascade,
  method   text not null check (method in ('cash','upi','bank','credit','advance')),
  amount   numeric(12,2) not null check (amount >= 0)
);
create index idx_payment_splits_bill_method on payment_splits(bill_id, method);

-- -------------------------------------------------------------------------
-- advance_orders
-- -------------------------------------------------------------------------
create table advance_orders (
  id                       uuid primary key default gen_random_uuid(),
  business_id              uuid not null references businesses(id) on delete cascade,
  customer_name            text not null,
  customer_mobile          text,
  advance_amount           numeric(12,2) not null default 0,
  expected_delivery_date   date,
  notes                    text,
  status                   text not null default 'pending' check (status in ('pending','completed','cancelled')),
  converted_bill_id        uuid references bills(id) on delete set null,
  created_at               timestamptz not null default now()
);
create index idx_advance_orders_business_status on advance_orders(business_id, status);

-- -------------------------------------------------------------------------
-- credit_payments (partial payment history against a bill's balance)
-- -------------------------------------------------------------------------
create table credit_payments (
  id       uuid primary key default gen_random_uuid(),
  bill_id  uuid not null references bills(id) on delete cascade,
  amount   numeric(12,2) not null check (amount > 0),
  method   text not null check (method in ('cash','upi','bank')),
  paid_at  timestamptz not null default now(),
  notes    text
);
create index idx_credit_payments_bill on credit_payments(bill_id);

-- -------------------------------------------------------------------------
-- expenses
-- -------------------------------------------------------------------------
create table expenses (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  date         date not null default current_date,
  category     text not null default 'Miscellaneous'
               check (category in ('Rent','Electricity','Fuel','Transport','Maintenance','Miscellaneous')),
  amount       numeric(12,2) not null check (amount >= 0),
  description  text,
  created_at   timestamptz not null default now()
);
create index idx_expenses_business_date on expenses(business_id, date);
create index idx_expenses_business_category on expenses(business_id, category);

-- -------------------------------------------------------------------------
-- activity_log
-- -------------------------------------------------------------------------
create table activity_log (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  entity_type  text not null,
  entity_id    uuid not null,
  action       text not null check (action in ('created','updated','voided','deleted')),
  detail       jsonb,
  created_at   timestamptz not null default now()
);
create index idx_activity_log_business_entity on activity_log(business_id, entity_type, entity_id);

-- =========================================================================
-- Triggers
-- =========================================================================

-- keep bills.updated_at current
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger trg_bills_updated_at
  before update on bills
  for each row execute function set_updated_at();

-- recompute bills.gross_profit + subtotal from bill_items whenever line items change.
-- This only fires at save time (insert/update/delete of bill_items) -- it does NOT
-- re-read from `products`, so historical bills never silently shift when product
-- defaults change later (per the "never recalculate old invoices" requirement).
create or replace function recompute_bill_rollups()
returns trigger language plpgsql as $$
declare
  target_bill_id uuid;
begin
  target_bill_id := coalesce(new.bill_id, old.bill_id);

  update bills b
  set
    subtotal     = coalesce((select sum(line_total) from bill_items where bill_id = target_bill_id), 0),
    gross_profit = coalesce((select sum(line_profit) from bill_items where bill_id = target_bill_id), 0)
  where b.id = target_bill_id;

  return coalesce(new, old);
end;
$$;
create trigger trg_bill_items_rollup
  after insert or update or delete on bill_items
  for each row execute function recompute_bill_rollups();

-- keep bills.paid_amount in sync with payment_splits + credit_payments, and
-- auto-derive status (paid / partial / credit) from the resulting balance.
create or replace function recompute_bill_payment_status()
returns trigger language plpgsql as $$
declare
  target_bill_id uuid;
  v_paid numeric(12,2);
  v_grand numeric(12,2);
begin
  target_bill_id := coalesce(new.bill_id, old.bill_id);

  select
    coalesce((select sum(amount) from payment_splits where bill_id = target_bill_id and method <> 'credit'), 0)
    + coalesce((select sum(amount) from credit_payments where bill_id = target_bill_id), 0)
  into v_paid;

  select grand_total into v_grand from bills where id = target_bill_id;

  update bills
  set
    paid_amount = v_paid,
    status = case
      when status = 'voided' then 'voided'
      when v_paid <= 0 then 'credit'
      when v_paid < v_grand then 'partial'
      else 'paid'
    end
  where id = target_bill_id;

  return coalesce(new, old);
end;
$$;
create trigger trg_payment_splits_sync
  after insert or update or delete on payment_splits
  for each row execute function recompute_bill_payment_status();
create trigger trg_credit_payments_sync
  after insert or update or delete on credit_payments
  for each row execute function recompute_bill_payment_status();

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table businesses      enable row level security;
alter table employees       enable row level security;
alter table products        enable row level security;
alter table bills           enable row level security;
alter table bill_items      enable row level security;
alter table payment_splits  enable row level security;
alter table advance_orders  enable row level security;
alter table credit_payments enable row level security;
alter table expenses        enable row level security;
alter table activity_log    enable row level security;

create policy "owner reads/writes own business" on businesses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- generic pattern for every business-scoped table
create policy "owner scoped: employees" on employees
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "owner scoped: products" on products
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "owner scoped: bills" on bills
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "owner scoped: bill_items" on bill_items
  for all using (bill_id in (
    select id from bills where business_id in (select id from businesses where owner_id = auth.uid())
  ))
  with check (bill_id in (
    select id from bills where business_id in (select id from businesses where owner_id = auth.uid())
  ));

create policy "owner scoped: payment_splits" on payment_splits
  for all using (bill_id in (
    select id from bills where business_id in (select id from businesses where owner_id = auth.uid())
  ))
  with check (bill_id in (
    select id from bills where business_id in (select id from businesses where owner_id = auth.uid())
  ));

create policy "owner scoped: advance_orders" on advance_orders
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "owner scoped: credit_payments" on credit_payments
  for all using (bill_id in (
    select id from bills where business_id in (select id from businesses where owner_id = auth.uid())
  ))
  with check (bill_id in (
    select id from bills where business_id in (select id from businesses where owner_id = auth.uid())
  ));

create policy "owner scoped: expenses" on expenses
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "owner scoped: activity_log" on activity_log
  for all using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

-- =========================================================================
-- Dashboard views (computed on read — data volume is small for a single store)
-- =========================================================================

create or replace view v_daily_summary as
select
  business_id,
  bill_date as day,
  count(*) filter (where status <> 'voided') as bill_count,
  sum(grand_total) filter (where status <> 'voided') as total_sales,
  sum(gross_profit) filter (where status <> 'voided') as total_profit,
  sum(paid_amount) filter (where status <> 'voided') as total_collected,
  sum(balance_due) filter (where status <> 'voided') as total_outstanding
from bills
group by business_id, bill_date;

create or replace view v_monthly_summary as
select
  business_id,
  date_trunc('month', bill_date)::date as month,
  count(*) filter (where status <> 'voided') as bill_count,
  sum(grand_total) filter (where status <> 'voided') as total_sales,
  sum(gross_profit) filter (where status <> 'voided') as total_profit,
  sum(paid_amount) filter (where status <> 'voided') as total_collected,
  sum(balance_due) filter (where status <> 'voided') as total_outstanding
from bills
group by business_id, date_trunc('month', bill_date);

create or replace view v_employee_performance as
select
  b.business_id,
  e.id as employee_id,
  e.name as employee_name,
  count(b.id) filter (where b.status <> 'voided') as bill_count,
  sum(b.grand_total) filter (where b.status <> 'voided') as total_sales,
  sum(b.gross_profit) filter (where b.status <> 'voided') as total_profit
from bills b
join employees e on e.id = b.employee_id
group by b.business_id, e.id, e.name;
