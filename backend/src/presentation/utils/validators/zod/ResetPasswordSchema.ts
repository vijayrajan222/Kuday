import { z } from "zod";

export const ResetPasswordSchema = z
    .object({
        email: z.email("Invalid email format"),

        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),

        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
