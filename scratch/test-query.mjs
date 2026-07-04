import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ycauzddfnmcxyszulrtt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXV6ZGRmbm1jeHlzenVscnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzE0MzY0NiwiZXhwIjoyMDk4NzE5NjQ2fQ.d1W8FxcUdlbJBzbPA3U_I9FAtmaqRM4-gRf8F2JJJQE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.time('Get business');
  const { data: businesses, error: bErr } = await supabase
    .from('businesses')
    .select('*')
    .limit(1);
  console.timeEnd('Get business');
  if (bErr) {
    console.error('Business error:', bErr);
    return;
  }

  const business = businesses[0];
  if (!business) {
    console.error('No business found');
    return;
  }
  console.log('Business ID:', business.id);

  console.time('Fetch products');
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, name, category, default_purchase_price, default_selling_price, status')
    .eq('business_id', business.id)
    .order('name');
  console.timeEnd('Fetch products');

  console.time('Fetch bills');
  const { data: bills, error: b2Err } = await supabase
    .from('bills')
    .select('id')
    .eq('business_id', business.id);
  console.timeEnd('Fetch bills');

  console.time('Fetch expenses');
  const { data: expenses, error: e2Err } = await supabase
    .from('expenses')
    .select('id')
    .eq('business_id', business.id);
  console.timeEnd('Fetch expenses');

  if (pErr) console.error('Products error:', pErr);
  if (b2Err) console.error('Bills error:', b2Err);
  if (e2Err) console.error('Expenses error:', e2Err);

  console.log(`Products: ${products?.length ?? 0}, Bills: ${bills?.length ?? 0}, Expenses: ${expenses?.length ?? 0}`);
}

test();
