import { z } from 'zod';

export const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().optional().default(''),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
