import { z } from 'zod';

const nameRule = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(30, `${label} must be at most 30 characters`)
    .regex(/^[A-Za-z][A-Za-z\s'-]*$/, `${label} can only contain letters`);

export const registerUserSchema = z
  .object({
    firstName: nameRule('First name'),
    lastName: nameRule('Last name'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[a-z]/, 'Include at least one lowercase letter')
      .regex(/\d/, 'Include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Include at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterUserFormValues = z.infer<typeof registerUserSchema>;
