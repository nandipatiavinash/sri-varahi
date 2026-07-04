import { z } from 'zod';

export const lineItemSchema = z.object({
  productId: z.string().uuid().nullable(),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  purchasePrice: z.coerce.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative'),
});

export const paymentSplitSchema = z.object({
  method: z.enum(['cash', 'upi', 'bank', 'credit', 'advance']),
  amount: z.coerce.number().min(0),
});

export const billSchema = z.object({
  billNumber: z.string().min(1, 'Bill number is required'),
  billDate: z.string().min(1, 'Bill date is required'), // ISO date string
  customerName: z.string().min(1, "Customer name is required"),
  customerMobile: z.string().optional().default(''),
  employeeId: z.string().uuid().nullable().optional(),
  discount: z.coerce.number().min(0).default(0),
  grandTotal: z.coerce.number().min(0),
  notes: z.string().optional().default(''),
  items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  paymentSplits: z.array(paymentSplitSchema).min(1, 'At least one payment method is required'),
});

export type BillFormValues = z.infer<typeof billSchema>;
export type LineItemValues = z.infer<typeof lineItemSchema>;
export type PaymentSplitValues = z.infer<typeof paymentSplitSchema>;

export const creditPaymentSchema = z.object({
  billId: z.string().uuid(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  method: z.enum(['cash', 'upi', 'bank']),
  notes: z.string().optional().default(''),
});
