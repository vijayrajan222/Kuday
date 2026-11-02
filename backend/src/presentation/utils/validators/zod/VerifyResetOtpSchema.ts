import { z } from "zod";

export const VerifyResetOtpSchema = z.object({
    email: z.email("Invalid email format"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export type VerifyResetOtpRequest = z.infer<typeof VerifyResetOtpSchema>;
