import { z } from 'zod';

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Electricity',
  'Fuel',
  'Transport',
  'Maintenance',
  'Miscellaneous',
] as const;

export const expenseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  category: z.enum(EXPENSE_CATEGORIES).default('Miscellaneous'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  description: z.string().optional().default(''),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
