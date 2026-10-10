import * as z from "zod";

export const SignUpUserRequestSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    // we can add .optional() to keep the input value as optional

    firstName: z

      .string()
      .min(2, "First name must be at least 2 characters")
      .regex(/^[A-Za-z]+$/, "First name can contain only letters"),

    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .regex(/^[A-Za-z]+$/, "Last name can contain only letters"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      // .regex(/[A-Z]/, "Password must contain at least one uppercase letter") // Temporarily disabled for testing; re-enable before production
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["ConfirmPassword"],
  });

