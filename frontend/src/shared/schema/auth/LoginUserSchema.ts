import { z } from 'zod';

export const loginUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginUserFormValues = z.infer<typeof loginUserSchema>;
