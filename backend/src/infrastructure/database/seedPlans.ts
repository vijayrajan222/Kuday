import { planModel } from "./model/PlanModel.js";

export const HOST_PLANS = [
    {
        name: "Host Monthly Premium",
        price: 49900, // ₹499 in integer paise
        durationDays: 30,
        audience: "host" as const,
        description: "Full premium host access for 30 days. Priority search visibility and unlimited seeker chat.",
        features: [
            "Unlimited direct chat with all seekers",
            "Priority listing rank in room searches",
            "Verified Host Profile Badge",
            "Instant visit scheduling & calendar management",
        ],
        isActive: true,
    },
    {
        name: "Host Yearly Premium",
        price: 399900, // ₹3,999 in integer paise (~₹333/mo)
        durationDays: 365,
        audience: "host" as const,
        description: "Year-round host VIP membership. Save over 30% compared to monthly pass.",
        features: [
            "All Host Monthly Premium features for 365 days",
            "Maximum savings (equivalent to ~₹333/month)",
            "Top-ranked search highlight for your rooms",
            "VIP Host badge & priority support",
        ],
        isActive: true,
    },
];

/**
 * Seeds or updates the two required host plans (Monthly & Yearly).
 * Strictly server-side prices in integer paise with audience: 'host'.
 */
export async function seedDefaultPlans(): Promise<void> {
    try {
        for (const plan of HOST_PLANS) {
            await planModel.findOneAndUpdate(
                { name: plan.name },
                { $set: plan },
                { upsert: true, returnDocument: "after", runValidators: true }
            );
        }

        // Deactivate any legacy plans that are not host-scoped
        await planModel.updateMany(
            { name: { $nin: HOST_PLANS.map((p) => p.name) } },
            { $set: { isActive: false } }
        );

        console.log("✓ Host premium plans successfully seeded (Monthly & Yearly, audience: 'host').");
    } catch (error) {
        console.error("Failed to seed default host plans:", error);
    }
}
