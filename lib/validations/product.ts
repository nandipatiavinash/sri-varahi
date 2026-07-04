import { z } from 'zod';

export const PRODUCT_CATEGORIES = [
  'Paints',
  'Steel',
  'Cement',
  'Tiles',
  'Hardware',
  'Plumbing',
  'Construction',
  'Miscellaneous',
] as const;

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.enum(PRODUCT_CATEGORIES).default('Miscellaneous'),
  defaultPurchasePrice: z.coerce.number().min(0),
  defaultSellingPrice: z.coerce.number().min(0),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type ProductFormValues = z.infer<typeof productSchema>;
