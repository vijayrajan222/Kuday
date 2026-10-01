import z from "zod";

export const VerifyResetOtpSchema =z.object({
      email: z.string().email("Invalid email format"),
      otp: z.string().length(6, "OTP must be exactly 6 digits"),
})