-- Demo seed data. Run after 0001_init.sql, against a project where you've
-- already created one auth user (owner). Replace the owner_id below with
-- that user's UUID (Supabase Studio > Authentication > Users).

-- \set owner_id 'PASTE-AUTH-USER-UUID-HERE'

insert into businesses (owner_id, name, address, phone, email, currency)
values (
  'PASTE-AUTH-USER-UUID-HERE',
  'Sri Varahi Building Solutions',
  'Main Road, Andhra Pradesh',
  '9876543210',
  'contact@srivarahi.example',
  'INR'
)
returning id \gset business_

-- employees
insert into employees (business_id, name, mobile, status) values
  (:'business_id', 'Ramesh Kumar', '9000011111', 'active'),
  (:'business_id', 'Suresh Babu', '9000022222', 'active'),
  (:'business_id', 'Lakshmi Priya', '9000033333', 'active');

-- products
insert into products (business_id, name, category, default_purchase_price, default_selling_price) values
  (:'business_id', 'Asian Paints Tractor Emulsion 20L', 'Paints', 2200, 2650),
  (:'business_id', 'TMT Steel Bar 12mm (Fe500)', 'Steel', 620, 690),
  (:'business_id', 'UltraTech Cement 50kg', 'Cement', 335, 380),
  (:'business_id', 'Vitrified Tile 2x2 ft (box)', 'Tiles', 850, 1050),
  (:'business_id', 'CPVC Pipe 1 inch (3m)', 'Plumbing', 260, 320),
  (:'business_id', 'Door Hinge Heavy Duty (pair)', 'Hardware', 90, 140);

-- a paid bill
with b as (
  insert into bills (business_id, bill_number, bill_date, customer_name, customer_mobile, grand_total, notes)
  values (:'business_id', 'SV-1001', current_date, 'Venkata Rao', '9123456780', 0, 'Cash sale')
  returning id
)
insert into bill_items (bill_id, product_name_snapshot, quantity, purchase_price, selling_price)
select id, 'UltraTech Cement 50kg', 20, 335, 380 from b;

-- an expense
insert into expenses (business_id, date, category, amount, description)
values (:'business_id', current_date, 'Transport', 850, 'Local delivery auto charges');
