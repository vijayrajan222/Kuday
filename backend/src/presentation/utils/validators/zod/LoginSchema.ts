import { z } from "zod";

export const LoginRequestSchema = z.object({
    email: z.email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
