import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { ProductsClient } from './ProductsClient';

export default async function ProductsPage() {
  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, category, default_purchase_price, default_selling_price, status')
    .eq('business_id', business.id)
    .order('name');

  return <ProductsClient initialProducts={products ?? []} />;
}
