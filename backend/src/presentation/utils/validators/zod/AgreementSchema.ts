import { z } from "zod";

export const createAgreementSchema = z.object({
    hostId: z.string().min(1, "hostId is required"),
    seekerId: z.string().min(1, "seekerId is required"),
    roomId: z.string().min(1, "roomId is required"),
});

export const checkUnlockSchema = z.object({
    hostId: z.string().min(1, "hostId query parameter is required"),
    seekerId: z.string().min(1, "seekerId query parameter is required"),
    roomId: z.string().min(1, "roomId query parameter is required"),
});

export const commonTermsSchema = z.object({
    rent: z.number().positive("Rent must be greater than 0"),
    deposit: z.number().nonnegative("Deposit cannot be negative"),
    moveInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "moveInDate must be in YYYY-MM-DD format"),
    durationMonths: z.number().int().min(1, "Duration must be at least 1 month").max(36, "Duration cannot exceed 36 months"),
    noticePeriodDays: z.number().int().min(0, "Notice period cannot be negative").max(90, "Notice period cannot exceed 90 days"),
    paymentDueDay: z.number().int().min(1).max(31, "paymentDueDay must be between 1 and 31"),
    utilities: z.string().min(2, "Utilities description must be provided").max(500, "Utilities description is too long"),
});

export const proposeCommonTermsSchema = z.object({
    terms: commonTermsSchema,
});

export const respondCommonTermsSchema = z.object({
    action: z.enum(["accept", "reject"], {
        error: "Action must be either 'accept' or 'reject'",
    }),
});

export const draftClauseSchema = z.object({
    userNeed: z
        .string()
        .min(1, "Clause description is required")
        .max(500, "Clause description must not exceed 500 characters"),
});

export const proposeCustomClauseSchema = z.object({
    originalText: z
        .string()
        .max(500, "Original description must not exceed 500 characters"),
    aiDraftText: z.string().max(1000).optional(),
    finalText: z
        .string()
        .min(1, "Final clause text is required")
        .max(1000, "Final clause text must not exceed 1000 characters"),
});

export const respondCustomClauseSchema = z.object({
    action: z.enum(["accept", "reject", "counter"], {
        error: "Action must be 'accept', 'reject', or 'counter'",
    }),
    counterText: z
        .string()
        .max(1000, "Counter-proposed text must not exceed 1000 characters")
        .optional(),
});

export const verifyAgreementPaymentSchema = z.object({
    orderId: z.string().min(1, "orderId is required"),
    paymentId: z.string().min(1, "paymentId is required"),
    signature: z.string().optional(),
});
