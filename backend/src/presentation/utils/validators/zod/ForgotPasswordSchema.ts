import { z } from "zod";

export const ForgetPasswordSchema = z.object({
    email: z.email("Invalid email format"),
});

export type ForgetPasswordRequest = z.infer<typeof ForgetPasswordSchema>;
