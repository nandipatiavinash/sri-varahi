import { z } from 'zod';

export const settingsSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')),
  currency: z.string().min(1).default('INR'),
  timezone: z.string().min(1).default('Asia/Kolkata'),
  // 0 = strictly same calendar day for bill edit/delete. Raise for a grace window past midnight.
  editWindowHours: z.coerce.number().min(0).max(24).default(0),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
