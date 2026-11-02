import { z } from "zod";

export const VerifyOtpRequestSchema = z.object({
    email: z.email("Invalid email format"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;
