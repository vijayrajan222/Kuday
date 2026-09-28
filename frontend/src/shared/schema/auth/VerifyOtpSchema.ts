import { z } from 'zod';
import { OTP_LENGTH } from '@/constants/events';

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  otp: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Enter the ${OTP_LENGTH}-digit code`),
});

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;
