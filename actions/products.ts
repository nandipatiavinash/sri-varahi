'use server';

import { revalidatePath } from 'next/cache';
import { createClient, getCurrentBusiness } from '@/lib/supabase/server';
import { productSchema, type ProductFormValues } from '@/lib/validations/product';
import type { ActionResult } from './bills';

export async function createProduct(input: ProductFormValues): Promise<ActionResult<{ id: string }>> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid product' };

  const supabase = await createClient();
  const business = await getCurrentBusiness();

  const { data, error } = await supabase
    .from('products')
    .insert({
      business_id: business.id,
      name: parsed.data.name,
      category: parsed.data.category,
      default_purchase_price: parsed.data.defaultPurchasePrice,
      default_selling_price: parsed.data.defaultSellingPrice,
      status: parsed.data.status,
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create product' };
  revalidatePath('/', 'layout');
  return { ok: true, data: { id: data.id } };
}

export async function updateProduct(id: string, input: ProductFormValues): Promise<ActionResult> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid product' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('products')
    .update({
      name: parsed.data.name,
      category: parsed.data.category,
      default_purchase_price: parsed.data.defaultPurchasePrice,
      default_selling_price: parsed.data.defaultSellingPrice,
      status: parsed.data.status,
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true, data: undefined };
}

// Products are only ever soft-disabled ("inactive"), never hard-deleted —
// bill_items.product_id references them and historical bills must keep
// resolving even after a product is retired from the catalog.
export async function setProductStatus(id: string, status: 'active' | 'inactive'): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('products').update({ status }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true, data: undefined };
}
