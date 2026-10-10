import { z } from "zod";

export const UpdateProfileSchema = z.object({
    firstName: z.string().trim().min(2, "First name must be at least 2 characters").optional(),
    lastName: z.string().trim().optional(),
    dob: z
        .string()
        .refine((val) => {
            if (!val) return true;
            const dobDate = new Date(val);
            if (isNaN(dobDate.getTime())) return false;
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            return dobDate <= today;
        }, { message: "Date of birth cannot be in the future" })
        .refine((val) => {
            if (!val) return true;
            const dobDate = new Date(val);
            if (isNaN(dobDate.getTime())) return true;
            const eighteenYearsAgo = new Date();
            eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
            eighteenYearsAgo.setHours(23, 59, 59, 999);
            return dobDate <= eighteenYearsAgo;
        }, { message: "User must be at least 18 years old" })
        .refine((val) => {
            if (!val) return true;
            const dobDate = new Date(val);
            if (isNaN(dobDate.getTime())) return true;
            const hundredYearsAgo = new Date();
            hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
            return dobDate >= hundredYearsAgo;
        }, { message: "Please enter a valid date of birth within the last 100 years" })
        .optional(),
    gender: z.string().optional(),
    occupation: z.string().optional(),
    bio: z.string().optional(),
    selfieUrl: z.string().optional(),
    selfieBase64: z.string().optional(),
});
