import { z } from 'zod';

export const advanceOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerMobile: z.string().optional().default(''),
  advanceAmount: z.coerce.number().min(0),
  expectedDeliveryDate: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
});

export type AdvanceOrderFormValues = z.infer<typeof advanceOrderSchema>;
