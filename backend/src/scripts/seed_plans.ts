import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectMongo } from "../infrastructure/database/ConnectMongoDB.js";
import { seedDefaultPlans, HOST_PLANS } from "../infrastructure/database/seedPlans.js";

async function run() {
    console.log("==========================================================");
    console.log("=== SEEDING KUDAI HOST PLANS (MONTHLY & YEARLY) ===");
    console.log("==========================================================");

    await connectMongo();
    await seedDefaultPlans();

    console.log("\nSeeded Plans:");
    HOST_PLANS.forEach((p, idx) => {
        console.log(
            `  ${idx + 1}. ${p.name}: ₹${p.price / 100} (${p.price} paise) | ${p.durationDays} days | audience: ${p.audience}`
        );
    });

    await mongoose.disconnect();
    console.log("\n✓ Seeding finished successfully.");
}

run().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
