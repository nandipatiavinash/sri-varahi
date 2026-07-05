-- Demo seed data. Run after 0001_init.sql.
-- This script uses chained CTEs to be 100% compatible with the Supabase SQL Editor UI.

WITH new_business AS (
  INSERT INTO businesses (owner_id, name, address, phone, email, currency)
  VALUES (
    'a112a7b5-ddd5-4b09-83e3-7fae479cf110',
    'Sree Vaaraahi Building Solutions',
    'Main Road, Andhra Pradesh',
    '9876543210',
    'contact@sreevaaraahi.example',
    'INR'
  )
  RETURNING id
),
new_employees AS (
  INSERT INTO employees (business_id, name, mobile, status)
  SELECT id, 'Ramesh Kumar', '9000011111', 'active' FROM new_business
  UNION ALL
  SELECT id, 'Suresh Babu', '9000022222', 'active' FROM new_business
  UNION ALL
  SELECT id, 'Lakshmi Priya', '9000033333', 'active' FROM new_business
  RETURNING id, name
),
new_products AS (
  INSERT INTO products (business_id, name, category, default_purchase_price, default_selling_price)
  SELECT id, 'Asian Paints Tractor Emulsion 20L', 'Paints', 2200, 2650 FROM new_business
  UNION ALL
  SELECT id, 'TMT Steel Bar 12mm (Fe500)', 'Steel', 620, 690 FROM new_business
  UNION ALL
  SELECT id, 'UltraTech Cement 50kg', 'Cement', 335, 380 FROM new_business
  UNION ALL
  SELECT id, 'Vitrified Tile 2x2 ft (box)', 'Tiles', 850, 1050 FROM new_business
  UNION ALL
  SELECT id, 'CPVC Pipe 1 inch (3m)', 'Plumbing', 260, 320 FROM new_business
  UNION ALL
  SELECT id, 'Door Hinge Heavy Duty (pair)', 'Hardware', 90, 140 FROM new_business
  RETURNING id, name
),
new_bill AS (
  INSERT INTO bills (business_id, bill_number, bill_date, customer_name, customer_mobile, employee_id, grand_total, notes)
  SELECT 
    nb.id, 
    'SV-1001', 
    CURRENT_DATE, 
    'Venkata Rao', 
    '9123456780', 
    (SELECT id FROM new_employees WHERE name = 'Ramesh Kumar' LIMIT 1), 
    0, 
    'Cash sale'
  FROM new_business nb
  RETURNING id
),
new_bill_item AS (
  INSERT INTO bill_items (bill_id, product_id, product_name_snapshot, quantity, purchase_price, selling_price)
  SELECT 
    new_bill.id, 
    (SELECT id FROM new_products WHERE name = 'UltraTech Cement 50kg' LIMIT 1), 
    'UltraTech Cement 50kg', 
    20, 
    335, 
    380
  FROM new_bill
)
INSERT INTO expenses (business_id, date, category, amount, description)
SELECT id, CURRENT_DATE, 'Transport', 850, 'Local delivery auto charges' FROM new_business;
