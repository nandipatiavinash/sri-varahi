-- =========================================================================
-- Sri Varahi Building Solutions — RLS Performance Optimization
-- Migration 0002: helper functions and optimized RLS policies
-- =========================================================================

-- 1. Create stable security definer function to cache business ID lookup.
-- Marked as STABLE so PostgreSQL evaluates it only once per query execution context,
-- reducing RLS row-scanning overhead from O(N) to O(1).
create or replace function get_my_business_id()
returns uuid
language sql
security definer
stable
as $$
  select id from public.businesses where owner_id = auth.uid();
$$;

-- 2. Drop existing subquery-heavy RLS policies
drop policy if exists "owner scoped: employees" on employees;
drop policy if exists "owner scoped: products" on products;
drop policy if exists "owner scoped: bills" on bills;
drop policy if exists "owner scoped: bill_items" on bill_items;
drop policy if exists "owner scoped: payment_splits" on payment_splits;
drop policy if exists "owner scoped: advance_orders" on advance_orders;
drop policy if exists "owner scoped: credit_payments" on credit_payments;
drop policy if exists "owner scoped: expenses" on expenses;
drop policy if exists "owner scoped: activity_log" on activity_log;

-- 3. Re-create optimized policies using cached business ID lookup
create policy "owner scoped: employees" on employees
  for all using (business_id = get_my_business_id())
  with check (business_id = get_my_business_id());

create policy "owner scoped: products" on products
  for all using (business_id = get_my_business_id())
  with check (business_id = get_my_business_id());

create policy "owner scoped: bills" on bills
  for all using (business_id = get_my_business_id())
  with check (business_id = get_my_business_id());

create policy "owner scoped: bill_items" on bill_items
  for all using (bill_id in (select id from bills where business_id = get_my_business_id()))
  with check (bill_id in (select id from bills where business_id = get_my_business_id()));

create policy "owner scoped: payment_splits" on payment_splits
  for all using (bill_id in (select id from bills where business_id = get_my_business_id()))
  with check (bill_id in (select id from bills where business_id = get_my_business_id()));

create policy "owner scoped: advance_orders" on advance_orders
  for all using (business_id = get_my_business_id())
  with check (business_id = get_my_business_id());

create policy "owner scoped: credit_payments" on credit_payments
  for all using (bill_id in (select id from bills where business_id = get_my_business_id()))
  with check (bill_id in (select id from bills where business_id = get_my_business_id()));

create policy "owner scoped: expenses" on expenses
  for all using (business_id = get_my_business_id())
  with check (business_id = get_my_business_id());

create policy "owner scoped: activity_log" on activity_log
  for all using (business_id = get_my_business_id())
  with check (business_id = get_my_business_id());
