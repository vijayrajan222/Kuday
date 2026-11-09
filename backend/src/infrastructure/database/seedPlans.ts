import { planModel } from "./model/PlanModel";

export async function seedDefaultPlans(): Promise<void> {
    try {
        const count = await planModel.countDocuments();
        if (count > 0) return;

        const defaultPlans = [
            {
                name: "Monthly Premium",
                price: 49900, // ₹499 in paise
                durationDays: 30,
                description: "Full access for 1 month with instant visit scheduling and verified badge.",
                features: [
                    "Direct chat & visit scheduling",
                    "Verified Profile Badge",
                    "Priority search results",
                    "Cancel anytime with prorated refund",
                ],
                isActive: true,
            },
            {
                name: "Quarterly Premium",
                price: 119900, // ₹1,199 in paise (20% off)
                durationDays: 90,
                description: "Most popular 3-month pass for active room finders.",
                features: [
                    "All Monthly Premium benefits",
                    "Save 20% compared to monthly",
                    "Unlimited roommate inquiries",
                    "VIP Host & Seeker support",
                ],
                isActive: true,
            },
            {
                name: "Annual Premium",
                price: 399900, // ₹3,999 in paise
                durationDays: 365,
                description: "Complete annual membership for hosts and long-term seekers.",
                features: [
                    "All Quarterly benefits",
                    "Maximum savings (₹333/month)",
                    "Top-ranked search highlight",
                    "Dedicated account manager",
                ],
                isActive: true,
            },
        ];

        await planModel.insertMany(defaultPlans);
        console.log("Default premium plans successfully seeded.");
    } catch (error) {
        console.error("Failed to seed default plans:", error);
    }
}
