import { z } from "zod";

export const ChangePasswordSchema = z
    .object({
        currentPassword: z.string().optional(),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "New passwords do not match",
        path: ["confirmPassword"],
    });

export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;
